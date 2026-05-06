#!/usr/bin/env python3
"""Add ZChat embedding support to Hermes holographic memory store."""

import re
import sqlite3
import threading
import json
import os
from pathlib import Path
from typing import Optional

# Try to import holographic HRR
try:
    from . import holographic as hrr
except ImportError:
    import holographic as hrr

# =============================================================================
# ZChat Embedding Integration
# =============================================================================

_ZCHAT_API_KEY = os.environ.get("ZCHAT_API_KEY") or os.environ.get("OPENAI_API_KEY", "")
_ZCHAT_BASE_URL = os.environ.get("ZCHAT_BASE_URL", "https://api.zchat.tech/v1")

# Use text-embedding-3-large for better precision (1536 dimensions)
_EMBEDDING_MODEL = "text-embedding-3-large"
_EMBEDDING_DIM = 1536


def get_zchat_embedding(text: str) -> Optional[list[float]]:
    """Get embedding vector from ZChat API."""
    if not _ZCHAT_API_KEY:
        return None

    try:
        import urllib.request
        import urllib.error

        url = f"{_ZCHAT_BASE_URL}/embeddings"
        data = json.dumps({
            "input": text[:8192],  # Truncate to max input length
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


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# =============================================================================
# Schema with embedding column
# =============================================================================

_SCHEMA = """
CREATE TABLE IF NOT EXISTS facts (
    fact_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    content         TEXT NOT NULL UNIQUE,
    category        TEXT DEFAULT 'general',
    tags            TEXT DEFAULT '',
    trust_score     REAL DEFAULT 0.5,
    retrieval_count INTEGER DEFAULT 0,
    helpful_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hrr_vector      BLOB,
    embedding       TEXT
);

CREATE TABLE IF NOT EXISTS entities (
    entity_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    entity_type TEXT DEFAULT 'unknown',
    aliases     TEXT DEFAULT '',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fact_entities (
    fact_id   INTEGER REFERENCES facts(fact_id),
    entity_id INTEGER REFERENCES entities(entity_id),
    PRIMARY KEY (fact_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_facts_trust    ON facts(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_facts_category ON facts(category);
CREATE INDEX IF NOT EXISTS idx_entities_name  ON entities(name);

CREATE VIRTUAL TABLE IF NOT EXISTS facts_fts
    USING fts5(content, tags, content=facts, content_rowid=fact_id);

CREATE TRIGGER IF NOT EXISTS facts_ai AFTER INSERT ON facts BEGIN
    INSERT INTO facts_fts(rowid, content, tags)
        VALUES (new.fact_id, new.content, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS facts_ad AFTER DELETE ON facts BEGIN
    INSERT INTO facts_fts(facts_fts, rowid, content, tags)
        VALUES ('delete', old.fact_id, old.content, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS facts_au AFTER UPDATE ON facts BEGIN
    INSERT INTO facts_fts(facts_fts, rowid, content, tags)
        VALUES ('delete', old.fact_id, old.content, old.tags);
    INSERT INTO facts_fts(rowid, content, tags)
        VALUES (new.fact_id, new.content, new.tags);
END;

CREATE TABLE IF NOT EXISTS memory_banks (
    bank_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name  TEXT NOT NULL UNIQUE,
    vector     BLOB NOT NULL,
    dim        INTEGER NOT NULL,
    fact_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

_HELPFUL_DELTA = 0.05
_UNHELPFUL_DELTA = -0.10
_TRUST_MIN = 0.0
_TRUST_MAX = 1.0

_RE_CAPITALIZED = re.compile(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b')
_RE_DOUBLE_QUOTE = re.compile(r'"([^"]+)"')
_RE_SINGLE_QUOTE = re.compile(r"'([^']+)'")
_RE_AKA = re.compile(
    r'(\w+(?:\s+\w+)*)\s+(?:aka|also known as)\s+(\w+(?:\s+\w+)*)',
    re.IGNORECASE,
)


def _clamp_trust(value: float) -> float:
    return max(_TRUST_MIN, min(_TRUST_MAX, value))


class MemoryStore:
    """SQLite-backed fact store with HRR vectors and ZChat embedding support."""

    def __init__(
        self,
        db_path: "str | Path | None" = None,
        default_trust: float = 0.5,
        hrr_dim: int = 1024,
    ) -> None:
        if db_path is None:
            from hermes_constants import get_hermes_home
            db_path = str(get_hermes_home() / "memory_store.db")
        self.db_path = Path(db_path).expanduser()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.default_trust = _clamp_trust(default_trust)
        self.hrr_dim = hrr_dim
        self._hrr_available = hrr._HAS_NUMPY
        self._conn: sqlite3.Connection = sqlite3.connect(
            str(self.db_path),
            check_same_thread=False,
            timeout=10.0,
        )
        self._lock = threading.RLock()
        self._conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self) -> None:
        """Create tables, indexes, and triggers if they do not exist."""
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.executescript(_SCHEMA)
        # Migrate: add hrr_vector and embedding columns if missing
        columns = {row[1] for row in self._conn.execute("PRAGMA table_info(facts)").fetchall()}
        if "hrr_vector" not in columns:
            self._conn.execute("ALTER TABLE facts ADD COLUMN hrr_vector BLOB")
        if "embedding" not in columns:
            self._conn.execute("ALTER TABLE facts ADD COLUMN embedding TEXT")
        self._conn.commit()

    def add_fact(
        self,
        content: str,
        category: str = "general",
        tags: str = "",
        generate_embedding: bool = True,
    ) -> int:
        """Insert a fact and return its fact_id.

        Generates HRR vector and ZChat embedding automatically.
        """
        with self._lock:
            content = content.strip()
            if not content:
                raise ValueError("content must not be empty")

            try:
                cur = self._conn.execute(
                    """
                    INSERT INTO facts (content, category, tags, trust_score)
                    VALUES (?, ?, ?, ?)
                    """,
                    (content, category, tags, self.default_trust),
                )
                self._conn.commit()
                fact_id: int = cur.lastrowid
            except sqlite3.IntegrityError:
                row = self._conn.execute(
                    "SELECT fact_id FROM facts WHERE content = ?", (content,)
                ).fetchone()
                return int(row["fact_id"])

            # Entity extraction and linking
            for name in self._extract_entities(content):
                entity_id = self._resolve_entity(name)
                self._link_fact_entity(fact_id, entity_id)

            # Compute HRR vector
            self._compute_hrr_vector(fact_id, content)

            # Generate ZChat embedding
            if generate_embedding:
                self._compute_embedding(fact_id, content)

            self._rebuild_bank(category)
            return fact_id

    def _compute_embedding(self, fact_id: int, content: str) -> None:
        """Compute and store ZChat embedding for a fact."""
        embedding_vec = get_zchat_embedding(content)
        if embedding_vec:
            self._conn.execute(
                "UPDATE facts SET embedding = ? WHERE fact_id = ?",
                (json.dumps(embedding_vec), fact_id),
            )
            self._conn.commit()

    def rebuild_embeddings(self, batch_size: int = 10) -> dict:
        """Recompute embeddings for all facts without them.

        Returns dict with 'total', 'success', 'failed' counts.
        """
        results = {"total": 0, "success": 0, "failed": 0}

        rows = self._conn.execute(
            "SELECT fact_id, content FROM facts WHERE embedding IS NULL OR embedding = ''"
        ).fetchall()

        results["total"] = len(rows)

        for row in rows:
            fact_id = row["fact_id"]
            content = row["content"]
            embedding_vec = get_zchat_embedding(content)
            if embedding_vec:
                self._conn.execute(
                    "UPDATE facts SET embedding = ? WHERE fact_id = ?",
                    (json.dumps(embedding_vec), fact_id),
                )
                self._conn.commit()
                results["success"] += 1
                print(f"[embedding] fact_id={fact_id} embedded ({len(embedding_vec)}d)")
            else:
                results["failed"] += 1
            # Rate limiting - sleep between calls
            import time
            time.sleep(0.1)

        return results

    def search_facts(
        self,
        query: str,
        category: str | None = None,
        min_trust: float = 0.3,
        limit: int = 10,
    ) -> list[dict]:
        """Full-text search over facts using FTS5 + optional embedding reranking."""
        with self._lock:
            query = query.strip()
            if not query:
                return []

            # Get FTS5 candidates
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
                fact = dict(row)
                fts_score = raw_rank / max_rank  # normalize to [0, 1]

                # Compute embedding similarity if available
                emb_score = 0.5  # neutral
                if query_embedding and fact.get("embedding"):
                    try:
                        fact_embedding = json.loads(fact["embedding"])
                        emb_score = cosine_similarity(query_embedding, fact_embedding)
                    except (json.JSONDecodeError, TypeError):
                        emb_score = 0.5

                # Combine FTS + embedding
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

            return scored[:limit]

    def _row_to_dict(self, row: sqlite3.Row) -> dict:
        return dict(row)

    def close(self) -> None:
        self._conn.close()

    def __enter__(self) -> "MemoryStore":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    # Include all original methods unchanged...
    def _extract_entities(self, text: str) -> list[str]:
        seen: set[str] = set()
        candidates: list[str] = []

        def _add(name: str) -> None:
            stripped = name.strip()
            if stripped and stripped.lower() not in seen:
                seen.add(stripped.lower())
                candidates.append(stripped)

        for m in _RE_CAPITALIZED.finditer(text):
            _add(m.group(1))
        for m in _RE_DOUBLE_QUOTE.finditer(text):
            _add(m.group(1))
        for m in _RE_SINGLE_QUOTE.finditer(text):
            _add(m.group(1))
        for m in _RE_AKA.finditer(text):
            _add(m.group(1))
            _add(m.group(2))

        return candidates

    def _resolve_entity(self, name: str) -> int:
        row = self._conn.execute(
            "SELECT entity_id FROM entities WHERE name LIKE ?", (name,)
        ).fetchone()
        if row is not None:
            return int(row["entity_id"])
        alias_row = self._conn.execute(
            "SELECT entity_id FROM entities WHERE ',' || aliases || ',' LIKE '%,' || ? || ',%'",
            (name,),
        ).fetchone()
        if alias_row is not None:
            return int(alias_row["entity_id"])
        cur = self._conn.execute("INSERT INTO entities (name) VALUES (?)", (name,))
        self._conn.commit()
        return int(cur.lastrowid)

    def _link_fact_entity(self, fact_id: int, entity_id: int) -> None:
        self._conn.execute(
            "INSERT OR IGNORE INTO fact_entities (fact_id, entity_id) VALUES (?, ?)",
            (fact_id, entity_id),
        )
        self._conn.commit()

    def _compute_hrr_vector(self, fact_id: int, content: str) -> None:
        with self._lock:
            if not self._hrr_available:
                return
            rows = self._conn.execute(
                "SELECT e.name FROM entities e JOIN fact_entities fe ON fe.entity_id = e.entity_id WHERE fe.fact_id = ?",
                (fact_id,),
            ).fetchall()
            entities = [row["name"] for row in rows]
            vector = hrr.encode_fact(content, entities, self.hrr_dim)
            self._conn.execute(
                "UPDATE facts SET hrr_vector = ? WHERE fact_id = ?",
                (hrr.phases_to_bytes(vector), fact_id),
            )
            self._conn.commit()

    def _rebuild_bank(self, category: str) -> None:
        with self._lock:
            if not self._hrr_available:
                return
            bank_name = f"cat:{category}"
            rows = self._conn.execute(
                "SELECT hrr_vector FROM facts WHERE category = ? AND hrr_vector IS NOT NULL",
                (category,),
            ).fetchall()
            if not rows:
                self._conn.execute("DELETE FROM memory_banks WHERE bank_name = ?", (bank_name,))
                self._conn.commit()
                return
            vectors = [hrr.bytes_to_phases(row["hrr_vector"]) for row in rows]
            bank_vector = hrr.bundle(*vectors)
            self._conn.execute(
                "INSERT INTO memory_banks (bank_name, vector, dim, fact_count, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(bank_name) DO UPDATE SET vector = excluded.vector, dim = excluded.dim, fact_count = excluded.fact_count, updated_at = excluded.updated_at",
                (bank_name, hrr.phases_to_bytes(bank_vector), self.hrr_dim, len(vectors)),
            )
            self._conn.commit()


if __name__ == "__main__":
    # Test embedding generation
    print("Testing ZChat embedding...")
    test_text = "Tavily API key configuration for research agent"
    embedding = get_zchat_embedding(test_text)
    if embedding:
        print(f"SUCCESS: Got embedding with {len(embedding)} dimensions")
    else:
        print("FAILED: Could not get embedding")