#!/usr/bin/env python3
"""
Local BGE-M3 Embedding Server for Scholar's Tea
Runs as a FastAPI service, model stays resident in memory.
"""

import os
import sys
import time
import json
from pathlib import Path
from typing import List, Optional, Union

# Ensure conda env packages take precedence over ~/.local
conda_site = "/data/home/zju321/miniconda3/envs/ai_agent/lib/python3.9/site-packages"
local_site = "/data/home/zju321/.local/lib/python3.9/site-packages"
if conda_site not in sys.path:
    sys.path.insert(0, conda_site)
# Reorder: conda first, then local (so conda packages override local)
if local_site in sys.path:
    sys.path.remove(local_site)
    sys.path.append(local_site)

from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

# Model path (local HuggingFace cache)
MODEL_PATH = "/data/home/zju321/321/DHL/Self_Learning/academic_rag/models/models--BAAI--bge-m3/snapshots/5617a9f61b028005a4858fdac845db406aefb181"
HOST = os.environ.get("EMBEDDING_HOST", "127.0.0.1")
PORT = int(os.environ.get("EMBEDDING_PORT", "9997"))

app = FastAPI(title="BGE-M3 Embedding Server", version="1.0.0")

# Lazy-load model on first request (faster startup)
_model = None
_model_load_time: Optional[float] = None


def get_model():
    global _model, _model_load_time
    if _model is None:
        from sentence_transformers import SentenceTransformer
        print(f"[EmbeddingServer] Loading BGE-M3 from {MODEL_PATH}", flush=True)
        t0 = time.time()
        _model = SentenceTransformer(MODEL_PATH, device="cpu")
        _model_load_time = time.time() - t0
        print(f"[EmbeddingServer] Model loaded in {_model_load_time:.2f}s, dim={_model.get_sentence_embedding_dimension()}", flush=True)
    return _model


class EmbeddingRequest(BaseModel):
    input: Union[str, List[str]]
    model: str = "BAAI/bge-m3"
    normalize_embeddings: bool = True


class EmbeddingResponse(BaseModel):
    object: str = "list"
    data: List[dict]
    model: str
    usage: dict


@app.on_event("startup")
async def startup_event():
    # Pre-load model on startup to avoid first-request latency
    get_model()


@app.get("/health")
async def health():
    model = get_model()
    return {
        "status": "ok",
        "model": "BAAI/bge-m3",
        "dim": model.get_sentence_embedding_dimension(),
        "load_time_ms": round((_model_load_time or 0) * 1000, 1),
    }


@app.post("/v1/embeddings", response_model=EmbeddingResponse)
async def create_embeddings(req: EmbeddingRequest):
    model = get_model()
    raw_texts = req.input if isinstance(req.input, list) else [req.input]
    # Filter out None and non-string inputs to prevent tokenizer TypeError
    # Also strip and filter out empty strings after stripping
    texts = []
    for t in raw_texts:
        if isinstance(t, str):
            cleaned = t.strip()
            if cleaned:
                # Remove null bytes and other control chars that break tokenizer
                cleaned = cleaned.replace('\x00', '').replace('\x01', '').replace('\x02', '')
                texts.append(cleaned)
        elif t is not None:
            # Convert non-string non-None to string as fallback
            try:
                s = str(t).strip()
                if s:
                    texts.append(s)
            except Exception:
                pass

    if not texts:
        return EmbeddingResponse(
            data=[],
            model="BAAI/bge-m3",
            usage={"prompt_tokens": 0, "total_tokens": 0, "elapsed_ms": 0},
        )

    try:
        t0 = time.time()
        embeddings = model.encode(
            texts,
            normalize_embeddings=req.normalize_embeddings,
            show_progress_bar=False,
        )
        elapsed = time.time() - t0
    except Exception as e:
        print(f"[EmbeddingServer] encode error: {type(e).__name__}: {e}", flush=True)
        print(f"[EmbeddingServer] texts count={len(texts)}, first_text_len={len(texts[0]) if texts else 0}", flush=True)
        # Fallback: encode one by one to isolate problematic input
        embeddings = []
        for t in texts:
            try:
                emb = model.encode([t], normalize_embeddings=req.normalize_embeddings, show_progress_bar=False)
                embeddings.append(emb[0])
            except Exception as e2:
                print(f"[EmbeddingServer] Single encode failed for text (len={len(t)}): {type(e2).__name__}: {e2}", flush=True)
                # Return zero vector as fallback
                dim = model.get_sentence_embedding_dimension()
                embeddings.append([0.0] * dim)

    data = []
    for i, emb in enumerate(embeddings):
        data.append({
            "object": "embedding",
            "index": i,
            "embedding": emb.tolist() if hasattr(emb, 'tolist') else list(emb),
        })

    return EmbeddingResponse(
        data=data,
        model="BAAI/bge-m3",
        usage={
            "prompt_tokens": sum(len(t) for t in texts),
            "total_tokens": sum(len(t) for t in texts),
            "elapsed_ms": round((time.time() - t0) * 1000, 1) if 't0' in locals() else 0,
        },
    )


@app.post("/embeddings", response_model=EmbeddingResponse)
async def create_embeddings_compat(req: EmbeddingRequest):
    """Compatibility endpoint (same as /v1/embeddings)."""
    return await create_embeddings(req)


if __name__ == "__main__":
    print(f"[EmbeddingServer] Starting on {HOST}:{PORT}", flush=True)
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
