"""Claude adapter: the only module that imports the Anthropic SDK (ADR-029)."""

import base64
import json
import time
from typing import Literal

import anthropic
from anthropic.types.beta import BetaContentBlockParam, BetaMessage

from avenra_ai.providers.base import (
    Content,
    ErrorCode,
    FileContent,
    ProviderError,
    StructuredRequest,
    StructuredResult,
    TextContent,
    Usage,
)

# Server-side refusal fallback; "default" routes by refusal category (Claude API only).
_FALLBACK_BETA = "server-side-fallback-2026-07-01"


class ClaudeProvider:
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        effort: Literal["low", "medium", "high"],
        timeout_seconds: float,
        client: anthropic.AsyncAnthropic | None = None,
    ) -> None:
        # The SDK retries connection errors, 408, 409, 429 and 5xx; the API's job engine retries
        # what is still failing after that, so the SDK's own retries stay small.
        self._client = client or anthropic.AsyncAnthropic(api_key=api_key, timeout=timeout_seconds, max_retries=2)
        self._model = model
        self._effort: Literal["low", "medium", "high"] = effort

    @property
    def name(self) -> str:
        return "claude"

    @property
    def model(self) -> str:
        return self._model

    async def structured(self, request: StructuredRequest) -> StructuredResult:
        started = time.perf_counter()
        try:
            response = await self._client.beta.messages.create(
                model=self._model,
                max_tokens=request.max_output_tokens,
                system=request.system,
                messages=[{"role": "user", "content": [_block(item) for item in request.content]}],
                output_config={
                    "effort": self._effort,
                    "format": {"type": "json_schema", "schema": dict(request.schema)},
                },
                betas=[_FALLBACK_BETA],
                fallbacks="default",
            )
        except anthropic.RateLimitError as error:
            raise _failure(ErrorCode.RATE_LIMITED, error, started) from error
        except anthropic.APITimeoutError as error:
            raise _failure(ErrorCode.TIMEOUT, error, started) from error
        except anthropic.APIConnectionError as error:
            raise _failure(ErrorCode.PROVIDER_UNAVAILABLE, error, started) from error
        except (anthropic.AuthenticationError, anthropic.PermissionDeniedError, anthropic.NotFoundError) as error:
            # Configuration problems: retrying the same request cannot help.
            raise _failure(ErrorCode.PROVIDER_REJECTED, error, started) from error
        except anthropic.BadRequestError as error:
            raise _failure(ErrorCode.BAD_REQUEST, error, started) from error
        except anthropic.APIStatusError as error:
            code = ErrorCode.PROVIDER_UNAVAILABLE if error.status_code >= 500 else ErrorCode.BAD_REQUEST
            raise _failure(code, error, started) from error
        return _result(response, started)


def _block(item: Content) -> BetaContentBlockParam:
    match item:
        case TextContent(text=text):
            return {"type": "text", "text": text}
        case FileContent(media_type="application/pdf", data=data):
            return {
                "type": "document",
                "source": {"type": "base64", "media_type": "application/pdf", "data": _b64(data)},
            }
        case FileContent(media_type="image/png" | "image/jpeg" as media_type, data=data):
            return {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": _b64(data)}}
        case FileContent(media_type=other):
            raise ProviderError(ErrorCode.UNREADABLE_DOCUMENT, f"unsupported file type {other}")


def _b64(data: bytes) -> str:
    return base64.standard_b64encode(data).decode("ascii")


def _elapsed(started: float) -> int:
    return round((time.perf_counter() - started) * 1000)


def _failure(code: ErrorCode, error: anthropic.APIError, started: float) -> ProviderError:
    # The SDK's message can quote the request; only the class and status are kept.
    status = getattr(error, "status_code", None)
    detail = type(error).__name__ + (f" ({status})" if status is not None else "")
    return ProviderError(code, detail, latency_ms=_elapsed(started))


def _usage(response: BetaMessage) -> Usage:
    usage = response.usage
    return Usage(
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
        cache_read_tokens=usage.cache_read_input_tokens or 0,
        cache_write_tokens=usage.cache_creation_input_tokens or 0,
    )


def _result(response: BetaMessage, started: float) -> StructuredResult:
    latency = _elapsed(started)
    usage = _usage(response)

    def fail(code: ErrorCode, detail: str) -> ProviderError:
        return ProviderError(code, detail, model=response.model, usage=usage, latency_ms=latency)

    # The stop reason decides whether the content means anything at all.
    if response.stop_reason == "refusal":
        category = response.stop_details.category if response.stop_details is not None else None
        raise fail(ErrorCode.REFUSED, f"declined ({category})")
    if response.stop_reason == "max_tokens":
        raise fail(ErrorCode.TRUNCATED, "the answer reached the output limit")
    text = "".join(block.text for block in response.content if block.type == "text")
    try:
        data: object = json.loads(text)
    except json.JSONDecodeError as error:
        raise fail(ErrorCode.INVALID_OUTPUT, "the answer is not JSON") from error
    fallback_used = any(entry.type == "fallback_message" for entry in (response.usage.iterations or []))
    return StructuredResult(
        data=data, model=response.model, usage=usage, latency_ms=latency, fallback_used=fallback_used
    )
