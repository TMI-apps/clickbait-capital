import { describe, expect, it } from "vitest";
import { juiceActionForEvent, juiceActionForPost } from "@/features/game-juice/services/eventJuice";

describe("juiceActionForEvent", () => {
  it("should give an event option the card juice of its kind when the kind is known", () => {
    expect(juiceActionForEvent("engagement")).toBe("viral");
    expect(juiceActionForEvent("commercial")).toBe("ad");
    expect(juiceActionForEvent("journalism")).toBe("news");
  });

  it("should fall back to plain event juice when the kind is missing", () => {
    expect(juiceActionForEvent(undefined)).toBe("event");
  });
});

describe("juiceActionForPost", () => {
  it("should use the card type for a card post and the option kind for an event post", () => {
    expect(juiceActionForPost({ type: "ad" })).toBe("ad");
    expect(juiceActionForPost({ type: "event", optionKind: "engagement" })).toBe("viral");
    expect(juiceActionForPost(undefined)).toBeNull();
  });
});
