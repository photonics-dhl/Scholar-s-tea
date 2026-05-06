#!/usr/bin/env python3
"""Patch store.py to add ZChat embedding support."""

import re

# Read original file
with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/store.py', 'r') as f:
    content = f.read()

# 1. Add imports after the existing imports
import_section_end = content.find("from pathlib import Path")
if import_section_end == -1:
    print("ERROR: Could not find import section")
    exit(1)

# Find the end of the imports block
import_end = content.find("\n_SCHEMA", import_section_end)
if import_end == -1:
    print("ERROR: Could not find _SCHEMA")
    exit(1)

# Build the new imports and constants to add
embedding_imports = '''
import json
import os

# =============================================================================
# ZChat Embedding Integration
# =============================================================================

_ZCHAT_API_KEY = os.environ.get("ZCHAT_API_KEY") or os.environ.get("OPENAI_API_KEY", "")
_ZCHAT_BASE_URL = os.environ.get("ZCHAT_BASE_URL", "https://api.zchat.tech/v1")
_EMBEDDING_MODEL = "text-embedding-3-large"


def get_zchat_embedding(text: str):
    """Get embedding vector from ZChat API."""
    if not _ZCHAT_API_KEY:
        return None

    try:
        import urllib.request
        import urllib.error

        url = f"{_ZCHAT_BASE_URL}/embeddings"
        data = json.dumps({
            "input": text[:8192],
            "model": _EMBEDDING_MODEL,
        }).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {_ZCHAT_API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result["data"][0]["embedding"]

    except Exception as e:
        print(f"[embedding] ZChat embedding error: {e}")
        return None


def cosine_similarity(a, b):
    """Compute cosine similarity between two vectors."""
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

'''

# Insert the new imports
content = content[:import_section_end] + embedding_imports + content[import_section_end:]

# 2. Modify add_fact to generate embedding
# Find the add_fact method and modify it
old_add_fact = '''            # Compute HRR vector after entity linking
            self._compute_hrr_vector(fact_id, content)
            self._rebuild_bank(category)

            return fact_id'''

new_add_fact = '''            # Compute HRR vector after entity linking
            self._compute_hrr_vector(fact_id, content)

            # Generate ZChat embedding
            embedding_vec = get_zchat_embedding(content)
            if embedding_vec:
                self._conn.execute(
                    "UPDATE facts SET embedding = ? WHERE fact_id = ?",
                    (json.dumps(embedding_vec), fact_id),
                )
                self._conn.commit()

            self._rebuild_bank(category)

            return fact_id'''

content = content.replace(old_add_fact, new_add_fact)

# 3. Modify search_facts to use embedding reranking
old_search = '''    def search_facts(
        self,
        query: str,
        category: str | None = None,
        min_trust: float = 0.3,
        limit: int = 10,
    ) -> list[dict]:
        """Full-text search over facts using FTS5.

        Returns a list of fact dicts ordered by FTS5 rank, then trust_score
        descending. Also increments retrieval_count for matched facts.
        """
        with self._lock:
            query = query.strip()
            if not query:
                return []

            params: list = [query, min_trust]
            category_clause = ""
            if category is not None:
                category_clause = "AND f.category = ?"
                params.append(category)
            params.append(limit)

            sql = f"""
                SELECT f.fact_id, f.content, f.category, f.tags,
                       f.trust_score, f.retrieval_count, f.helpful_count,
                       f.created_at, f.updated_at
                FROM facts f
                JOIN facts_fts fts ON fts.rowid = f.fact_id
                WHERE facts_fts MATCH ?
                  AND f.trust_score >= ?
                  {category_clause}
                ORDER BY fts.rank, f.trust_score DESC
                LIMIT ?
            """

            rows = self._conn.execute(sql, params).fetchall()
            results = [self._row_to_dict(r) for r in rows]

            if results:
                ids = [r["fact_id"] for r in results]
                placeholders = ",".join("?" * len(ids))
                self._conn.execute(
                    f"UPDATE facts SET retrieval_count = retrieval_count + 1 WHERE fact_id IN ({placeholders})",
                    ids,
                )
                self._conn.commit()

            return results'''

new_search = '''    def search_facts(
        self,
        query: str,
        category: str | None = None,
        min_trust: float = 0.3,
        limit: int = 10,
    ) -> list[dict]:
        """Full-text search over facts using FTS5 + embedding reranking.

        Returns a list of fact dicts ordered by hybrid score (FTS5 + embedding).
        Also increments retrieval_count for matched facts.
        """
        with self._lock:
            query = query.strip()
            if not query:
                return []

            params: list = [query, min_trust]
            category_clause = ""
            if category is not None:
                category_clause = "AND f.category = ?"
                params.append(category)
            params.append(limit * 3)  # Get more for reranking

            sql = f"""
                SELECT f.fact_id, f.content, f.category, f.tags,
                       f.trust_score, f.retrieval_count, f.helpful_count,
                       f.created_at, f.updated_at, f.embedding,
                       facts_fts.rank as fts_rank_raw
                FROM facts_fts
                JOIN facts f ON f.fact_id = facts_fts.rowid
                WHERE facts_fts MATCH ?
                  AND f.trust_score >= ?
                  {category_clause}
                ORDER BY facts_fts.rank
                LIMIT ?
            """

            try:
                rows = self._conn.execute(sql, params).fetchall()
            except Exception:
                return []

            if not rows:
                return []

            # Get query embedding
            query_embedding = get_zchat_embedding(query)

            # Normalize FTS5 ranks and compute final scores
            raw_ranks = [abs(row["fts_rank_raw"]) for row in rows]
            max_rank = max(raw_ranks) if raw_ranks else 1.0
            max_rank = max(max_rank, 1e-6)

            scored = []
            for row, raw_rank in zip(rows, raw_ranks):
                fact = self._row_to_dict(row)
                fts_score = raw_rank / max_rank  # normalize to [0, 1]

                # Compute embedding similarity if available
                emb_score = 0.5  # neutral
                if query_embedding and fact.get("embedding"):
                    try:
                        fact_embedding = json.loads(fact["embedding"])
                        emb_score = cosine_similarity(query_embedding, fact_embedding)
                    except (json.JSONDecodeError, TypeError):
                        emb_score = 0.5

                # Combine FTS + embedding (60% embedding, 40% FTS for semantic boost)
                relevance = 0.4 * fts_score + 0.6 * emb_score
                fact["score"] = relevance * fact["trust_score"]
                fact.pop("embedding", None)
                fact.pop("fts_rank_raw", None)
                scored.append(fact)

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

content = content.replace(old_search, new_search)

# Write modified file
with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/store.py', 'w') as f:
    f.write(content)

print("Patch applied successfully!")

# Verify syntax
import ast
try:
    with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/store.py', 'r') as f:
        ast.parse(f.read())
    print("Syntax check: OK")
except SyntaxError as e:
    print(f"SYNTAX ERROR at line {e.lineno}: {e.msg}")
    print("Reverting...")
    import shutil
    shutil.copy('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/store.py.bak.embed',
                '/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/store.py')
    print("Reverted to backup")