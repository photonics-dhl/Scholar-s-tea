"""FHRR (Fourier Holographic Reduced Representations) operations.

FHRR uses complex unit-modulus vectors where:
- Binding = element-wise complex multiplication (exact inverse via conjugation)
- Unbinding = element-wise complex conjugate multiplication
- Similarity = Re(mean(a * conj(b)))

Key advantage over circular-convolution HRR:
- FHRR binding has EXACT algebraic inverse: unbind(bind(a,b), a) = b (element-wise)
- Similarity preservation: sim(a,b) ≈ sim(bind(a,c), bind(b,c))

Reference: Gayler (2004), Yeung et al. (2024) - Generalized HRR
"""

import hashlib
import logging
import math
import struct

try:
    import numpy as np
    _HAS_NUMPY = True
except ImportError:
    _HAS_NUMPY = False

logger = logging.getLogger(__name__)

_TWO_PI = 2.0 * math.pi


def _require_numpy():
    if not _HAS_NUMPY:
        raise RuntimeError("numpy is required for holographic operations")


def encode_atom(word: str, dim: int = 1024) -> "np.ndarray":
    """Deterministic phase vector via SHA-256 counter blocks.

    Uses hashlib (not numpy RNG) for cross-platform reproducibility.

    Algorithm:
    - Generate enough SHA-256 blocks by hashing f"{word}:{i}" for i=0,1,2,...
    - Concatenate digests, interpret as uint16 values via struct.unpack
    - Scale to [0, 2π): phases = values * (2π / 65536)
    - Truncate to dim elements
    - Returns np.float64 array of shape (dim,)
    """
    _require_numpy()

    values_per_block = 16
    blocks_needed = math.ceil(dim / values_per_block)

    uint16_values: list[int] = []
    for i in range(blocks_needed):
        digest = hashlib.sha256(f"{word}:{i}".encode()).digest()
        uint16_values.extend(struct.unpack("<16H", digest))

    phases = np.array(uint16_values[:dim], dtype=np.float64) * (_TWO_PI / 65536.0)
    return phases


# =============================================================================
# FHRR Operations (complex-number based)
# =============================================================================

def _to_complex(phases: "np.ndarray") -> "np.ndarray":
    """Convert phase angles to complex unit vectors: e^(i*phase)."""
    return np.exp(1j * phases)


def _from_complex(z: "np.ndarray") -> "np.ndarray":
    """Convert complex unit vectors back to phase angles: angle(z) mod 2π."""
    return np.angle(z) % _TWO_PI


def bind_fhr(a: "np.ndarray", b: "np.ndarray") -> "np.ndarray":
    """FHRR binding = element-wise complex multiplication.

    bind_fhr(a, b) = e^(i*a) * e^(i*b) = e^(i*(a+b)) = phase_addition
    Exact inverse: unbind_fhr(bind_fhr(a, b), a) = b (element-wise)
    """
    _require_numpy()
    za = _to_complex(a)
    zb = _to_complex(b)
    return _from_complex(za * zb)


def unbind_fhr(memory: "np.ndarray", key: "np.ndarray") -> "np.ndarray":
    """FHRR unbinding = element-wise complex conjugate multiplication.

    unbind_fhr(memory, key) = memory * conj(key)
    This is the EXACT inverse of bind_fhr: unbind_fhr(bind_fhr(a, b), a) = b
    """
    _require_numpy()
    zmem = _to_complex(memory)
    zkey = _to_complex(key)
    return _from_complex(zmem * np.conj(zkey))


def bundle_fhr(*vectors: "np.ndarray") -> "np.ndarray":
    """FHRR bundling = circular mean of complex exponentials (same as HRR bundle).

    Bundling merges multiple vectors into one similar to each input.
    Result is the phase of the mean complex vector.
    """
    _require_numpy()
    complex_sum = np.sum([np.exp(1j * v) for v in vectors], axis=0)
    return np.angle(complex_sum) % _TWO_PI


def similarity_fhr(a: "np.ndarray", b: "np.ndarray") -> float:
    """FHRR similarity = real part of mean complex product.

    Equivalent to HRR similarity: mean(cos(a - b))
    But computed via complex arithmetic for consistency with FHRR operations.
    """
    _require_numpy()
    za = _to_complex(a)
    zb = _to_complex(b)
    return float(np.mean(np.real(za * np.conj(zb))))


# =============================================================================
# Legacy HRR Operations (circular convolution)
# =============================================================================

def bind(a: "np.ndarray", b: "np.ndarray") -> "np.ndarray":
    """Circular convolution = element-wise phase addition.

    Binding associates two concepts into a single composite vector.
    The result is dissimilar to both inputs (quasi-orthogonal).
    """
    _require_numpy()
    return (a + b) % _TWO_PI


def unbind(memory: "np.ndarray", key: "np.ndarray") -> "np.ndarray":
    """Circular correlation = element-wise phase subtraction.

    Unbinding retrieves the value associated with a key from a memory vector.
    unbind(bind(a, b), a) ≈ b  (up to superposition noise)
    """
    _require_numpy()
    return (memory - key) % _TWO_PI


def bundle(*vectors: "np.ndarray") -> "np.ndarray":
    """Superposition via circular mean of complex exponentials.

    Bundling merges multiple vectors into one that is similar to each input.
    The result can hold O(sqrt(dim)) items before similarity degrades.
    """
    _require_numpy()
    complex_sum = np.sum([np.exp(1j * v) for v in vectors], axis=0)
    return np.angle(complex_sum) % _TWO_PI


def similarity(a: "np.ndarray", b: "np.ndarray") -> float:
    """Phase cosine similarity. Range [-1, 1].

    Returns 1.0 for identical vectors, near 0.0 for random (unrelated) vectors,
    and -1.0 for perfectly anti-correlated vectors.
    """
    _require_numpy()
    return float(np.mean(np.cos(a - b)))


def encode_text(text: str, dim: int = 1024) -> "np.ndarray":
    """Bag-of-words: bundle of atom vectors for each token.

    Tokenizes by lowercasing, splitting on whitespace, and stripping
    leading/trailing punctuation from each token.

    Returns bundle of all token atom vectors.
    If text is empty or produces no tokens, returns encode_atom("__hrr_empty__", dim).
    """
    _require_numpy()

    tokens = [
        token.strip(".,!?;:\"'()[]{}")
        for token in text.lower().split()
    ]
    tokens = [t for t in tokens if t]

    if not tokens:
        return encode_atom("__hrr_empty__", dim)

    atom_vectors = [encode_atom(token, dim) for token in tokens]
    return bundle(*atom_vectors)


def encode_fact(content: str, entities: list[str], dim: int = 1024) -> "np.ndarray":
    """Structured encoding using FHRR binding: content + entities all bundled.

    Role vectors are reserved atoms: "__hrr_role_content__", "__hrr_role_entity__"

    Components (FHRR):
    1. bind_fhr(encode_text(content, dim), role_content)
    2. For each entity: bind_fhr(encode_atom(entity.lower(), dim), role_entity)
    3. bundle_fhr all components together

    FHRR binding advantages:
    - Exact inverse: unbind_fhr works element-wise, no FFT approximation
    - Similarity preserved: sim(a,b) ≈ sim(bind_fhr(a,c), bind_fhr(b,c))
    """
    _require_numpy()

    role_content = encode_atom("__hrr_role_content__", dim)
    role_entity = encode_atom("__hrr_role_entity__", dim)

    components: list[np.ndarray] = [
        bind_fhr(encode_text(content, dim), role_content)
    ]

    for entity in entities:
        components.append(bind_fhr(encode_atom(entity.lower(), dim), role_entity))

    return bundle_fhr(*components)


def encode_fact_hrr(content: str, entities: list[str], dim: int = 1024) -> "np.ndarray":
    """Legacy HRR encode_fact (circular convolution binding)."""
    _require_numpy()

    role_content = encode_atom("__hrr_role_content__", dim)
    role_entity = encode_atom("__hrr_role_entity__", dim)

    components: list[np.ndarray] = [
        bind(encode_text(content, dim), role_content)
    ]

    for entity in entities:
        components.append(bind(encode_atom(entity.lower(), dim), role_entity))

    return bundle(*components)


def phases_to_bytes(phases: "np.ndarray") -> bytes:
    """Serialize phase vector to bytes. float64 tobytes — 8 KB at dim=1024."""
    _require_numpy()
    return phases.tobytes()


def bytes_to_phases(data: bytes) -> "np.ndarray":
    """Deserialize bytes back to phase vector. Inverse of phases_to_bytes.

    The .copy() call is required because frombuffer returns a read-only view
    backed by the bytes object; callers expect a mutable array.
    """
    _require_numpy()
    return np.frombuffer(data, dtype=np.float64).copy()


def snr_estimate(dim: int, n_items: int) -> float:
    """Signal-to-noise ratio estimate for holographic storage.

    SNR = sqrt(dim / n_items) when n_items > 0, else inf.

    The SNR falls below 2.0 when n_items > dim / 4, meaning retrieval
    errors become likely. Logs a warning when this threshold is crossed.
    """
    _require_numpy()

    if n_items <= 0:
        return float("inf")

    snr = math.sqrt(dim / n_items)

    if snr < 2.0:
        logger.warning(
            "HRR storage near capacity: SNR=%.2f (dim=%d, n_items=%d). "
            "Retrieval accuracy may degrade. Consider increasing dim or reducing stored items.",
            snr,
            dim,
            n_items,
        )

    return snr