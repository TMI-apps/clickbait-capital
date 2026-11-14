import type { GameOverReason } from "@/features/game-engine/api";
import type {
  EndReport,
  EndReportInput,
  EndReportLine,
  GameOverStory,
  GameOverText,
} from "@/features/game-content/types/contentPresentation.types";
import { DEFAULT_APP_NAME } from "@/features/game-content/services/uiCopy";
import { EVENT_CARDS } from "@/features/game-content/services/eventCards";

/**
 * End screens: the game over, Bankroet (score-redesign D16), and the IPO end report (design § 6 Fase 4)
 * that shows what the win cost society. Report numbers are derived from the run, then
 * dressed up; they are satire, not statistics.
 */

/**
 * The game over. It has one title and four stories; `selectGameOverText` picks the story
 * that matches how the run got there (game-content D9), so the ending never blames ads the
 * player never showed.
 */
export const GAME_OVER_TEXTS = {
  bankrupt: {
    title: "Bankroet",
    variants: {
      noIncome: {
        headline: "{app} offline: de rekeningen zijn niet betaald",
        body: "Het bedrijf van je [[servers|server]] heeft de stekker eruit getrokken. De [[investeerders|investeerder]] namen de pingpongtafel mee. Je feed was druk, maar niemand betaalde ervoor.",
        lesson:
          "Aandacht is nog geen geld. Een app zonder [[verdienmodel]] gaat vroeg of laat meer reclame laten zien.",
      },
      costsOutgrew: {
        headline: "Groeiende app {app} gaat onderuit door hoge rekeningen",
        body: "De reclame bracht geld op, maar de rekeningen groeiden harder: servers, controleurs, advocaten. Op een dinsdagochtend was het geld op.",
        lesson:
          "Hoe groter een app, hoe duurder hij is. Daarom willen techbedrijven steeds meer geld verdienen aan elke gebruiker.",
      },
      noAudience: {
        headline: "Reclame zonder kijkers: adverteerders betalen niet meer",
        body: "Reclame, reclame en nog eens reclame. Je gebruikers zijn weggescrold. Zonder kijkers wilde geen adverteerder nog betalen, en de rekeningen bleven komen.",
        lesson:
          "Gebruikers zijn het product. Wie ze te veel reclame laat zien, heeft straks niemand meer om reclame aan te laten zien.",
      },
      scandals: {
        headline: "Schandaal na schandaal: niemand wil nog betalen",
        body: "[[Nepnieuws]], haat en ophef: de ene ophef was nog niet voorbij of de volgende stond al in de krant. Boetes, boze adverteerders en advocaten kostten zoveel dat het geld op was.",
        lesson:
          "Ophef levert meteen kijkers op. De schade komt later. Maar hij komt wel, en dan kost hij veel geld.",
      },
    },
  },
} as const satisfies Record<
  GameOverReason,
  { title: string; variants: Record<string, GameOverStory> }
>;

type GameOverVariant<R extends GameOverReason> = keyof (typeof GAME_OVER_TEXTS)[R]["variants"];

/** Share of each card type in the run (0–1); all 0 when nothing was played. */
function typeShares(run: EndReportInput): Record<"viral" | "ad" | "news", number> {
  const total = run.playedTypes.length || 1;
  return {
    viral: countType(run, "viral") / total,
    ad: countType(run, "ad") / total,
    news: countType(run, "news") / total,
  };
}

/** Bankroet: under this share of ads, nobody paid; from AD_HEAVY_SHARE on, the ads drove users away. */
export const NO_INCOME_BELOW_AD_SHARE = 0.25;
export const AD_HEAVY_SHARE = 0.5;
/** Bankroet: this many scandals make it a story of piled-up scandals. */
export const SCANDALS_FROM_EVENTS = 2;

/** Scandal events (score-redesign D14); milestone events such as the investors are not scandals. */
const SCANDAL_EVENT_IDS = new Set(
  EVENT_CARDS.filter((event) => event.trigger.kind === "scandal").map((event) => event.id)
);

function scandalCount(run: EndReportInput): number {
  return run.firedEventIds.filter((id) => SCANDAL_EVENT_IDS.has(id)).length;
}

/** Bankroet, the only game over (score-redesign D16): scandals first, then the ad share. */
function bankruptVariant(run: EndReportInput): GameOverVariant<"bankrupt"> {
  if (scandalCount(run) >= SCANDALS_FROM_EVENTS) return "scandals";
  const { ad } = typeShares(run);
  if (ad >= AD_HEAVY_SHARE) return "noAudience";
  return ad < NO_INCOME_BELOW_AD_SHARE ? "noIncome" : "costsOutgrew";
}

/** The run's app name for `{app}` (app-name AN1); runs without one read "Jouw app". */
const appNameOf = (input: EndReportInput): string => input.appName ?? DEFAULT_APP_NAME;

function textOf<V extends string>(
  ending: { title: string; variants: Record<V, GameOverStory> },
  variant: V,
  app: string
): GameOverText {
  const story = ending.variants[variant];
  return {
    title: ending.title,
    variant,
    headline: fillTemplate(story.headline, { app }),
    body: fillTemplate(story.body, { app }),
    lesson: fillTemplate(story.lesson, { app }),
  };
}

/**
 * The game-over text that matches how the run got there (game-content D9): the shared title
 * plus the story picked from the run's scandals and played card types. Pure.
 */
export function selectGameOverText(reason: GameOverReason, run: EndReportInput): GameOverText {
  switch (reason) {
    case "bankrupt":
      return textOf(GAME_OVER_TEXTS.bankrupt, bankruptVariant(run), appNameOf(run));
  }
}

/** Labels and texts of the IPO report; `{name}` placeholders are filled by `buildEndReport`. */
export const END_REPORT_TEMPLATE = {
  title: "Gefeliciteerd met je beursgang!",
  intro:
    "In {turns} beurten groeide {app} van een zolderkamer tot een groot techbedrijf op de [[beurs]], met {users} gebruikers en {money} op de bank. Dit is wat er niet in de folder voor [[investeerders|investeerder]] stond.",
  lines: {
    valuation: "Wat je bedrijf waard is op dag één",
    viralPosts: "Virale posts die je bovenaan zette",
    misinformationShares: "Keer dat nepnieuws werd gedeeld",
    screenHours: "Uren slaap die je gebruikers misten",
    familyFights: "Ruzies aan de keukentafel",
    adsShown: "Reclames getoond",
    factchecksRead: "Mensen die een factcheck helemaal lazen",
    crises: "Schandalen en crises die je overleefde",
  },
  closing:
    "De bel van de beurs gaat. De aandeelhouders juichen. De feed draait door, sneller dan ooit. Was het dat waard?",
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
  const { users, money } = input.score;
  const viral = countType(input, "viral");
  const ads = countType(input, "ad");
  const news = countType(input, "news");
  return {
    valuation: euroFormat.format(Math.max(0, money) * 10 + users * 5),
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
      app: appNameOf(input),
      turns: numberFormat.format(input.turn),
      users: numberFormat.format(input.score.users),
      money: euroFormat.format(Math.max(0, input.score.money)),
    }),
    lines,
    closing: END_REPORT_TEMPLATE.closing,
  };
}
