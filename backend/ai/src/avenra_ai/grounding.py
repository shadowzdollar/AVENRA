"""Locating what the model quoted in the document's own text (§50 source grounding)."""

import re
import unicodedata

_SPACE = re.compile(r"\s+")


def normalize(text: str) -> str:
    """Compatibility-normalized, case-folded, with runs of whitespace as one space."""
    return _SPACE.sub(" ", unicodedata.normalize("NFKC", text)).strip().casefold()


def located(quote: str, text: str) -> bool:
    """Whether the quote appears in the text, ignoring case and whitespace differences."""
    needle = normalize(quote)
    return bool(needle) and needle in normalize(text)


def value_in_quote(value: str, quote: str) -> bool:
    """Whether a text value is literally part of its quote."""
    return normalize(value) in normalize(quote)
