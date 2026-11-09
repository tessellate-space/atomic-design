import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { it, expect, vi } from "vitest";
import App from "@/App";

it("renders the dashboard with fetched orders", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url.includes("orders")
          ? [{ id: "1", title: "Order one", status: "active" }]
          : { name: "Ada", email: "ada@example.test", status: "active" },
    })),
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <App />
    </QueryClientProvider>,
  );
  expect(await screen.findByText(/Order one/)).toBeInTheDocument();
  expect(await screen.findByText("Ada")).toBeInTheDocument();
});
