"""The Claude adapter against a recorded-shape HTTP exchange; no network, no key."""

import json
from collections.abc import Callable

import anthropic
import httpx2
import pytest

from avenra_ai.providers import ErrorCode, FileContent, ProviderError, StructuredRequest, TextContent
from avenra_ai.providers.claude import ClaudeProvider

pytestmark = pytest.mark.anyio

SCHEMA = {
    "type": "object",
    "properties": {"ok": {"type": "boolean"}},
    "required": ["ok"],
    "additionalProperties": False,
}
REQUEST = StructuredRequest(
    task="test",
    system="trusted instructions",
    content=[TextContent("<document>hello</document>"), FileContent("image/png", b"\x89PNG")],
    schema=SCHEMA,
)


def message(text: str, *, stop_reason: str = "end_turn", **extra: object) -> dict[str, object]:
    return {
        "id": "msg_test",
        "type": "message",
        "role": "assistant",
        "model": "claude-sonnet-5-5",
        "content": [{"type": "text", "text": text}],
        "stop_reason": stop_reason,
        "stop_sequence": None,
        "usage": {
            "input_tokens": 1200,
            "output_tokens": 30,
            "cache_read_input_tokens": 0,
            "cache_creation_input_tokens": 0,
        },
        **extra,
    }


def provider(handler: Callable[[httpx2.Request], httpx2.Response]) -> ClaudeProvider:
    client = anthropic.AsyncAnthropic(
        api_key="sk-ant-test",
        max_retries=0,
        http_client=anthropic.DefaultAsyncHttpxClient(transport=httpx2.MockTransport(handler)),
    )
    return ClaudeProvider(
        api_key="unused", model="claude-sonnet-5-5", effort="medium", timeout_seconds=5, client=client
    )


async def test_sends_a_schema_constrained_request_without_tools() -> None:
    sent: list[httpx2.Request] = []

    def handler(request: httpx2.Request) -> httpx2.Response:
        sent.append(request)
        return httpx2.Response(200, json=message('{"ok": true}'))

    result = await provider(handler).structured(REQUEST)
    assert result.data == {"ok": True}
    assert (result.model, result.usage.input_tokens, result.usage.output_tokens) == ("claude-sonnet-5-5", 1200, 30)

    (request,) = sent
    body = json.loads(request.content)
    assert body["model"] == "claude-sonnet-5-5"
    assert body["system"] == "trusted instructions"
    assert body["output_config"] == {"effort": "medium", "format": {"type": "json_schema", "schema": SCHEMA}}
    assert body["fallbacks"] == "default"
    assert "server-side-fallback-2026-07-01" in request.headers["anthropic-beta"]
    assert "tools" not in body
    assert "tool_choice" not in body
    (turn,) = body["messages"]
    assert turn["role"] == "user"
    assert [block["type"] for block in turn["content"]] == ["text", "image"]


@pytest.mark.parametrize(
    ("response", "code"),
    [
        (httpx2.Response(200, json=message("", stop_reason="refusal", stop_details=None)), ErrorCode.REFUSED),
        (httpx2.Response(200, json=message('{"ok": tr', stop_reason="max_tokens")), ErrorCode.TRUNCATED),
        (httpx2.Response(200, json=message("not json")), ErrorCode.INVALID_OUTPUT),
        (
            httpx2.Response(429, json={"type": "error", "error": {"type": "rate_limit_error", "message": "x"}}),
            ErrorCode.RATE_LIMITED,
        ),
        (
            httpx2.Response(529, json={"type": "error", "error": {"type": "overloaded_error", "message": "x"}}),
            ErrorCode.PROVIDER_UNAVAILABLE,
        ),
        (
            httpx2.Response(401, json={"type": "error", "error": {"type": "authentication_error", "message": "x"}}),
            ErrorCode.PROVIDER_REJECTED,
        ),
        (
            httpx2.Response(400, json={"type": "error", "error": {"type": "invalid_request_error", "message": "x"}}),
            ErrorCode.BAD_REQUEST,
        ),
    ],
)
async def test_failures_are_classified(response: httpx2.Response, code: ErrorCode) -> None:
    with pytest.raises(ProviderError) as failure:
        await provider(lambda _request: response).structured(REQUEST)
    assert failure.value.code is code


async def test_retryable_failures_are_the_transient_ones() -> None:
    assert {code for code in ErrorCode if code.retryable} == {
        ErrorCode.RATE_LIMITED,
        ErrorCode.PROVIDER_UNAVAILABLE,
        ErrorCode.TIMEOUT,
    }


async def test_a_refusal_still_reports_what_it_cost() -> None:
    response = httpx2.Response(200, json=message("", stop_reason="refusal", stop_details=None))
    with pytest.raises(ProviderError) as failure:
        await provider(lambda _request: response).structured(REQUEST)
    assert failure.value.usage.input_tokens == 1200
    assert failure.value.model == "claude-sonnet-5-5"


async def test_connection_failures_are_retryable() -> None:
    def handler(request: httpx2.Request) -> httpx2.Response:
        raise httpx2.ConnectError("down", request=request)

    with pytest.raises(ProviderError) as failure:
        await provider(handler).structured(REQUEST)
    assert failure.value.code is ErrorCode.PROVIDER_UNAVAILABLE
    assert failure.value.code.retryable


async def test_error_details_never_quote_the_provider_message() -> None:
    body = {"type": "error", "error": {"type": "invalid_request_error", "message": "secret-content-Q9"}}
    with pytest.raises(ProviderError) as failure:
        await provider(lambda _request: httpx2.Response(400, json=body)).structured(REQUEST)
    assert "secret-content-Q9" not in str(failure.value)
