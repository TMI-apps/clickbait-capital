import type { GameOverReason } from "@/features/game-engine/api";
import type {
  EndReport,
  EndReportInput,
  EndReportLine,
  GameOverText,
} from "@/features/game-content/types/contentPresentation.types";

/**
 * End screens: the three game overs (design § 2) and the IPO end report (design § 6 Fase 4)
 * that shows what the win cost society. Report numbers are derived from the run, then
 * dressed up; they are satire, not statistics.
 */

export const GAME_OVER_TEXTS: Record<GameOverReason, GameOverText> = {
  bankrupt: {
    title: "Bankroet",
    headline: "Servers op zwart: app offline wegens onbetaalde rekeningen",
    body: "De hostingpartij trok de stekker eruit, de investeerders namen de pingpongtafel mee. Je feed was druk, maar niemand betaalde ervoor.",
    lesson:
      "Aandacht is geen geld. Zonder verdienmodel duwt elk platform vroeg of laat meer reclame in de feed.",
  },
  abandoned: {
    title: "Verlaten Platform",
    headline: "Gebruikers massaal vertrokken naar de concurrent",
    body: "Reclame na reclame na reclame. Je gebruikers zijn weggescrold en komen niet terug. Je feed is een spookstad met banners.",
    lesson: "Gebruikers zijn het product. Wie ze te hard uitknijpt, heeft niets meer te verkopen.",
  },
  banned: {
    title: "Verbod & Regulering",
    headline: "Toezichthouder verbiedt app wegens maatschappelijke ontwrichting",
    body: "Desinformatie, haat en ophef stapelden zich op tot de wetgever ingreep. Je platform wordt verboden en opgesplitst.",
    lesson: "Ophef levert direct op, de schade komt later. Maar ze komt wel, en dan in één klap.",
  },
};

/** Labels and texts of the IPO report; `{name}` placeholders are filled by `buildEndReport`. */
export const END_REPORT_TEMPLATE = {
  title: "Gefeliciteerd met je beursgang!",
  intro:
    "In {turns} beurten groeide je app van een zolderkamer tot een beursgenoteerde techreus met {users} gebruikers. Hieronder het rapport dat niet in de prospectus stond.",
  lines: {
    valuation: "Beurswaarde op de eerste handelsdag",
    viralPosts: "Virale posts die je bovenaan zette",
    misinformationShares: "Keer dat desinformatie werd gedeeld",
    screenHours: "Uren slaap die je gebruikers misliepen",
    familyFights: "Ruzies aan de keukentafel",
    adsShown: "Advertenties getoond",
    factchecksRead: "Mensen die een factcheck helemaal uitlazen",
    crises: "Crises die je overleefde",
  },
  closing:
    "De bel van de beurs luidt. De aandeelhouders juichen. De feed draait door, sneller dan ooit. Was het het waard?",
} as const;

type EndReportLineId = keyof typeof END_REPORT_TEMPLATE.lines;

const numberFormat = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 });
const euroFormat = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Fills `{name}` placeholders; unknown names stay visible so a missing value is noticed. */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}

function countType(input: EndReportInput, type: "viral" | "ad" | "news"): number {
  return input.playedTypes.filter((played) => played === type).length;
}

/** The report numbers. Multipliers are satirical scale factors, tuned to read as plausible. */
function reportValues(input: EndReportInput): Record<EndReportLineId, string> {
  const { users, revenue } = input.stats;
  const viral = countType(input, "viral");
  const ads = countType(input, "ad");
  const news = countType(input, "news");
  return {
    valuation: euroFormat.format(revenue * 40),
    viralPosts: numberFormat.format(viral),
    misinformationShares: numberFormat.format(viral * users * 0.03),
    screenHours: numberFormat.format(users * input.turn * 0.02),
    familyFights: numberFormat.format((viral * users) / 200),
    adsShown: numberFormat.format(ads * users * 4),
    factchecksRead: numberFormat.format(news * 37),
    crises: numberFormat.format(input.firedEventIds.length),
  };
}

/** Builds the IPO end report from a won game (pass the engine's final `GameState`). */
export function buildEndReport(input: EndReportInput): EndReport {
  const values = reportValues(input);
  const lines: EndReportLine[] = (Object.keys(values) as EndReportLineId[]).map((id) => ({
    id,
    label: END_REPORT_TEMPLATE.lines[id],
    value: values[id],
  }));
  return {
    title: END_REPORT_TEMPLATE.title,
    intro: fillTemplate(END_REPORT_TEMPLATE.intro, {
      turns: numberFormat.format(input.turn),
      users: numberFormat.format(input.stats.users),
    }),
    lines,
    closing: END_REPORT_TEMPLATE.closing,
  };
}
