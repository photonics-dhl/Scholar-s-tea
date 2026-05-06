#!/usr/bin/env python3
filepath = "/data/home/zju321/.hermes/hermes-agent/plugins/memory/holographic/retrieval.py"
with open(filepath) as f:
    content = f.read()

old = """        # Stage 2: Score by direct FHRR similarity (best method per analysis)
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
        return results"""

new = """        # Stage 2: FTS5 + Jaccard re-ranking (replaces flawed FHRR similarity)
        # Old approach: content_probe = bind(encode_text(entity), role_content)
        # Problem: encode_fact uses CONTENT text, not entity text - mismatch!
        fact_ids = [row["fact_id"] for row in rows]
        placeholders = ",".join("?" for _ in fact_ids)
        full_sql = """
            SELECT f.fact_id, f.content, f.category, f.tags,
                   f.trust_score, f.retrieval_count, f.helpful_count,
                   f.created_at, f.updated_at, f.hrr_vector
            FROM facts f
            WHERE f.fact_id IN (%s)
        """ % placeholders
        full_rows = conn.execute(full_sql, fact_ids).fetchall()

        query_tokens = self._tokenize(entity)
        scored = []
        for row in full_rows:
            fact = dict(row)
            content_tokens = self._tokenize(fact["content"])
            tag_tokens = self._tokenize(fact.get("tags", ""))
            all_tokens = content_tokens | tag_tokens
            jaccard = self._jaccard_similarity(query_tokens, all_tokens)
            fts_score = 0.8 if query_tokens & all_tokens else 0.2
            relevance = 0.5 * fts_score + 0.5 * jaccard
            fact["score"] = relevance * fact["trust_score"]
            scored.append(fact)

        scored.sort(key=lambda x: x["score"], reverse=True)
        results = scored[:limit]

        for fact in results:
            fact.pop("hrr_vector", None)
        return results"""

if old in content:
    content = content.replace(old, new)
    with open(filepath, "w") as f:
        f.write(content)
    print("SUCCESS: probe() fixed")
else:
    print("ERROR: old pattern not found")
    # Debug: print first 500 chars of what we were looking for
    idx = content.find("Stage 2: Score by direct FHRR")
    if idx != -1:
        print("Found at index", idx)
        print(content[idx:idx+500])