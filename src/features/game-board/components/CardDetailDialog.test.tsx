import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardDetailDialog } from "@/features/game-board/components/CardDetailDialog";
import type { DraftCardView } from "@/features/game-board/types/gameBoard.types";

const card: DraftCardView = {
  id: "viral-besluit-nachtmeldingen",
  type: "viral",
  title: "Meldingen, ook 's nachts",
  body: "Je telefoon trilt ook om twee uur 's nachts.",
  effects: [],
  forecast: { users: 0.5, revenue: 0.5 },
  forecastText: { users: "+1.000", revenue: "±0" },
};

const realCase = {
  line: "In 2026 noemde Europa meldingen een truc die een app verslavend maakt.",
  url: "https://example.org/artikel",
  publisher: "Europese Commissie",
  date: "feb. 2026",
};

describe("CardDetailDialog", () => {
  it("should link the article in a new tab when the card has a real case", () => {
    render(<CardDetailDialog card={{ ...card, realCase }} onClose={vi.fn()} onPlay={vi.fn()} />);
    expect(screen.getByText(realCase.line, { exact: false })).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: "Lees het artikel bij Europese Commissie (feb. 2026), opent in een nieuw tabblad",
    });
    expect(link).toHaveAttribute("href", realCase.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should show no real case line when the card is a regular post", () => {
    render(<CardDetailDialog card={card} onClose={vi.fn()} onPlay={vi.fn()} />);
    expect(screen.queryByText("Echt gebeurd:")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
