"""Hybrid keyword/BM25 retrieval for the memory store.

Uses FHRR (Fourier Holographic Reduced Representations) for vector operations:
- FHRR binding = element-wise complex multiplication (EXACT inverse via conjugation)
- FHRR similarity = Re(mean(a * conj(b)))

Key improvement over circular-convolution HRR:
- probe(): entity-index exact filter + FHRR similarity ranking
- reason(): entity-index exact filter (AND semantics) + FHRR similarity
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .store import MemoryStore

try:
    from . import holographic as hrr
except ImportError:
    import holographic as hrr  # type: ignore[no-redef]


class FactRetriever:
    """Multi-strategy fact retrieval with trust-weighted scoring."""

    def __init__(
        self,
        store: MemoryStore,
        temporal_decay_half_life: int = 0,  # days, 0 = disabled
        fts_weight: float = 0.4,
        jaccard_weight: float = 0.3,
        hrr_weight: float = 0.3,
        hrr_dim: int = 1024,
    ):
        self.store = store
        self.half_life = temporal_decay_half_life
        self.hrr_dim = hrr_dim

        # Auto-redistribute weights if numpy unavailable
        if hrr_weight > 0 and not hrr._HAS_NUMPY:
            fts_weight = 0.6
            jaccard_weight = 0.4
            hrr_weight = 0.0

        self.fts_weight = fts_weight
        self.jaccard_weight = jaccard_weight
        self.hrr_weight = hrr_weight

    def search(
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

            # HRR similarity (FHRR operations)
            if self.hrr_weight > 0 and fact.get("hrr_vector"):
                fact_vec = hrr.bytes_to_phases(fact["hrr_vector"])
                query_vec = hrr.encode_text(query, self.hrr_dim)
                # Use FHRR similarity if available, else fallback
                if hasattr(hrr, 'similarity_fhr'):
                    hrr_sim = (hrr.similarity_fhr(query_vec, fact_vec) + 1.0) / 2.0
                else:
                    hrr_sim = (hrr.similarity(query_vec, fact_vec) + 1.0) / 2.0
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

        # Sort by score descending, return top limit
        scored.sort(key=lambda x: x["score"], reverse=True)
        results = scored[:limit]
        # Strip raw HRR bytes — callers expect JSON-serializable dicts
        for fact in results:
            fact.pop("hrr_vector", None)
        return results

    def probe(
        self,
        entity: str,
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Compositional entity query using FHRR algebra + entity index.

        Two-stage approach (overcomes bundle interference noise):
        1. Entity index: EXACT filter on fact_entities table
        2. FHRR similarity: rank by content vector similarity

        This avoids the bundle interference problem where algebraic unbind
        can't cleanly extract from a superposition of many components.

        Falls back to FTS5 search if numpy unavailable.
        """
        if not hrr._HAS_NUMPY:
            return self.search(entity, category=category, limit=limit)

        conn = self.store._conn
        entity_lower = entity.lower()

        # Stage 1: Get fact_ids that contain this entity (EXACT, no bundle noise)
        params: list = []
        where_clauses = ["LOWER(e.name) = ?"]
        params.append(entity_lower)

        if category:
            where_clauses.append("f.category = ?")
            params.append(category)

        where_clauses.append("f.hrr_vector IS NOT NULL")

        where_sql = " AND ".join(where_clauses)
        sql = f"""
            SELECT DISTINCT f.fact_id, f.content, f.category, f.tags,
                   f.trust_score, f.retrieval_count, f.helpful_count,
                   f.created_at, f.updated_at, f.hrr_vector
            FROM facts f
            JOIN fact_entities fe ON fe.fact_id = f.fact_id
            JOIN entities e ON e.entity_id = fe.entity_id
            WHERE {where_sql}
        """

        rows = conn.execute(sql, params).fetchall()

        if not rows:
            # Final fallback: keyword search
            return self.search(entity, category=category, limit=limit)

        # Stage 2: Score by direct FHRR similarity (best method per analysis)
        # Residual similarity was worse than direct - bundle noise interferes with unbind
        role_content = hrr.encode_atom("__hrr_role_content__", self.hrr_dim)

        scored = []
        for row in rows:
            fact = dict(row)
            fact_vec = hrr.bytes_to_phases(fact.pop("hrr_vector"))

            # Direct FHRR similarity: fact_vec vs content-bound probe
            # This ranks facts by how much the content matches the entity query
            content_probe = hrr.bind_fhr(
                hrr.encode_text(entity, self.hrr_dim), role_content
            )
            if hasattr(hrr, 'similarity_fhr'):
                sim = hrr.similarity_fhr(fact_vec, content_probe)
            else:
                sim = hrr.similarity(fact_vec, content_probe)

            fact["score"] = (sim + 1.0) / 2.0 * fact["trust_score"]
            scored.append(fact)

        scored.sort(key=lambda x: x["score"], reverse=True)
        results = scored[:limit]

        # Strip hrr_vector from output
        for fact in results:
            fact.pop("hrr_vector", None)
        return results

    def related(
        self,
        entity: str,
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Discover facts that share structural connections with an entity.

        Uses FHRR operations for vector similarity scoring.
        Falls back to FTS5 search if numpy unavailable.
        """
        if not hrr._HAS_NUMPY:
            return self.search(entity, category=category, limit=limit)

        conn = self.store._conn
        entity_lower = entity.lower()

        # Get all facts with vectors
        where = "WHERE hrr_vector IS NOT NULL"
        params: list = []
        if category:
            where += " AND category = ?"
            params.append(category)

        rows = conn.execute(
            f"""
            SELECT fact_id, content, category, tags, trust_score,
                   retrieval_count, helpful_count, created_at, updated_at,
                   hrr_vector
            FROM facts
            {where}
            """,
            params,
        ).fetchall()

        if not rows:
            return self.search(entity, category=category, limit=limit)

        entity_vec = hrr.encode_atom(entity_lower, self.hrr_dim)
        role_entity = hrr.encode_atom("__hrr_role_entity__", self.hrr_dim)
        role_content = hrr.encode_atom("__hrr_role_content__", self.hrr_dim)

        scored = []
        for row in rows:
            fact = dict(row)
            fact_vec = hrr.bytes_to_phases(fact.pop("hrr_vector"))

            if hasattr(hrr, 'unbind_fhr'):
                residual = hrr.unbind_fhr(fact_vec, entity_vec)
                entity_role_sim = hrr.similarity_fhr(residual, role_entity)
                content_role_sim = hrr.similarity_fhr(residual, role_content)
            else:
                residual = hrr.unbind(fact_vec, entity_vec)
                entity_role_sim = hrr.similarity(residual, role_entity)
                content_role_sim = hrr.similarity(residual, role_content)

            best_sim = max(entity_role_sim, content_role_sim)
            fact["score"] = (best_sim + 1.0) / 2.0 * fact["trust_score"]
            scored.append(fact)

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]

    def reason(
        self,
        entities: list[str],
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Multi-entity compositional query — entity index + FHRR similarity.

        Two-stage approach:
        1. Entity index: find facts containing ALL entities (AND semantics)
        2. FHRR similarity: rank by combined content similarity

        This avoids the min-similarity problem where bundle noise compounds
        across multiple entities.
        """
        if not hrr._HAS_NUMPY or not entities:
            query = " ".join(entities)
            return self.search(query, category=category, limit=limit)

        conn = self.store._conn
        entities_lower = [e.lower() for e in entities]

        # Stage 1: Find facts containing ALL entities (via entity index, exact)
        placeholders = ",".join("?" for _ in entities_lower)
        params: list = []
        where_clauses = [f"LOWER(e.name) IN ({placeholders})"]
        params.extend(entities_lower)

        if category:
            where_clauses.append("f.category = ?")
            params.append(category)

        where_clauses.append("f.hrr_vector IS NOT NULL")
        where_sql = " AND ".join(where_clauses)

        # Group by fact_id and keep only those with ALL entities
        sql = f"""
            SELECT f.fact_id, f.content, f.category, f.tags,
                   f.trust_score, f.retrieval_count, f.helpful_count,
                   f.created_at, f.updated_at, f.hrr_vector,
                   COUNT(DISTINCT e.entity_id) as entity_match_count
            FROM facts f
            JOIN fact_entities fe ON fe.fact_id = f.fact_id
            JOIN entities e ON e.entity_id = fe.entity_id
            WHERE {where_sql}
            GROUP BY f.fact_id
            HAVING entity_match_count = ?
        """
        params.append(len(entities_lower))

        rows = conn.execute(sql, params).fetchall()

        if not rows:
            query = " ".join(entities)
            return self.search(query, category=category, limit=limit)

        # Stage 2: Score by FHRR content similarity (average across entities)
        role_content = hrr.encode_atom("__hrr_role_content__", self.hrr_dim)

        scored = []
        for row in rows:
            fact = dict(row)
            fact_vec = hrr.bytes_to_phases(fact.pop("hrr_vector"))

            entity_sims = []
            for entity_lower in entities_lower:
                if hasattr(hrr, 'bind_fhr'):
                    probe_key = hrr.bind_fhr(
                        hrr.encode_atom(entity_lower, self.hrr_dim),
                        hrr.encode_atom("__hrr_role_entity__", self.hrr_dim)
                    )
                    residual = hrr.unbind_fhr(fact_vec, probe_key)
                    sim = hrr.similarity_fhr(residual, hrr.bind_fhr(
                        hrr.encode_text(fact["content"], self.hrr_dim), role_content
                    ))
                else:
                    probe_key = hrr.bind(
                        hrr.encode_atom(entity_lower, self.hrr_dim),
                        hrr.encode_atom("__hrr_role_entity__", self.hrr_dim)
                    )
                    residual = hrr.unbind(fact_vec, probe_key)
                    sim = hrr.similarity(residual, hrr.bind(
                        hrr.encode_text(fact["content"], self.hrr_dim), role_content
                    ))
                entity_sims.append(sim)

            # Use mean similarity across entities (softer than min)
            avg_sim = sum(entity_sims) / len(entity_sims)
            fact["score"] = (avg_sim + 1.0) / 2.0 * fact["trust_score"]
            scored.append(fact)

        scored.sort(key=lambda x: x["score"], reverse=True)
        results = scored[:limit]

        for fact in results:
            fact.pop("hrr_vector", None)
        return results

    def contradict(
        self,
        category: str | None = None,
        threshold: float = 0.3,
        limit: int = 10,
    ) -> list[dict]:
        """Find potentially contradictory facts via entity overlap + content divergence.

        Two facts contradict when they share entities (same subject) but have
        low content-vector similarity (different claims). Uses FHRR similarity.

        Returns pairs of facts with a contradiction score.
        Falls back to empty list if numpy unavailable.
        """
        if not hrr._HAS_NUMPY:
            return []

        conn = self.store._conn

        where = "WHERE f.hrr_vector IS NOT NULL"
        params: list = []
        if category:
            where += " AND f.category = ?"
            params.append(category)

        rows = conn.execute(
            f"""
            SELECT f.fact_id, f.content, f.category, f.tags, f.trust_score,
                   f.created_at, f.updated_at, f.hrr_vector
            FROM facts f
            {where}
            """,
            params,
        ).fetchall()

        if len(rows) < 2:
            return []

        _MAX_CONTRADICT_FACTS = 500
        if len(rows) > _MAX_CONTRADICT_FACTS:
            rows = sorted(rows, key=lambda r: r["updated_at"] or r["created_at"], reverse=True)
            rows = rows[:_MAX_CONTRADICT_FACTS]

        fact_entities: dict[int, set[str]] = {}
        for row in rows:
            fid = row["fact_id"]
            entity_rows = conn.execute(
                """
                SELECT e.name FROM entities e
                JOIN fact_entities fe ON fe.entity_id = e.entity_id
                WHERE fe.fact_id = ?
                """,
                (fid,),
            ).fetchall()
            fact_entities[fid] = {r["name"].lower() for r in entity_rows}

        facts = [dict(r) for r in rows]
        contradictions = []

        for i in range(len(facts)):
            for j in range(i + 1, len(facts)):
                f1, f2 = facts[i], facts[j]
                ents1 = fact_entities.get(f1["fact_id"], set())
                ents2 = fact_entities.get(f2["fact_id"], set())

                if not ents1 or not ents2:
                    continue

                entity_overlap = len(ents1 & ents2) / len(ents1 | ents2) if (ents1 | ents2) else 0.0

                if entity_overlap < 0.3:
                    continue

                v1 = hrr.bytes_to_phases(f1["hrr_vector"])
                v2 = hrr.bytes_to_phases(f2["hrr_vector"])

                if hasattr(hrr, 'similarity_fhr'):
                    content_sim = hrr.similarity_fhr(v1, v2)
                else:
                    content_sim = hrr.similarity(v1, v2)

                contradiction_score = entity_overlap * (1.0 - (content_sim + 1.0) / 2.0)

                if contradiction_score >= threshold:
                    f1_clean = {k: v for k, v in f1.items() if k != "hrr_vector"}
                    f2_clean = {k: v for k, v in f2.items() if k != "hrr_vector"}
                    contradictions.append({
                        "fact_a": f1_clean,
                        "fact_b": f2_clean,
                        "entity_overlap": round(entity_overlap, 3),
                        "content_similarity": round(content_sim, 3),
                        "contradiction_score": round(contradiction_score, 3),
                        "shared_entities": sorted(ents1 & ents2),
                    })

        contradictions.sort(key=lambda x: x["contradiction_score"], reverse=True)
        return contradictions[:limit]

    def _score_facts_by_vector(
        self,
        target_vec: "np.ndarray",
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Score facts by FHRR similarity to a target vector."""
        conn = self.store._conn

        where = "WHERE hrr_vector IS NOT NULL"
        params: list = []
        if category:
            where += " AND category = ?"
            params.append(category)

        rows = conn.execute(
            f"""
            SELECT fact_id, content, category, tags, trust_score,
                   retrieval_count, helpful_count, created_at, updated_at,
                   hrr_vector
            FROM facts
            {where}
            """,
            params,
        ).fetchall()

        scored = []
        for row in rows:
            fact = dict(row)
            fact_vec = hrr.bytes_to_phases(fact.pop("hrr_vector"))
            if hasattr(hrr, 'similarity_fhr'):
                sim = hrr.similarity_fhr(target_vec, fact_vec)
            else:
                sim = hrr.similarity(target_vec, fact_vec)
            fact["score"] = (sim + 1.0) / 2.0 * fact["trust_score"]
            scored.append(fact)

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]

    def _fts_candidates(
        self,
        query: str,
        category: str | None,
        min_trust: float,
        limit: int,
    ) -> list[dict]:
        """Get raw FTS5 candidates from the store."""
        conn = self.store._conn

        params: list = []
        where_clauses = ["facts_fts MATCH ?"]
        params.append(query)

        if category:
            where_clauses.append("f.category = ?")
            params.append(category)

        where_clauses.append("f.trust_score >= ?")
        params.append(min_trust)

        where_sql = " AND ".join(where_clauses)

        sql = f"""
            SELECT f.*, facts_fts.rank as fts_rank_raw
            FROM facts_fts
            JOIN facts f ON f.fact_id = facts_fts.rowid
            WHERE {where_sql}
            ORDER BY facts_fts.rank
            LIMIT ?
        """
        params.append(limit)

        try:
            rows = conn.execute(sql, params).fetchall()
        except Exception:
            return []

        if not rows:
            return []

        raw_ranks = [abs(row["fts_rank_raw"]) for row in rows]
        max_rank = max(raw_ranks) if raw_ranks else 1.0
        max_rank = max(max_rank, 1e-6)

        results = []
        for row, raw_rank in zip(rows, raw_ranks):
            fact = dict(row)
            fact.pop("fts_rank_raw", None)
            fact["fts_rank"] = raw_rank / max_rank
            results.append(fact)

        return results

    @staticmethod
    def _tokenize(text: str) -> set[str]:
        """Whitespace tokenization with CJK character-level support."""
        if not text:
            return set()
        tokens = set()
        _CJK = range(0x4E00, 0x9FFF + 1)
        _EXT_A = range(0x3400, 0x4DBF + 1)
        _EXT_B = range(0x20000, 0x2A6DF + 1)

        def _is_cjk(ch: str) -> bool:
            cp = ord(ch)
            return cp in _CJK or cp in _EXT_A or cp in _EXT_B

        def _split_word(word: str) -> list:
            result = []
            current = []
            for ch in word:
                if _is_cjk(ch):
                    if current:
                        result.append("".join(current))
                        current = []
                    result.append(ch)
                else:
                    current.append(ch)
            if current:
                result.append("".join(current))
            return result

        text_lower = text.lower()
        for word in text_lower.split():
            cleaned = word.strip(".,;:!?\"'()[]{}#@<>")
            if not cleaned:
                continue
            if any(_is_cjk(ch) for ch in cleaned):
                for ch in _split_word(cleaned):
                    if ch:
                        tokens.add(ch)
            else:
                tokens.add(cleaned)
        return tokens

    @staticmethod
    def _jaccard_similarity(set_a: set, set_b: set) -> float:
        """Jaccard similarity coefficient: |A ∩ B| / |A ∪ B|."""
        if not set_a or not set_b:
            return 0.0
        intersection = len(set_a & set_b)
        union = len(set_a | set_b)
        return intersection / union if union > 0 else 0.0

    def _temporal_decay(self, timestamp_str: str | None) -> float:
        """Exponential decay: 0.5^(age_days / half_life_days)."""
        if not self.half_life or not timestamp_str:
            return 1.0

        try:
            if isinstance(timestamp_str, str):
                ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            else:
                ts = timestamp_str

            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)

            age_days = (datetime.now(timezone.utc) - ts).total_seconds() / 86400
            if age_days < 0:
                return 1.0

            return math.pow(0.5, age_days / self.half_life)
        except (ValueError, TypeError):
            return 1.0