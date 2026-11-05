import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppErrorFallback } from "./AppErrorFallback";
import { AppStatusScreen } from "./AppStatusScreen";

describe("AppStatusScreen", () => {
  afterEach(() => vi.restoreAllMocks());

  it("should offer retry and home when loading failed", () => {
    render(<AppStatusScreen kind="loadFailed" />);

    expect(screen.getByRole("heading", { name: "Laden mislukt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Opnieuw proberen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Naar het begin" })).toBeInTheDocument();
  });

  it("should offer only home and a browser tip when the browser is unsupported", () => {
    render(<AppStatusScreen kind="unsupported" />);

    expect(screen.getByRole("heading", { name: "Browser niet ondersteund" })).toBeInTheDocument();
    expect(screen.getByText(/recente versie van Chrome/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Opnieuw proberen" })).not.toBeInTheDocument();
  });

  it("should show the offline screen when a page fails while offline", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

    render(<AppErrorFallback />);

    expect(screen.getByRole("heading", { name: "Geen internet" })).toBeInTheDocument();
  });
});
