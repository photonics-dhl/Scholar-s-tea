#!/usr/bin/env python3
"""Patch retrieval.py to add keyword boost for exact phrase matching."""

with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/retrieval.py', 'r') as f:
    content = f.read()

# Find the search method's scored.sort section
old_section = '''        # Sort by score descending, return top limit
        scored.sort(key=lambda x: x["score"], reverse=True)
        results = scored[:limit]
        # Strip raw HRR bytes — callers expect JSON-serializable dicts
        for fact in results:
            fact.pop("hrr_vector", None)
        return results'''

new_section = '''        # Keyword boost: exact phrase match gets priority
        query_lower = query.lower()
        for fact in scored:
            content_lower = fact.get("content", "").lower()
            tags_lower = fact.get("tags", "").lower()
            # Exact match in content or tags
            if query_lower in content_lower or query_lower in tags_lower:
                fact["score"] += 0.3
            # Bonus for multiple word matches (AND logic)
            query_words = query_lower.split()
            if len(query_words) > 1:
                matched_words = sum(1 for w in query_words if w in content_lower or w in tags_lower)
                if matched_words == len(query_words):
                    fact["score"] += 0.1

        # Sort by score descending, return top limit
        scored.sort(key=lambda x: x["score"], reverse=True)
        results = scored[:limit]
        # Strip raw HRR bytes — callers expect JSON-serializable dicts
        for fact in results:
            fact.pop("hrr_vector", None)
        return results'''

if old_section in content:
    content = content.replace(old_section, new_section)
    print("Keyword boost added to search()!")
else:
    print("ERROR: Could not find target section")
    exit(1)

with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/retrieval.py', 'w') as f:
    f.write(content)

import ast
try:
    with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/retrieval.py', 'r') as f:
        ast.parse(f.read())
    print("Syntax check: OK")
except SyntaxError as e:
    print(f"SYNTAX ERROR: {e}")