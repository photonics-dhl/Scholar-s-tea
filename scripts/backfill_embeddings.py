#!/usr/bin/env python3
"""Backfill missing embeddings for facts."""

import json
import os
import sqlite3
import time

_ZCHAT_API_KEY = os.environ.get("ZCHAT_API_KEY") or os.environ.get("OPENAI_API_KEY", "")
_ZCHAT_BASE_URL = os.environ.get("ZCHAT_BASE_URL", "https://api.zchat.tech/v1")
_EMBEDDING_MODEL = "text-embedding-3-large"


def get_zchat_embedding(text: str):
    if not _ZCHAT_API_KEY:
        print("ERROR: ZCHAT_API_KEY not set")
        return None

    try:
        import urllib.request

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


def backfill_embeddings():
    db_path = "/data/home/zju321/.hermes/memory_store.db"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # Find facts without embedding
    rows = conn.execute(
        'SELECT fact_id, content FROM facts WHERE embedding IS NULL OR embedding = ""'
    ).fetchall()

    print(f"Found {len(rows)} facts missing embeddings")

    for row in rows:
        fact_id = row["fact_id"]
        content = row["content"]
        print(f"Embedding fact_id={fact_id}: {content[:50]}...")

        embedding = get_zchat_embedding(content)
        if embedding:
            conn.execute(
                "UPDATE facts SET embedding = ? WHERE fact_id = ?",
                (json.dumps(embedding), fact_id),
            )
            conn.commit()
            print(f"  -> Success ({len(embedding)}d)")
        else:
            print(f"  -> FAILED")

        time.sleep(0.1)  # Rate limiting

    conn.close()
    print("Done!")


if __name__ == "__main__":
    backfill_embeddings()