"""Estimated cost of a call, for observation only (ADR-030, Guidelines §53).

Prices are US dollars per million tokens, which is also micro-dollars per token.
"""

from dataclasses import dataclass

from avenra_ai.providers.base import Usage


@dataclass(frozen=True)
class Price:
    input: float
    output: float
    cache_read: float

    @property
    def cache_write(self) -> float:
        # Five-minute cache writes cost 1.25 times the input price.
        return self.input * 1.25


PRICES: dict[str, Price] = {
    "claude-sonnet-5-5": Price(input=2.00, output=10.00, cache_read=0.20),
    "claude-sonnet-5": Price(input=2.00, output=10.00, cache_read=0.20),
    "claude-opus-5-5": Price(input=4.00, output=20.00, cache_read=0.20),
    "claude-opus-4-8": Price(input=5.00, output=25.00, cache_read=0.50),
    "claude-haiku-5-5": Price(input=0.10, output=0.50, cache_read=0.01),
    "fake": Price(input=0.0, output=0.0, cache_read=0.0),
}


def estimate_micros(model: str | None, usage: Usage) -> int | None:
    """The estimated cost in micro-dollars, or `None` for a model without a known price."""
    price = PRICES.get(model or "")
    if price is None:
        return None
    total = (
        usage.input_tokens * price.input
        + usage.output_tokens * price.output
        + usage.cache_read_tokens * price.cache_read
        + usage.cache_write_tokens * price.cache_write
    )
    return round(total)
