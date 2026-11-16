import { ApiError, idempotencyKey, unwrap } from "./api";

const response = (status: number) => new Response(null, { status });

describe("unwrap", () => {
  it("returns data from a successful response", () => {
    expect(unwrap({ data: { id: 1 }, response: response(200) })).toEqual({ id: 1 });
  });

  it("throws an ApiError carrying the server's message, code and field problems", () => {
    const error = {
      code: "VALIDATION_FAILED",
      message: "The request contains invalid values.",
      requestId: "r-1",
      details: [{ field: "password", problem: "is too common" }],
    };
    let thrown: unknown;
    try {
      unwrap({ error, response: response(400) });
    } catch (caught) {
      thrown = caught;
    }
    expect(thrown).toBeInstanceOf(ApiError);
    const apiError = thrown as ApiError;
    expect(apiError.status).toBe(400);
    expect(apiError.code).toBe("VALIDATION_FAILED");
    expect(apiError.message).toBe("The request contains invalid values.");
    expect(apiError.fieldProblem("password")).toBe("is too common");
    expect(apiError.fieldProblem("email")).toBeUndefined();
  });

  it("uses a generic message when the response has no error body", () => {
    expect(() => unwrap({ response: response(502) })).toThrow("Something went wrong. Please try again.");
  });
});

describe("idempotencyKey", () => {
  it("is unique and within the contract's length limits", () => {
    const first = idempotencyKey();
    expect(first).not.toBe(idempotencyKey());
    expect(first.length).toBeGreaterThanOrEqual(8);
    expect(first.length).toBeLessThanOrEqual(128);
  });
});
