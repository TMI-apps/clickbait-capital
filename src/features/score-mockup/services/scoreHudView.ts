import {
  advanceTurn,
  companyValue,
  forecast,
  MOCK_GOAL,
  previewTurn,
  reputationLevel,
  revenuePerUser,
} from "@/features/score-mockup/services/scoreMockupModel";
import {
  formatCount,
  formatMoney,
  formatPercent,
  formatSignedMoney,
} from "@/features/score-mockup/services/scoreFormat";
import type {
  CompanyValueView,
  MockCard,
  ScoreHudView,
  ScorePoint,
  ScoreState,
  ScoreTurn,
  TrendView,
} from "@/features/score-mockup/types/scoreMockup.types";

/** Bedrijfswaarde goal of the mock phase (variant B). */
const VALUE_GOAL = 10_000_000;
/** Company value counts each user at this many turns of revenue (same as the model). */
const VALUE_PER_USER_TURNS = 25;

const trend = (text: string, value: number): TrendView => ({ text, positive: value >= 0 });

function companyView(state: ScoreState, selected: MockCard | null): CompanyValueView {
  const value = companyValue(state);
  const previous = state.history[state.history.length - 2];
  const change =
    previous && state.lastTurn ? value / companyValue({ ...state, ...previous }) - 1 : null;
  const next = selected ? companyValue(advanceTurn(state, selected)) : null;
  return {
    value,
    change: change === null ? null : trend(formatPercent(change), change),
    preview: next === null ? null : trend(`→ ${formatMoney(next)}`, next - value),
    usersText: formatCount(state.users),
    perUserText: `€ ${(revenuePerUser(state) * VALUE_PER_USER_TURNS).toFixed(2).replace(".", ",")}`,
    moneyText: formatMoney(state.money),
    progress: Math.min(1, Math.max(0, value / VALUE_GOAL)),
    goalText: `Doel ${formatMoney(VALUE_GOAL)}`,
  };
}

function feedText(turn: ScoreTurn): string {
  return `${formatPercent(turn.growth)} · ${formatSignedMoney(turn.profit)}`;
}

/** Builds the HUD view: tickers, company value, chart shares and feed posts. */
export function buildScoreHudView(
  state: ScoreState,
  selected: MockCard | null,
  log: ScoreTurn[]
): ScoreHudView {
  const last = state.lastTurn;
  const preview = selected ? previewTurn(state, selected) : null;
  const ahead: ScorePoint[] | null = selected ? forecast(state, selected) : null;
  const ticker = (key: "users" | "money") => {
    const goal = MOCK_GOAL[key];
    const points = state.history.map((point) => point[key]);
    const future = ahead?.map((point) => point[key]) ?? null;
    return {
      value: state[key],
      format: key === "users" ? ("count" as const) : ("money" as const),
      points,
      forecast: future,
      goal,
      goalText: key === "users" ? `Doel ${formatCount(goal)}` : `Doel ${formatMoney(goal)}`,
      reached: state[key] >= goal,
      shares: points.map((value) => value / goal),
      forecastShares: future?.map((value) => value / goal) ?? null,
    };
  };
  return {
    turn: state.turn,
    level: reputationLevel(state.reputation),
    reputation: state.reputation,
    users: {
      ...ticker("users"),
      trend: last && trend(`${formatPercent(last.growth)}/beurt`, last.growth),
      preview: preview && trend(formatPercent(preview.growth), preview.growth),
    },
    money: {
      ...ticker("money"),
      trend: last && trend(`${formatSignedMoney(last.profit)}/beurt`, last.profit),
      preview: preview && trend(formatSignedMoney(preview.profit), preview.profit),
    },
    company: companyView(state, selected),
    feed: log.map((turn, index) => ({
      key: state.turn - index,
      kind: turn.kind,
      title: turn.title,
      effectText: feedText(turn),
    })),
  };
}
