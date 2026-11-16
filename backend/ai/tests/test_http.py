import re

from fastapi.testclient import TestClient

UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")


def assert_error(response_json: dict[str, object], code: str, request_id: str) -> None:
    assert response_json["code"] == code
    assert isinstance(response_json["message"], str)
    assert response_json["requestId"] == request_id
    assert set(response_json) == {"code", "message", "requestId"}


def test_liveness_and_readiness_are_up(client: TestClient) -> None:
    for path in ("/health/liveness", "/health/readiness"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.json() == {"status": "UP"}


def test_every_response_has_a_generated_request_id(client: TestClient) -> None:
    response = client.get("/health/liveness")
    assert UUID.fullmatch(response.headers["X-Request-Id"])


def test_a_well_formed_inbound_request_id_is_kept(client: TestClient) -> None:
    response = client.get("/health/liveness", headers={"X-Request-Id": "from-the-api-0001"})
    assert response.headers["X-Request-Id"] == "from-the-api-0001"


def test_an_unsafe_inbound_request_id_is_replaced(client: TestClient) -> None:
    response = client.get("/health/liveness", headers={"X-Request-Id": "bad id\twith tab"})
    assert UUID.fullmatch(response.headers["X-Request-Id"])


def test_unknown_paths_use_the_platform_error_format(client: TestClient) -> None:
    response = client.get("/nothing-here")
    assert response.status_code == 404
    assert_error(response.json(), "NOT_FOUND", response.headers["X-Request-Id"])


def test_wrong_method_uses_the_platform_error_format(client: TestClient) -> None:
    response = client.post("/health/liveness")
    assert response.status_code == 405
    assert_error(response.json(), "METHOD_NOT_ALLOWED", response.headers["X-Request-Id"])


def test_unexpected_errors_hide_internal_details(client: TestClient) -> None:
    response = client.get("/__test/boom")
    assert response.status_code == 500
    assert_error(response.json(), "INTERNAL_ERROR", response.headers["X-Request-Id"])
    assert "boom-secret-Q7" not in response.text
    assert "RuntimeError" not in response.text
    assert "Traceback" not in response.text


def test_internal_documentation_endpoints_are_not_exposed(client: TestClient) -> None:
    for path in ("/docs", "/redoc", "/openapi.json"):
        assert client.get(path).status_code == 404


def test_responses_forbid_content_sniffing(client: TestClient) -> None:
    assert client.get("/health/liveness").headers["X-Content-Type-Options"] == "nosniff"
