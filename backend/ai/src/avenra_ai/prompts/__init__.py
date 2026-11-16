"""Versioned prompts (ADR-029).

A prompt is a file `<name>/v<version>.md` in this package. Its SHA-256 is returned with every
answer, so a recorded invocation names the exact text that produced it.
"""

import hashlib
from dataclasses import dataclass
from functools import cache
from importlib import resources


@dataclass(frozen=True)
class Prompt:
    name: str
    version: int
    text: str

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.text.encode("utf-8")).hexdigest()


@cache
def load(name: str, version: int) -> Prompt:
    """The prompt's text; a missing prompt is a programming error and fails loudly."""
    if not name.replace("_", "").isalnum() or version < 1:
        raise ValueError(f"invalid prompt reference {name} v{version}")
    text = resources.files(__package__).joinpath(name, f"v{version}.md").read_text(encoding="utf-8")
    return Prompt(name=name, version=version, text=text)
