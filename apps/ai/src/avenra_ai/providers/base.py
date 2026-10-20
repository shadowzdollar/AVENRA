"""The internal provider interface (ADR-003, ADR-029).

Tasks depend on this module only; adapters translate it to one provider's API.
"""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Protocol


@dataclass(frozen=True)
class TextContent:
    """Text to read. Untrusted when it comes from a document."""

    text: str


@dataclass(frozen=True)
class FileContent:
    """A file the model reads itself: a PDF without a text layer, or an image."""

    media_type: str
    data: bytes


type Content = TextContent | FileContent


@dataclass(frozen=True)
class StructuredRequest:
    """One structured-output call.

    `system` holds the trusted instructions; `content` holds the material to work on, which the
    provider passes as data after them.
    """

    task: str
    system: str
    content: Sequence[Content]
    schema: Mapping[str, object]
    max_output_tokens: int = 8_000


@dataclass(frozen=True)
class Usage:
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0


@dataclass(frozen=True)
class StructuredResult:
    """The parsed JSON of an answer and what it cost. The JSON is not validated yet."""

    data: object
    model: str
    usage: Usage
    latency_ms: int
    fallback_used: bool = False


class ErrorCode(StrEnum):
    RATE_LIMITED = "RATE_LIMITED"
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE"
    TIMEOUT = "TIMEOUT"
    PROVIDER_REJECTED = "PROVIDER_REJECTED"
    BAD_REQUEST = "BAD_REQUEST"
    REFUSED = "REFUSED"
    TRUNCATED = "TRUNCATED"
    INVALID_OUTPUT = "INVALID_OUTPUT"
    UNREADABLE_DOCUMENT = "UNREADABLE_DOCUMENT"

    @property
    def retryable(self) -> bool:
        """Whether trying the same request later can succeed (Guidelines §103)."""
        return self in _RETRYABLE


_RETRYABLE = frozenset({ErrorCode.RATE_LIMITED, ErrorCode.PROVIDER_UNAVAILABLE, ErrorCode.TIMEOUT})


@dataclass
class ProviderError(Exception):
    """A call that produced no usable answer. Carries what it cost, which is recorded anyway."""

    code: ErrorCode
    detail: str
    model: str | None = None
    usage: Usage = field(default_factory=Usage)
    latency_ms: int = 0

    def __str__(self) -> str:
        return f"{self.code}: {self.detail}"


class Provider(Protocol):
    @property
    def name(self) -> str: ...

    @property
    def model(self) -> str: ...

    async def structured(self, request: StructuredRequest) -> StructuredResult: ...
