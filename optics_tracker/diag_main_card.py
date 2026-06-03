#!/usr/bin/env python3
"""Diagnostic: build main card and check payload size + structure."""
import json, sys, os

# Add current dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Minimal imports to build card structure
from optics_tracker_v2 import (
    FeishuCardSender, OpticsClassifier, MiniMaxAnalyzer,
    _clean_latex, _uid, _has_valid_analysis
)
from datetime import datetime

def main():
    classifier = OpticsClassifier()
    
    # Create mock category_summaries with 3 papers each
    category_summaries = {}
    for cat_id, cat in classifier.categories.items():
        papers = []
        for i in range(3):
            papers.append({
                "title": f"Test paper {i+1} for {cat.get('name', cat_id)} with some longer title text here",
                "arxiv_id": f"2605.{28000+i}",
                "citations": 0,
                "venue": "arXiv",
                "source": "arxiv",
                "authors": ["Author A", "Author B"],
                "analysis": {
                    "summary": "This is a test summary",
                    "innovation": "Test innovation", 
                    "method": "Test method",
                    "application": "Test application",
                    "limitation": "Test limitation",
                    "trend": "Test trend"
                }
            })
        category_summaries[cat_id] = {"papers": papers}
    
    sender = FeishuCardSender()
    
    # Build the card JSON (same as what send_main_card does with use_template=False)
    card_data = sender._build_main_card_json(category_summaries, classifier, None, {})
    card_content_str = json.dumps(card_data, ensure_ascii=False)
    
    print(f"Card payload size: {len(card_content_str)} bytes ({len(card_content_str)/1024:.1f} KB)")
    
    # Check for potential issues
    # 1. Check if text_size is used in markdown elements (schema 2.0 issue)
    card_str = json.dumps(card_data, ensure_ascii=False)
    text_size_count = card_str.count('"text_size"')
    print(f"text_size occurrences: {text_size_count}")
    
    # 2. Check nesting depth
    def max_depth(obj, depth=0):
        if isinstance(obj, dict):
            return max((max_depth(v, depth+1) for v in obj.values()), default=depth)
        elif isinstance(obj, list):
            return max((max_depth(v, depth+1) for v in obj), default=depth)
        return depth
    print(f"Max nesting depth: {max_depth(card_data)}")
    
    # 3. Check for interactive_container elements
    def find_tags(obj, path=""):
        results = []
        if isinstance(obj, dict):
            tag = obj.get("tag", "")
            if tag:
                results.append(f"{path}/{tag}")
            for k, v in obj.items():
                results.extend(find_tags(v, f"{path}/{k}"))
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                results.extend(find_tags(v, f"{path}[{i}]"))
        return results
    
    tags = find_tags(card_data)
    unique_tags = set(tags)
    print(f"\nUnique tag paths ({len(unique_tags)}):")
    for t in sorted(unique_tags):
        print(f"  {t}")
    
    # 4. Check column_set structure
    print(f"\nCard body elements count: {len(card_data.get('body', {}).get('elements', []))}")
    
    # 5. Check Feishu schema 2.0 validity issues
    # In schema 2.0, markdown doesn't support text_size
    # Check for unsupported attributes
    body = card_data.get('body', {})
    elements = body.get('elements', [])
    
    issues = []
    def check_element(el, path=""):
        if isinstance(el, dict):
            tag = el.get("tag", "")
            if tag == "markdown" and "text_size" in el:
                issues.append(f"markdown with text_size at {path}")
            if tag == "column" and "background_style" in el:
                val = el["background_style"]
                # Valid colors in schema 2.0
                valid = ["blue", "wathet", "turquoise", "green", "yellow", "orange", "red", "carmine", "violet", "purple", "indigo", "grey", "default"]
                valid_50 = [f"{c}-50" for c in ["blue", "green", "purple", "orange", "red", "yellow"]]
                if val not in valid and val not in valid_50:
                    issues.append(f"column with invalid background_style '{val}' at {path}")
            if tag == "interactive_container":
                issues.append(f"interactive_container at {path}")
            for k, v in el.items():
                if k != "tag":
                    check_element(v, f"{path}/{k}")
        elif isinstance(el, list):
            for i, v in enumerate(el):
                check_element(v, f"{path}[{i}]")
    
    check_element(body)
    if issues:
        print("\n⚠️  Potential issues:")
        for iss in issues:
            print(f"  - {iss}")
    else:
        print("\n✅ No obvious structural issues found")
    
    # 6. Save the payload for manual inspection
    with open("/tmp/main_card_payload.json", "w") as f:
        json.dump(card_data, f, ensure_ascii=False, indent=2)
    print(f"\nPayload saved to /tmp/main_card_payload.json")

if __name__ == "__main__":
    main()
