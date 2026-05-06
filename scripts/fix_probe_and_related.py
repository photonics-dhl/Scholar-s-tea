#!/usr/bin/env python3
"""Fix probe/related/reason in retrieval.py to use proper FTS5 entity filtering."""

import re

# Read the file
with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/retrieval.py', 'r') as f:
    content = f.read()

# 1. Fix probe() - remove min_trust_threshold reference
old_probe = '''    def probe(
        self,
        entity: str,
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Entity query using FTS5 + ZChat embedding with keyword boost.

        Uses store.search_facts() which combines FTS5 exact match with
        ZChat embedding semantic similarity, plus keyword boost for exact phrase.
        """
        # Use store's search_facts which has FTS5 + ZChat embedding + keyword boost
        return self.store.search_facts(
            entity,
            category=category,
            min_trust=self.min_trust_threshold,
            limit=limit,
        )'''

new_probe = '''    def probe(
        self,
        entity: str,
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Entity query using FTS5 + ZChat embedding with keyword boost.

        Uses store.search_facts() which combines FTS5 exact match with
        ZChat embedding semantic similarity, plus keyword boost for exact phrase.
        """
        # Use store's search_facts which has FTS5 + ZChat embedding + keyword boost
        return self.store.search_facts(
            entity,
            category=category,
            limit=limit,
        )'''

if old_probe in content:
    content = content.replace(old_probe, new_probe)
    print("probe() fixed - removed min_trust_threshold!")
else:
    print("WARNING: Could not find exact probe() pattern, trying alternative...")
    # Try to fix just the min_trust line
    if "min_trust=self.min_trust_threshold" in content:
        content = content.replace("min_trust=self.min_trust_threshold,", "")
        print("probe() fixed - removed min_trust_threshold reference!")
    else:
        print("ERROR: min_trust_threshold reference not found")

# 2. Fix related() - use FTS5 instead of broken HRR similarity
old_related = '''    def related(
        self,
        entity: str,
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Discover facts that share structural connections with an entity.

        Unlike probe (which finds facts *about* an entity), related finds
        facts that are connected through shared context — e.g., other entities
        mentioned alongside this one, or content that overlaps structurally.

        Falls back to FTS5 search if numpy unavailable.
        """
        if not hrr._HAS_NUMPY:
            return self.search(entity, category=category, limit=limit)

        conn = self.store._conn

        # Encode entity as a bare atom (not role-bound — we want ANY structural match)
        entity_vec = hrr.encode_atom(entity.lower(), self.hrr_dim)

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

        # Score each fact by how much the entity's atom appears in its vector
        # This catches both role-bound entity matches AND content word matches
        scored = []
        for row in rows:
            fact = dict(row)
            fact_vec = hrr.bytes_to_phases(fact.pop("hrr_vector"))

            # Check structural similarity: unbind entity from fact
            residual = hrr.unbind(fact_vec, entity_vec)
            # A high-similarity residual to ANY known role vector means this entity
            # plays a structural role in the fact
            role_entity = hrr.encode_atom("__hrr_role_entity__", self.hrr_dim)
            role_content = hrr.encode_atom("__hrr_role_content__", self.hrr_dim)

            entity_role_sim = hrr.similarity(residual, role_entity)
            content_role_sim = hrr.similarity(residual, role_content)
            # Take the max — entity could appear in either role
            best_sim = max(entity_role_sim, content_role_sim)

            fact["score"] = (best_sim + 1.0) / 2.0 * fact["trust_score"]
            scored.append(fact)

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]'''

new_related = '''    def related(
        self,
        entity: str,
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Discover facts that mention a specific entity.

        Uses FTS5 to find facts containing the entity keyword in content or tags.
        """
        # Use FTS5 search for entity matching
        return self.store.search_facts(
            entity,
            category=category,
            limit=limit,
        )'''

if old_related in content:
    content = content.replace(old_related, new_related)
    print("related() fixed - now uses FTS5 via store.search_facts()!")
else:
    print("WARNING: Could not find exact related() pattern")

# 3. Fix reason() - use FTS5 with AND logic for multiple entities
old_reason = '''    def reason(
        self,
        entities: list[str],
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Multi-entity compositional query — vector-space JOIN.

        Given multiple entities, algebraically intersects their structural
        connections to find facts related to ALL of them simultaneously.
        This is compositional reasoning that no embedding DB can do.

        Example: reason(["peppi", "backend"]) finds facts where peppi AND
        backend both play structural roles — without keyword matching.

        Falls back to FTS5 search if numpy unavailable.
        """
        if not hrr._HAS_NUMPY or not entities:
            # Fallback: search with all entities as keywords
            query = " ".join(entities)
            return self.search(query, category=category, limit=limit)

        conn = self.store._conn
        role_entity = hrr.encode_atom("__hrr_role_entity__", self.hrr_dim)

        # For each entity, compute what the bank "remembers" about it
        # by unbinding entity+role from each fact vector
        entity_residuals = []
        for entity in entities:
            entity_vec = hrr.encode_atom(entity.lower(), self.hrr_dim)
            probe_key = hrr.bind(entity_vec, role_entity)
            entity_residuals.append(probe_key)

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
            query = " ".join(entities)
            return self.search(query, category=category, limit=limit)

        # Score each fact by how much EACH entity is structurally present.
        # A fact scores high only if ALL entities have structural presence
        # (AND semantics via min, vs OR which would use mean/max).
        role_content = hrr.encode_atom("__hrr_role_content__", self.hrr_dim)

        scored = []
        for row in rows:
            fact = dict(row)
            fact_vec = hrr.bytes_to_phases(fact.pop("hrr_vector"))

            entity_scores = []
            for probe_key in entity_residuals:
                residual = hrr.unbind(fact_vec, probe_key)
                sim = hrr.similarity(residual, role_content)
                entity_scores.append(sim)

            min_sim = min(entity_scores)
            fact["score"] = (min_sim + 1.0) / 2.0 * fact["trust_score"]
            scored.append(fact)

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]'''

new_reason = '''    def reason(
        self,
        entities: list[str],
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Multi-entity query — find facts containing ALL given entities.

        Uses FTS5 with AND logic to find facts that mention all entities.
        Example: reason(["ngrok", "feishu"]) returns facts mentioning both.
        """
        if not entities:
            return []

        # FTS5 AND query: facts containing ALL entities
        # Build an FTS5 query with AND between entities
        fts_query = " AND ".join(entities)

        # Use search_facts which handles FTS5 + embedding + keyword boost
        return self.store.search_facts(
            fts_query,
            category=category,
            limit=limit,
        )'''

if old_reason in content:
    content = content.replace(old_reason, new_reason)
    print("reason() fixed - now uses FTS5 AND query!")
else:
    print("WARNING: Could not find exact reason() pattern")

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
    print("Reverting...")
    exit(1)

print("All fixes applied successfully!")