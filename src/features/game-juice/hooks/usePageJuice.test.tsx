import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { gameJuiceBus } from "@/features/game-juice/services/gameJuiceRuntime";
import { usePageJuice } from "@/features/game-juice/hooks/usePageJuice";

let heard: string[] = [];
let stop: () => void = () => undefined;
beforeEach(() => {
  heard = [];
  stop = gameJuiceBus.listen((name) => heard.push(name));
});
afterEach(() => stop());

let go: (to: string) => void = () => undefined;
const Probe = () => {
  usePageJuice();
  const navigate = useNavigate();
  go = (to) => void navigate(to);
  return null;
};

describe("usePageJuice", () => {
  it("should play the page entrance only when the pathname changes after the first load", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Probe />
      </MemoryRouter>
    );
    expect(heard).toEqual([]);
    act(() => go("/instellingen"));
    act(() => go("/instellingen"));
    expect(heard).toEqual(["page.opened"]);
  });
});
