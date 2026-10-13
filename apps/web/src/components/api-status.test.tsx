import { createAvenraClient } from "@avenra/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { ApiStatus } from "./api-status";

function renderWithResponse(response: () => Promise<Response>) {
  const client = createAvenraClient({ baseUrl: "https://api.avenra.test", fetch: () => response() });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ApiStatus client={client} />
    </QueryClientProvider>,
  );
}

const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

describe("ApiStatus", () => {
  it("reports a successful connection using the contract response", async () => {
    renderWithResponse(() => json(200, { service: "avenra-api", apiVersion: "v1" }));

    expect(await screen.findByText("Connected to avenra-api (v1)")).toBeInTheDocument();
  });

  it("reports an API error response as unavailable", async () => {
    renderWithResponse(() => json(500, { code: "INTERNAL_ERROR", message: "x", requestId: "r-1" }));

    expect(await screen.findByText("API unavailable")).toBeInTheDocument();
  });

  it("reports a network failure as unavailable", async () => {
    renderWithResponse(() => Promise.reject(new TypeError("Failed to fetch")));

    expect(await screen.findByText("API unavailable")).toBeInTheDocument();
  });

  it("shows a neutral state while checking", () => {
    renderWithResponse(() => new Promise<Response>(() => {}));

    expect(screen.getByRole("status")).toHaveTextContent("Checking API connection…");
  });
});
