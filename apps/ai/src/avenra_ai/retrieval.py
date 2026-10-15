"""Retrieval foundation: chunks with their source, chosen by lexical relevance (ADR-031, §51).

No embeddings or vector store: one document at a time does not need them.
"""

import re
from collections.abc import Iterable, Sequence
from dataclasses import dataclass

CHUNK_CHARS = 2_000
OVERLAP_CHARS = 200

_WORD = re.compile(r"[^\W_]{2,}", re.UNICODE)


@dataclass(frozen=True)
class Chunk:
    """A passage and where it came from: page (1-based) and character offsets in that page."""

    page: int
    start: int
    end: int
    text: str


def chunk(pages: Sequence[str], size: int = CHUNK_CHARS, overlap: int = OVERLAP_CHARS) -> list[Chunk]:
    chunks: list[Chunk] = []
    step = size - overlap
    for number, text in enumerate(pages, start=1):
        for start in range(0, max(len(text), 1), step):
            end = min(start + size, len(text))
            if text[start:end].strip():
                chunks.append(Chunk(page=number, start=start, end=end, text=text[start:end]))
            if end == len(text):
                break
    return chunks


def _words(text: str) -> set[str]:
    return {word.casefold() for word in _WORD.findall(text)}


def select(chunks: Sequence[Chunk], terms: Iterable[str], budget_chars: int) -> list[Chunk]:
    """The most relevant chunks that fit the budget, back in document order.

    The first chunk is always kept: titles and document kinds are usually stated there.
    """
    if not chunks:
        return []
    wanted = set().union(*(_words(term) for term in terms))

    def score(item: Chunk) -> int:
        return len(_words(item.text) & wanted)

    chosen = [chunks[0]]
    used = len(chunks[0].text)
    ranked = sorted(chunks[1:], key=lambda item: (-score(item), item.page, item.start))
    for item in ranked:
        if used + len(item.text) > budget_chars:
            continue
        chosen.append(item)
        used += len(item.text)
    return sorted(chosen, key=lambda item: (item.page, item.start))
