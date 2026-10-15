"""Deterministic provider for tests, CI and local work without a key (ADR-029).

Each task registers a responder that computes an answer from the request alone, so the same
request always gets the same answer and costs nothing.
"""

from collections.abc import Callable, Mapping

from avenra_ai.providers.base import ErrorCode, ProviderError, StructuredRequest, StructuredResult, Usage

type Responder = Callable[[StructuredRequest], object]


class FakeProvider:
    def __init__(self, responders: Mapping[str, Responder]) -> None:
        self._responders = dict(responders)

    @property
    def name(self) -> str:
        return "fake"

    @property
    def model(self) -> str:
        return "fake"

    async def structured(self, request: StructuredRequest) -> StructuredResult:
        responder = self._responders.get(request.task)
        if responder is None:
            raise ProviderError(ErrorCode.BAD_REQUEST, f"no fake answer for {request.task}")
        data = responder(request)
        characters = len(request.system) + sum(len(getattr(item, "text", "")) for item in request.content)
        # Roughly four characters per token, so usage records are not all zero.
        return StructuredResult(
            data=data,
            model="fake",
            usage=Usage(input_tokens=characters // 4, output_tokens=len(repr(data)) // 4),
            latency_ms=0,
        )
