import { CHART_MOVE_TIERS, STREAK_LEVELS } from "@/features/game-juice/api";

const LINE_LABELS: Record<keyof typeof CHART_MOVE_TIERS, string> = {
  users: "Gebruikers",
  revenue: "Geld",
};

const percent = (share: number): string => `${Math.round(share * 100)} %`;

/**
 * The chart juice's thresholds (chart-juice D1, D3), read-only: which move is small / medium /
 * big / huge (a share of the line's goal) and from which streak length each level starts. They
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
    <p className="text-muted-foreground">
      Beweging als deel van het doel; kleiner is small. Reeks-niveaus vanaf{" "}
      {STREAK_LEVELS.join(", ")} keer op rij omhoog (8 = 8 of meer). Aanpassen in{" "}
      <code>src/features/game-juice/services/chartJuice.ts</code>.
    </p>
  </section>
);
