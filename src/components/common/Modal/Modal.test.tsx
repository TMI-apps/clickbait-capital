import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("should close from the close button and Escape when dismissible is left at its default", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Titel" />);

    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("should use the given close label when closeLabel is set", () => {
    render(<Modal open onClose={vi.fn()} title="Titel" closeLabel="Sluiten" />);

    expect(screen.getByRole("button", { name: "Sluiten" })).toBeInTheDocument();
  });

  it("should show no close button and ignore Escape when dismissible is false", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Titel" dismissible={false} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should focus the first control after the description when the description holds a button", () => {
    render(
      <Modal
        open
        dismissible={false}
        title="Spoed"
        description={
          <>
            Een <button type="button">woord</button> in de tekst.
          </>
        }
      >
        <button type="button">Optie A</button>
      </Modal>
    );
    expect(screen.getByRole("button", { name: "Optie A" })).toHaveFocus();
  });
});
