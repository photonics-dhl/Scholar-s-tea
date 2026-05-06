#!/usr/bin/env python3
"""Fix FactRetriever.search() to use store.search_facts() for prefetch compatibility."""

# Read the file
with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/retrieval.py', 'r') as f:
    content = f.read()

# Replace the entire search() method with one that delegates to store.search_facts()
old_search = '''    def search(
        self,
        query: str,
        category: str | None = None,
        min_trust: float = 0.3,
        limit: int = 10,
    ) -> list[dict]:
        """Hybrid search: FTS5 candidates → Jaccard rerank → trust weighting.

        Pipeline:
        1. FTS5 search: Get limit*3 candidates from SQLite full-text search
        2. Jaccard boost: Token overlap between query and fact content
        3. Trust weighting: final_score = relevance * trust_score
        4. Temporal decay (optional): decay = 0.5^(age_days / half_life)

        Returns list of dicts with fact data + 'score' field, sorted by score desc.
        """
        # Stage 1: Get FTS5 candidates (more than limit for reranking headroom)
        candidates = self._fts_candidates(query, category, min_trust, limit * 3)

        if not candidates:
            return []

        # Stage 2: Rerank with Jaccard + trust + optional decay
        query_tokens = self._tokenize(query)
        scored = []

        for fact in candidates:
            content_tokens = self._tokenize(fact["content"])
            tag_tokens = self._tokenize(fact.get("tags", ""))
            all_tokens = content_tokens | tag_tokens

            jaccard = self._jaccard_similarity(query_tokens, all_tokens)
            fts_score = fact.get("fts_rank", 0.0)

            # HRR similarity
            if self.hrr_weight > 0 and fact.get("hrr_vector"):
                fact_vec = hrr.bytes_to_phases(fact["hrr_vector"])
                query_vec = hrr.encode_text(query, self.hrr_dim)
                hrr_sim = (hrr.similarity(query_vec, fact_vec) + 1.0) / 2.0  # shift to [0,1]
            else:
                hrr_sim = 0.5  # neutral

            # Combine FTS5 + Jaccard + HRR
            relevance = (self.fts_weight * fts_score
                        + self.jaccard_weight * jaccard
                        + self.hrr_weight * hrr_sim)

            # Trust weighting
            score = relevance * fact["trust_score"]

            # Optional temporal decay
            if self.half_life > 0:
                score *= self._temporal_decay(fact.get("updated_at") or fact.get("created_at"))

            fact["score"] = score
            scored.append(fact)

        # Keyword boost: exact phrase match gets priority
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

new_search = '''    def search(
        self,
        query: str,
        category: str | None = None,
        min_trust: float = 0.3,
        limit: int = 10,
    ) -> list[dict]:
        """Search facts using FTS5 + ZChat embedding (store.search_facts).

        This is the main entry point for prefetch() and other search operations.
        Uses store.search_facts() which combines FTS5 exact match with
        ZChat embedding semantic similarity, plus keyword boost for exact phrase.
        """
        # Delegate to store.search_facts for consistent FTS5 + embedding scoring
        return self.store.search_facts(
            query,
            category=category,
            limit=limit,
        )'''

if old_search in content:
    content = content.replace(old_search, new_search)
    print("FactRetriever.search() fixed to use store.search_facts()!")
else:
    print("WARNING: Could not find exact search() pattern")
    print("Trying simpler replacement...")
    # Find and replace just the method signature and body
    if "def search(" in content and "_fts_candidates" in content:
        # The old search method is there, need to find boundaries
        import re
        # Find the search method
        match = re.search(r'(    def search\(\n        self,\n        query: str,.*?\n        \) -> list\[dict\]:.*?)(?=    def |\Z)', content, re.DOTALL)
        if match:
            old_method = match.group(1)
            # Extract just the signature and docstring
            new_method = '''    def search(
        self,
        query: str,
        category: str | None = None,
        min_trust: float = 0.3,
        limit: int = 10,
    ) -> list[dict]:
        """Search facts using FTS5 + ZChat embedding (store.search_facts).

        This is the main entry point for prefetch() and other search operations.
        Uses store.search_facts() which combines FTS5 exact match with
        ZChat embedding semantic similarity, plus keyword boost for exact phrase.
        """
        # Delegate to store.search_facts for consistent FTS5 + embedding scoring
        return self.store.search_facts(
            query,
            category=category,
            limit=limit,
        )
'''
            content = content.replace(old_method, new_method)
            print("FactRetriever.search() fixed via regex replacement!")
        else:
            print("ERROR: Could not find search() method boundaries")

# Write modified file
with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/retrieval.py', 'w') as f:
    f.write(content)

# Verify syntax
import ast
try:
    with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/retrieval.py', 'r') as f:
        ast.parse(f.read())
    print("Syntax check: OK")
except SyntaxError as e:
    print(f"SYNTAX ERROR at line {e.lineno}: {e.msg}")
    exit(1)

print("Fix applied successfully!")