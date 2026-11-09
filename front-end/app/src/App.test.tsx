import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import * as healthApi from "./features/health/api/health.api";

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render Hello World", () => {
    vi.spyOn(healthApi, "fetchHealth").mockReturnValue(new Promise(() => {}));

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Hello World" })
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Checking the API…");
  });

  it("should show the API status once the API answers", async () => {
    vi.spyOn(healthApi, "fetchHealth").mockResolvedValue({
      status: "ok",
      uptime: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    render(<App />);

    expect(await screen.findByText("API status: ok")).toBeInTheDocument();
  });

  it("should say the API is unreachable when the request fails", async () => {
    vi.spyOn(healthApi, "fetchHealth").mockRejectedValue(
      new Error("Network Error")
    );

    render(<App />);

    expect(
      await screen.findByText("API unreachable: Network Error")
    ).toBeInTheDocument();
  });
});
