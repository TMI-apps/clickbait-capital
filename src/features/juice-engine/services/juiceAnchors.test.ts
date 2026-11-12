import { describe, expect, it } from "vitest";
import {
  findJuiceAnchor,
  getJuiceStage,
  registerJuiceAnchor,
  registerJuiceStage,
} from "@/features/juice-engine/services/juiceAnchors";

const attached = (): HTMLElement => document.body.appendChild(document.createElement("div"));

describe("juice anchors", () => {
  it("should keep the newer anchor when the older registration is undone after it", () => {
    const first = attached();
    const second = attached();
    const undoFirst = registerJuiceAnchor("meter:users", first);
    const undoSecond = registerJuiceAnchor("meter:users", second);
    undoFirst();
    expect(findJuiceAnchor("meter:users")).toBe(second);
    undoSecond();
    expect(findJuiceAnchor("meter:users")).toBeNull();
  });

  it("should not return an anchor when its element left the document", () => {
    const element = attached();
    registerJuiceAnchor("feed:newest", element);
    element.remove();
    expect(findJuiceAnchor("feed:newest")).toBeNull();
  });

  it("should keep the newer stage when the older one unmounts after it", () => {
    const first = attached();
    const second = attached();
    const undoFirst = registerJuiceStage(first);
    registerJuiceStage(second);
    undoFirst();
    expect(getJuiceStage()).toBe(second);
  });
});
