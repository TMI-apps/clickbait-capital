import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UI_COPY } from "@/features/game-content/api";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { isSupabaseConfigured } from "@/shared/services/supabaseService";
import { renderWithProviders } from "tests/test-utils";

vi.mock("@/shared/services/supabaseService", () => ({ isSupabaseConfigured: vi.fn() }));

const copy = UI_COPY.privacy;

describe("PrivacyPage", () => {
  beforeEach(() => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
  });

  it("should list every privacy point and link to credits when rendered", () => {
    renderWithProviders(<PrivacyPage />);
    expect(screen.getByRole("heading", { level: 1, name: copy.title })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(copy.points.length);
    expect(screen.getByRole("link", { name: copy.creditsLink })).toHaveAttribute(
      "href",
      "/credits"
    );
  });

  it("should not mention error reports when Supabase is not configured", () => {
    renderWithProviders(<PrivacyPage />);
    expect(screen.queryByText(copy.errorReports)).not.toBeInTheDocument();
  });

  it("should mention error reports when Supabase is configured", () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    renderWithProviders(<PrivacyPage />);
    expect(screen.getByText(copy.errorReports)).toBeInTheDocument();
  });
});
