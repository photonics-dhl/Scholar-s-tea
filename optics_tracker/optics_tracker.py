#!/usr/bin/env python3
"""Optics Research Tracker - 光学论文追踪与飞书推送"""
import json, os, sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional

try:
    import requests
except ImportError:
    print("ERROR: requests not installed")
    sys.exit(1)

class OpticsClassifier:
    def __init__(self, config_path=None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "optics_categories.json")
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)
        self.categories = self.config["categories"]

    def classify(self, paper: Dict) -> Optional[str]:
        text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
        matches = []
        for cat_id, cat in self.categories.items():
            score = sum(1 for kw in cat["keywords"] if kw.lower() in text)
            if score > 0:
                matches.append((cat_id, score, cat.get("priority", 99)))
        if not matches:
            return None
        matches.sort(key=lambda x: (-x[1], x[2]))
        return matches[0][0]

class ArxivSearcher:
    ARXIV_API = "http://export.arxiv.org/api/query"

    def __init__(self, classifier):
        self.classifier = classifier

    def search(self, query: str, max_results: int = 20, days_back: int = 7) -> Dict:
        start_date = datetime.now() - timedelta(days=days_back)
        date_str = start_date.strftime("%Y-%m-%d")
        search_query = f"all:{query} AND submittedDate:[{date_str} TO 2099-12-31]"
        params = {"search_query": search_query, "start": 0, "max_results": max_results, "sortBy": "submittedDate", "sortOrder": "descending"}

        response = requests.get(self.ARXIV_API, params=params, timeout=30)
        response.raise_for_status()

        from xml.etree import ElementTree as ET
        root = ET.fromstring(response.content)
        ns = {"atom": "http://www.w3.org/2005/Atom"}

        results = {cat_id: [] for cat_id in self.classifier.categories.keys()}
        results["uncategorized"] = []

        for entry in root.findall("atom:entry", ns):
            paper = {
                "title": entry.find("atom:title", ns).text.replace("\n", " ").strip() if entry.find("atom:title", ns) is not None else "",
                "abstract": entry.find("atom:summary", ns).text.replace("\n", " ").strip() if entry.find("atom:summary", ns) is not None else "",
                "arxiv_id": entry.find("atom:id", ns).text.split("/")[-1] if entry.find("atom:id", ns) is not None else "",
                "published": entry.find("atom:published", ns).text[:10] if entry.find("atom:published", ns) is not None else "",
                "url": entry.find("atom:id", ns).text if entry.find("atom:id", ns) is not None else "",
                "citations": 0,
                "venue": "arXiv"
            }
            category = self.classifier.classify(paper)
            if category:
                results[category].append(paper)
            else:
                results["uncategorized"].append(paper)
        return results

class FeishuCardSender:
    API_BASE = "https://open.feishu.cn/open-apis"

    def __init__(self):
        self.app_id = os.getenv("FEISHU_APP_ID")
        self.app_secret = os.getenv("FEISHU_APP_SECRET")
        self.target_group = os.getenv("FEISHU_TARGET_GROUP", "oc_6172e7ce838d85f4928d6ee707203b60")

    def get_access_token(self) -> Optional[str]:
        url = f"{self.API_BASE}/auth/v3/tenant_access_token/internal"
        data = {"app_id": self.app_id, "app_secret": self.app_secret}
        response = requests.post(url, json=data, timeout=10)
        return response.json().get("tenant_access_token")

    def send_card(self, card_content: Dict, chat_id: str = None) -> bool:
        token = self.get_access_token()
        if not token:
            return False
        chat_id = chat_id or self.target_group
        url = f"{self.API_BASE}/im/v1/messages?receive_id_type=chat_id"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {"receive_id": chat_id, "msg_type": "interactive", "content": json.dumps(card_content)}
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        result = response.json()
        if result.get("code") == 0:
            print("SUCCESS: Card sent")
            return True
        print(f"ERROR: {result}")
        return False

def build_overview_card(results: Dict, classifier: OpticsClassifier) -> Dict:
    elements = [{"tag": "markdown", "content": "## 🔬 **光学领域每日速递**\n\n---\n"}]
    for cat_id, cat in classifier.categories.items():
        count = len(results.get(cat_id, []))
        elements.append({"tag": "markdown", "content": f"### {cat['icon']} **{cat['name']}**\n最新进展: **{count}** 篇\n[查看详情 ▶](#)"})
        elements.append({"tag": "hr"})
    elements.append({"tag": "markdown", "content": f"---\n🕐 推送时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}"})
    return {"config": {"wide_screen_mode": True}, "elements": elements}

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--query", "-q", default="optics photonics laser")
    parser.add_argument("--days", "-d", type=int, default=7)
    parser.add_argument("--max-results", "-m", type=int, default=20)
    parser.add_argument("--feishu", action="store_true")
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    classifier = OpticsClassifier(os.path.join(script_dir, "optics_categories.json"))
    searcher = ArxivSearcher(classifier)

    print("Searching arXiv...")
    results = searcher.search(args.query, max_results=args.max_results, days_back=args.days)

    for cat_id, cat in classifier.categories.items():
        print(f"  {cat['icon']} {cat['name']}: {len(results.get(cat_id, []))} 篇")

    if args.feishu:
        sender = FeishuCardSender()
        sender.send_card(build_overview_card(results, classifier))

    return 0

if __name__ == "__main__":
    sys.exit(main())