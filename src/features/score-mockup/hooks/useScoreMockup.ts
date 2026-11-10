import { useEffect, useRef, useState } from "react";
import {
  advanceTurn,
  createScoreState,
  DEMO_SCRIPT,
  mockHand,
} from "@/features/score-mockup/services/scoreMockupModel";
import { buildScoreHudView } from "@/features/score-mockup/services/scoreHudView";
import type {
  MockCard,
  ScoreHudView,
  ScoreState,
  ScoreTurn,
} from "@/features/score-mockup/types/scoreMockup.types";

const DEMO_STEP_MS = 2200;
const DEMO_PREVIEW_MS = 1000;

export interface ScoreMockup {
  view: ScoreHudView;
  hand: MockCard[];
  selected: MockCard | null;
  demoRunning: boolean;
  select: (card: MockCard) => void;
  play: (card: MockCard) => void;
  runDemo: () => void;
  reset: () => void;
}

/** Fake run for the score mockup: selection with forecast, plays, and the scripted demo. */
export function useScoreMockup(): ScoreMockup {
  const [state, setState] = useState(createScoreState);
  const [log, setLog] = useState<ScoreTurn[]>([]);
  const [selectedKind, setSelectedKind] = useState<MockCard["kind"] | null>(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const timers = useRef<number[]>([]);

  const hand = mockHand(state.turn);
  const selected = hand.find((card) => card.kind === selectedKind) ?? null;

  const clearTimers = (): void => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  // Timers read the latest state through this ref (the demo plays across renders).
  const stateRef = useRef<ScoreState | null>(null);

  const playKind = (kind: MockCard["kind"]): void => {
    const current = stateRef.current ?? state;
    const card = mockHand(current.turn).find((candidate) => candidate.kind === kind)!;
    const next = advanceTurn(current, card);
    stateRef.current = next;
    setSelectedKind(null);
    setState(next);
    setLog((entries) => [next.lastTurn!, ...entries].slice(0, 6));
  };

  const reset = (): void => {
    clearTimers();
    setDemoRunning(false);
    setSelectedKind(null);
    const fresh = createScoreState();
    stateRef.current = fresh;
    setState(fresh);
    setLog([]);
  };

  const runDemo = (): void => {
    reset();
    setDemoRunning(true);
    DEMO_SCRIPT.forEach((kind, index) => {
      const at = 400 + index * DEMO_STEP_MS;
      timers.current.push(window.setTimeout(() => setSelectedKind(kind), at));
      timers.current.push(window.setTimeout(() => playKind(kind), at + DEMO_PREVIEW_MS));
    });
    timers.current.push(
      window.setTimeout(() => setDemoRunning(false), 400 + DEMO_SCRIPT.length * DEMO_STEP_MS)
    );
  };

  return {
    view: buildScoreHudView(state, selected, log),
    hand,
    selected,
    demoRunning,
    select: (card) => setSelectedKind((kind) => (kind === card.kind ? null : card.kind)),
    play: (card) => playKind(card.kind),
    runDemo,
    reset,
  };
}
