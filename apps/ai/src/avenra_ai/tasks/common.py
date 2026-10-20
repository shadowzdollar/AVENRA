"""What every task returns besides its result: the invocation record and its failure type."""

from dataclasses import dataclass

from pydantic import BaseModel, ConfigDict, ValidationError
from pydantic.alias_generators import to_camel

from avenra_ai.pricing import estimate_micros
from avenra_ai.prompts import Prompt
from avenra_ai.providers.base import ErrorCode, Provider, Usage


class Camel(BaseModel):
    """Wire models: camelCase on the wire, unknown properties refused."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid", frozen=True)


class PromptInfo(Camel):
    name: str
    version: int
    sha256: str


class UsageInfo(Camel):
    input_tokens: int
    output_tokens: int
    cache_read_tokens: int
    cache_write_tokens: int


class Invocation(Camel):
    """What one call cost and who answered; the API records it (ADR-030)."""

    provider: str
    model_requested: str
    model: str | None
    prompt: PromptInfo
    usage: UsageInfo
    latency_ms: int
    estimated_cost_micros: int | None
    fallback_used: bool


@dataclass
class TaskFailedError(Exception):
    """A task that produced nothing usable, with the invocation that is recorded anyway."""

    code: ErrorCode
    detail: str
    invocation: Invocation | None

    def __str__(self) -> str:
        return f"{self.code}: {self.detail}"


def invocation(
    provider: Provider,
    prompt: Prompt,
    model: str | None,
    usage: Usage,
    latency_ms: int,
    *,
    fallback: bool,
) -> Invocation:
    return Invocation(
        provider=provider.name,
        model_requested=provider.model,
        model=model,
        prompt=PromptInfo(name=prompt.name, version=prompt.version, sha256=prompt.sha256),
        usage=UsageInfo(
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            cache_read_tokens=usage.cache_read_tokens,
            cache_write_tokens=usage.cache_write_tokens,
        ),
        latency_ms=latency_ms,
        estimated_cost_micros=estimate_micros(model, usage),
        fallback_used=fallback,
    )


def reason(error: Exception) -> str:
    """A failure's reason without quoting the model's output."""
    if isinstance(error, ValidationError):
        return "the answer does not match the output model"
    return str(error)[:200]
