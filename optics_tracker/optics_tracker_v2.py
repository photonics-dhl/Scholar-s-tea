#!/usr/bin/env python3
"""Optics Research Tracker v2 - 使用飞书模板发送卡片"""
import json
import math
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

# 加载 .env 环境变量（支持 dot notation 路径）
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, ".env")
    load_dotenv(_env_path, override=False)
except ImportError:
    pass  # python-dotenv 未安装则跳过

try:
    import httpx
except ImportError:
    httpx = None

try:
    import requests
except ImportError:
    print("ERROR: requests not installed")
    sys.exit(1)

# 代理设置
# ⚠️ ArXiv 搜索已硬编码 proxies={}（line 246），不受此变量影响
# S2 API / PubMed / DuckCoding / MiniMax 必须走代理
# TavilySearcher 使用自己的 proxy 参数（socks5h），不依赖此常量
# 飞书 API 必须走代理（FEISHU_PROXIES）
PROXIES = {
    "http": "http://127.0.0.1:7890",
    "https": "http://127.0.0.1:7890",
}

# 飞书 API 必须走代理（open.feishu.cn 直连超时）
FEISHU_PROXIES = {
    "http": "http://127.0.0.1:7890",
    "https": "http://127.0.0.1:7890",
}
PROXIES_SOCKS5 = {
    "http": "socks5h://127.0.0.1:7890",
    "https": "socks5h://127.0.0.1:7890",
}


def _clean_latex(text: str) -> str:
    """清洗 LaTeX 数学公式，避免飞书 markdown 渲染异常/乱码。

    处理顺序（重要）：
    1. 先提取 $...$ / $$...$$ 内容并清洗
    2. 用占位符保护已清洗内容
    3. 处理剩余 LaTeX 命令 → Unicode
    4. 还原占位符为干净文本
    """
    import re
    if not text:
        return text

    def _clean_latex_inner(raw: str) -> str:
        """清洗 LaTeX 数学环境内的文本（内部处理）"""
        # Greek
        for latex, uni in {
            r'\alpha': 'α', r'\beta': 'β', r'\gamma': 'γ', r'\delta': 'δ',
            r'\epsilon': 'ε', r'\zeta': 'ζ', r'\eta': 'η', r'\theta': 'θ',
            r'\iota': 'ι', r'\kappa': 'κ', r'\lambda': 'λ', r'\mu': 'μ',
            r'\nu': 'ν', r'\xi': 'ξ', r'\pi': 'π', r'\rho': 'ρ',
            r'\sigma': 'σ', r'\tau': 'τ', r'\upsilon': 'υ', r'\phi': 'φ',
            r'\chi': 'χ', r'\psi': 'ψ', r'\omega': 'ω',
            r'\Gamma': 'Γ', r'\Delta': 'Δ', r'\Theta': 'Θ', r'\Lambda': 'Λ',
            r'\Xi': 'Ξ', r'\Pi': 'Π', r'\Sigma': 'Σ', r'\Phi': 'Φ',
            r'\Psi': 'Ψ', r'\Omega': 'Ω',
        }.items():
            raw = raw.replace(latex, uni)
        # 上标
        for d, sup in {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶',
                       '7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','n':'ⁿ'}.items():
            raw = raw.replace(f'^{d}', sup)
            raw = raw.replace(f'^{{{d}}}', sup)
        # 下标
        for d, sub in {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆',
                       '7':'₇','8':'₈','9':'₉'}.items():
            raw = raw.replace(f'_{d}', sub)
            raw = raw.replace(f'_{{{d}}}', sub)
        # 命令处理
        raw = re.sub(r'\\text\{([^}]*)\}', r'\1', raw)
        raw = re.sub(r'\\([a-zA-Z]+)\{([^}]*)\}', r'\2', raw)
        raw = re.sub(r'\\([a-zA-Z]+)', '', raw)
        raw = raw.replace(r'\,', ' ').replace(r'\;', ' ').replace(r'\!', '')
        raw = raw.replace(r'\cdot', '·').replace(r'\times', '×')
        raw = raw.replace(r'\sim', '~').replace(r'\approx', '≈')
        raw = raw.replace(r'\neq', '≠').replace(r'\leq', '≤').replace(r'\geq', '≥')
        raw = re.sub(r'\s+', ' ', raw)
        return raw

    # Step 1: 提取并清洗 $$...$$
    disp_map = {}
    def repl_display(m):
        cleaned = _clean_latex_inner(m.group(1))
        key = f'\x00DISP{len(disp_map)}\x00'
        disp_map[key] = cleaned
        return key
    text = re.sub(r'\$\$([^$]+)\$\$', repl_display, text)

    # Step 2: 提取并清洗 $...$
    inline_map = {}
    def repl_inline(m):
        cleaned = _clean_latex_inner(m.group(1))
        key = f'\x00INLINE{len(inline_map)}\x00'
        inline_map[key] = cleaned
        return key
    text = re.sub(r'\$([^$]+)\$', repl_inline, text)

    # Step 3: 处理剩余 LaTeX 命令（不在占位符中）
    greek_map = {
        r'\alpha': 'α', r'\beta': 'β', r'\gamma': 'γ', r'\delta': 'δ',
        r'\epsilon': 'ε', r'\zeta': 'ζ', r'\eta': 'η', r'\theta': 'θ',
        r'\iota': 'ι', r'\kappa': 'κ', r'\lambda': 'λ', r'\mu': 'μ',
        r'\nu': 'ν', r'\xi': 'ξ', r'\pi': 'π', r'\rho': 'ρ',
        r'\sigma': 'σ', r'\tau': 'τ', r'\upsilon': 'υ', r'\phi': 'φ',
        r'\chi': 'χ', r'\psi': 'ψ', r'\omega': 'ω',
        r'\Gamma': 'Γ', r'\Delta': 'Δ', r'\Theta': 'Θ', r'\Lambda': 'Λ',
        r'\Xi': 'Ξ', r'\Pi': 'Π', r'\Sigma': 'Σ', r'\Phi': 'Φ',
        r'\Psi': 'Ψ', r'\Omega': 'Ω',
    }
    for latex, uni in greek_map.items():
        text = text.replace(latex, uni)
    for d, sup in {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶',
                   '7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','n':'ⁿ'}.items():
        text = text.replace(f'^{d}', sup)
        text = text.replace(f'^{{{d}}}', sup)
    for d, sub in {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆',
                   '7':'₇','8':'₈','9':'₉'}.items():
        text = text.replace(f'_{d}', sub)
        text = text.replace(f'_{{{d}}}', sub)
    text = re.sub(r'\\text\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\([a-zA-Z]+)\{([^}]*)\}', r'\2', text)
    text = re.sub(r'\\([a-zA-Z]+)', '', text)
    text = text.replace('\\', '')
    text = text.replace(r'\sim', '~').replace(r'\approx', '≈')
    text = text.replace(r'\times', '×').replace(r'\cdot', '·')
    text = text.replace(r'\partial', '∂').replace(r'\nabla', '∇')
    text = text.replace(r'\infty', '∞').replace(r'\hbar', 'ℏ')

    # Step 4: 还原占位符
    for key, cleaned in disp_map.items():
        text = text.replace(key, f'〔{cleaned}〕')
    for key, cleaned in inline_map.items():
        text = text.replace(key, f'({cleaned})')

    text = re.sub(r'\s+', ' ', text).strip()
    return text


class OpticsClassifier:
    """光学论文分类器"""

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
                # 检查排除关键词
                excluded = False
                for ex in cat.get("exclude", []):
                    if ex.lower() in text:
                        excluded = True
                        break
                if not excluded:
                    matches.append((cat_id, score, cat.get("priority", 99)))
        if not matches:
            return None
        matches.sort(key=lambda x: (-x[1], x[2]))
        return matches[0][0]


class ArxivSearcher:
    """ArXiv 论文搜索"""

    ARXIV_API = "http://export.arxiv.org/api/query"

    def __init__(self, classifier: OpticsClassifier):
        self.classifier = classifier

    # ArXiv 光学相关分类
    ARXIV_PHYSICS_CATEGORIES = [
        "physics.optics",
        "quant-ph",  # Quantum Physics
        "physics.app-ph",  # Applied Physics
        "physics.atom-ph",  # Atomic, Molecular and Optical Physics
    ]

    def search_by_category(self, category_id: str, max_results: int = 30, days_back: int = 90) -> List[Dict]:
        """按领域搜索论文 - ArXiv分类+关键词双重过滤

        重试策略：429硬封禁立即返回，429软限速/502-504/超时指数退避，3次全失败返回空列表。
        """
        import time
        from xml.etree import ElementTree as ET

        cat = self.classifier.categories.get(category_id, {})
        keywords = cat.get("keywords", [])
        exclude = cat.get("exclude", [])

        if not keywords:
            return []

        # 构建 ArXiv 查询
        cat_queries = [f"cat:{c}" for c in self.ARXIV_PHYSICS_CATEGORIES]
        cat_query = " OR ".join(cat_queries)
        keyword_queries = []
        for kw in keywords[:5]:
            if " " in kw or "-" in kw:
                kw_escaped = kw.replace('"', '\\"')
                keyword_queries.append(f'all:"{kw_escaped}"')
            else:
                keyword_queries.append(f"all:{kw}")
        keyword_query = " OR ".join(keyword_queries)
        query = f"({cat_query}) AND ({keyword_query})"

        params = {
            "search_query": query,
            "start": 0,
            "max_results": max_results * 2,
            "sortBy": "submittedDate",
            "sortOrder": "descending"
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        response_content: bytes = b""
        for attempt in range(3):
            try:
                resp = requests.get(self.ARXIV_API, params=params, timeout=60, proxies={}, headers=headers)

                if resp.status_code == 429:
                    if b"Rate exceeded" in resp.content:
                        print(f"  ERROR: ArXiv hard rate limit for {category_id} — skipping")
                        return []
                    wait = (2 ** attempt) * 10
                    print(f"  WARNING: ArXiv 429 for {category_id}, waiting {wait}s (attempt {attempt+1}/3)...")
                    time.sleep(wait)
                    continue

                if resp.status_code == 200:
                    content = resp.content
                    if not (content.startswith(b"<!") or content.startswith(b"<html>")):
                        response_content = content
                        break

                if attempt < 2:
                    wait = (2 ** attempt) * 5
                    print(f"  WARNING: ArXiv HTTP {resp.status_code} for {category_id}, retrying in {wait}s...")
                    time.sleep(wait)
                    continue

                print(f"  ERROR: ArXiv search failed for {category_id}: HTTP {resp.status_code}")
                return []

            except requests.exceptions.Timeout:
                print(f"  WARNING: ArXiv timeout for {category_id} (attempt {attempt+1}/3)")
                if attempt == 2:
                    print(f"  ERROR: ArXiv timeout exhausted for {category_id}")
                    return []
                time.sleep(2 ** attempt)
            except Exception as e:
                print(f"  WARNING: ArXiv exception for {category_id}: {type(e).__name__}: {e} (attempt {attempt+1}/3)")
                if attempt == 2:
                    print(f"  ERROR: ArXiv exception exhausted for {category_id}")
                    return []
                time.sleep(2 ** attempt)
        else:
            # 循环正常结束（3次全失败）但没有 return
            print(f"  ERROR: ArXiv search exhausted all retries for {category_id}")
            return []

        # 解析 XML
        try:
            root = ET.fromstring(response_content)
        except ET.ParseError as e:
            print(f"  ERROR: ArXiv XML parse failed for {category_id}: {e}")
            return []

        ns = {"atom": "http://www.w3.org/2005/Atom"}
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)
        papers = []

        for entry in root.findall("atom:entry", ns):
            published_str = entry.find("atom:published", ns)
            if published_str is not None and published_str.text:
                try:
                    published = datetime.fromisoformat(published_str.text.replace("Z", "+00:00"))
                    if published < cutoff_date:
                        continue
                except (ValueError, AttributeError):
                    pass

            title_el = entry.find("atom:title", ns)
            title = title_el.text.replace("\n", " ").strip() if title_el is not None and title_el.text else ""
            abstract_el = entry.find("atom:summary", ns)
            abstract = abstract_el.text.replace("\n", " ").strip() if abstract_el is not None and abstract_el.text else ""

            if not title:
                continue

            if any(ex.lower() in (title + abstract).lower() for ex in exclude):
                continue

            id_el = entry.find("atom:id", ns)
            arxiv_url = id_el.text if id_el is not None and id_el.text else ""
            arxiv_id = arxiv_url.split("/")[-1] if arxiv_url else ""

            paper = {
                "title": title,
                "abstract": abstract,
                "arxiv_id": arxiv_id,
                "published": (published_str.text[:10] if published_str is not None and published_str.text else ""),
                "url": arxiv_url,
                "authors": [a.find("atom:name", ns).text for a in entry.findall("atom:author", ns)
                           if a.find("atom:name", ns) is not None and a.find("atom:name", ns).text][:3],
                "citations": 0,
                "venue": "arXiv"
            }
            papers.append(paper)

        return papers

    def get_quality_papers(self, category_id: str, top_n: int = 5) -> List[Dict]:
        """获取质量最高的论文

        单次查询 + 扩大候选池（top_n*4），确保有足够候选供后续分析
        ArXiv 按 date 排序保证新论文优先，高影响力由 Phase2 S2 补充引用数后加权
        """
        papers = self.search_by_category(category_id, max_results=top_n * 4, days_back=90)
        papers.sort(key=lambda x: x.get("published", ""), reverse=True)
        return papers[:top_n]


class SemanticScholarSearcher:
    """Semantic Scholar 论文检索 - 获取引用数等信息"""

    S2_API = "https://api.semanticscholar.org/graph/v1"

    def __init__(self):
        # 扩展字段：influentialCitationCount（高影响力引用数，更能反映质量）
        self.fields = "title,authors,citationCount,influentialCitationCount,year,venue,journal,externalIds"

    def get_paper_by_arxiv(self, arxiv_id: str) -> Optional[Dict]:
        """根据 ArXiv ID 获取论文信息"""
        try:
            url = f"{self.S2_API}/paper/arXiv:{arxiv_id}"
            params = {"fields": self.fields}
            response = requests.get(url, params=params, timeout=15, proxies=PROXIES)
            if response.status_code == 200:
                data = response.json()
                return {
                    "citations": data.get("citationCount", 0),
                    "influential_citations": data.get("influentialCitationCount", 0),
                    "venue": data.get("venue") or data.get("journal", {}).get("name", "arXiv") if isinstance(data.get("journal"), dict) else data.get("journal", "arXiv"),
                    "year": data.get("year"),
                }
        except Exception as e:
            print(f"  WARNING: S2 lookup failed for {arxiv_id}: {e}")
        return None

    def get_paper_by_doi(self, doi: str) -> Optional[Dict]:
        """根据 DOI 获取论文信息（支持 Crossref/PubMed 来源的论文）"""
        try:
            url = f"{self.S2_API}/paper/DOI:{doi}"
            params = {"fields": self.fields}
            response = requests.get(url, params=params, timeout=15, proxies=PROXIES)
            if response.status_code == 200:
                data = response.json()
                if not data.get("title"):  # DOI 未匹配到论文
                    return None
                return {
                    "citations": data.get("citationCount", 0),
                    "influential_citations": data.get("influentialCitationCount", 0),
                    "venue": data.get("venue") or data.get("journal", {}).get("name", "Journal") if isinstance(data.get("journal"), dict) else data.get("journal", "Journal"),
                    "year": data.get("year"),
                }
        except Exception as e:
            print(f"  WARNING: S2 DOI lookup failed for {doi}: {e}")
        return None

    def enrich_papers(self, papers: List[Dict]) -> List[Dict]:
        """批量丰富论文信息（并发获取引用数）

        同时处理 ArXiv（via arxiv_id）和非 ArXiv 有 DOI 的论文（via DOI）。
        S2 API 支持 DOI:{doi} 格式查询，Crossref/PubMed 论文均可使用。
        """
        from concurrent.futures import ThreadPoolExecutor, as_completed

        # 收集 ArXiv 论文
        arxiv_ids = [(i, p.get("arxiv_id", "")) for i, p in enumerate(papers) if p.get("arxiv_id")]
        # 收集有 DOI 的非 ArXiv 论文
        doi_papers = [(i, p.get("doi", "")) for i, p in enumerate(papers) if p.get("doi") and not p.get("arxiv_id")]

        results = {}
        to_query = []

        def do_lookup(idx, lookup_fn, q):
            try:
                info = lookup_fn(q)
                if info:
                    results[idx] = info
            except Exception as e:
                print(f"  WARNING: S2 lookup failed: {e}")

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = []
            for idx, aid in arxiv_ids:
                futures.append(executor.submit(do_lookup, idx, self.get_paper_by_arxiv, aid))
            for idx, doi in doi_papers:
                futures.append(executor.submit(do_lookup, idx, self.get_paper_by_doi, doi))
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    print(f"  WARNING: S2 concurrent lookup failed: {e}")

        # 更新论文信息
        for idx, info in results.items():
            if 0 <= idx < len(papers):
                papers[idx]["citations"] = info.get("citations", 0)
                papers[idx]["influential_citations"] = info.get("influential_citations", 0)
                if info.get("venue"):
                    papers[idx]["venue"] = info["venue"]
                if info.get("year"):
                    papers[idx]["year"] = info["year"]

        print(f"    S2 enriched: {len(arxiv_ids)} ArXiv + {len(doi_papers)} DOI papers, "
              f"{len(results)} got citations", flush=True)
        return papers

    def sort_by_quality(self, papers: List[Dict]) -> List[Dict]:
        """多因素综合质量排序：引用数(40%) + 高引数(35%) + 发表日期(25%)

        策略：
        - citations log压缩：避免一篇顶刊(500+引)完全掩盖同领域其他有价值论文
        - influentialCitationCount：同行认可的强信号，权重最高
        - 发表日期：偏好近90天内的论文，避免推送过时内容
        """
        # 顶刊名单：发表在这些期刊的论文获得额外加分
        TOP_VENUES = {
            "nature photonics", "nature physics", "nature", "science",
            "physical review x", "optica", "optics express", "optics letters",
            "photonics research", "laser & photonics reviews",
            "nature communications", "science advances",
            "advanced photonics", "prx quantum",
            "light: science & applications", "npj photonic",
        }

        def _quality_score(p):
            cites = max(0, p.get("citations", 0))
            infl_cites = max(0, p.get("influential_citations", 0))
            year = p.get("year") or 2020
            venue = (p.get("venue") or "").lower()

            # 1. log压缩引用数（40%），200引为满分基准
            cite_score = math.log1p(cites) / math.log1p(200) * 0.40

            # 2. 高影响力引用数（35%），5个为满分基准
            infl_score = math.log1p(infl_cites) / math.log1p(5) * 0.35

            # 3. 发表日期（25%），近90天=满分，每90天衰减一半
            days_old = (2026 - year) * 365 + (120 - 120)  # rough
            if p.get("published"):
                try:
                    import datetime
                    pub = datetime.datetime.strptime(p["published"][:10], "%Y-%m-%d")
                    days_old = (datetime.datetime.now() - pub).days
                except Exception:
                    pass
            recency_score = max(0, 1 - days_old / 365) * 0.25

            # 4. 顶刊加成（额外加权，非乘数）
            venue_bonus = 0.0
            for tv in TOP_VENUES:
                if tv in venue:
                    venue_bonus = 0.10
                    break

            return cite_score + infl_score + recency_score + venue_bonus

        papers.sort(key=_quality_score, reverse=True)
        return papers


class PubMedSearcher:
    """PubMed 论文搜索 - 生物医学光学领域补充来源"""

    ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

    def __init__(self):
        self.db = "pubmed"

    def search_by_keywords(self, keywords: List[str], max_results: int = 10, days_back: int = 90) -> List[Dict]:
        """使用关键词搜索 PubMed 论文

        Args:
            keywords: 关键词列表
            max_results: 最大返回数量
            days_back: 搜索近多少天的论文

        Returns:
            论文列表，格式与 ArXiv 兼容
        """
        if not keywords:
            return []

        # 构建查询词（Title/Abstract搜索）
        keyword_query = " AND ".join([f'({kw}[Title/Abstract] OR {kw}[Abstract])' for kw in keywords[:5]])
        # 注意：日期过滤使用reldate参数，不在term中

        params = {
            "db": self.db,
            "term": keyword_query,
            "retmax": max_results * 2,
            "retmode": "json",
            "sort": "date",
            "datetype": "pdat",
            "reldate": days_back
        }

        try:
            response = requests.get(self.ESEARCH_URL, params=params, timeout=30, proxies=PROXIES)
            if response.status_code != 200:
                print(f"  WARNING: PubMed ESearch failed: {response.status_code}")
                return []

            data = response.json()
            id_list = data.get("esearchresult", {}).get("idlist", [])
            if not id_list:
                return []

            # 限制数量
            id_list = id_list[:max_results]

            # 获取详情
            papers = self._fetch_details(id_list)
            return papers

        except Exception as e:
            print(f"  WARNING: PubMed search failed: {e}")
            return []

        return []

    def _fetch_details(self, pmids: List[str]) -> List[Dict]:
        """获取 PubMed 论文详情"""
        if not pmids:
            return []

        params = {
            "db": self.db,
            "id": ",".join(pmids),
            "rettype": "abstract",
            "retmode": "xml"
        }

        try:
            response = requests.get(self.EFETCH_URL, params=params, timeout=30, proxies=PROXIES)
            if response.status_code != 200:
                return []

            from xml.etree import ElementTree as ET
            root = ET.fromstring(response.content)

            papers = []
            for article in root.findall(".//PubmedArticle"):
                # 提取标题
                title_elem = article.find(".//ArticleTitle")
                title = title_elem.text.replace("\n", " ").strip() if title_elem is not None and title_elem.text else ""

                # 提取摘要
                abstract_elems = article.findall(".//AbstractText")
                abstract = " ".join([a.text.replace("\n", " ").strip() for a in abstract_elems if a.text])

                # 提取日期
                date_pub = article.find(".//PubDate")
                pub_date = ""
                if date_pub is not None:
                    year = date_pub.find("Year")
                    month = date_pub.find("Month")
                    day = date_pub.find("Day")
                    if year is not None:
                        pub_date = f"{year.text}-{month.text if month is not None and month.text else '01'}-{day.text if day is not None and day.text else '01'}"

                # 提取作者
                authors = []
                for author in article.findall(".//Author")[:3]:
                    last_name = author.find("LastName")
                    fore_name = author.find("ForeName")
                    if last_name is not None:
                        name = last_name.text
                        if fore_name is not None and fore_name.text:
                            name = f"{fore_name.text} {name}"
                        authors.append(name)

                # 提取期刊
                journal = article.find(".//Journal/Title")
                venue = journal.text if journal is not None else "PubMed"

                # 提取 DOI
                article_id_elems = article.findall(".//ArticleId")
                doi = ""
                pubmed_id = ""
                for elem in article_id_elems:
                    if elem.get("IdType") == "doi":
                        doi = elem.text
                    elif elem.get("IdType") == "pubmed":
                        pubmed_id = elem.text

                papers.append({
                    "title": title,
                    "abstract": abstract,
                    "pubmed_id": pubmed_id,
                    "doi": doi,
                    "published": pub_date,
                    "url": f"https://pubmed.ncbi.nlm.nih.gov/{pubmed_id}/" if pubmed_id else "",
                    "authors": authors,
                    "citations": 0,
                    "venue": venue,
                    "source": "pubmed"
                })

            return papers

        except Exception as e:
            print(f"  WARNING: PubMed EFetch failed: {e}")
            return []

        return []

    def search_category(self, category_id: str, classifier: 'OpticsClassifier', max_results: int = 10) -> List[Dict]:
        """根据领域配置搜索 PubMed 论文

        Args:
            category_id: 领域ID
            classifier: 光学分类器（用于获取关键词）
            max_results: 最大返回数量

        Returns:
            论文列表
        """
        cat = classifier.categories.get(category_id, {})
        keywords = cat.get("keywords", [])

        if not keywords:
            return []

        return self.search_by_keywords(keywords, max_results=max_results)


class MiniMaxAnalyzer:
    """论文分析 - 生成6维度结构化分析

    支持三源热备：ZAI glm-4.5（主力）→ DUCKCODING gpt-5.4 → MiniMax M2.7（兜底）。
    """

    ZAI_API_URL = "https://api.z.ai/api/coding/paas/v4/chat/completions"
    API_URL = "https://api.minimax.chat/v1/chat/completions"
    DUCK_API_URL = "https://www.duckcoding.ai/v1/chat/completions"

    # 6维度分析提示词模板
    ANALYSIS_PROMPT = """你是一位光学领域的学术研究员。请分析以下论文并生成结构化总结。

论文标题：{title}
论文摘要：{abstract}
ArXiv ID：{arxiv_id}

请按以下6个维度生成分析（每项30-50字）：
1. 一句话概括：核心贡献是什么？
2. 研究思路：解决什么科学/技术问题？
3. 实验方案：采用了什么关键方法或技术？
4. 创新点：相比已有工作的突破在哪里？
5. 关联工作：该领域还有哪些重要工作？
6. 评价：对领域发展的意义和影响？

请用JSON格式返回：
{{
  "summary": "一句话概括",
  "research思路": "研究思路",
  "experiment": "实验方案",
  "innovation": "创新点",
  "related_work": "关联工作",
  "impact": "评价"
}}
"""

    def __init__(self, api_key: str = None, duck_api_key: str = None, zai_api_key: str = None):
        self.api_key = api_key or os.getenv("MINIMAX_API_KEY", "")
        self.duck_api_key = duck_api_key or os.getenv("DUCKCODING_API_KEY", "")
        self.zai_api_key = zai_api_key or os.getenv("ZAI_API_KEY", "")

    def _call_api(self, prompt: str, max_tokens: int = 512, temperature: float = 0.3) -> str:
        """通用 API 调用接口，供分类等非分析任务使用"""
        if not self.api_key:
            return ""
        try:
            response = requests.post(
                self.API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "MiniMax-M2.7",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": temperature
                },
                timeout=60,
                proxies=PROXIES
            )
            if response.status_code == 200:
                result = response.json()
                message = result.get("choices", [{}])[0].get("message", {})
                return message.get("content", "") or message.get("reasoning_content", "")
        except Exception:
            pass
        return ""

    def _call_duckcoding(self, prompt: str, max_tokens: int = 512) -> str:
        """通过 DUCKCODING gpt-5.4 调用分析（热备）"""
        if not self.duck_api_key:
            return ""
        try:
            response = requests.post(
                self.DUCK_API_URL,
                headers={
                    "Authorization": f"Bearer {self.duck_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-5.4",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                    "max_tokens": max_tokens,
                    "temperature": 0.3
                },
                timeout=120,
                proxies=PROXIES
            )
            if response.status_code == 200:
                result = response.json()
                return result.get("choices", [{}])[0].get("message", {}).get("content", "")
        except Exception:
            pass
        return ""

    def _call_zai(self, prompt: str, model: str = "glm-4.5", max_tokens: int = 4096, temperature: float = 0.3) -> str:
        """通过 ZAI API 调用分析（主力，使用 httpx 避免 requests SSL 兼容性问题）
        
        ⚠️ Coding Plan 端点默认开启 Thinking Mode，content 为空，实际输出在 reasoning_content。
        通过设置 thinking.type=disabled 关闭思考模式，让 content 正常返回。
        参考：https://docs.z.ai/guides/capabilities/thinking-mode
        """
        if not self.zai_api_key:
            return ""
        # 关闭 Thinking Mode，让 content 正常返回（Coding Plan 端点默认开启）
        _request_body = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "thinking": {"type": "disabled"}
        }
        try:
            if httpx is not None:
                # httpx 方式：SSL 兼容性更好，稳定走代理
                with httpx.Client(proxy="http://127.0.0.1:7890", timeout=180) as client:
                    response = client.post(
                        self.ZAI_API_URL,
                        headers={
                            "Authorization": f"Bearer {self.zai_api_key}",
                            "Content-Type": "application/json"
                        },
                        json=_request_body
                    )
            else:
                # fallback: requests + verify=False（httpx 未安装时兜底）
                response = requests.post(
                    self.ZAI_API_URL,
                    headers={
                        "Authorization": f"Bearer {self.zai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json=_request_body,
                    timeout=120,
                    proxies=PROXIES,
                    verify=False
                )
            if response.status_code == 200:
                result = response.json() if hasattr(response, 'json') and callable(response.json) else response.json()
                message = result.get("choices", [{}])[0].get("message", {})
                # 优先取 content（thinking=disabled 时应正常返回），兜底取 reasoning_content
                content = message.get("content", "") or message.get("reasoning_content", "")

                return content
            elif response.status_code == 429:
                print(f"  WARNING: ZAI API rate limited (429), falling back...")
            else:
                text = response.text[:200] if hasattr(response, 'text') else str(response.content[:200])
                print(f"  WARNING: ZAI API returned {response.status_code}: {text}")
        except Exception as e:
            print(f"  WARNING: ZAI request failed: {e}")
        return ""

    def analyze_paper(self, paper: Dict) -> Dict:
        """分析单篇论文，返回6维度分析结果

        策略：ZAI glm-4.5（主力）→ DUCKCODING gpt-5.4 → MiniMax M2.7（兜底）。
        """
        if not self.zai_api_key and not self.duck_api_key and not self.api_key:
            print("  WARNING: No API key set (ZAI_API_KEY / DUCKCODING_API_KEY / MINIMAX_API_KEY), skipping analysis")
            return {}

        title = paper.get("title", "")
        abstract = paper.get("abstract", "")[:1000]
        arxiv_id = paper.get("arxiv_id", "")

        prompt = self.ANALYSIS_PROMPT.format(
            title=title,
            abstract=abstract,
            arxiv_id=arxiv_id
        )

        # ---- Primary: ZAI glm-4.5（快速、低成本）----
        if self.zai_api_key:
            try:
                content = self._call_zai(prompt, model="glm-4.5", max_tokens=1200)
                if content:
                    result = self._parse_analysis(content)
                    if result:
                        return result
                    print(f"  WARNING: ZAI parse failed, trying DUCKCODING...")
            except Exception as e:
                print(f"  WARNING: ZAI request failed: {e}")

        # ---- Secondary: DUCKCODING gpt-5.4（JSON mode，稳定可靠）----
        if self.duck_api_key:
            try:
                content = self._call_duckcoding(prompt, max_tokens=1200)
                if content:
                    result = self._parse_analysis(content)
                    if result:
                        return result
                    print(f"  WARNING: DUCKCODING parse failed, trying MiniMax...")
            except Exception as e:
                print(f"  WARNING: DUCKCODING request failed: {e}")

        # ---- Fallback: MiniMax M2.7 ----
        if self.api_key:
            try:
                response = requests.post(
                    self.API_URL,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "MiniMax-M2.7",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 1200,
                        "temperature": 0.3
                    },
                    timeout=120,
                    proxies=PROXIES
                )

                if response.status_code == 200:
                    result = response.json()
                    message = result.get("choices", [{}])[0].get("message", {})
                    content = message.get("content", "") or message.get("reasoning_content", "")
                    parsed = self._parse_analysis(content)
                    if parsed:
                        return parsed
                    print(f"  WARNING: MiniMax parse failed, paper dropped")

                elif response.status_code == 529:
                    print(f"  WARNING: MiniMax 529 overloaded (primary already tried ZAI+DUCKCODING)")

            except Exception as e:
                print(f"  WARNING: MiniMax request failed: {e}")

        return {}

    def _parse_analysis(self, content: str) -> Dict:
        """解析 MiniMax 返回的分析结果（支持多种格式）

        常见格式：
        1. ```json\n{...}\n```
        2. <think>
            思考过程...
           </think>
            ```json
            {JSON...}
            ```
        3. plain JSON without fences
        """
        import re
        import html

        if not content:
            return {}

        # Step 1: 去除 HTML 实体（如 &#124; → |, &#39; → ', 等等）
        content = html.unescape(content)

        # Step 2: 去除 <think> ...  思考标签（可能有嵌套）
        while "<think>" in content and "</think>" in content:
            start = content.find("<think>")
            end = content.find("</think>") + len("</think>")
            content = content[:start] + content[end:]
        content = content.strip()

        # Step 3: 提取 ```json ... ``` 或 ``` ... ``` 代码块
        for pattern in [
            r'```json\s*(\{[\s\S]*?\})\s*```',
            r'```\s*(\{[\s\S]*?\})\s*```',
        ]:
            matches = re.findall(pattern, content)
            for block in reversed(matches):
                block = block.strip()
                try:
                    result = json.loads(block)
                    if isinstance(result, dict) and len(result) > 0:
                        return result
                except:
                    continue

        # Step 4: 使用 brace-counting 找第一个完整 JSON 对象
        first_brace = content.find('{')
        if first_brace >= 0:
            depth = 0
            json_end = -1
            for i, c in enumerate(content[first_brace:]):
                if c == '{':
                    depth += 1
                elif c == '}':
                    depth -= 1
                    if depth == 0:
                        json_end = first_brace + i + 1
                        break
            if json_end > 0:
                json_str = content[first_brace:json_end]
                try:
                    result = json.loads(json_str)
                    if isinstance(result, dict) and len(result) > 0:
                        return result
                except:
                    pass

        # Step 5: 尝试从纯文本提取关键字段
        fallback = {}
        for field, label in [
            ("summary", "一句话概括"), ("research思路", "研究思路"),
            ("experiment", "实验方案"), ("innovation", "创新点"),
            ("related_work", "关联工作"), ("impact", "评价")
        ]:
            patterns = [
                rf'•\s*{re.escape(label)}[：:]\s*([^\n•]+)',
                rf'\d+\.\s*{re.escape(label)}[：:]\s*([^\n•]+)',
                rf'"{re.escape(field)}"\s*:\s*"([^"]+)"',
            ]
            for pat in patterns:
                m = re.search(pat, content)
                if m:
                    fallback[field] = m.group(1).strip()[:80]
                    break
        if fallback:
            print(f"  WARNING: Fallback parsed fields: {list(fallback.keys())}")
            return fallback

        print(f"  WARNING: Parse analysis failed, content: {content[:150]}...")
        return {}

    def batch_analyze(self, papers: List[Dict], top_n: int = 6) -> List[Dict]:
        """批量并行分析论文（只分析前top_n篇高质量论文）

        使用 concurrent.futures 并行调用 MiniMax API，显著加速批量分析。
        每篇论文单独调用，互不依赖。
        """
        # 筛选待分析的论文（只要还没分析过的，不限制来源）
        analyzable = [p for p in papers if not p.get("analysis")]
        analyzable = analyzable[:top_n]

        if not analyzable:
            return papers

        if not self.zai_api_key and not self.duck_api_key and not self.api_key:
            print(f"  WARNING: No API key set (ZAI/DUCKCODING/MINIMAX), skipping analysis")
            return papers

        print(f"  AI: parallel analyzing {len(analyzable)} papers (ZAI→DUCKCODING→MiniMax)...")

        # 方法1: 尝试使用线程池并行（适合 IO 密集型）
        try:
            from concurrent.futures import ThreadPoolExecutor, as_completed
            import threading

            results_lock = threading.Lock()
            results_map = {}  # idx -> analysis

            def analyze_single(paper: Dict, idx: int):
                arxiv_id = paper.get("arxiv_id", "")
                try:
                    print(f"    Analyzing [{idx+1}/{len(analyzable)}]: {arxiv_id}...")
                    analysis = self.analyze_paper(paper)
                    with results_lock:
                        results_map[idx] = (paper, analysis)
                except Exception as e:
                    print(f"    WARNING: Failed to analyze {arxiv_id}: {e}")
                    with results_lock:
                        results_map[idx] = (paper, {})

            # 最多3个并行 worker（避免 API 限流）
            with ThreadPoolExecutor(max_workers=3) as executor:
                futures = {
                    executor.submit(analyze_single, paper, i): i
                    for i, paper in enumerate(analyzable)
                }
                for future in as_completed(futures, timeout=300):
                    try:
                        future.result()  # 等待完成
                    except Exception as e:
                        print(f"  WARNING: Future failed: {e}")

            # 更新 papers 中的 analysis 字段
            for idx, (paper, analysis) in results_map.items():
                if analysis:
                    paper["analysis"] = analysis

            print(f"  MiniMax: completed {len(results_map)} analyses")
            return papers

        except ImportError:
            # fallback: 串行处理
            print("  WARNING: concurrent.futures not available, using serial analysis")
            analyzed = 0
            for paper in analyzable:
                if analyzed >= top_n:
                    break
                arxiv_id = paper.get("arxiv_id", "")
                print(f"    Analyzing paper {analyzed + 1}/{min(top_n, len(analyzable))}: {arxiv_id}...")
                analysis = self.analyze_paper(paper)
                if analysis:
                    paper["analysis"] = analysis
                    analyzed += 1
            return papers

    # 领域趋势分析提示词模板
    DOMAIN_TREND_PROMPT = """你是一位光学领域顶级学术研究员。请分析以下 {domain} 领域的最新论文，识别核心共同主题，生成一句话趋势概括。

领域：{cat_name} ({cat_name_en})

论文列表：
{paper_list}

请分析这些论文的共同主题、技术路线或发展趋势，用一句话概括（30-50字），要求：
1. 抓人眼球，体现该领域最活跃的研究方向
2. 准确反映论文核心贡献
3. 使用学术严谨但引人注目的表达
4. 避免空洞词汇，需要具体技术/架构名称

请返回JSON格式：
{{
  "trend": "趋势概括句",
  "key_topics": ["主题1", "主题2", "主题3"],
  "development_direction": "发展方向描述"
}}
"""

    def generate_domain_trends(self, cat_id: str, papers: List[Dict], cat: Dict) -> Dict:
        """分析领域内多篇论文，生成一句话趋势概括"""
        if not self.zai_api_key and not self.api_key:
            return {"trend": f"{len(papers)}篇新论文"}

        # 过滤有效论文
        valid_papers = [p for p in papers if p.get("title") and p.get("abstract")]
        if len(valid_papers) < 3:
            return {"trend": f"{len(valid_papers)}篇新论文"}

        cat_name = cat.get("name", cat_id)
        cat_name_en = cat.get("name_en", "")

        # 构建论文列表
        paper_list = []
        for i, paper in enumerate(valid_papers[:6], 1):
            title = paper.get("title", "")[:80]
            abstract = paper.get("abstract", "")[:300]
            paper_list.append(f"{i}. {title}\n   摘要: {abstract}")

        prompt = self.DOMAIN_TREND_PROMPT.format(
            domain=cat_name,
            cat_name=cat_name,
            cat_name_en=cat_name_en,
            paper_list="\n\n".join(paper_list)
        )

        # ---- Primary: ZAI glm-4.5 ----
        if self.zai_api_key:
            try:
                content = self._call_zai(prompt, model="glm-4.5", max_tokens=500, temperature=0.7)
                if content:
                    result = self._parse_trend_result(content)
                    if result:
                        return result
            except Exception as e:
                print(f"  WARNING: ZAI domain trend analysis failed: {e}")

        # ---- Fallback: MiniMax M2.7 ----
        if self.api_key:
            try:
                response = requests.post(
                    self.API_URL,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "MiniMax-M2.7",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 500,
                        "temperature": 0.7
                    },
                    timeout=60,
                    proxies=PROXIES
                )

                if response.status_code == 200:
                    result = response.json()
                    message = result.get("choices", [{}])[0].get("message", {})
                    content = message.get("content", "") or message.get("reasoning_content", "")
                    return self._parse_trend_result(content)
            except Exception as e:
                print(f"  WARNING: MiniMax domain trend analysis failed: {e}")
    def _parse_trend_result(self, content: str) -> Dict:
        """解析领域趋势分析结果"""
        import re
        import html

        if not content:
            return {}

        # Step 1: 去除 HTML 实体
        content = html.unescape(content)

        # Step 2: 去除思考标签
        while "<think>" in content and "</think>" in content:
            start = content.find("<think>")
            end = content.find("</think>") + len("</think>")
            content = content[:start] + content[end:]
        content = content.strip()

        # Step 3: 尝试直接解析（已去除 fences）
        try:
            return json.loads(content)
        except:
            pass

        # Step 4: 提取 ```json ... ``` 块
        matches = re.findall(r'```(?:json)?\s*([\s\S]*?)```', content, re.DOTALL)
        if matches:
            for json_str in reversed(matches):
                json_str = json_str.strip()
                try:
                    result = json.loads(json_str)
                    if "trend" in result or "key_topics" in result:
                        return result
                except:
                    continue

        # Step 5: 尝试找包含 trend/key_topics 的 JSON 对象
        matches = re.findall(r'\{[^}]*(?:trend|key_topics|development_direction)[^}]*\}', content, re.DOTALL)
        for match in matches:
            try:
                result = json.loads(match.replace("'", '"'))
                if "trend" in result:
                    return result
            except:
                continue

        # Step 6: fallback - 提取 trend 纯文本
        trend_match = re.search(r'"trend"\s*:\s*"([^"]+)"', content)
        if trend_match:
            return {"trend": trend_match.group(1)}

        # 解析失败时返回安全默认值，不暴露思考过程或 raw content
        print(f"  WARNING: Parse trend result failed, content: {content[:100]}...")
        return {"trend": "该领域暂无趋势分析"}

    # 基于分析结果的领域趋势提示词
    DOMAIN_TREND_FROM_ANALYSIS_PROMPT = """你是一位光学领域顶级学术研究员。请分析以下论文的6维度学术评价，生成领域发展趋势概括。

领域：{cat_name} ({cat_name_en})

论文列表（每篇包含6维度分析）：
{paper_analysis_list}

请根据这些论文的6维度分析（特别是创新点、评价、关联工作），识别：
1. 该领域最活跃的研究方向
2. 技术发展趋势
3. 跨领域融合机会

用一句话概括（30-50字），要求：
1. 抓人眼球，体现该领域最前沿的研究热点
2. 准确反映论文核心贡献
3. 使用学术严谨但引人注目的表达

请返回JSON格式：
{{
  "trend": "趋势概括句（30-50字）",
  "key_topics": ["热点主题1", "热点主题2", "热点主题3"],
  "development_direction": "发展方向描述"
}}
"""

    def generate_domain_trends_from_analysis(self, cat_id: str, papers: List[Dict], cat: Dict) -> Dict:
        """基于6维度分析结果生成领域趋势"""
        if not self.zai_api_key and not self.api_key:
            return {"trend": f"{len(papers)}篇新论文"}

        # 收集有分析结果的论文
        analyzed_papers = [p for p in papers if p.get("analysis")]
        if len(analyzed_papers) < 1:
            return {"trend": f"{len(papers)}篇新论文"}

        cat_name = cat.get("name", cat_id)
        cat_name_en = cat.get("name_en", "")

        # 构建论文分析列表
        paper_list = []
        for i, paper in enumerate(analyzed_papers[:6], 1):
            analysis = paper.get("analysis", {})
            title = paper.get("title", "")[:60]
            summary = analysis.get("summary", "待分析")
            innovation = analysis.get("innovation", "待分析")
            impact = analysis.get("impact", "待分析")

            paper_list.append(f"{i}. {title}")
            paper_list.append(f"   概括: {summary[:50]}")
            paper_list.append(f"   创新: {innovation[:50]}")
            paper_list.append(f"   评价: {impact[:50]}")

        prompt = self.DOMAIN_TREND_FROM_ANALYSIS_PROMPT.format(
            cat_name=cat_name,
            cat_name_en=cat_name_en,
            paper_analysis_list="\n".join(paper_list)
        )

        # ---- Primary: ZAI glm-4.5 ----
        if self.zai_api_key:
            try:
                content = self._call_zai(prompt, model="glm-4.5", max_tokens=500, temperature=0.7)
                if content:
                    result = self._parse_trend_result(content)
                    if result:
                        return result
            except Exception as e:
                print(f"  WARNING: ZAI domain trend from analysis failed: {e}")

        # ---- Fallback: MiniMax M2.7 ----
        if self.api_key:
            try:
                response = requests.post(
                    self.API_URL,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "MiniMax-M2.7",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 500,
                        "temperature": 0.7
                    },
                    timeout=60,
                    proxies=PROXIES
                )

                if response.status_code == 200:
                    result = response.json()
                    message = result.get("choices", [{}])[0].get("message", {})
                    content = message.get("content", "") or message.get("reasoning_content", "")
                    return self._parse_trend_result(content)
            except Exception as e:
                print(f"  WARNING: MiniMax domain trend from analysis failed: {e}")

        return {"trend": f"{len(papers)}篇新论文"}


class TavilySearcher:
    """Tavily 网络搜索 - 多源检索补充，支持 key 轮换"""

    @staticmethod
    def _load_and_probe_keys() -> List[str]:
        """从 ~/.claude/tavily-rotate/.env.tavily 读取所有 key，
        用轻量探测过滤掉 432（月度耗尽）/401/403 等无效 key，
        保留可用 key 列表。恢复后自动重新启用，无需手动维护。"""
        import os
        env_path = os.path.expanduser("~/.claude/tavily-rotate/.env.tavily")
        raw_keys = []
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and line.startswith("TAVILY_API_KEY"):
                        _, _, key = line.partition("=")
                        key = key.strip()
                        if key:
                            raw_keys.append(key)

        if not raw_keys:
            return []

        # 探测所有 key，过滤掉 432/401/403 等无效响应
        valid_keys = []
        for key in raw_keys:
            try:
                r = requests.post(
                    TavilySearcher.API_URL,
                    json={"api_key": key, "query": "test", "max_results": 1},
                    proxies=TavilySearcher.SOCKS_PROXY, timeout=20
                )
                if r.status_code == 200:
                    valid_keys.append(key)
                else:
                    print(f"  [Tavily] Key {key[:20]}... excluded: HTTP {r.status_code}")
            except Exception as e:
                # 网络抖动也保留，后续自动重试
                print(f"  [Tavily] Key {key[:20]}... probe error: {e}, keeping for retry")
                valid_keys.append(key)

        return valid_keys

    API_URL = "https://api.tavily.com/search"
    # keys 从 ~/.claude/tavily-rotate/.env.tavily 动态加载 + 运行时探测过滤
    # _keys_probed: 类级缓存标志，避免每次实例化都重新探测所有 key（每次探测 = 3×HTTP 请求）
    KEYS: List[str] = []
    _keys_probed: bool = False
    SOCKS_PROXY = {"http": "socks5h://127.0.0.1:7890", "https": "socks5h://127.0.0.1:7890"}

    def __init__(self, api_key: str = None):
        # 运行时探测 key（类级缓存，同一进程内只探测一次，下个月自动恢复）
        if not TavilySearcher._keys_probed:
            TavilySearcher.KEYS = self._load_and_probe_keys()
            TavilySearcher._keys_probed = True
            print(f"  [Tavily] {len(TavilySearcher.KEYS)} valid key(s) loaded: {[k[:15]+'...' for k in TavilySearcher.KEYS]}")
        self._current_key_index = 0
        self._exhausted_keys: set = set()
        self._single_key_mode = bool(api_key)

    def _get_active_key(self) -> str:
        """返回当前可用 key（跳过已耗尽的），全部耗尽则返回空字符串"""
        tried = 0
        start = self._current_key_index
        while tried < len(self.KEYS):
            if self._current_key_index not in self._exhausted_keys:
                return self.KEYS[self._current_key_index]
            self._current_key_index = (self._current_key_index + 1) % len(self.KEYS)
            tried += 1
        return ""

    def _mark_exhausted_and_rotate(self):
        """标记当前 key 耗尽，切换到下一个"""
        self._exhausted_keys.add(self._current_key_index)
        old = self._current_key_index
        self._current_key_index = (self._current_key_index + 1) % len(self.KEYS)
        print(f"  [Tavily] Key {old+1} exhausted/无效，切换到 Key {self._current_key_index+1}")

    def _rotate_to_next(self):
        """正常轮换到下一个 key（不标记耗尽）"""
        self._current_key_index = (self._current_key_index + 1) % len(self.KEYS)

    def search_topic(self, query: str, max_results: int = 3) -> List[Dict]:
        """搜索主题相关结果，支持 key 轮换重试"""
        # 单 key 模式（兼容旧调用）
        if self._single_key_mode:
            return self._search_single_key(query, max_results)

        # 多 key 轮换模式（最多遍历全部 key 各一次）
        for attempt in range(len(self.KEYS)):
            key = self._get_active_key()
            if not key:
                print("  [Tavily] 所有 key 均已耗尽，跳过搜索")
                return []

            key_idx = self.KEYS.index(key)
            try:
                response = requests.post(
                    self.API_URL,
                    json={
                        "api_key": key,
                        "query": query,
                        "max_results": max_results,
                        "include_answer": False,
                        "include_raw_content": False,
                    },
                    timeout=30,
                    proxies=self.SOCKS_PROXY,
                )
                if response.status_code == 200:
                    data = response.json()
                    results = []
                    for item in data.get("results", [])[:max_results]:
                        results.append({
                            "title": item.get("title", ""),
                            "url": item.get("url", ""),
                            "snippet": (item.get("content") or "")[:300],
                        })
                    return results
                elif response.status_code in (401, 403, 429, 432):
                    # key 无效/额度用尽 → 本次跳过，下次可能恢复（432=本月配额耗尽，非永久失效）
                    print(f"  [Tavily] Key {key_idx+1} error({response.status_code})，本次跳过")
                    self._rotate_to_next()
                    continue
                else:
                    # 非预期状态码 → 本次轮转不重用
                    print(f"  [Tavily] API error {response.status_code}，本次跳过")
                    self._rotate_to_next()
                    continue
            except Exception as e:
                print(f"  [Tavily] 请求异常: {e}，本次跳过，下个 key 继续")
                self._rotate_to_next()
                continue
        return []

    def _search_single_key(self, query: str, max_results: int = 3) -> List[Dict]:
        """单 key 搜索（兼容旧模式）"""
        if not self.KEYS:
            return []
        try:
            response = requests.post(
                self.API_URL,
                json={
                    "api_key": self.KEYS[0],
                    "query": query,
                    "max_results": max_results,
                    "include_answer": False,
                    "include_raw_content": False,
                },
                timeout=30,
                proxies=self.SOCKS_PROXY,
            )
            if response.status_code == 200:
                data = response.json()
                results = []
                for item in data.get("results", [])[:max_results]:
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "snippet": (item.get("content") or "")[:300],
                    })
                return results
            elif response.status_code == 429:
                print(f"  [Tavily] Key1 额度耗尽(429)，key 轮换模式已关闭")
            else:
                print(f"  [Tavily] API error {response.status_code}")
        except Exception as e:
            print(f"  [Tavily] 请求异常: {e}")
        return []

    def search_papers(self, category_keywords: List[str], max_results: int = 3) -> List[Dict]:
        """搜索领域相关最新论文/预印本（用于补充 ArXiv/PubMed）

        P1 重构：多路并行 AND 查询策略
        - 每个关键词独立 AND 期刊加权（避免宽松 OR 召回噪声）
        - 期刊优先级：Nature Photonics > Optica > Advanced Photonics > Science/PR > 通用
        - 多路并发查询，结果合并去重
        """
        if not category_keywords:
            return []

        import concurrent.futures

        # 期刊优先级（按影响力降序）
        journal_tiers = [
            # Tier 1: 光学顶刊（必须包含关键词）
            ["Nature Photonics", "Advanced Photonics", "Optica"],
            # Tier 2: 综述顶刊 + Science/PR 系列
            ["Science", "Physical Review X", "Nature Communications", "Light Science"],
            # Tier 3: 光学主力期刊
            ["Optics Express", "Photonics Research", "IEEE Journal", "Proceedings"],
        ]

        # P1 安全版：顺序查询，每域最多 3 次 Tavily 调用（Tier 并发，关键词串行）
        # 避免: 15并发(5关键词×3层) × 4workers = 60+ 并发 Tavily 请求导致 429
        journal_tiers = [
            ["Nature Photonics", "Advanced Photonics", "Optica"],
            ["Science", "Physical Review X", "Nature Communications"],
            ["Optics Express", "Photonics Research", "IEEE Journal"],
        ]

        all_results = []
        seen_urls = set()

        for tier in journal_tiers:
            # 同层期刊 OR 查询（1次 Tavily 调用覆盖整层）
            journal_part = " OR ".join(f'"{j}"' for j in tier)
            kw_part = " OR ".join(f'"{kw}"' for kw in category_keywords[:3])  # 最多3个关键词
            query = f"({kw_part}) AND ({journal_part})"
            results = self.search_topic(query, max_results=max(max_results, 3))
            for r in results:
                url = r.get("url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    all_results.append(r)

        # 按 title 长度降序（长标题 = 更可能是正式论文）
        all_results.sort(key=lambda x: len(x.get("title", "")), reverse=True)
        return all_results[:max_results * 3]

    def get_domain_summary(self, category_id: str, papers: List[Dict]) -> str:
        """根据领域论文生成AI总结（使用 Tavily 搜索补充）"""
        if not papers:
            return "暂无最新论文"

        # 提取领域关键词
        keywords = []
        for paper in papers[:3]:
            title = paper.get("title", "")
            # 取标题中的实词
            words = [w for w in title.split() if len(w) > 4 and w.lower() not in ["with", "from", "that", "this"]]
            keywords.extend(words[:3])

        if keywords:
            query = f"{' '.join(keywords[:8])} latest research 2024"
            results = self.search_topic(query, max_results=2)

            if results:
                snippets = [r["snippet"] for r in results if r["snippet"]]
                if snippets:
                    return f"近期热点: {'; '.join(snippets[:2])}"

        return ""


class CrossrefSearcher:
    """Crossref 期刊论文搜索 - 免费、无注册限制的第三信源

    补充 ArXiv/PubMed 覆盖不到的会议论文和期刊文章，
    覆盖 Nature/Science/PRX/Optica 等高影响力期刊。
    """

    API_URL = "https://api.crossref.org/works"

    def __init__(self):
        self.rate_limit_delay = 0.334  # Crossref 要求每秒最多 1 请求

    def _rate_limit(self):
        import time
        time.sleep(self.rate_limit_delay)

    def search_by_keywords(self, keywords: List[str], max_results: int = 5,
                           days_back: int = 90) -> List[Dict]:
        """按关键词搜索 Crossref 期刊论文

        Args:
            keywords: 关键词列表
            max_results: 最大返回数量
            days_back: 搜索近多少天内的论文

        Returns:
            论文列表，格式与 ArXiv 兼容（有 title/abstract/url/authors/doi）
        """
        if not keywords:
            return []

        from datetime import datetime, timezone
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
        from_dt = cutoff.strftime("%Y-%m-%d")

        query = " ".join(keywords[:4])
        params = {
            "query": query,
            "filter": f"from-pub-date:{from_dt},type:journal-article",
            "rows": max_results * 2,
            "sort": "relevance",
            "mailto": "scholars-tea@example.com"
        }

        try:
            self._rate_limit()
            response = requests.get(
                self.API_URL, params=params, timeout=30, proxies=PROXIES
            )
            if response.status_code != 200:
                # 打印响应体帮助诊断（截断到200字符）
                body = response.text[:200].replace("\n", " ")
                print(f"  WARNING: Crossref API error {response.status_code}: {body}")
                return []

            data = response.json()
            items = data.get("message", {}).get("items", [])
            papers = []

            for item in items[:max_results]:
                title_parts = item.get("title", [])
                title = title_parts[0] if title_parts else ""
                if not title:
                    continue

                # ===== P0-1: 标题质量过滤 =====
                # 过滤垃圾元数据标题（非正式论文标题）
                title_lower = title.lower()
                garbage_title_patterns = [
                    "issue publication information", "author index", "table of contents",
                    "front matter", "back matter", "editorial", " Erratum",
                    "corrigendum", "retraction", "comment on", "reply to",
                    "conference proceedings", "meeting abstracts", "annual meeting",
                    "special issue", "guest editorial", "in memory",
                ]
                if any(p in title_lower for p in garbage_title_patterns):
                    continue
                # 过滤过短标题（通常是网页片段或元数据）
                if len(title) < 25:
                    continue

                abstract = ""
                abstr = item.get("abstract", "")
                if abstr:
                    import re as re_mod
                    abstract = re_mod.sub(r"<[^>]+>", "", abstr)

                authors = []
                for a in item.get("author", []):
                    name = (a.get("given", "") + " " + a.get("family", "")).strip()
                    if name:
                        authors.append(name)

                doi = item.get("DOI", "")
                url = f"https://doi.org/{doi}" if doi else ""

                papers.append({
                    "title": title,
                    "abstract": abstract[:800],
                    "doi": doi,
                    "url": url,
                    "authors": authors[:5],
                    "citations": 0,
                    "venue": (item.get("container-title", [""])[0]
                              if item.get("container-title") else ""),
                    "published": (item.get("published-print", item.get("published-online", {}))
                                 .get("date-parts", [[""]])[0][0]),
                    "source": "crossref"
                })
            return papers
        except Exception as e:
            print(f"  WARNING: Crossref search failed: {e}")
            return []

    def search_category(self, category_id: str, classifier: "OpticsClassifier",
                        max_results: int = 5) -> List[Dict]:
        """按领域搜索，使用领域关键词"""
        cat = classifier.categories.get(category_id, {})
        keywords = cat.get("keywords", [])
        if keywords:
            return self.search_by_keywords(keywords, max_results=max_results)
        return []


class FeishuCardSender:
    """飞书卡片发送器"""

    API_BASE = "https://open.feishu.cn/open-apis"
    MAIN_TEMPLATE_ID = "AAqejKhk6IPow"  # 主卡片模板ID
    SUB_TEMPLATE_ID = "AAqejTzWm5upF"   # 子卡片模板ID

    # 子卡片存储群（仅用于获取 message_id，不对用户可见）
    SUB_CARD_STORAGE_GROUP = "oc_e7930d06b52382cfbc1a8ca2e5d7b5d6"

    # 8大领域配置（对应主卡片中的8个格子，按2x4网格排列）
    # 与 father.md 主卡片布局一致
    CATEGORIES_LAYOUT = [
        ["ultrafast_optics", "metamaterial_optics"],       # 第一行：超快光学, 超材料与纳米光学
        ["nearfield_optics", "laser_processing"],          # 第二行：近场光学, 激光加工与制造
        ["nonlinear_optics", "nanophotonics"],               # 第三行：非线性光学, 硅基光子学与量子光学
        ["biophotonics", "quantum_optics"],                 # 第四行：生物与医学光子学, 量子光学
    ]

    # 域名到模板变量的映射
    DOMAIN_VAR_MAP = {
        "ultrafast_optics": ("domain1", "subdomain1"),
        "metamaterial_optics": ("domain2", "subdomain2"),
        "nearfield_optics": ("domain3", "subdomain3"),
        "laser_processing": ("domain4", "subdomain4"),
        "nonlinear_optics": ("domain5", "subdomain5"),
        "nanophotonics": ("domain6", "subdomain6"),
        "biophotonics": ("domain7", "subdomain7"),
        "quantum_optics": ("domain8", "subdomain8"),
    }

    def __init__(self):
        self.app_id = os.getenv("FEISHU_APP_ID")
        self.app_secret = os.getenv("FEISHU_APP_SECRET")
        self.target_group = os.getenv("FEISHU_TARGET_GROUP", "oc_e7930d06b52382cfbc1a8ca2e5d7b5d6")
        # 优先从环境变量读取（.env 中配置 ngrok URL）
        self.public_base_url = os.getenv("PUBLIC_BASE_URL")
        # 如果未配置，尝试从 ngrok API 获取
        if not self.public_base_url:
            try:
                resp2 = urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels", timeout=3)
                tunnels2 = json.loads(resp2.read()).get("tunnels", [])
                if tunnels2:
                    self.public_base_url = tunnels2[0]["public_url"].rstrip("/")
            except Exception:
                pass

    def get_access_token(self) -> Optional[str]:
        url = f"{self.API_BASE}/auth/v3/tenant_access_token/internal"
        data = {"app_id": self.app_id, "app_secret": self.app_secret}
        try:
            response = requests.post(url, json=data, timeout=15, proxies=FEISHU_PROXIES)
            result = response.json()
            return result.get("tenant_access_token")
        except Exception as e:
            print(f"ERROR: Failed to get access token: {e}")
            return None

    def send_card(self, card_content: Dict, chat_id: str = None) -> bool:
        token = self.get_access_token()
        if not token:
            return False
        chat_id = chat_id or self.target_group
        url = f"{self.API_BASE}/im/v1/messages?receive_id_type=chat_id"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {"receive_id": chat_id, "msg_type": "interactive", "content": json.dumps(card_content, ensure_ascii=False)}
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30, proxies=FEISHU_PROXIES)
            result = response.json()
            if result.get("code") == 0:
                print(f"  SUCCESS: Card sent to {chat_id}")
                return True
            print(f"  ERROR: {result}")
            return False
        except Exception as e:
            print(f"  ERROR: {e}")
            return False

    def generate_image(self, prompt: str, output_path: str = "/tmp/gen_images/generated.jpg") -> str:
        """调用 MiniMax 图片生成 API 并下载到本地。

        Returns: 本地图片路径，失败返回空字符串。
        """
        import urllib.request
        api_token = os.environ.get("ANTHROPIC_AUTH_TOKEN", "")
        if not api_token:
            print("  ERROR: ANTHROPIC_AUTH_TOKEN not set, cannot generate image")
            return ""

        url = "https://api.minimax.chat/v1/image_generation"
        headers = {"Authorization": f"Bearer {api_token}"}
        payload = {"model": "image-01", "prompt": prompt, "aspect_ratio": "1:1", "num_images": 1}
        try:
            # MiniMax 直连，不走代理（走代理会导致超时）
            resp = requests.post(url, json=payload, headers=headers, timeout=120)
            resp.raise_for_status()
            image_url = resp.json()["data"]["image_urls"][0]
        except Exception as e:
            print(f"  ERROR: MiniMax image generation failed: {e}")
            return ""

        # 下载到本地（直连，不走代理）
        try:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            img_resp = requests.get(image_url, timeout=30)
            img_resp.raise_for_status()
            with open(output_path, "wb") as f:
                f.write(img_resp.content)
            print(f"  Image downloaded: {output_path}")
            return output_path
        except Exception as e:
            print(f"  ERROR: Failed to download image: {e}")
            return ""

    def send_image(self, image_path: str, chat_id: str = None) -> bool:
        """上传本地图片到飞书并作为图片消息发送。

        Returns: 发送是否成功。
        """
        token = self.get_access_token()
        if not token:
            return False
        chat_id = chat_id or self.target_group

        # Step 1: 上传获取 image_key
        upload_url = f"{self.API_BASE}/im/v1/images"
        headers = {"Authorization": f"Bearer {token}"}
        try:
            with open(image_path, "rb") as f:
                files = {"image": (os.path.basename(image_path), f, "image/jpeg")}
                data = {"image_type": "message"}
                resp = requests.post(upload_url, headers=headers, files=files, data=data, timeout=30, proxies=FEISHU_PROXIES)
            result = resp.json()
            if result.get("code") != 0:
                print(f"  ERROR: Image upload failed: {result}")
                return False
            image_key = result["data"]["image_key"]
        except Exception as e:
            print(f"  ERROR: Image upload exception: {e}")
            return False

        # Step 2: 发送图片消息
        send_url = f"{self.API_BASE}/im/v1/messages?receive_id_type=chat_id"
        payload = {
            "receive_id": chat_id,
            "msg_type": "image",
            "content": json.dumps({"image_key": image_key}),
        }
        try:
            resp = requests.post(send_url, headers=headers, json=payload, timeout=20, proxies=FEISHU_PROXIES)
            result = resp.json()
            if result.get("code") == 0:
                print(f"  SUCCESS: Image sent to {chat_id}")
                return True
            print(f"  ERROR: Image send failed: {result}")
            return False
        except Exception as e:
            print(f"  ERROR: Image send exception: {e}")
            return False

    def generate_and_send_image(self, prompt: str, chat_id: str = None, output_path: str = None) -> bool:
        """生成图片 + 发到飞书，一站式完成。

        Args:
            prompt: MiniMax 图片生成 prompt
            chat_id: 目标群 ID
            output_path: 本地图片路径，默认 /tmp/gen_images/<timestamp>.jpg

        Returns: 发送是否成功
        """
        if output_path is None:
            import time
            output_path = f"/tmp/gen_images/img_{int(time.time())}.jpg"

        img_path = self.generate_image(prompt, output_path)
        if not img_path:
            return False
        return self.send_image(img_path, chat_id)

    def send_main_card(self, category_summaries: Dict[str, Dict], classifier: OpticsClassifier, use_template: bool = True, minimax_analyzer=None, sub_card_message_ids: Dict[str, str] = None, target_chat_id: str = None) -> str:
        """
        target_chat_id: 发送目标群 ID，默认 self.target_group（测试群）
        sub_card_message_ids: {category_id: message_id} 映射，用于构建「查看详情」按钮URL。
        """
        token = self.get_access_token()
        if not token:
            return ""

        if not use_template:
            card_data = self._build_main_card_json(category_summaries, classifier, minimax_analyzer, sub_card_message_ids)
            card_content_str = json.dumps(card_data, ensure_ascii=False)
        else:
            card_data = self._build_main_card_template_data(category_summaries, classifier)
            card_content_str = json.dumps(card_data, ensure_ascii=False)

        chat_id = target_chat_id or self.target_group
        url = f"{self.API_BASE}/im/v1/messages?receive_id_type=chat_id"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {"receive_id": chat_id, "msg_type": "interactive", "content": card_content_str}

        try:
            # content 字段已经是 JSON 字符串，直接用 requests.post(json=payload) 让其自动处理编码
            response = requests.post(url, headers=headers, json=payload, timeout=30, proxies=FEISHU_PROXIES)
            result = response.json()
            if result.get("code") == 0:
                message_id = result.get("data", {}).get("message_id", "")
                print(f"  SUCCESS: Main card sent -> message_id={message_id}")
                return message_id
            print(f"  ERROR: {result}")
            return ""
        except Exception as e:
            print(f"  ERROR: {e}")
            return False

    def _build_main_card_template_data(self, category_summaries: Dict[str, Dict], classifier: OpticsClassifier) -> str:
        """构建主卡片模板数据（使用模板变量）"""
        # 构建模板变量
        vars = {}
        domain_map = {
            "ultrafast_optics": ("domain1", "subdomain1"),
            "metamaterial_optics": ("domain2", "subdomain2"),
            "nearfield_optics": ("domain3", "subdomain3"),
            "laser_processing": ("domain4", "subdomain4"),
            "nonlinear_optics": ("domain5", "subdomain5"),
            "nanophotonics": ("domain6", "subdomain6"),
            "biophotonics": ("domain7", "subdomain7"),
            "quantum_optics": ("domain8", "subdomain8"),
        }

        for cat_id, (domain_key, subdomain_key) in domain_map.items():
            summary = category_summaries.get(cat_id, {})
            papers = summary.get("papers", [])
            cat = classifier.categories.get(cat_id, {})
            icon = cat.get("icon", "📄")
            name = cat.get("name", cat_id)
            name_en = cat.get("name_en", "")
            count = len(papers)

            # domain变量
            vars[domain_key] = f"{icon} **{name}**\n{name_en}\n最新进展: **{count}** 篇"

            # subdomain变量
            if papers:
                vars[subdomain_key] = self._build_domain_summary(cat_id, papers, classifier)
            else:
                vars[subdomain_key] = "暂无最新论文"

        vars["time"] = f"🕐 推送时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}"

        # 使用模板格式
        card_data = {
            "type": "template",
            "data": {
                "template_id": self.MAIN_TEMPLATE_ID,
                "template_variable": vars
            }
        }
        return json.dumps(card_data)

    def _build_main_card_json(self, category_summaries: Dict[str, Dict], classifier: OpticsClassifier, minimax_analyzer=None, sub_card_message_ids: Dict[str, str] = None) -> Dict:
        """构建主卡片完整JSON
        保持原有2x4网格布局，每个领域卡片带「查看详情」按钮跳转到子卡片消息。
        sub_card_message_ids: {category_id: message_id} 映射。
        """
        sub_card_message_ids = sub_card_message_ids or {}

        def build_paper_detail(paper: Dict, index: int) -> List[Dict]:
            """构建单篇论文详情（美观格式，恢复原始风格）"""
            title = paper.get("title", "")
            citations = paper.get("citations", 0)
            venue = paper.get("venue", "arXiv")
            arxiv_id = paper.get("arxiv_id", "")
            authors = paper.get("authors", [])[:2]
            author_str = ", ".join(authors) if authors else ""

            # 6维度分析内容（与子卡片保持一致）
            analysis = paper.get("analysis", {})
            if analysis:
                content = self._build_6dimension_content(analysis, arxiv_id)
            else:
                content = self._build_paper_content(paper)

            # 构建URL
            arxiv_url = f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else ""

            # 根据来源决定显示"阅读数"还是"引用数"
            source = paper.get("source", "arxiv")
            if source == "arxiv" and arxiv_id:
                citation_label = "阅读数"
                citation_value = citations  # ArXiv来源显示阅读数
            else:
                citation_label = "引用"
                citation_value = citations

            result = [
                {"tag": "markdown", "content": f"**{index}.** {_clean_latex(title[:70])}{'...' if len(title) > 70 else ''}", "margin": "4px 0px 2px 0px"},
                {"tag": "markdown", "content": f"   📚 {citation_label}: **{citation_value}**  |  🏠 {venue}", "margin": "0px 0px 2px 0px"}
            ]
            if author_str:
                result.append({"tag": "markdown", "content": f"   👥 {author_str}", "margin": "0px 0px 4px 0px"})
            result.append({"tag": "markdown", "content": content, "margin": "0px 0px 4px 0px"})
            # 添加URL链接
            if arxiv_url:
                result.append({"tag": "markdown", "content": f"<a href='{arxiv_url}'>🔗 arXiv: {arxiv_id}</a>", "margin": "0px 0px 0px 0px"})
            elif paper.get("url"):
                result.append({"tag": "markdown", "content": f"<a href='{paper['url']}'>🔗 来源链接</a>", "margin": "0px 0px 0px 0px"})
            return result

        def build_paper_elements(paper: Dict, index: int) -> List[Dict]:
            """构建单篇论文的卡片内元素（每个论文1个markdown行）"""
            title = paper.get("title", "")
            citations = paper.get("citations", 0)
            venue = paper.get("venue", "arXiv")
            arxiv_id = paper.get("arxiv_id", "")
            authors = paper.get("authors", [])[:2]
            author_str = ", ".join(authors) if authors else ""

            analysis = paper.get("analysis", {})
            if analysis:
                content = self._build_6dimension_content(analysis, arxiv_id)
            else:
                content = self._build_paper_content(paper)

            arxiv_url = f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else ""

            source = paper.get("source", "arxiv")
            citation_label = "阅读数" if (source == "arxiv" and arxiv_id) else "引用"
            citation_value = citations

            # 合并为单个简洁markdown行
            lines = [
                f"**{index}.** {_clean_latex(title[:60])}{'...' if len(title) > 60 else ''}",
                f"📚 {citation_label}: **{citation_value}**  🏠 {venue}" + (f"  👥 {author_str}" if author_str else ""),
            ]
            if arxiv_url:
                lines.append(f"<a href='{arxiv_url}'>🔗 {arxiv_id}</a>")
            elif paper.get("url"):
                lines.append(f"<a href='{paper['url']}'>🔗 来源链接</a>")

            return [{"tag": "markdown", "content": "\n".join(lines), "margin": "2px 0px 2px 0px"}]

        def build_domain_cell(cat_id: str, papers: List[Dict], cat: Dict, accent_color: str = "indigo") -> List[Dict]:
            """构建单个领域的单元格（蓝色/紫色底框 + 清晰层次设计）

            设计原则：
            - 外层 card + background_style：蓝/紫色底框
            - Emoji + 粗体标题：一眼区分领域
            - 辅助信息灰色 + 主要内容默认色：层次分明
            """
            icon = cat.get("icon", "📄")
            name = cat.get("name", cat_id)
            name_en = cat.get("name_en", "")

            # 论文数量徽章：显示实际展示的篇目（最多3篇）
            displayed = min(len(papers), 3)

            # AI趋势概括
            trend_result = papers[0].get("domain_trend", {}) if papers else {}
            trend = trend_result.get("trend", f"**{displayed}** 篇新论文")

            # 领域标题（emoji + 加粗）
            domain_text = f"**{icon} {name}**  `{name_en}`"
            count_badge = f"📚 **{displayed}** 篇新论文"

            # 趋势文字（LaTeX清洗，不加灰色）
            trend_text = _clean_latex(trend)

            # 小结（去除 grey 包裹，白底灰字对比度差，改为默认深色）
            summary = self._build_domain_summary(cat_id, papers, classifier)
            public_base = getattr(self, 'public_base_url', None)
            if papers and public_base:
                sub_msg_id = sub_card_message_ids.get(cat_id) if sub_card_message_ids else None
                sub_url = f"{public_base}/card/{cat_id}"
                button = {
                    "tag": "button",
                    "text": {"tag": "plain_text", "content": f"\u25b6 \u67e5\u770b\u8be6\u60c5 ({displayed}\u7bc7)"},
                    "type": "primary_text",
                    "width": "fill",
                    "url": sub_url,
                    "margin": "4px 0px 0px 0px"
                }
            elif papers:
                button = {
                    "tag": "markdown",
                    "content": f"📂 共 {len(papers)} 篇（链接生成中）",
                    "margin": "4px 0px 0px 0px"
                }
            else:
                button = {
                    "tag": "markdown",
                    "content": "📂 暂无数据",
                    "margin": "4px 0px 0px 0px"
                }

            # 收集论文标题列表（最多3篇，清洗LaTeX）
            paper_elements = []
            for i, paper in enumerate(papers[:3], 1):
                title = _clean_latex(paper.get("title", "")[:60])
                suffix = "…" if len(paper.get("title", "")) > 60 else ""
                arxiv_id = paper.get("arxiv_id", "")
                paper_elements.append(
                    {"tag": "markdown", "content": f"  {i}. {title}{suffix}", "text_size": "small", "margin": "1px 0px 1px 0px"}
                )

            elements = [
                {"tag": "markdown", "content": domain_text, "text_size": "normal", "margin": "0px 0px 3px 0px"},
                {"tag": "markdown", "content": count_badge, "text_size": "normal", "margin": "0px 0px 3px 0px"},
                {"tag": "markdown", "content": trend_text, "text_size": "small", "margin": "0px 0px 3px 0px"},
            ]
            elements.extend(paper_elements)
            elements.extend([
                {"tag": "markdown", "content": summary, "text_size": "small", "margin": "2px 0px 4px 0px"},
                button
            ])
            return elements

        # 按 JSON 中的实际 key 顺序
        domain_order = list(classifier.categories.keys())
        available_cats = list(classifier.categories.keys())

        # 构建2x4网格布局（白色底，清晰层次）
        elements = []

        # ── 8领域配色（四大浅色系，每色填2个领域，2列各用一半）─────
        # 8领域配色（四大浅色系，飞书支持 blue-50/green-50/purple-50/orange-50）
        # domain_order: [ultrafast, nearfield, metamaterial, laser, nonlinear, nanophotonics, biophotonics, quantum]
        # 行1→浅蓝: ultrafast+nearfield(索引0,1) | 行2→浅绿: metamaterial+laser(索引2,3)
        # 行3→浅紫: nonlinear+nanophotonics(索引4,5) | 行4→浅橙: biophotonics+quantum(索引6,7)
        DOMAIN_COLORS = {
            "ultrafast_optics":    "blue-50",    # 行1左
            "nearfield_optics":    "green-50",   # 行1右 ← 与metamaterial互换
            "metamaterial_optics": "blue-50",    # 行2左 ← 与nearfield互换
            "laser_processing":    "green-50",   # 行2右
            "nonlinear_optics":    "purple-50",  # 行3
            "nanophotonics":       "purple-50",  # 行3
            "biophotonics":        "orange-50",  # 行4
            "quantum_optics":      "orange-50",  # 行4
        }

        # Row 1: domain1 + domain2
        row1_cols = []
        for idx in [0, 1]:
            cat_id = domain_order[idx]
            if cat_id in available_cats:
                cat = classifier.categories.get(cat_id, {})
                papers = category_summaries.get(cat_id, {}).get("papers", [])
                color = DOMAIN_COLORS.get(cat_id, "wathet")
                row1_cols.append({
                    "tag": "column", "width": "weighted",
                    "background_style": color,
                    "elements": [{"tag": "interactive_container", "width": "fill", "height": "auto",
                        "elements": build_domain_cell(cat_id, papers, cat), "has_border": False, "direction": "vertical"}],
                    "padding": "10px 12px 10px 12px", "vertical_spacing": "6px", "horizontal_align": "left", "vertical_align": "top", "weight": 1
                })
        if row1_cols:
            elements.append({"tag": "column_set", "flex_mode": "stretch", "horizontal_spacing": "10px", "horizontal_align": "left", "columns": row1_cols, "margin": "0px 0px 0px 0px"})

        # Row 2: domain3 + domain4
        row2_cols = []
        for idx in [2, 3]:
            cat_id = domain_order[idx]
            if cat_id in available_cats:
                cat = classifier.categories.get(cat_id, {})
                papers = category_summaries.get(cat_id, {}).get("papers", [])
                color = DOMAIN_COLORS.get(cat_id, "wathet")
                row2_cols.append({
                    "tag": "column", "width": "weighted",
                    "background_style": color,
                    "elements": [{"tag": "interactive_container", "width": "fill", "height": "auto",
                        "elements": build_domain_cell(cat_id, papers, cat), "has_border": False, "direction": "vertical"}],
                    "padding": "10px 12px 10px 12px", "vertical_spacing": "6px", "horizontal_align": "left", "vertical_align": "top", "weight": 1
                })
        if row2_cols:
            elements.append({"tag": "column_set", "flex_mode": "stretch", "horizontal_spacing": "10px", "horizontal_align": "left", "columns": row2_cols, "margin": "0px 0px 0px 0px"})

        # Row 3: domain5 + domain6
        row3_cols = []
        for idx in [4, 5]:
            cat_id = domain_order[idx]
            if cat_id in available_cats:
                cat = classifier.categories.get(cat_id, {})
                papers = category_summaries.get(cat_id, {}).get("papers", [])
                color = DOMAIN_COLORS.get(cat_id, "wathet")
                row3_cols.append({
                    "tag": "column", "width": "weighted",
                    "background_style": color,
                    "elements": [{"tag": "interactive_container", "width": "fill", "height": "auto",
                        "elements": build_domain_cell(cat_id, papers, cat), "has_border": False, "direction": "vertical"}],
                    "padding": "10px 12px 10px 12px", "vertical_spacing": "6px", "horizontal_align": "left", "vertical_align": "top", "weight": 1
                })
        if row3_cols:
            elements.append({"tag": "column_set", "flex_mode": "stretch", "horizontal_spacing": "10px", "horizontal_align": "left", "columns": row3_cols, "margin": "0px 0px 0px 0px"})

        # Row 4: domain7 + domain8
        row4_cols = []
        for idx in [6, 7]:
            cat_id = domain_order[idx]
            if cat_id in available_cats:
                cat = classifier.categories.get(cat_id, {})
                papers = category_summaries.get(cat_id, {}).get("papers", [])
                color = DOMAIN_COLORS.get(cat_id, "wathet")
                row4_cols.append({
                    "tag": "column", "width": "weighted",
                    "background_style": color,
                    "elements": [{"tag": "interactive_container", "width": "fill", "height": "auto",
                        "elements": build_domain_cell(cat_id, papers, cat), "has_border": False, "direction": "vertical"}],
                    "padding": "10px 12px 10px 12px", "vertical_spacing": "6px", "horizontal_align": "left", "vertical_align": "top", "weight": 1
                })
        if row4_cols:
            elements.append({"tag": "column_set", "flex_mode": "stretch", "horizontal_spacing": "10px", "horizontal_align": "left", "columns": row4_cols, "margin": "0px 0px 0px 0px"})

        # ── 底部统计栏：markdown 居中块，替代裸文字 ──
        total_papers = sum(len(category_summaries.get(c, {}).get("papers", [])) for c in classifier.categories.keys())
        elements.append({"tag": "hr", "margin": "6px 0px 6px 0px"})
        elements.append({
            "tag": "markdown",
            "content": (
                f"🕐 **{datetime.now().strftime('%Y-%m-%d %H:%M')}**  |  "
                f"📊 共 **{total_papers}** 篇论文  |  "
                f"🔬 光学领域每日速递"
            ),
            "text_align": "center",
            "text_size": "small",
            "margin": "0px"
        })

        card = {
            "config": {"update_multi": True},
            "schema": "2.0",
            "body": {"direction": "vertical", "elements": elements},
            "header": {
                "title": {"tag": "plain_text", "content": "🔬 光学领域每日速递"},
                "subtitle": {"tag": "plain_text", "content": f"共 {len(classifier.categories)} 大领域 · 近90天最新论文"},
                "text_tag_list": [
                    {"tag": "text_tag", "text": {"tag": "plain_text", "content": "光学人的茶话会 ✨"}, "color": "indigo"}
                ],
                "template": "wathet",
                "padding": "12px 20px 12px 20px"
            }
        }
        return card

    def _build_domain_summary(self, cat_id: str, papers: List[Dict], classifier: OpticsClassifier) -> str:
        """构建领域小结（恢复 father.md 原始 subdomain 格式）

        格式：
        📋 **小结：**
        • 重点是{关键词1}、{关键词2}、{关键词3}
        • 发展趋势是{趋势}
        • 启发是{启发}
        """
        if not papers:
            return "📋 **小结：**\n• 暂无论文"

        # 1. 提取热点关键词
        keywords = []
        topics = []
        for paper in papers[:6]:
            title_words = paper.get("title", "").split()
            for w in title_words:
                w_clean = w.strip('.,;:()[]{}').lower()
                if len(w_clean) > 5 and w_clean not in ["with", "from", "that", "this", "using", "based", "system", "method"]:
                    topics.append(w_clean)
        from collections import Counter
        topic_counts = Counter(topics)
        hot_topics = [t for t, _ in topic_counts.most_common(3)]

        def _smart_truncate(text: str, max_len: int = 120) -> str:
            """在自然断句处截断（句号>逗号>顿号>任意位置），避免句子戛然而止。"""
            if not text:
                return text
            text = text.strip()
            if len(text) <= max_len:
                return text
            # 优先在标点处截断
            for punct in ['。', '；', '，', '、', '：', '…']:
                idx = text[:max_len].rfind(punct)
                if idx > max_len * 0.5:
                    return text[:idx+1]
            return text[:max_len-1] + "…"

        # 2. 提取发展趋势和启发（从多篇论文分析中综合）
        # 发展趋势：从 related_work 和 research思路 提取（反映领域横向联系和整体方向）
        # 启发：从 impact 提取（反映研究意义和应用价值）
        trend_parts = []
        insight_parts = []
        for paper in papers[:3]:
            analysis = paper.get("analysis", {})
            if analysis:
                related = _smart_truncate(analysis.get("related_work", ""), 60)
                research = _smart_truncate(analysis.get("research思路", ""), 60)
                impact = _smart_truncate(analysis.get("impact", ""), 60)
                if related:
                    trend_parts.append(related)
                elif research:
                    trend_parts.append(research)
                if impact:
                    insight_parts.append(impact)

        # 综合多篇论文趋势：去重后拼接
        innovation_trend = ""
        if trend_parts:
            seen = set()
            for t in trend_parts:
                key = t[:20]
                if key not in seen:
                    seen.add(key)
                    innovation_trend = t
                    break

        if not innovation_trend:
            # 从论文标题提取关键词作为趋势描述
            title_words = []
            for p in papers[:6]:
                for w in p.get("title", "").split():
                    w_clean = w.strip('.,;:()[]{}')
                    if 4 <= len(w_clean) <= 15 and w_clean.lower() not in ["with", "from", "that", "this", "using", "based", "system", "method", "paper", "study"]:
                        title_words.append(w_clean)
            from collections import Counter
            top_words = [w for w, _ in Counter(title_words).most_common(3)]
            if top_words:
                innovation_trend = "、".join(top_words) + " 等方向"
            else:
                innovation_trend = "技术向实际应用转型"

        # 启发：综合多篇 impact
        impact_insight = ""
        if insight_parts:
            seen = set()
            for i in insight_parts:
                key = i[:20]
                if key not in seen:
                    seen.add(key)
                    impact_insight = i
                    break

        if not impact_insight:
            impact_insight = "跨学科交叉是突破口"

        # 构建father.md subdomain格式
        lines = [
            "📋 **小结：**",
            f"• 重点是{', '.join(hot_topics[:3]) if hot_topics else '待挖掘'}",
            f"• 发展趋势是{innovation_trend}",
            f"• 启发是{impact_insight}"
        ]

        return "\n".join(lines)

    def _build_main_summary(self, category_summaries: Dict[str, Dict], classifier: OpticsClassifier) -> str:
        """构建主卡片的总结文本"""
        lines = []
        total_papers = sum(len(s.get("papers", [])) for s in category_summaries.values())

        lines.append(f"📊 共覆盖 {len(category_summaries)} 个领域，收录 {total_papers} 篇最新论文\n")

        for cat_id, summary in category_summaries.items():
            cat = classifier.categories.get(cat_id, {})
            icon = cat.get("icon", "📄")
            name = cat.get("name", cat_id)
            papers = summary.get("papers", [])
            lines.append(f"{icon} {name}: {len(papers)} 篇")

        return "\n".join(lines)

    def get_bot_open_id(self) -> str:
        """获取 Bot 自身的 open_id"""
        try:
            resp = requests.get(
                f"{self.API_BASE}/bot/v3/info",
                headers={"Authorization": f"Bearer {self.get_access_token()}"},
                timeout=15, proxies=FEISHU_PROXIES
            )
            result = resp.json()
            if result.get("code") == 0:
                return result.get("bot", {}).get("open_id", "")
        except:
            pass
        return ""

    def _save_card_data_for_web(self, category_id: str, papers: List[Dict], classifier: OpticsClassifier) -> None:
        """将论文数据保存到 card_data/*.json，供 card_server 的 /card/<category_id> 网页使用"""
        try:
            data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "card_data")
            os.makedirs(data_dir, exist_ok=True)
            cat = classifier.categories.get(category_id, {})
            card_data = {
                "domain_name": cat.get("name", category_id),
                "papers": papers
            }
            filepath = os.path.join(data_dir, f"{category_id}.json")
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(card_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"  WARNING: Failed to save card_data for web: {e}")

    def send_sub_card(self, category_id: str, papers: List[Dict], classifier: OpticsClassifier, stats: Dict = None, in_reply_to: str = None) -> str:
        """发送子卡片（单个领域的论文详情，使用原生JSON卡片，不依赖模板）

        子卡片发送到目标群（作为主卡的回复线程，不污染主群但在同一对话中可见）。
        可选 in_reply_to 参数指定回复的主卡片 message_id。
        返回发送成功的 message_id，失败返回空字符串。
        """
        cat = classifier.categories.get(category_id, {})
        if not cat:
            print(f"  ERROR: Category {category_id} not found")
            return ""

        token = self.get_access_token()
        if not token:
            return ""

        # 构建原生JSON卡片（不依赖模板，测试群也可用）
        card_elements = self._build_sub_card_native(cat, papers)

        # 构建卡片 header
        icon = cat.get('icon', '📄')
        name = cat.get('name', category_id)
        name_en = cat.get('name_en', '')
        header = {
            "title": {"tag": "plain_text", "content": f"{icon} {name}"},
            "template": "wathet"
        }

        card = {
            "config": {"wide_screen_mode": True},
            "header": header,
            "elements": card_elements
        }

        # 先保存到 card_data/*.json（供 card_server /card/<category_id> 网页使用）
        self._save_card_data_for_web(category_id, papers, classifier)

        # 发到目标群
        url = f"{self.API_BASE}/im/v1/messages?receive_id_type=chat_id"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "receive_id": self.target_group,
            "msg_type": "interactive",
            "content": json.dumps(card, ensure_ascii=False)
        }

        # 如果有 in_reply_to，作为回复发送（在同一对话线程中）
        if in_reply_to:
            payload["in_reply_to"] = in_reply_to

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30, proxies=FEISHU_PROXIES)
            result = response.json()
            if result.get("code") == 0:
                message_id = result.get("data", {}).get("message_id", "")
                print(f"  SUCCESS: Sub-card sent for {name} ({len(papers[:6])} papers) -> message_id={message_id}")
                return message_id
            print(f"  ERROR: {result}")
            return ""
        except Exception as e:
            print(f"  ERROR: {e}")
            return ""

    def _build_sub_card_native(self, cat: Dict, papers: List[Dict]) -> List[Dict]:
        """构建子卡片原生JSON元素（优化排版：统计栏 + 论文卡片式 + 分隔线）

        优化点：
        - 顶部统计栏：徽章式布局（论文数/引用/高引/顶刊）
        - 每篇论文卡片：标题+元信息行+6维度分析
        - 分隔线区分论文
        """
        display_papers = papers[:6]
        elements = []

        # ===== 顶部统计栏 =====
        total_citations = sum(p.get("citations", 0) for p in display_papers)
        high_citation = len([p for p in display_papers if p.get("citations", 0) > 50])
        top_journals = len([p for p in display_papers if p.get("venue") in ["Nature", "Science", "Nature Photonics", "PRL", "Science Advances"]])

        stats_parts = [
            f"📚 **{len(display_papers)}** 篇",
            f"⬆️ **{total_citations}** 引用",
            f"🔥 高引 **{high_citation}**",
            f"⭐ 顶刊 **{top_journals}**",
        ]
        elements.append({
            "tag": "markdown",
            "content": "  ".join(stats_parts),
            "margin": "0px 0px 6px 0px",
            "text_size": "small"
        })

        elements.append({"tag": "hr", "margin": "0px 0px 6px 0px"})

        # ===== 每篇论文 =====
        for i, paper in enumerate(display_papers):
            idx = i + 1
            title = paper.get("title", "")
            citations = paper.get("citations", 0)
            venue = paper.get("venue", "arXiv")
            arxiv_id = paper.get("arxiv_id", "")
            arxiv_url = f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else paper.get("url", "")
            authors = paper.get("authors", [])[:2]
            author_str = "、".join(authors) if authors else ""
            analysis = paper.get("analysis", {})
            source = paper.get("source", "arxiv")
            citation_label = "阅读" if (source == "arxiv" and arxiv_id) else "引用"

            # 论文标题（加粗，序号徽章）
            badge = f"**{idx}**"
            elements.append({
                "tag": "markdown",
                "content": f"{badge} **{self._truncate(_clean_latex(title), 72)}**",
                "margin": "4px 0px 2px 0px"
            })

            # 元信息行（引用 | 期刊 | 作者）
            meta_parts = [f"📊 {citation_label}: **{citations}**", f"🏠 {venue}"]
            if author_str:
                meta_parts.append(f"👥 {author_str}")
            elements.append({
                "tag": "markdown",
                "content": "  |  ".join(meta_parts),
                "margin": "0px 0px 2px 0px",
                "text_size": "small"
            })

            # 6维度分析
            if analysis:
                content = self._build_6dimension_content(analysis, arxiv_id)
            else:
                content = self._build_paper_content(paper)
            elements.append({
                "tag": "markdown",
                "content": content,
                "margin": "0px 0px 2px 0px",
                "text_size": "small"
            })

            # 论文原始链接（ArXiv/DOI/Web）
            if arxiv_id:
                # ArXiv 论文 → 优先原始链接，回退到 Enrich 后的 S2 URL
                paper_url = paper.get("url", "")
                is_s2_url = "semanticscholar" in paper_url
                display_url = paper_url if paper_url and not is_s2_url else f"https://arxiv.org/abs/{arxiv_id}"
                elements.append({
                    "tag": "markdown",
                    "content": f"<a href='{display_url}'>🔗 {arxiv_id}</a>",
                    "margin": "0px 0px 4px 0px",
                    "text_size": "small"
                })
            elif paper.get("doi"):
                # DOI 论文 → DOI 链接
                doi = paper.get("doi", "")
                elements.append({
                    "tag": "markdown",
                    "content": f"<a href='https://doi.org/{doi}'>🔗 DOI链接</a>",
                    "margin": "0px 0px 4px 0px",
                    "text_size": "small"
                })
            elif paper.get("url") and "semanticscholar" not in paper.get("url", ""):
                # 其他有 URL 的论文 → 原始链接
                elements.append({
                    "tag": "markdown",
                    "content": f"<a href='{paper['url']}'>🔗 来源链接</a>",
                    "margin": "0px 0px 4px 0px",
                    "text_size": "small"
                })

            if i < len(display_papers) - 1:
                elements.append({"tag": "hr", "margin": "4px 0px 4px 0px"})

        # 底部时间戳
        elements.append({"tag": "hr", "margin": "6px 0px 4px 0px"})
        elements.append({
            "tag": "markdown",
            "content": f"🕐 更新于 {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "text_align": "center",
            "text_size": "small",
            "margin": "0px"
        })

        return elements

    def _build_6dimension_content(self, analysis: Dict, arxiv_id: str = "") -> str:
        """构建6维度分析内容（恢复 child.md 格式，每项≤80字）"""
        parts = []
        max_len = 80  # 每维度最大长度（严格80字限制）

        def _smart_truncate(text: str, max_len: int = 80) -> str:
            """在自然断句处截断（句号>逗号>顿号>任意位置），避免句子戛然而止。"""
            if not text:
                return ""
            text = text.strip()
            if len(text) <= max_len:
                return text
            for punct in ['。', '；', '，', '、', '：', '…']:
                idx = text[:max_len].rfind(punct)
                if idx > max_len * 0.5:
                    return text[:idx+1]
            return text[:max_len-1] + "…"

        # 一句话概括
        if analysis.get("summary"):
            parts.append(f"• 一句话概括：{_smart_truncate(_clean_latex(analysis['summary']), 80)}")

        # 研究思路
        if analysis.get("research思路"):
            parts.append(f"• 研究思路：{_smart_truncate(_clean_latex(analysis['research思路']), 80)}")

        # 实验方案
        if analysis.get("experiment"):
            parts.append(f"• 实验方案：{_smart_truncate(_clean_latex(analysis['experiment']), 80)}")

        # 创新点
        if analysis.get("innovation"):
            parts.append(f"• 创新点：{_smart_truncate(_clean_latex(analysis['innovation']), 80)}")

        # 关联工作
        if analysis.get("related_work"):
            parts.append(f"• 关联工作：{_smart_truncate(_clean_latex(analysis['related_work']), 80)}")

        # 评价
        if analysis.get("impact"):
            parts.append(f"• 评价：{_smart_truncate(_clean_latex(analysis['impact']), 80)}")

        content = "\n".join(parts) if parts else f"• arXiv: {arxiv_id}"

        return content

    def _truncate(self, text: str, max_len: int) -> str:
        """截断文本"""
        if len(text) <= max_len:
            return text
        return text[:max_len] + "..."

    def _build_paper_content(self, paper: Dict) -> str:
        """构建论文内容摘要（用于无analysis时的fallback）- 从摘要提取多维度信息"""
        abstract = paper.get("abstract", "")
        title = paper.get("title", "")

        parts = []

        # 一句话概括：从摘要第一句提取
        brief = ""
        if abstract:
            import re
            sentences = re.split(r'[。.\n]', abstract)
            for sent in sentences:
                sent = sent.strip()
                if len(sent) > 20:
                    brief = sent
                    break
            if not brief and abstract:
                brief = abstract[:150].strip()
        if not brief:
            brief = title[:100] if title else "暂无摘要信息"
        if len(brief) > 120:
            brief = brief[:117] + "..."
        parts.append(f"• 一句话概括：{brief}")

        # 方法/技术：从摘要中提取
        tech_keywords = ["方法", "技术", "原理", "机制", " approach", " method", " technique", " mechanism"]
        if abstract:
            for kw in tech_keywords:
                idx = abstract.find(kw)
                if idx > 0:
                    snippet = abstract[max(0, idx-10):idx+30].strip()
                    snippet = re.sub(r'\s+', ' ', snippet)
                    if len(snippet) > 5:
                        parts.append(f"• 方法技术：{snippet[:60]}")
                        break

        source = paper.get("source", "arxiv")
        if source == "pubmed":
            pubmed_id = paper.get("pubmed_id", "")
            parts.append(f"• PubMed: {pubmed_id}")
        else:
            arxiv_id = paper.get("arxiv_id", "")
            parts.append(f"• arXiv: {arxiv_id}")

        return "\n".join(parts)


def build_markdown_card(category_id: str, papers: List[Dict], classifier: OpticsClassifier) -> Dict:
    """构建 markdown 格式卡片（备用）"""
    cat = classifier.categories.get(category_id, {})
    icon = cat.get("icon", "📄")
    name = cat.get("name", "")
    name_en = cat.get("name_en", "")

    elements = [
        {
            "tag": "markdown",
            "content": f"## {icon} {name} | {name_en}\n最新 {len(papers)} 篇 | {datetime.now().strftime('%Y-%m-%d')}\n\n---\n"
        }
    ]

    for i, paper in enumerate(papers[:5], 1):
        raw_title = paper.get("title", "")
        title = _clean_latex(raw_title[:80]) + ("..." if len(raw_title) > 80 else "")
        arxiv_id = paper.get("arxiv_id", "")
        source = paper.get("source", "arxiv")
        paper_url = paper.get("url", "") or (f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else "")
        authors = ", ".join(paper.get("authors", [])[:2]) if paper.get("authors") else ""

        content = f"**{i}.** {title}\n"
        if authors:
            content += f"_{authors}_\n"
        if arxiv_id:
            content += f"🔗 [arXiv](https://arxiv.org/abs/{arxiv_id}) | [PDF](https://arxiv.org/pdf/{arxiv_id}.pdf)\n"
        elif paper_url:
            content += f"🔗 [链接]({paper_url})\n"

        elements.append({"tag": "markdown", "content": content})
        if i < len(papers[:5]):
            elements.append({"tag": "hr"})

    elements.append({
        "tag": "markdown",
        "content": f"\n---\n📊 共 **{len(papers)}** 篇论文 | 更新时间: {datetime.now().strftime('%H:%M')}"
    })

    return {"config": {"wide_screen_mode": True}, "elements": elements}


def main():
    import argparse, time, threading
    t_start = time.time()
    parser = argparse.ArgumentParser(description="Optics Research Tracker v2")
    parser.add_argument("--category", "-c", help="Specific category ID (e.g., ultrafast_optics)")
    parser.add_argument("--days", "-d", type=int, default=90, help="Days to look back")
    parser.add_argument("--top", "-t", type=int, default=5, help="Top N papers per category")
    parser.add_argument("--feishu", "-f", action="store_true", help="Send to Feishu")
    parser.add_argument("--template", action="store_true", help="Use template card (main+sub cards)")
    parser.add_argument("--main-card", action="store_true", help="Send only main card (overview)")
    parser.add_argument("--fast", action="store_true", help="Skip slow API calls (Semantic Scholar, MiniMax)")
    parser.add_argument("--cache", action="store_true", help="Use cached card_data/*.json, skip all API calls")
    parser.add_argument("--test", action="store_true", help="Send all cards to test group only (skip main group)")
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(script_dir, "optics_categories.json")
    classifier = OpticsClassifier(config_path)
    searcher = ArxivSearcher(classifier)
    s2_searcher = SemanticScholarSearcher()
    pubmed_searcher = PubMedSearcher()  # 多源检索：PubMed 补充
    tavily_searcher = TavilySearcher()   # 多源检索：Tavily 网络搜索补充
    crossref_searcher = CrossrefSearcher()  # 多源检索：Crossref 期刊论文补充（第三信源）
    minimax_analyzer = MiniMaxAnalyzer()
    sender = FeishuCardSender()

    def search_and_enrich(category_id: str, top_n: int, analyze: bool = True, fast: bool = False) -> List[Dict]:
        """多源检索论文、获取引用数、必要时进行 MiniMax 分析

        正确流程：
        1. 多源检索（ArXiv + PubMed + Tavily）
        2. 丰富引用数据
        3. MiniMax 6维度分析（先生成分析结果）
        4. 基于分析结果生成领域趋势

        多源策略：
        - ArXiv: 物理光学类论文（核心来源）
        - PubMed: 生物医学光学论文（补充来源，如 biophotonics）
        - Tavily: 网络搜索补充（行业动态、最新进展）

        注意：
        - fast=True 只跳过 Semantic Scholar 引用富化（网络慢时）
        - analyze=True 时 MiniMax AI 分析始终执行（可设置更长超时）
        """
        all_papers = []
        cat = classifier.categories.get(category_id, {})

        # 来源1: ArXiv 检索（核心）
        arxiv_papers = searcher.get_quality_papers(category_id, top_n=top_n * 2)
        if arxiv_papers:
            print(f"    ArXiv: found {len(arxiv_papers)} papers")
            for p in arxiv_papers:
                p["source"] = "arxiv"
            all_papers.extend(arxiv_papers)

        # 来源2: PubMed 检索（生物医学光学补充）
        pubmed_papers = []
        if category_id == "biophotonics" or category_id == "nearfield_optics" or len(all_papers) < 3:
            pubmed_papers = pubmed_searcher.search_category(category_id, classifier, max_results=top_n)
            if pubmed_papers:
                print(f"    PubMed: found {len(pubmed_papers)} papers")
                for p in pubmed_papers:
                    p["source"] = "pubmed"
                    # 去重
                    is_dup = False
                    for ap in all_papers:
                        if ap.get("title") and p.get("title"):
                            if ap["title"][:50].lower() == p["title"][:50].lower():
                                is_dup = True
                                break
                    if not is_dup:
                        all_papers.append(p)

        # 来源3: Tavily 网络搜索（所有领域补充最新动态，3 key 自动轮换）
        keywords = cat.get("keywords", [])[:5]
        tavily_results = tavily_searcher.search_papers(keywords, max_results=2)
        if tavily_results:
                print(f"    Tavily: found {len(tavily_results)} web results")
                for r in tavily_results:
                    all_papers.append({
                        "title": r.get("title", ""),
                        "abstract": r.get("snippet", ""),
                        "source": "tavily",
                        "url": r.get("url", ""),
                        "authors": [],
                        "citations": 0,
                        "venue": "Web",
                        "arxiv_id": ""
                    })

        if not all_papers:
            print(f"    No papers found from any source")
            return []

        papers = all_papers

        # 丰富引用数据（仅对有arxiv_id的论文，fast模式可跳过）
        if not fast:
            print(f"    Enriching papers with citation data...")
            arxiv_papers_to_enrich = [p for p in papers if p.get("arxiv_id") and p.get("source") == "arxiv"]
            if arxiv_papers_to_enrich:
                s2_searcher.enrich_papers(arxiv_papers_to_enrich)
            s2_searcher.sort_by_quality(papers)
        papers = papers[:top_n]

        # AI 6维度分析（analyze=True 时执行，不受 fast 影响）
        # 分析所有待显示论文（最多6篇），确保子卡片和展开面板都有完整6维分析
        # 三源热备：ZAI glm-4.5 → DUCKCODING gpt-5.4 → MiniMax M2.7
        has_any_key = minimax_analyzer.zai_api_key or minimax_analyzer.duck_api_key or minimax_analyzer.api_key
        if analyze and has_any_key:
            print(f"    Running AI 6-dimension analysis (ZAI→DUCKCODING→MiniMax, analyzing up to 6 papers)...")
            papers = minimax_analyzer.batch_analyze(papers, top_n=min(6, top_n))
        elif analyze and not has_any_key:
            print(f"    WARNING: No API key set (ZAI/DUCKCODING/MINIMAX), skipping AI analysis")

        # 生成领域趋势（基于分析结果）
        if has_any_key and any(p.get("analysis") for p in papers):
            print(f"    Generating domain trends based on analysis...")
            trend_result = minimax_analyzer.generate_domain_trends_from_analysis(category_id, papers, cat)
            if trend_result and papers:
                papers[0]["domain_trend"] = trend_result

        # 过滤：只保留有完整 6 维分析的论文，避免发送空白分析
        analyzed = [p for p in papers if p.get("analysis")]
        if analyzed:
            dropped = len(papers) - len(analyzed)
            if dropped > 0:
                print(f"    Dropped {dropped} paper(s) without valid analysis, keeping {len(analyzed)}")
            papers = analyzed
        else:
            print(f"    WARNING: No papers with valid analysis for {category_id}, will retry with more papers...")
            # Fallback: 用更多论文重试分析（最多 2 次）
            retry_count = getattr(search_and_enrich, "_retry_count", 0)
            if retry_count < 1:
                search_and_enrich._retry_count = retry_count + 1
                return search_and_enrich(category_id, top_n=top_n * 2, analyze=True, fast=fast)

        return papers

    def _load_cached(category_id: str) -> List[Dict]:
        """从 card_data/*.json 加载缓存，跳过所有 API 调用"""
        cache_path = os.path.join(script_dir, "card_data", f"{category_id}.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                papers = data.get("papers", [])
                print(f"  [CACHE] {category_id}: loaded {len(papers)} papers from cache")
                return papers
            except Exception as e:
                print(f"  [CACHE] {category_id}: load failed {e}, will fetch")
        return []

    if args.category:
        # 搜索指定领域 - 发送子卡片
        print(f"Searching for {args.category}...")
        papers = search_and_enrich(args.category, args.top, fast=args.fast)
        cat = classifier.categories.get(args.category, {})
        print(f"  Found {len(papers)} papers for {cat.get('name', args.category)}")

        if args.feishu and papers:
            if args.template:
                sender.send_sub_card(args.category, papers, classifier)
            else:
                card = build_markdown_card(args.category, papers, classifier)
                sender.send_card(card)
    elif args.main_card:
        # 仅发送主卡片（需要先搜索所有领域获取摘要）
        if not args.feishu:
            print("Use --feishu with --main-card")
            return 1

        use_cache = args.cache
        if use_cache:
            print("Using cached card_data/*.json (skip all API calls)...")
        else:
            print("Searching all categories for main card...")

        category_summaries = {}
        for cat_id in classifier.categories.keys():
            search_and_enrich._retry_count = 0  # 重置该领域的重试计数器
            cat = classifier.categories.get(cat_id, {})
            if use_cache:
                papers = _load_cached(cat_id)
            else:
                papers = search_and_enrich(cat_id, args.top, fast=args.fast)
            analyzed_count = len([p for p in papers if p.get("analysis")])
            category_summaries[cat_id] = {
                "papers": papers,
                "count": len(papers),
                "analyzed": analyzed_count,
                "cat_name": cat.get("name", cat_id),
                "cat_emoji": cat.get("icon", "📄"),
            }

        print(f"DEBUG: Calling send_main_card with {len(category_summaries)} categories")
        sender.send_main_card(category_summaries, classifier, use_template=False, minimax_analyzer=minimax_analyzer, sub_card_message_ids={})
    else:
        # =====================================================================
        # 搜索所有领域 - 发送主卡片 + 子卡片
        # 新流程（解决跨领域重复分类问题）：
        #   Phase 1: 全局多源搜索 → 按 arxiv_id 去重
        #   Phase 2: 统一 classify() 重新分类 → 按领域分配
        #   Phase 3: 各领域独立分析 → 过滤无分析论文
        # =====================================================================
        print("Searching all categories (Phase 1: global multi-source search)...")

        if args.feishu:
            # =========================================================================
            # Phase 1: 全局多源搜索
            # 每个领域只搜 1 次 ArXiv（1次≈3-5秒，多关键词无额外延迟）
            # + 全领域 PubMed + 全领域 Tavily
            # 结果统一去重，交给 Phase 2 MiniMax 语义分类
            # =========================================================================
            all_collected = {}  # _uid -> paper

            # =========================================================================
            # 推送历史管理：避免重复推送同一篇论文
            # =========================================================================
            HISTORY_FILE = os.path.join(script_dir, "pushed_papers.json")
            _pushed_uids: set = set()   # 已推送的 uid 集合（内存缓存）

            def _load_pushed_history() -> set:
                """从文件加载已推送论文的 uid 集合（最近 30 天）"""
                import time
                if not os.path.exists(HISTORY_FILE):
                    return set()
                try:
                    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    cutoff = time.time() - 30 * 86400  # 30 天过期
                    valid = {}
                    for uid, timestamp in data.items():
                        if timestamp > cutoff:
                            valid[uid] = timestamp
                    return set(valid.keys())
                except Exception:
                    return set()

            def _save_pushed_history(uids: List[str]):
                """追加记录本次推送的 uid 到历史文件"""
                import time
                try:
                    history = {}
                    if os.path.exists(HISTORY_FILE):
                        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                            history = json.load(f)
                    now = time.time()
                    for uid in uids:
                        history[uid] = now  # 更新时间戳
                    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                        json.dump(history, f, ensure_ascii=False)
                except Exception as e:
                    print(f"  WARNING: Failed to save pushed history: {e}")

            _pushed_uids = _load_pushed_history()
            if _pushed_uids:
                print(f"  Loaded {len(_pushed_uids)} previously pushed papers (dedup active)", flush=True)

            def _uid(paper):
                # 优先用稳定唯一标识符
                if paper.get("arxiv_id"):
                    return paper["arxiv_id"]
                if paper.get("doi"):
                    return paper["doi"]
                # 对无 DOI/arxiv 的论文，用 title + venue 的 MD5 哈希作为稳定 UID
                # 避免 URL 变化导致同一论文被重复推送
                title = (paper.get("title") or "")[:80]
                venue = (paper.get("venue") or "")[:40]
                raw = f"{title}|{venue}".encode("utf-8")
                import hashlib
                return hashlib.md5(raw).hexdigest()[:24]

            def _merge_paper(existing, new):
                if not existing:
                    return new
                result = dict(existing)
                if len(new.get("authors", [])) > len(existing.get("authors", [])):
                    result["authors"] = new["authors"]
                if len(new.get("abstract", "")) > len(existing.get("abstract", "")):
                    result["abstract"] = new["abstract"]
                if new.get("citations", 0) > existing.get("citations", 0):
                    result["citations"] = new["citations"]
                return result

            t_phase1 = time.time()
            print(f"  Phase 1: Searching all 8 domains in parallel (4 workers)...", flush=True)
            all_collected = {}
            lock = threading.Lock()

            def _search_domain(cat_id, cat):
                """单领域搜索：ArXiv + PubMed + Crossref + Tavily（返回 paper list）"""
                t = time.time()
                papers = []
                # ArXiv: 扩量到50篇候选（day window=90），确保Phase 2有足够候选
                arxiv_raw = searcher.get_quality_papers(cat_id, top_n=50)
                for p in arxiv_raw:
                    p["source"] = "arxiv"
                    papers.append(p)
                # PubMed: 补充医学/生物光学
                pubmed_raw = pubmed_searcher.search_category(cat_id, classifier, max_results=8)
                for p in pubmed_raw:
                    p["source"] = "pubmed"
                    papers.append(p)
                # Crossref: 期刊论文补充（第三信源，覆盖 Nature/Science/PRX/Optica 等）
                crossref_raw = crossref_searcher.search_category(cat_id, classifier, max_results=8)
                for p in crossref_raw:
                    p["source"] = "crossref"
                    papers.append(p)
                # Tavily: 全领域 Web 补充（3 key 自动轮换）—— 提升到 8 篇以支撑多样性
                tavily_raw = tavily_searcher.search_papers(cat.get("keywords", [])[:5], max_results=8)
                for r in tavily_raw:
                    url = r.get("url", "")
                    title = r.get("title", "")

                    # ===== P0-2: 扩展 skip_patterns 覆盖更多非论文URL =====
                    # 这些 URL 不是正式论文，而是会议摘要、学科门户、新闻等
                    skip_patterns = [
                        # 百科/视频/社交
                        "wikipedia.org", "youtube.com", "twitter.com", "x.com",
                        "facebook.com", "linkedin.com", "researchgate.net",
                        "academia.edu", "scholar.google.com/citations",
                        # 会议/课程/活动
                        "event/", "conference", "session/", "contribution/",
                        "abstract.cfm", "subjects/", "program/", "schedule/",
                        # 会议论文集（SPIE等）
                        "spie.org/Publications/Proceedings", "procedings", "proc.",
                        # 期刊门户/导航页（非具体论文）
                        "nature.com/subjects", "opg.optica.org/abstract",
                        "optica-opn.org/home/articles", "catalog.nlm.nih.gov/discovery",
                        "pubmed.ncbi.nlm.nih.gov", "aps.org/prresearch/subjects",
                        "mdpi.com/journal/", "iopscience.iop.org", "eurekamag.com",
                        "worldscientific.com/doi", "commsphys", "photonics",
                        "inspirehep.net", "indico.ictp",
                        # 预印本平台（非正式）
                        "preprints.opticaopen.org", "biorxiv.org", "medrxiv.org",
                        "chemrxiv.org", "arxiv.org/abs/",  # 只跳过 abstract 页，abs/ok
                        # 元数据/索引页
                        "oldcitypublishing.com", "ufn.ru", "jlps.gr.jp", "martinos.org",
                        "material/0/0.pdf",
                        # 新闻/科普
                        "news.", "press release", "eurekaalert", "phys.org",
                        "sciencedaily.com", "nanowerk.com", "photonics.com",
                        # 商业/产品页
                        "linkedin.com/company", "amazon.com", "ebay.com",
                        # 机构主页
                        "charles.ac.uk", "stanford.edu/~", "mit.edu/~",
                    ]
                    if any(p in url.lower() for p in skip_patterns):
                        continue
                    # ===== P0-2: 标题质量过滤 =====
                    # 过滤垃圾标题（非正式论文标题）
                    title_lower = title.lower()
                    garbage_in_title = [
                        "issue publication information", "author index",
                        "table of contents", "front matter", "back matter",
                        "editorial", "erratum", "corrigendum", "retraction",
                        "special issue", "guest editorial", "in memory",
                        "conference report", "meeting abstract", "annual meeting",
                        "press release", "news:", "announcement",
                    ]
                    if any(p in title_lower for p in garbage_in_title):
                        continue
                    # 过滤过短标题（通常是网页片段或元数据）
                    if not title or len(title) < 25:
                        continue

                    papers.append({
                        "title": title,
                        "abstract": r.get("snippet", ""),
                        "source": "tavily",
                        "url": url,
                        "authors": [],
                        "citations": 0,
                        "venue": "Web",
                        "arxiv_id": ""
                    })
                print(f"    [{time.time()-t:.1f}s] {cat.get('name',cat_id)}: ArXiv={len(arxiv_raw)}, PubMed={len(pubmed_raw)}, Crossref={len(crossref_raw)}, Tavily={len(tavily_raw)}", flush=True)
                return papers

            # 4 并行 worker 处理 8 个领域（错峰搜索，避免 ArXiv 429 burst rate limit）
            from concurrent.futures import ThreadPoolExecutor, as_completed
            with ThreadPoolExecutor(max_workers=4) as pool:
                futures = {pool.submit(_search_domain, cat_id, cat): cat_id
                           for cat_id, cat in classifier.categories.items()}
                for future in as_completed(futures):
                    papers = future.result()
                    for p in papers:
                        uid = _uid(p)
                        # 跳过历史推送过的论文（arxiv_id/doi/url 匹配即认为重复）
                        if _pushed_uids and uid in _pushed_uids:
                            continue
                        with lock:
                            if uid not in all_collected:
                                all_collected[uid] = p
                            else:
                                all_collected[uid] = _merge_paper(all_collected[uid], p)

            # --- Semantic Scholar: 批量补充引用数（所有来源，有DOI或arxiv_id均可）---
            all_for_enrich = list(all_collected.values())
            if all_for_enrich and not args.fast:
                try:
                    s2_searcher.enrich_papers(all_for_enrich)
                except Exception as e:
                    print(f"  WARNING: S2 enrichment failed: {e}")

            raw_papers = list(all_collected.values())
            print(f"  Phase 1 done: {len(raw_papers)} unique papers ({time.time()-t_phase1:.0f}s total)", flush=True)

            # =========================================================================
            # Phase 2: MiniMax 语义分类（并行批处理）
            # =========================================================================
            t_phase2 = time.time()
            BATCH = 20
            total_batches = (len(raw_papers) + BATCH - 1) // BATCH
            print(f"  Phase 2: MiniMax semantic classification ({len(raw_papers)} papers, {total_batches} batches)...", flush=True)

            def _build_classification_prompt(papers_batch, categories):
                cat_desc = "\n".join([
                    f"{i+1}. **{cid}**: {cat.get('name','')} | 关键词: {', '.join(cat['keywords'][:6])}"
                    for i, (cid, cat) in enumerate(categories.items())
                ])
                papers_text = "\n".join([
                    f"[{i}] {p.get('title','N/A')[:100]}\n   {p.get('abstract','N/A')[:150]}"
                    for i, p in enumerate(papers_batch)
                ])
                return (
                    f"你是一个光学领域学术论文分类专家。8个领域定义如下：\n{cat_desc}\n\n"
                    f"请为每篇论文选择最匹配的1个领域（考虑：论文主题、摘要术语、排除矛盾领域）。\n"
                    f"论文列表：\n{papers_text}\n\n"
                    f"严格输出JSON数组：[{{\"index\":0,\"category\":\"ultrafast_optics\"}}, ...]"
                )

            uid_list = [_uid(p) for p in raw_papers]
            paper_domain_map = {}
            BATCH = 20
            total_batches = (len(raw_papers) + BATCH - 1) // BATCH
            print(f"  Phase 2: MiniMax semantic classification ({len(raw_papers)} papers, {total_batches} batches)...", flush=True)

            def classify_batch(batch_idx):
                batch = raw_papers[batch_idx * BATCH : (batch_idx + 1) * BATCH]
                if not batch:
                    return {}
                prompt = _build_classification_prompt(batch, classifier.categories)
                resp = minimax_analyzer._call_api(prompt, max_tokens=600)
                result_map = {}
                if resp:
                    import re, json as json_mod
                    m = re.search(r'\[.*\]', resp.replace('```json','').replace('```',''), re.DOTALL)
                    if m:
                        try:
                            items = json_mod.loads(m.group())
                            for it in items:
                                idx = it.get("index")
                                cat = it.get("category","")
                                if isinstance(idx,int) and 0 <= idx < len(batch) and cat in classifier.categories:
                                    result_map[_uid(batch[idx])] = cat
                        except Exception:
                            pass
                # Fallback: keyword rule for unclassified
                for paper in batch:
                    uid = _uid(paper)
                    if uid not in result_map:
                        text = (paper.get('title','') + ' ' + paper.get('abstract','')).lower()
                        best = None
                        for cid, c in classifier.categories.items():
                            sc = sum(1 for kw in c["keywords"] if kw.lower() in text)
                            pen = sum(0.5 for ex in c.get("exclude",[]) if ex.lower() in text)
                            fin = max(0, sc - pen)
                            if fin > 0 and (best is None or fin > best[1]):
                                best = (cid, fin)
                        if best:
                            result_map[uid] = best[0]
                return result_map

            # 并行分类
            try:
                from concurrent.futures import ThreadPoolExecutor, as_completed
                with ThreadPoolExecutor(max_workers=4) as pool:
                    futures = {pool.submit(classify_batch, bi): bi for bi in range(total_batches)}
                    done = 0
                    for future in as_completed(futures):
                        result_map = future.result()
                        paper_domain_map.update(result_map)
                        done += 1
                        print(f"    Classification batch {done}/{total_batches} done ({len(result_map)} papers)")
            except Exception as e:
                print(f"  WARNING: Parallel classification failed: {e}, falling back to serial")
                for bi in range(total_batches):
                    result_map = classify_batch(bi)
                    paper_domain_map.update(result_map)
                    print(f"    Classification batch {bi+1}/{total_batches} done")

            unclassified = [u for u in uid_list if u not in paper_domain_map]
            print(f"  Phase 2 done: {len(paper_domain_map)} classified, {len(unclassified)} unclassified ({time.time()-t_phase2:.0f}s)", flush=True)
            cat_counts = {}
            for uid, cat in paper_domain_map.items():
                cat_counts[cat] = cat_counts.get(cat, 0) + 1
            for cat, cnt in sorted(cat_counts.items(), key=lambda x: -x[1]):
                cname = classifier.categories.get(cat, {}).get("name", cat)
                print(f"    {cname}: {cnt} papers")

            # =========================================================================
            # Phase 3: 各领域分配 + 分析 + 发送
            # =========================================================================
            category_summaries = {}

            # Phase 3 分析质量门控：至少要有 4 个有效字段才算合格
            REQUIRED_ANALYSIS_FIELDS = frozenset({
                "summary", "research_approach", "research思路",
                "experiment", "innovation", "related_work", "impact"
            })

            def _has_valid_analysis(paper):
                """检查 analysis 是否有足够的有效字段（≥3个），避免残留旧缓存数据被误用"""
                a = paper.get("analysis")
                if not a or not isinstance(a, dict):
                    return False
                valid_count = sum(
                    1 for k in REQUIRED_ANALYSIS_FIELDS
                    if a.get(k) and str(a[k]).strip()
                )
                return valid_count >= 3

            def _is_journal(paper):
                """判断来源是否为期刊（vs arxiv预印本）。
                有 doi 且来源非 arxiv/tavily/pubmed 的视为期刊。
                """
                src = paper.get("source", "").lower()
                if src in ("arxiv", "tavily", "pubmed"):
                    return False
                # 有 doi 的通常是正式期刊文章
                if paper.get("doi"):
                    return True
                return False

            def _source_diversity_pick(candidates: List[Dict], target: int = 3) -> List[Dict]:
                """在质量排序后的候选论文中，按来源多样性 + 真实论文保障约束选取目标数量。

                规则：
                1. 至少 1 篇 arxiv
                2. 至少 1 篇 peer-reviewed 期刊（DOI）
                3. 其余优先从真实论文（arxiv/DOI）中补（高于 Tavily/Web）
                4. 若真实论文不足，再从其他来源补充

                返回的论文保留原始质量排序（仅被约束精选，不改变相对顺序）。
                """
                if len(candidates) <= target:
                    return candidates

                def _is_real_paper(p):
                    """判断是否为经过 peer-review 的正式出版物"""
                    if p.get("source") == "arxiv":
                        return True
                    if p.get("doi") or p.get("arxiv_id"):
                        return True
                    return False

                # 分类
                arxiv_papers = [p for p in candidates if p.get("source") == "arxiv"]
                journal_papers = [p for p in candidates if not p.get("source") == "arxiv"
                                  and (p.get("doi") or p.get("arxiv_id"))]
                other_papers  = [p for p in candidates
                                 if p not in arxiv_papers and p not in journal_papers]

                # 按原始顺序（质量从高到低）各自取最好的
                arxiv_best = arxiv_papers[:1]
                journal_best = journal_papers[:1]

                # 其余 slots：优先从真实论文（journal）中补，不够再从 other 补
                remaining_slots = target - len(arxiv_best) - len(journal_best)
                # 真实论文优先
                extra_journal = [p for p in journal_papers
                                 if p not in arxiv_best and p not in journal_best][:remaining_slots]
                remaining_after_journal = remaining_slots - len(extra_journal)
                other_best = [p for p in other_papers
                              if p not in arxiv_best and p not in journal_best
                              and p not in extra_journal][:remaining_after_journal]

                # 合并（保持全局质量顺序：arxiv_best + journal_best + extra_journal + other_best 再按原始顺序重排）
                selected = arxiv_best + journal_best + extra_journal + other_best
                selected_uids = {id(p) for p in selected}

                # 如果真实论文不足 2 篇，尝试从剩余候选中补充真实论文（替换最低分）
                MIN_REAL = 2
                real_in_selected = sum(1 for p in selected if _is_real_paper(p))
                if real_in_selected < MIN_REAL:
                    # 找未入选的真实论文（按 candidates 顺序，即质量优先）
                    extras = [p for p in candidates
                              if id(p) not in selected_uids and _is_real_paper(p)
                              and p not in selected][:MIN_REAL - real_in_selected]
                    if extras:
                        # 找出 selected 中得分最低的（排在最后的，即质量最低的）
                        uid_order = {id(p): i for i, p in enumerate(selected)}
                        selected.sort(key=lambda p: uid_order[id(p)])
                        # 替换 selected 中最后1-2个（非 arxiv_best[0] 和 journal_best[0]）
                        replaced = 0
                        for i in range(len(selected) - 1, -1, -1):
                            if replaced >= len(extras):
                                break
                            p_to_replace = selected[i]
                            # 不替换 diversity slots（arxiv_best[0] 和 journal_best[0]）
                            if p_to_replace in arxiv_best or p_to_replace in journal_best:
                                continue
                            new_p = extras[replaced]
                            selected[i] = new_p
                            selected_uids.discard(id(p_to_replace))
                            selected_uids.add(id(new_p))
                            replaced += 1

                # 最终按 candidates 原始顺序排列（保持质量优先）
                uid_order = {id(p): i for i, p in enumerate(candidates)}
                selected.sort(key=lambda p: uid_order[id(p)])
                return selected[:target]

            # =========================================================================
            # 三级保障机制：确保每个领域至少 3 篇论文
            # Level 1: Phase 3 正常流程（每个领域取 top_n = 3 篇）
            # Level 2: < 3 篇的领域 → ArXiv 扩窗 180 天 + Crossref 补充
            # Level 3: 扩窗后仍 < 3 篇 → 综合分数排序取排名前 3 篇
            # =========================================================================
            MIN_PAPERS = 3

            # 顶刊名单（与模块级 TOP_VENUES 保持一致）
            _TOP_VENUES = {
                "nature photonics", "nature physics", "nature", "science",
                "physical review x", "optica", "optics express", "optics letters",
                "photonics research", "laser & photonics reviews",
                "nature communications", "science advances",
                "advanced photonics", "prx quantum",
                "light: science & applications", "npj photonic",
            }

            def _composite_score(p):
                cites = max(0, p.get("citations", 0))
                infl_cites = max(0, p.get("influential_citations", 0))
                year = p.get("year") or 2026
                venue = (p.get("venue") or "").lower()
                src = p.get("source", "")

                # 1. log压缩引用数（35%），200引为满分基准
                cite_s = math.log1p(cites) / math.log1p(200) * 0.35
                # 2. 高影响力引用数（30%），5个为满分基准
                infl_s = math.log1p(infl_cites) / math.log1p(5) * 0.30
                # 3. 发表日期（20%），近365天满分
                days_old = (2026 - year) * 365
                if p.get("published"):
                    try:
                        import datetime as _dt
                        pub = _dt.datetime.strptime(p["published"][:10], "%Y-%m-%d")
                        days_old = (_dt.datetime.now() - pub).days
                    except Exception:
                        pass
                recency_s = max(0, 1 - days_old / 365) * 0.20
                # 4. 顶刊加成（+10%，非乘数）
                venue_bonus = 0.10 if any(tv in venue for tv in _TOP_VENUES) else 0.0
                # 5. 真实论文加权：arxiv/DOI > Tavily/Web
                # 有 doi 或 arxiv_id 的论文是经过 peer-review 的正式出版物
                has_doi_or_arxiv = bool(p.get("doi") or p.get("arxiv_id"))
                src_weight = 0.15 if has_doi_or_arxiv else 0.0

                return cite_s + infl_s + recency_s + venue_bonus + src_weight

            def _process_domain(cat_id, cat):
                """Phase 3: 分析单个领域（供并行调用）

                关键兜底：如果 Phase 2 分类漏掉了某领域（候选<3），用关键词对全量论文回捞。
                """
                domain_papers = [p for uid_val, p in all_collected.items()
                                 if paper_domain_map.get(uid_val) == cat_id
                                 and uid_val not in _pushed_uids]

                # ===== 关键兜底：Phase 2 分类漏掉时，用关键词对全量论文回捞 =====
                if len(domain_papers) < MIN_PAPERS:
                    keywords = cat.get("keywords", [])
                    # 对未分类或分到其他领域的论文，用关键词打分回捞
                    scored = []
                    for uid_val, p in all_collected.items():
                        if uid_val in _pushed_uids:
                            continue
                        if paper_domain_map.get(uid_val) == cat_id:
                            continue  # 已在候选中
                        text = (p.get("title", "") + " " + p.get("abstract", "")).lower()
                        score = sum(1 for kw in keywords if kw.lower() in text)
                        if score > 0:
                            scored.append((score, uid_val, p))
                    scored.sort(key=lambda x: x[0], reverse=True)
                    for score, uid_val, p in scored[:20]:  # 取关键词最匹配的20篇
                        paper_domain_map[uid_val] = cat_id
                        domain_papers.append(p)
                    if scored:
                        print(f"    [RESCUE] {cat.get('name')}: 回捞 {len(scored[:20])} 篇关键词匹配论文")

                domain_papers.sort(key=_composite_score, reverse=True)
                _top_k = max(3, args.top)
                # 先多取候选（质量排序后取 top_k，保证有足够候选做 diversity 挑选）
                domain_papers = domain_papers[:_top_k]
                if domain_papers and minimax_analyzer.api_key:
                    domain_papers = minimax_analyzer.batch_analyze(domain_papers,
                                                                    top_n=min(6, _top_k))
                if minimax_analyzer.api_key and any(_has_valid_analysis(p) for p in domain_papers):
                    trend_result = minimax_analyzer.generate_domain_trends_from_analysis(
                        cat_id, domain_papers, cat)
                    if trend_result and domain_papers:
                        domain_papers[0]["domain_trend"] = trend_result
                # 过滤有效 analysis 后，再按来源多样性约束精选（至少 1 arxiv + 1 期刊）
                analyzed = [p for p in domain_papers if _has_valid_analysis(p)]
                analyzed = _source_diversity_pick(analyzed, target=MIN_PAPERS)
                dropped = len(domain_papers) - len(analyzed)
                return cat_id, analyzed, dropped

            t_phase3 = time.time()
            print(f"  Phase 3: Per-domain MiniMax analysis (parallel, 4 workers)...", flush=True)
            from concurrent.futures import ThreadPoolExecutor, as_completed
            with ThreadPoolExecutor(max_workers=4) as pool:
                futures = {pool.submit(_process_domain, cat_id, cat): cat_id
                           for cat_id, cat in classifier.categories.items()}
                done = 0
                for future in as_completed(futures):
                    cat_id, analyzed, dropped = future.result()
                    cat = classifier.categories[cat_id]
                    if dropped > 0:
                        print(f"    [{time.time()-t_phase3:.0f}s] {cat.get('icon','')} {cat.get('name',cat_id)}: {len(analyzed)} papers (dropped {dropped})")
                    elif analyzed:
                        print(f"    [{time.time()-t_phase3:.0f}s] {cat.get('icon','')} {cat.get('name',cat_id)}: {len(analyzed)} papers")
                    else:
                        print(f"    [{time.time()-t_phase3:.0f}s] {cat.get('icon','')} {cat.get('name',cat_id)}: WARNING - no valid analysis!")
                    category_summaries[cat_id] = {
                        "papers": analyzed,
                        "count": len(analyzed),
                        "analyzed": len(analyzed),
                        "cat_name": cat.get("name", cat_id),
                        "cat_emoji": cat.get("icon", "📄"),
                    }
                    done += 1
                    print(f"    Phase 3 progress: {done}/{len(classifier.categories)} domains done")

            print(f"  Phase 3 done ({time.time()-t_phase3:.0f}s total)", flush=True)

            # =========================================================================
            # 三级保障机制：确保每个领域至少 3 篇论文
            # Level 1: Phase 3 正常流程（每个领域取 top_n = 3 篇）
            # Level 2: < 3 篇的领域 → ArXiv 扩窗 180 天 + Crossref 补充
            # Level 3: 扩窗后仍 < 3 篇 → 综合分数排序取排名前 3 篇
            # =========================================================================
            def _reprocess_domain(cat_id, cat):
                """扩窗后重新处理某领域：用已扩窗的 all_collected 重新分析

                关键优化：
                - 已通过 Phase 3 获得有效 analysis 的论文 → 直接复用，不重复调用 MiniMax
                - 只有新扩窗来的（无 analysis 的）论文 → 调用 batch_analyze
                - 合并结果后再做质量排序和多样性精选
            """
                # 按是否有有效 analysis 分组
                already_analyzed = []
                needs_analysis = []
                for uid_val, p in all_collected.items():
                    if paper_domain_map.get(uid_val) != cat_id:
                        continue
                    if uid_val in _pushed_uids:
                        continue
                    if _has_valid_analysis(p):
                        already_analyzed.append(p)
                    else:
                        needs_analysis.append(p)

                # 只对需要分析的论文调用 MiniMax（避免重复分析已合格的论文）
                if needs_analysis and minimax_analyzer.api_key:
                    needs_analysis.sort(key=_composite_score, reverse=True)
                    needs_analysis = minimax_analyzer.batch_analyze(
                        needs_analysis, top_n=min(6, max(3, args.top)))

                # 合并：已分析（保留） + 新分析（可能部分失败）
                domain_papers = already_analyzed + needs_analysis
                analyzed = [p for p in domain_papers if _has_valid_analysis(p)]
                analyzed.sort(key=_composite_score, reverse=True)
                analyzed = _source_diversity_pick(analyzed, target=MIN_PAPERS)

                # 趋势分析：只在确实有可分析论文时才调用（且只调用一次）
                if (analyzed and minimax_analyzer.api_key and
                        any(_has_valid_analysis(p) for p in analyzed)):
                    trend_result = minimax_analyzer.generate_domain_trends_from_analysis(
                        cat_id, analyzed, cat)
                    if trend_result and analyzed:
                        analyzed[0]["domain_trend"] = trend_result

                return analyzed

            # ---- Level 2: 扩窗补充 ----
            # 兼容 0 篇的领域（Phase 3 全丢的情况）：改为 >= 0 而非 > 0
            underfilled = [cid for cid, s in category_summaries.items()
                          if len(s["papers"]) < MIN_PAPERS]
            print(f"\n  [DEBUG] underfilled domains (len={len(underfilled)}): {underfilled}", flush=True)
            if underfilled:
                print(f"\n  [FILL-L2] {len(underfilled)} domains with < {MIN_PAPERS} papers — expanding search...", flush=True)
                # ArXiv 可用性预检（避免每个领域都白等 70s 重试）
                _arxiv_ok = True
                try:
                    _test = searcher.search_by_category(list(classifier.categories.keys())[0], max_results=1, days_back=7)
                    if not _test:
                        _arxiv_ok = False
                        print("  WARNING: ArXiv unavailable — skipping ArXiv expand in L2 Fill")
                except Exception:
                    _arxiv_ok = False
                    print("  WARNING: ArXiv expand pre-check failed — skipping ArXiv expand in L2 Fill")
                for cat_id in underfilled:
                    cat = classifier.categories[cat_id]
                    expanded = []
                    # 策略1: ArXiv 扩窗至 180 天 + 扩大召回（仅在 ArXiv 可用时）
                    if _arxiv_ok:
                        try:
                            expanded_arxiv = searcher.search_by_category(
                                cat_id, max_results=60, days_back=180)
                            for p in expanded_arxiv:
                                uid = _uid(p)
                                if uid not in _pushed_uids and uid not in all_collected:
                                    p["source"] = "arxiv"
                                    all_collected[uid] = p
                                    expanded.append(p)
                        except Exception as e:
                            print(f"    [{cat.get('name')}] ArXiv expand failed: {e}")
                    # 策略2: Crossref 扩召（每领域最多 8 篇）
                    try:
                        expanded_cr = crossref_searcher.search_category(
                            cat_id, classifier, max_results=8)
                        for p in expanded_cr:
                            uid = _uid(p)
                            if uid not in _pushed_uids and uid not in all_collected:
                                all_collected[uid] = p
                                expanded.append(p)
                    except Exception as e:
                        print(f"    [{cat.get('name')}] Crossref expand failed: {e}")
                    if expanded:
                        print(f"  [FILL-L2] {cat.get('name')}: +{len(expanded)} papers, re-analyzing...")
                        for p in expanded:
                            uid = _uid(p)
                            paper_domain_map[uid] = cat_id
                        analyzed2 = _reprocess_domain(cat_id, cat)
                        if analyzed2:
                            category_summaries[cat_id] = {
                                "papers": analyzed2,
                                "count": len(analyzed2),
                                "analyzed": len(analyzed2),
                                "cat_name": cat.get("name", cat_id),
                                "cat_emoji": cat.get("icon", "📄"),
                            }
                            print(f"  [FILL-L2] {cat.get('name')}: recovered to {len(analyzed2)} papers")
                        else:
                            print(f"  [FILL-L2] {cat.get('name')}: 0 valid analysis after expand")

            # ---- Level 3: 兜底排序 —— 扩窗后仍不足 3 篇，取综合分数最高的 ----
            # 兼容 0 篇的领域（Phase 3 全丢的情况）：改为 >= 0 而非 > 0
            still_underfilled = [cid for cid, s in category_summaries.items()
                                  if len(s["papers"]) < MIN_PAPERS]
            print(f"  [DEBUG] still_underfilled domains: {still_underfilled}", flush=True)
            if still_underfilled:
                print(f"\n  [FILL-L3] {len(still_underfilled)} domains still < {MIN_PAPERS} papers — applying composite-score fallback...", flush=True)
                for cat_id in still_underfilled:
                    cat = classifier.categories[cat_id]
                    # 从 all_collected 中取出属于该领域且未推送的所有论文
                    candidates = [p for uid_val, p in all_collected.items()
                                  if paper_domain_map.get(uid_val) == cat_id
                                  and uid_val not in _pushed_uids]

                    # 如果 paper_domain_map 中该领域没有任何论文（Phase 2 分类完全遗漏该领域），
                    # 用关键词在 all_collected 中直接搜索（绕过 paper_domain_map）
                    if not candidates:
                        keywords = cat.get('keywords', [])
                        scored = []
                        for uid_val, p in all_collected.items():
                            if uid_val in _pushed_uids:
                                continue
                            text = (p.get('title', '') + ' ' + p.get('abstract', '')).lower()
                            score = sum(1 for kw in keywords if kw.lower() in text)
                            if score > 0:
                                scored.append((score, uid_val, p))
                        scored.sort(key=lambda x: x[0], reverse=True)
                        candidates = [p for _, uid_val, p in scored[:20]]
                        if scored:
                            print(f"    [FILL-L3] {cat.get('name')}: 关键词回捞 {len(candidates)} 篇（Phase 2 遗漏该领域）")

                    candidates.sort(key=_composite_score, reverse=True)
                    top_candidates = candidates[:MIN_PAPERS]
                    if top_candidates:
                        # 保留已有的 analysis，只补充无 analysis 的论文
                        for p in top_candidates:
                            if not _has_valid_analysis(p) and minimax_analyzer.api_key:
                                # 直接调用 analyze_paper（避免 batch_analyze 的整条 pipeline 开销）
                                analysis = minimax_analyzer.analyze_paper(p)
                                if analysis:
                                    p["analysis"] = analysis
                        valid = [p for p in top_candidates if _has_valid_analysis(p)]
                        valid = _source_diversity_pick(valid, target=MIN_PAPERS)
                        if valid:
                            category_summaries[cat_id] = {
                                "papers": valid[:MIN_PAPERS],
                                "count": len(valid),
                                "analyzed": len(valid),
                                "cat_name": cat.get("name", cat_id),
                                "cat_emoji": cat.get("icon", "📄"),
                            }
                            print(f"  [FILL-L3] {cat.get('name')}: composite-sort fallback → {len(valid)} papers")

            # ---- 打印最终各领域论文数 ----
            print(f"\n  [FINAL] Domain paper counts:")
            for cat_id, s in category_summaries.items():
                cat = classifier.categories.get(cat_id, {})
                status = "✅" if len(s["papers"]) >= MIN_PAPERS else "⚠️"
                print(f"    {status} {cat.get('icon','')} {cat.get('name', cat_id)}: {len(s['papers'])} papers")
            print(f"  [{time.time()-t_start:.0f}s] All phases complete, proceeding to send cards...", flush=True)

            # 步骤1：发送子卡片到测试群（收集 message_id）
            sub_count = sum(1 for s in category_summaries.values() if s.get("papers"))
            test_group = sender.target_group  # 测试群 ID（来自环境变量）
            print(f"\n[Step 1/2] Sending {sub_count} sub-cards to test group...")
            sub_card_message_ids = {}
            for cat_id, summary in category_summaries.items():
                papers = summary.get("papers", [])
                if papers:
                    msg_id = sender.send_sub_card(cat_id, papers, classifier, in_reply_to=None)
                    if msg_id:
                        sub_card_message_ids[cat_id] = msg_id
                        print(f"    -> {cat_id}: message_id={msg_id}")

            # 步骤2：发送主卡片到目标群
            # --test 模式：所有内容发测试群，不污染主群
            if args.test:
                TARGET_GROUP = test_group
                print(f"\n[Step 2/2] Sending main card to TEST group {TARGET_GROUP} (--test mode)...")
            else:
                TARGET_GROUP = "oc_6172e7ce838d85f4928d6ee707203b60"
                print(f"\n[Step 2/2] Sending main card to MAIN group {TARGET_GROUP}...")
            main_msg_id = sender.send_main_card(
                category_summaries, classifier,
                use_template=False, minimax_analyzer=minimax_analyzer,
                sub_card_message_ids=sub_card_message_ids,
                target_chat_id=TARGET_GROUP
            )

            if main_msg_id:
                # 收集所有已发送论文的 uid，写入历史记录（避免后续重复推送）
                all_sent_uids = []
                for summary in category_summaries.values():
                    for p in summary.get("papers", []):
                        uid = _uid(p)
                        if uid:
                            all_sent_uids.append(uid)
                _save_pushed_history(all_sent_uids)
                print(f"\n✅ All cards sent! (recorded {len(all_sent_uids)} papers to history)")
                print(f"   Main card: message_id={main_msg_id}")
                print(f"   {len(sub_card_message_ids)} sub-cards in test group")
            else:
                print("ERROR: Failed to send main card")
        else:
            # 仅搜索不发送
            for cat_id in classifier.categories.keys():
                cat = classifier.categories.get(cat_id, {})
                papers = searcher.get_quality_papers(cat_id, top_n=args.top)
                print(f"  {cat.get('icon', '')} {cat.get('name', cat_id)}: {len(papers)} papers")

    return 0


if __name__ == "__main__":
    sys.exit(main())