import {
  CHART_MOVE_TIERS,
  GAME_JUICE_RECIPES,
  STREAK_LEVELS,
  type JuiceChartGainVariant,
} from "@/features/game-juice/api";

const LINE_LABELS: Record<keyof typeof CHART_MOVE_TIERS, string> = {
  users: "Gebruikers",
  revenue: "Geld",
};

const percent = (share: number): string => `${Math.round(share * 100)} %`;

const TIERS = ["small", "medium", "big", "huge"] as const;

/** Glyphs a gain of this line and tier flies to its end dot (`chart.gain`, chart-juice D8). */
function flightCount(variant: JuiceChartGainVariant): number {
  const steps = GAME_JUICE_RECIPES["chart.gain"].variants?.[variant] ?? [];
  return steps.reduce((sum, step) => sum + (step.effect === "particles" ? step.count : 0), 0);
}

/**
 * The chart juice's thresholds (chart-juice D1, D3), read-only: which move is small / medium /
 * big / huge (a share of the line's goal), how many glyphs a gain of each tier flies to its line,
 * and from which streak length each level starts. They
 * are code data in game-juice's `chartJuice.ts`; the triggers above play each tier and step.
 */
export const ChartJuiceThresholds = () => (
  <section aria-labelledby="chart-juice-thresholds" className="flex flex-col gap-2 text-sm">
    <h2 id="chart-juice-thresholds" className="font-heading text-lg font-bold">
      Grafiek-drempels
    </h2>
    <table className="w-full text-left tabular-nums">
      <thead className="text-muted-foreground">
        <tr>
          <th className="font-medium">Lijn</th>
          <th className="font-medium">medium</th>
          <th className="font-medium">big</th>
          <th className="font-medium">huge</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(CHART_MOVE_TIERS).map(([line, tiers]) => (
          <tr key={line}>
            <th className="font-semibold">{LINE_LABELS[line as keyof typeof CHART_MOVE_TIERS]}</th>
            <td>≥ {percent(tiers.medium)}</td>
            <td>≥ {percent(tiers.big)}</td>
            <td>≥ {percent(tiers.huge)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <table className="w-full text-left tabular-nums">
      <caption className="text-left text-muted-foreground">Deeltjes naar de lijn bij winst</caption>
      <thead className="text-muted-foreground">
        <tr>
          <th className="font-medium">Lijn</th>
          {TIERS.map((tier) => (
            <th key={tier} className="font-medium">
              {tier}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(["users", "revenue"] as const).map((line) => (
          <tr key={line}>
            <th className="font-semibold">{LINE_LABELS[line]}</th>
            {TIERS.map((tier) => (
              <td key={tier}>{flightCount(`${line}-${tier}`)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    <p className="text-muted-foreground">
      Beweging als deel van het doel; kleiner is small. Reeks-niveaus vanaf{" "}
      {STREAK_LEVELS.join(", ")} keer op rij omhoog (8 = 8 of meer). Drempels aanpassen in{" "}
      <code>src/features/game-juice/services/chartJuice.ts</code>, aantallen in de recepten (
      <code>chart.gain</code>) of live hierboven.
    </p>
  </section>
);
