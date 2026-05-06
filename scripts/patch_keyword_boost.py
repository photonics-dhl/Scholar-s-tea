#!/usr/bin/env python3
"""Patch store.py to add keyword boost for exact phrase matching in search."""

# Read the file
with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/store.py', 'r') as f:
    content = f.read()

# Find the search_facts method and add keyword boost
old_search_section = '''            scored.sort(key=lambda x: x["score"], reverse=True)

            # Update retrieval counts
            if scored:
                ids = [r["fact_id"] for r in scored[:limit]]
                placeholders = ",".join("?" * len(ids))
                self._conn.execute(
                    f"UPDATE facts SET retrieval_count = retrieval_count + 1 WHERE fact_id IN ({placeholders})",
                    ids,
                )
                self._conn.commit()

            return scored[:limit]'''

new_search_section = '''            # Keyword boost: exact phrase match gets priority
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
                        fact["score"] += 0.1  # All words match bonus

            scored.sort(key=lambda x: x["score"], reverse=True)

            # Update retrieval counts
            if scored:
                ids = [r["fact_id"] for r in scored[:limit]]
                placeholders = ",".join("?" * len(ids))
                self._conn.execute(
                    f"UPDATE facts SET retrieval_count = retrieval_count + 1 WHERE fact_id IN ({placeholders})",
                    ids,
                )
                self._conn.commit()

            return scored[:limit]'''

if old_search_section in content:
    content = content.replace(old_search_section, new_search_section)
    print("Keyword boost added!")
else:
    print("ERROR: Could not find the target section to patch")
    print("Searching for 'scored.sort'...")
    if "scored.sort(key=lambda x: x[\"score\"], reverse=True)" in content:
        print("Found scored.sort with different quote style")
    exit(1)

# Write modified file
with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/store.py', 'w') as f:
    f.write(content)

# Verify syntax
import ast
try:
    with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/store.py', 'r') as f:
        ast.parse(f.read())
    print("Syntax check: OK")
except SyntaxError as e:
    print(f"SYNTAX ERROR at line {e.lineno}: {e.msg}")