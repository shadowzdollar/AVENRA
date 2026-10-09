/**
 * Typed client for the Avenra API, generated from `openapi/avenra.v1.yaml`
 * (ADR-008). Requests and responses are checked against the contract at
 * compile time; a contract change that breaks a caller fails the type check.
 */
import createClient, { type ClientOptions } from "openapi-fetch";
import type { components, paths } from "./generated/v1.js";

export type { components, paths };

export type ApiMeta = components["schemas"]["ApiMeta"];
export type ErrorResponse = components["schemas"]["ErrorResponse"];
export type FieldProblem = components["schemas"]["FieldProblem"];

export function createAvenraClient(options: ClientOptions = {}) {
  return createClient<paths>(options);
}

export type AvenraClient = ReturnType<typeof createAvenraClient>;
