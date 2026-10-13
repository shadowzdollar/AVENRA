"""HTTP entry point of the AI service.

Phase 1 exposes only health endpoints. AI capabilities arrive in Phase 6,
behind service-to-service authentication.
"""

import logging
import re
import time
import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from avenra_ai.config import Settings
from avenra_ai.logs import configure_logging, request_id_var

REQUEST_ID_HEADER = "X-Request-Id"
_ACCEPTED_REQUEST_ID = re.compile(r"[A-Za-z0-9._-]{8,128}")

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

log = logging.getLogger("avenra_ai.http")


class HealthStatus(BaseModel):
    status: str


def _error(code: str, status: int) -> JSONResponse:
    """The platform error format (Guidelines §34); never includes exception details."""
    body = {"code": code, "message": _ERROR_MESSAGES[code], "requestId": request_id_var.get()}
    return JSONResponse(body, status_code=status, headers={"Cache-Control": "no-store"})


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()  # values come from the environment
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

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = _ERROR_CODES.get(exc.status_code, "INTERNAL_ERROR" if exc.status_code >= 500 else "MALFORMED_REQUEST")
        return _error(code, exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, _exc: RequestValidationError) -> JSONResponse:
        return _error("VALIDATION_FAILED", 400)

    @app.get("/health/liveness")
    async def liveness() -> HealthStatus:
        return HealthStatus(status="UP")

    @app.get("/health/readiness")
    async def readiness() -> HealthStatus:
        # No dependencies yet; model providers are checked here from Phase 6.
        return HealthStatus(status="UP")

    return app
