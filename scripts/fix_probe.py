#!/usr/bin/env python3
"""Fix probe/related/reason to use store.search_facts() with ZChat embedding."""

with open('/data/home/zju321/.hermes/hermes-home-rsync/hermes-agent/plugins/memory/holographic/retrieval.py', 'r') as f:
    content = f.read()

# Replace the probe method to use store.search_facts() instead of HRR
old_probe = '''    def probe(
        self,
        entity: str,
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Compositional entity query using HRR algebra.

        Unbinds entity from memory bank to extract associated content.
        This is NOT keyword search — it uses algebraic structure to find facts
        where the entity plays a structural role.

        Falls back to FTS5 search if numpy unavailable.
        """
        if not hrr._HAS_NUMPY:
            # Fallback to keyword search on entity name
            return self.search(entity, category=category, limit=limit)

        conn = self.store._conn

        # Encode entity as role-bound vector
        role_entity = hrr.encode_atom("__hrr_role_entity__", self.hrr_dim)
        entity_vec = hrr.encode_atom(entity.lower(), self.hrr_dim)
        probe_key = hrr.bind(entity_vec, role_entity)

        # Try category-specific bank first, then all facts
        if category:
            bank_name = f"cat:{category}"
            bank_row = conn.execute(
                "SELECT vector FROM memory_banks WHERE bank_name = ?",
                (bank_name,),
            ).fetchone()
            if bank_row:
                bank_vec = hrr.bytes_to_phases(bank_row["vector"])
                extracted = hrr.unbind(bank_vec, probe_key)
                # Use extracted signal to score individual facts
                return self._score_facts_by_vector(
                    extracted, category=category, limit=limit
                )

        # Score against individual fact vectors directly
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
            # Final fallback: keyword search
            return self.search(entity, category=category, limit=limit)

        scored = []
        for row in rows:
            fact = dict(row)
            fact_vec = hrr.bytes_to_phases(fact.pop("hrr_vector"))
            # Unbind probe key from fact to see if entity is structurally present
            residual = hrr.unbind(fact_vec, probe_key)
            # Compare residual against content signal
            role_content = hrr.encode_atom("__hrr_role_content__", self.hrr_dim)
            content_vec = hrr.bind(hrr.encode_text(fact["content"], self.hrr_dim), role_content)
            sim = hrr.similarity(residual, content_vec)
            fact["score"] = (sim + 1.0) / 2.0 * fact["trust_score"]
            scored.append(fact)

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]'''

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
            min_trust=self.min_trust_threshold,
            limit=limit,
        )'''

if old_probe in content:
    content = content.replace(old_probe, new_probe)
    print("probe() fixed to use store.search_facts()!")
else:
    print("ERROR: Could not find probe() method to replace")
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