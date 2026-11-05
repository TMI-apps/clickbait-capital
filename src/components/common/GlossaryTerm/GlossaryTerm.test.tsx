import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { GlossaryText } from "./GlossaryText";

const GLOSSARY = { algoritme: "Een computerregel die kiest wat jij te zien krijgt." };

/** jsdom has no ResizeObserver; Radix Popper measures the trigger with it. */
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

describe("GlossaryText", () => {
  it("should show the meaning when the marked word is tapped", async () => {
    const user = userEvent.setup();
    render(<GlossaryText text="Jij bent het [[algoritme]]." glossary={GLOSSARY} />);
    await user.click(screen.getByRole("button", { name: "algoritme" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent(GLOSSARY.algoritme);
  });

  it("should give screen readers the meaning when the word is focused", () => {
    render(<GlossaryText text="Het [[algoritme]] kiest." glossary={GLOSSARY} />);
    expect(screen.getByRole("button", { name: "algoritme" })).toHaveAccessibleDescription(
      GLOSSARY.algoritme
    );
  });

  it("should open with Enter and close with Escape when used by keyboard", async () => {
    const user = userEvent.setup();
    render(<GlossaryText text="[[algoritme]]" glossary={GLOSSARY} />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "algoritme" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render plain text without markup when a term is missing from the glossary", () => {
    const { container } = render(<GlossaryText text="Een [[onbekend]] woord" glossary={{}} />);
    expect(container).toHaveTextContent("Een onbekend woord");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
