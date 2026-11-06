import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventModal } from "@/features/game-flow/components/EventModal";
import type { FlowEvent } from "@/features/game-flow/types/gameFlow.types";
import { renderWithProviders } from "tests/test-utils";

const EVENT: FlowEvent = {
  id: "event-test",
  title: "Verkiezingen & Desinformatie",
  body: "Het stormt in je feed.",
  options: [
    {
      id: "a",
      kind: "commercial",
      label: "Laat de ads toe.",
      effects: [{ meter: "revenue", delta: 8 }],
    },
    {
      id: "b",
      kind: "engagement",
      label: "Laat het woeden.",
      effects: [{ meter: "users", delta: 6 }],
    },
    {
      id: "c",
      kind: "journalism",
      label: "Schakel factcheckers in.",
      effects: [{ meter: "reputation", delta: -16 }],
    },
  ],
};

describe("EventModal", () => {
  it("should offer three labelled policy options and stay open on Escape when an event fires", async () => {
    const onChoose = vi.fn();
    renderWithProviders(<EventModal open event={EVENT} onChoose={onChoose} />);
    const user = userEvent.setup();
    const dialog = screen.getByRole("dialog", { name: /Verkiezingen/ });

    const options = within(dialog).getAllByRole("button");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("A · Geld");
    expect(within(dialog).getByText("Wat doe je?")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /factcheckers/ }));
    expect(onChoose).toHaveBeenCalledWith("c");
  });

  it("should start the next event with fresh options and focus on the first when events follow each other", async () => {
    const onChoose = vi.fn();
    const { rerender } = renderWithProviders(<EventModal open event={EVENT} onChoose={onChoose} />);
    const user = userEvent.setup();
    const answered = screen.getByRole("button", { name: /factcheckers/ });
    await user.click(answered);

    const NEXT: FlowEvent = {
      ...EVENT,
      id: "event-next",
      title: "Nog een storm",
      options: EVENT.options.map((option) => ({ ...option, label: `Volgende ${option.id}.` })),
    };
    rerender(<EventModal open event={NEXT} onChoose={onChoose} />);

    const dialog = screen.getByRole("dialog", { name: /Nog een storm/ });
    const options = within(dialog).getAllByRole("button");
    expect(options).toHaveLength(3);
    expect(options).not.toContain(answered);
    expect(options[0]).toHaveFocus();
  });

  it("should show the event's picture above its title and keep it out of the dialog's spoken content when an event fires", () => {
    const withPicture: FlowEvent = { ...EVENT, id: "event-gemeen-filmpje" };
    renderWithProviders(<EventModal open event={withPicture} onChoose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: /Verkiezingen/ });

    const picture = dialog.querySelector("img");
    expect(picture).not.toBeNull();
    expect(picture?.closest('[aria-hidden="true"]')).not.toBeNull();
    const title = within(dialog).getByRole("heading", { name: /Verkiezingen/ });
    expect(picture?.compareDocumentPosition(title)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(within(dialog).queryByRole("img")).not.toBeInTheDocument();
  });
});
