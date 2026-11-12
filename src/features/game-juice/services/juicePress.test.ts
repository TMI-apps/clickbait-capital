import { describe, expect, it } from "vitest";
import { pressedControl } from "@/features/game-juice/services/juicePress";

/** A click's path from the element up to the root, as `composedPath()` gives it. */
const pathOf = (element: Element | null): EventTarget[] => {
  const path: EventTarget[] = [];
  for (let node = element; node; node = node.parentElement) path.push(node);
  return path;
};

const html = (markup: string): HTMLElement => {
  const root = document.createElement("div");
  root.innerHTML = markup;
  return root;
};

describe("pressedControl", () => {
  it("should find the button when a click lands on its icon", () => {
    const root = html('<button id="b"><svg><path id="p"></path></svg></button>');
    expect(pressedControl(pathOf(root.querySelector("#p")))).toBe(root.querySelector("#b"));
  });

  it("should find links and button-like roles when they are pressed", () => {
    const root = html('<a id="a" href="/x">x</a><div id="r" role="radio">y</div>');
    expect(pressedControl(pathOf(root.querySelector("#a")))).not.toBeNull();
    expect(pressedControl(pathOf(root.querySelector("#r")))).not.toBeNull();
  });

  it("should ignore plain text and disabled controls when they are clicked", () => {
    const root = html(
      '<p id="t">hi</p><button id="d" disabled>x</button><button id="ad" aria-disabled="true">y</button>'
    );
    expect(pressedControl(pathOf(root.querySelector("#t")))).toBeNull();
    expect(pressedControl(pathOf(root.querySelector("#d")))).toBeNull();
    expect(pressedControl(pathOf(root.querySelector("#ad")))).toBeNull();
  });

  it("should stay quiet when the control sits in an area with its own juice", () => {
    const root = html('<div data-juice-press="off"><button id="b">x</button></div>');
    expect(pressedControl(pathOf(root.querySelector("#b")))).toBeNull();
  });

  it("should still resolve the control when React removed it from the page on click", () => {
    const root = html('<div><button id="b">x</button></div>');
    const button = root.querySelector("#b");
    const path = pathOf(button);
    button?.remove();
    expect(pressedControl(path)).toBe(button);
  });
});
