"""The closed catalogue of actions a model may propose (ADR-029, Guidelines §45-§46).

The AI service validates proposals and returns them as data. It has no way to execute them;
people act on them through the application.
"""

from dataclasses import dataclass
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, ValidationError


class Risk(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ReasonInput(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    reason: str = Field(min_length=1, max_length=300)


@dataclass(frozen=True)
class Tool:
    name: str
    description: str
    risk: Risk
    input_model: type[BaseModel]


CATALOGUE: dict[str, Tool] = {
    tool.name: tool
    for tool in (
        Tool(
            name="request_clearer_copy",
            description="Ask the client for a clearer or complete copy of the document.",
            # Sends a message to the client when a person carries it out.
            risk=Risk.MEDIUM,
            input_model=ReasonInput,
        ),
        Tool(
            name="flag_for_review",
            description="Draw a person's attention to something about the document.",
            risk=Risk.LOW,
            input_model=ReasonInput,
        ),
    )
}


class InvalidProposalError(ValueError):
    pass


@dataclass(frozen=True)
class Proposal:
    tool: str
    risk: Risk
    input: dict[str, object]


def validate(tool_name: str, raw_input: object, allowed: frozenset[str]) -> Proposal:
    """A proposal checked against the catalogue and the tools this task allows."""
    tool = CATALOGUE.get(tool_name)
    if tool is None or tool_name not in allowed:
        raise InvalidProposalError(f"tool {tool_name!r} is not allowed")
    try:
        parsed = tool.input_model.model_validate(raw_input)
    except ValidationError as error:
        raise InvalidProposalError(f"invalid input for {tool_name}") from error
    return Proposal(tool=tool.name, risk=tool.risk, input=parsed.model_dump())


def input_schema() -> dict[str, object]:
    """The JSON schema shared by the catalogue's inputs, for the output format."""
    return {
        "type": "object",
        "properties": {"reason": {"type": "string"}},
        "required": ["reason"],
        "additionalProperties": False,
    }
