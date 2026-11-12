import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { gameJuiceBus } from "@/features/game-juice/api";
import { useCardForecast } from "@/features/game-board/hooks/useCardForecast";
import type { DraftCardView } from "@/features/game-board/types/gameBoard.types";

let heard: string[] = [];
let stop: () => void = () => undefined;
beforeEach(() => {
  heard = [];
  stop = gameJuiceBus.listen((name, payload) =>
    heard.push(payload.variant ? `${name}:${payload.variant}` : name)
  );
});
afterEach(() => stop());

const card = (id: string, type: DraftCardView["type"]): DraftCardView =>
  ({ id, type, forecast: { users: 1, revenue: 1 } }) as DraftCardView;
const DRAFT = [card("a", "viral"), card("b", "news")];

const render = () =>
  renderHook(() =>
    useCardForecast({ draft: DRAFT, detailCard: null, cardElement: () => null, feedId: "feed" })
  );
const start = (id: string) => ({ active: { id } }) as unknown as DragStartEvent;
const dropOn = (overId: string | null) =>
  ({ active: { id: "a" }, over: overId ? { id: overId } : null }) as unknown as DragEndEvent;

describe("useCardForecast juice", () => {
  it("should lift the card and show its forecast when a drag starts", () => {
    const { result } = render();
    act(() => result.current.dragEvents.onDragStart(start("a")));
    expect(heard).toEqual(["card.pickup:viral", "forecast.shown"]);
    expect(result.current.dragging).toBe(true);
  });

  it("should lift once when a held card turns into a drag", () => {
    const { result } = render();
    act(() => result.current.onPreview("hold", "b"));
    act(() => result.current.dragEvents.onDragStart(start("b")));
    expect(heard.filter((name) => name.startsWith("card.pickup"))).toEqual(["card.pickup:news"]);
  });

  it("should cancel when the card is dropped outside the feed and play when it lands on it", () => {
    const { result } = render();
    act(() => result.current.dragEvents.onDragStart(start("a")));
    act(() => result.current.dragEvents.onDragOver({ over: { id: "feed" } } as DragOverEvent));
    let played = true;
    act(() => {
      played = result.current.endDrag(dropOn(null));
    });
    expect(played).toBe(false);
    expect(heard).toContain("card.over-feed");
    expect(heard[heard.length - 1]).toBe("card.cancel");

    act(() => result.current.dragEvents.onDragStart(start("a")));
    act(() => {
      played = result.current.endDrag(dropOn("feed"));
    });
    expect(played).toBe(true);
    expect(heard[heard.length - 1]).not.toBe("card.cancel");
  });
});
