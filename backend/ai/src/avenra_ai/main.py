"""HTTP entry point of the AI service.

Health endpoints are open; every task needs the API's service token (ADR-029).
"""

import hmac
import logging
import re
import time
import uuid
from collections.abc import Awaitable, Callable

from fastapi import Depends, FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from avenra_ai.config import ProviderName, Settings
from avenra_ai.logs import configure_logging, request_id_var, trace_id_var
from avenra_ai.providers import ErrorCode, Provider
from avenra_ai.providers.claude import ClaudeProvider
from avenra_ai.providers.fake import FakeProvider
from avenra_ai.tasks import document_read, work_plan
from avenra_ai.tasks.common import TaskFailedError

REQUEST_ID_HEADER = "X-Request-Id"
_ACCEPTED_REQUEST_ID = re.compile(r"[A-Za-z0-9._-]{8,128}")
_TRACEPARENT = re.compile(r"00-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}")

_ERROR_CODES = {
    400: "MALFORMED_REQUEST",
    401: "AUTHENTICATION_REQUIRED",
    403: "ACCESS_DENIED",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    422: "VALIDATION_FAILED",
}
_ERROR_MESSAGES = {
    "MALFORMED_REQUEST": "The request could not be read.",
    "AUTHENTICATION_REQUIRED": "Authentication is required.",
    "ACCESS_DENIED": "You do not have permission to perform this action.",
    "NOT_FOUND": "The requested resource does not exist.",
    "METHOD_NOT_ALLOWED": "This method is not supported for this resource.",
    "VALIDATION_FAILED": "The request contains invalid values.",
    "INTERNAL_ERROR": "An unexpected error occurred.",
}

# Task failures: HTTP status and message; `retryable` tells the caller what to do (§103).
_TASK_ERRORS: dict[ErrorCode, tuple[int, str]] = {
    ErrorCode.RATE_LIMITED: (503, "The model provider is rate limiting requests."),
    ErrorCode.PROVIDER_UNAVAILABLE: (503, "The model provider is unavailable."),
    ErrorCode.TIMEOUT: (504, "The model provider did not answer in time."),
    ErrorCode.PROVIDER_REJECTED: (502, "The model provider rejected the service's credentials or model."),
    ErrorCode.BAD_REQUEST: (400, "The request cannot be processed."),
    ErrorCode.REFUSED: (422, "The model declined to read this document."),
    ErrorCode.TRUNCATED: (502, "The model's answer was cut off."),
    ErrorCode.INVALID_OUTPUT: (502, "The model's answer did not pass validation and was discarded."),
    ErrorCode.UNREADABLE_DOCUMENT: (422, "The document cannot be read."),
}

log = logging.getLogger("avenra_ai.http")


class HealthStatus(BaseModel):
    status: str


def _error(code: str, status: int) -> JSONResponse:
    """The platform error format (Guidelines §34); never includes exception details."""
    body = {"code": code, "message": _ERROR_MESSAGES[code], "requestId": request_id_var.get()}
    return JSONResponse(body, status_code=status, headers={"Cache-Control": "no-store"})


def _task_error(failure: TaskFailedError) -> JSONResponse:
    status, message = _TASK_ERRORS[failure.code]
    body: dict[str, object] = {
        "code": failure.code.value,
        "message": message,
        "requestId": request_id_var.get(),
        "retryable": failure.code.retryable,
        "detail": failure.detail,
        "invocation": failure.invocation.model_dump(by_alias=True) if failure.invocation else None,
    }
    return JSONResponse(body, status_code=status, headers={"Cache-Control": "no-store"})


def build_provider(settings: Settings) -> Provider:
    if settings.selected_provider is ProviderName.CLAUDE:
        assert settings.anthropic_api_key is not None  # noqa: S101  # guaranteed by Settings validation
        return ClaudeProvider(
            api_key=settings.anthropic_api_key.get_secret_value(),
            model=settings.model,
            effort=settings.effort,
            timeout_seconds=settings.request_timeout_seconds,
        )
    return FakeProvider({document_read.TASK: document_read.fake_answer, work_plan.TASK: work_plan.fake_answer})


class _UnauthenticatedError(Exception):
    pass


def create_app(settings: Settings | None = None, provider: Provider | None = None) -> FastAPI:
    settings = settings or Settings()  # values come from the environment
    provider = provider or build_provider(settings)
    expected_token = settings.service_token.get_secret_value().encode("utf-8")
    configure_logging(
        service_name=settings.service_name,
        environment=settings.environment.value,
        json_output=settings.log_json,
    )

    # No interactive docs or schema endpoint: this is an internal service.
    app = FastAPI(title="Avenra AI", docs_url=None, redoc_url=None, openapi_url=None)

    @app.middleware("http")
    async def request_context(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        inbound = request.headers.get(REQUEST_ID_HEADER)
        request_id = inbound if inbound and _ACCEPTED_REQUEST_ID.fullmatch(inbound) else str(uuid.uuid4())
        token = request_id_var.set(request_id)
        traceparent = _TRACEPARENT.fullmatch(request.headers.get("traceparent", ""))
        trace_token = trace_id_var.set(traceparent.group(1) if traceparent else None)
        started = time.perf_counter()
        status = 500
        try:
            try:
                response = await call_next(request)
            except Exception:
                log.exception("Unhandled exception")
                response = _error("INTERNAL_ERROR", 500)
            status = response.status_code
            response.headers[REQUEST_ID_HEADER] = request_id
            response.headers["X-Content-Type-Options"] = "nosniff"
            return response
        finally:
            log.info(
                "Request completed",
                extra={
                    "http": {"request": {"method": request.method}, "response": {"status_code": status}},
                    "url": {"path": request.url.path},
                    "event": {"duration_ms": round((time.perf_counter() - started) * 1000)},
                },
            )
            request_id_var.reset(token)
            trace_id_var.reset(trace_token)

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = _ERROR_CODES.get(exc.status_code, "INTERNAL_ERROR" if exc.status_code >= 500 else "MALFORMED_REQUEST")
        return _error(code, exc.status_code)

    @app.exception_handler(_UnauthenticatedError)
    async def unauthenticated(_request: Request, _exc: _UnauthenticatedError) -> JSONResponse:
        response = _error("AUTHENTICATION_REQUIRED", 401)
        response.headers["WWW-Authenticate"] = "Bearer"
        return response

    @app.exception_handler(TaskFailedError)
    async def task_failed(request: Request, exc: TaskFailedError) -> JSONResponse:
        log.info(
            "Task failed",
            extra={
                "url": {"path": request.url.path},
                "error": {"code": exc.code.value, "retryable": exc.code.retryable},
            },
        )
        return _task_error(exc)

    async def service_caller(request: Request) -> None:
        """Only the API, holding the shared token, may run tasks. Compared in constant time."""
        scheme, _, presented = request.headers.get("Authorization", "").partition(" ")
        if scheme.lower() != "bearer" or not hmac.compare_digest(presented.encode("utf-8"), expected_token):
            raise _UnauthenticatedError

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, _exc: RequestValidationError) -> JSONResponse:
        return _error("VALIDATION_FAILED", 400)

    @app.get("/health/liveness")
    async def liveness() -> HealthStatus:
        return HealthStatus(status="UP")

    @app.get("/health/readiness")
    async def readiness() -> HealthStatus:
        # The provider is not called here: a readiness probe must not spend tokens.
        return HealthStatus(status="UP")

    @app.post("/v1/tasks/document-read", dependencies=[Depends(service_caller)])
    async def read_document(body: document_read.ReadRequest) -> JSONResponse:
        result = await document_read.read(body, provider, max_document_chars=settings.max_document_chars)
        log.info(
            "Task completed",
            extra={
                "task": document_read.TASK,
                "ai": {
                    "model": result.invocation.model,
                    "input_tokens": result.invocation.usage.input_tokens,
                    "output_tokens": result.invocation.usage.output_tokens,
                    "latency_ms": result.invocation.latency_ms,
                },
            },
        )
        return JSONResponse(result.model_dump(by_alias=True, mode="json"), headers={"Cache-Control": "no-store"})

    @app.post("/v1/tasks/work-plan", dependencies=[Depends(service_caller)])
    async def plan_work(body: work_plan.PlanRequest) -> JSONResponse:
        result = await work_plan.plan(body, provider)
        log.info(
            "Task completed",
            extra={"task": work_plan.TASK, "ai": {"model": result.invocation.model, "steps": len(result.steps)}},
        )
        return JSONResponse(result.model_dump(by_alias=True, mode="json"), headers={"Cache-Control": "no-store"})

    return app
