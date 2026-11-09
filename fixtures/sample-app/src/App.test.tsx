import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { it, expect } from "vitest";
import "~/lib/i18n";
import App from "~/App";

it("renders the translated title and button", () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <App />
    </QueryClientProvider>,
  );
  expect(screen.getByRole("heading", { name: "Welcome" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Get started" })).toBeInTheDocument();
});
