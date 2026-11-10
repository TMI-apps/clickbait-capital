# score-chart

The stock-style score chart of the game board (score-redesign D10, D29): each score number as a line racing to a dashed goal line.

## Purpose

Shows how the score moves over the last actions and how far it is from the goal. Every series is a share of its own goal line, drawn on one scale, so the goal line is the same finish line for all of them. The chart is visual only (`aria-hidden`); the caller speaks the numbers.

## Structure

- `components/ScoreChart.tsx`: the SVG (goal band, dashed goal line, one polyline and an end dot per series).
- `hooks/useScoreChart.ts`: memoises the geometry.
- `services/scoreChart.ts`: pure geometry (`toChartGeometry(series, slots)`), unit-tested in `scoreChart.test.ts`.
- `types/scoreChart.types.ts`: `ScoreChartSeries`, `ChartGeometry`.
- `api/index.ts`: `ScoreChart` and its types.

## Dependencies

Theme token classes only (`text-meter-*`, `success`) and lucide icons. No game logic: game-board builds the series from the engine state (`MeterView.history`) and passes the slot count (`SCORE_HISTORY_POINTS`).
