"""Structured JSON logging (Guidelines §62), field-compatible with the API's ECS logs."""

import json
import logging
import sys
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any, override

request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)
# W3C trace id from the caller's `traceparent`, so a call is found from either service.
trace_id_var: ContextVar[str | None] = ContextVar("trace_id", default=None)

# Attributes every LogRecord has; anything else was passed through `extra=`.
_STANDARD_ATTRIBUTES = frozenset(vars(logging.makeLogRecord({})).keys()) | {"message", "asctime"}


class JsonFormatter(logging.Formatter):
    def __init__(self, service_name: str, environment: str) -> None:
        super().__init__()
        self._service = {"name": service_name, "environment": environment}

    @override
    def format(self, record: logging.LogRecord) -> str:
        entry: dict[str, Any] = {
            "@timestamp": datetime.fromtimestamp(record.created, UTC).isoformat().replace("+00:00", "Z"),
            "log": {"level": record.levelname, "logger": record.name},
            "service": self._service,
            "message": record.getMessage(),
        }
        request_id = request_id_var.get()
        if request_id is not None:
            entry["requestId"] = request_id
        trace_id = trace_id_var.get()
        if trace_id is not None:
            entry["trace"] = {"id": trace_id}
        for key, value in vars(record).items():
            if key not in _STANDARD_ATTRIBUTES:
                entry[key] = value
        if record.exc_info:
            entry["error"] = {"stack_trace": self.formatException(record.exc_info)}
        return json.dumps(entry, default=str)


class _StdoutHandler(logging.StreamHandler):  # type: ignore[type-arg]
    """Writes to whatever `sys.stdout` is at the time of each record, not at creation.

    Process managers and test harnesses may replace `sys.stdout` after logging is
    configured; a handler bound to the original stream would silently miss them.
    """

    @property
    def stream(self) -> Any:  # noqa: ANN401  # mirrors logging.StreamHandler.stream
        return sys.stdout

    @stream.setter
    def stream(self, _value: Any) -> None:  # noqa: ANN401
        pass


def _add_request_id(record: logging.LogRecord) -> bool:
    """Exposes the request id to the plain-text format."""
    record.requestId = request_id_var.get() or "-"
    return True


def configure_logging(*, service_name: str, environment: str, json_output: bool) -> None:
    handler = _StdoutHandler()
    if json_output:
        handler.setFormatter(JsonFormatter(service_name, environment))
    else:
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)-5s [%(requestId)s] %(name)s - %(message)s"))
        handler.addFilter(_add_request_id)
    root = logging.getLogger()
    root.handlers[:] = [handler]
    root.setLevel(logging.INFO)
    # Uvicorn's own access log would duplicate our request log and include query strings.
    logging.getLogger("uvicorn.access").disabled = True
    # HTTP client libraries log full URLs, including query strings that can carry
    # tokens or API keys (Guidelines §62). Only their warnings are kept.
    for name in ("httpx", "httpx2", "httpcore", "httpcore2"):
        logging.getLogger(name).setLevel(logging.WARNING)
    for name in ("uvicorn", "uvicorn.error"):
        logging.getLogger(name).handlers[:] = []
        logging.getLogger(name).propagate = True
