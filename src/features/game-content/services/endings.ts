import type { GameOverReason } from "@/features/game-engine/api";
import type {
  EndReport,
  EndReportInput,
  EndReportLine,
  GameOverStory,
  GameOverText,
} from "@/features/game-content/types/contentPresentation.types";
import { EVENT_CARDS } from "@/features/game-content/services/eventCards";

/**
 * End screens: the three game overs (design § 2) and the IPO end report (design § 6 Fase 4)
 * that shows what the win cost society. Report numbers are derived from the run, then
 * dressed up; they are satire, not statistics.
 */

/**
 * The game overs. Each has one title and 2–3 stories; `selectGameOverText` picks the story
 * that matches how the run got there (game-content D9), so the ending never blames ads the
 * player never showed.
 */
export const GAME_OVER_TEXTS = {
  bankrupt: {
    title: "Bankroet",
    variants: {
      noIncome: {
        headline: "App offline: de rekeningen zijn niet betaald",
        body: "Het bedrijf van je [[servers|server]] heeft de stekker eruit getrokken. De [[investeerders|investeerder]] namen de pingpongtafel mee. Je feed was druk, maar niemand betaalde ervoor.",
        lesson:
          "Aandacht is nog geen geld. Een app zonder [[verdienmodel]] gaat vroeg of laat meer reclame laten zien.",
      },
      costsOutgrew: {
        headline: "Groeiende app gaat onderuit door hoge rekeningen",
        body: "De reclame bracht geld op, maar de rekeningen groeiden harder: servers, controleurs, advocaten. Op een dinsdagochtend was het geld op.",
        lesson:
          "Hoe groter een app, hoe duurder hij is. Daarom willen techbedrijven steeds meer geld verdienen aan elke gebruiker.",
      },
    },
  },
  abandoned: {
    title: "Verlaten Platform",
    variants: {
      adOverload: {
        headline: "Gebruikers massaal weg naar een andere app",
        body: "Reclame, reclame en nog eens reclame. Je gebruikers zijn weggescrold en komen niet terug. Je feed is een spookstad vol banners.",
        lesson:
          "Gebruikers zijn het product. Wie ze te veel reclame laat zien, heeft straks niemand meer om reclame aan te laten zien.",
      },
      dullFeed: {
        headline: "Gebruikers vallen in slaap en kiezen een drukkere app",
        body: "Nieuws, nieuws en nog een [[factcheck]]. Netjes, eerlijk en supersaai. Je gebruikers gingen naar apps die harder schreeuwen. Je feed klopt helemaal, maar niemand kijkt nog.",
        lesson:
          "Apps vechten om je aandacht. Een rustig verhaal verliest dan van ophef. Daarom laat een [[algoritme]] vaak juist sensatie zien.",
      },
      viralBurnout: {
        headline: "Gebruikers vluchten weg van de eindeloze ruzie-feed",
        body: "Elke post was ophef. Elke keer scrollen was een nieuwe ruzie. Eerst kwamen mensen kijken, daarna waren ze het zat.",
        lesson:
          "Boosheid trekt kijkers, maar houdt ze niet vast. Een app die alleen op ophef draait, raakt zijn kijkers kwijt.",
      },
    },
  },
  banned: {
    title: "Verbod & Regulering",
    variants: {
      viralToxicity: {
        headline: "App verboden: hij maakte te veel kapot",
        body: "[[Nepnieuws]], haat en ophef stapelden zich op. Toen greep de regering in. Je app wordt verboden en in stukken gehakt.",
        lesson:
          "Ophef levert meteen kijkers op. De schade komt later. Maar hij komt wel, en dan in één keer.",
      },
      crises: {
        headline: "Crisis na crisis: het parlement verbiedt je app",
        body: "De ene crisis was nog niet voorbij of de volgende stond al in de krant. Steeds minder mensen vertrouwden je. Toen zei het [[parlement]]: genoeg.",
        lesson:
          "Een app wordt bijna nooit verboden om één fout. Het zijn de keuzes onder druk die zich opstapelen.",
      },
      scamAds: {
        headline: "App gesloten na een stroom nepreclame",
        body: "Nep-giveaways, wondermiddelen, [[cryptomunten|cryptomunt]]: wie betaalde, kwam in de feed. Na duizenden klachten sluit de [[toezichthouder]] je app.",
        lesson:
          "Een app die elke reclame toelaat, verkoopt het vertrouwen van zijn eigen gebruikers. Daarom zijn er regels voor reclame.",
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

/** Bankroet: under this share of ads, nobody paid; above it, the costs outgrew the income. */
export const NO_INCOME_BELOW_AD_SHARE = 0.25;
/** Verbod: from this viral share the ban is about outrage. */
export const TOXIC_FROM_VIRAL_SHARE = 0.5;
/** Verbod: this many crises (toxicity-triggered events) make it a story of piled-up crises. */
export const CRISES_FROM_EVENTS = 2;

/** Crisis events (toxicity triggers); milestone events such as the investors are not crises. */
const CRISIS_EVENT_IDS = new Set(
  EVENT_CARDS.filter((event) => event.trigger.kind === "toxicity").map((event) => event.id)
);

function crisisCount(run: EndReportInput): number {
  return run.firedEventIds.filter((id) => CRISIS_EVENT_IDS.has(id)).length;
}

function bankruptVariant(run: EndReportInput): GameOverVariant<"bankrupt"> {
  return typeShares(run).ad < NO_INCOME_BELOW_AD_SHARE ? "noIncome" : "costsOutgrew";
}

/** Verlaten: the type the player leaned on most (ties: ads, then viral, then news). */
function abandonedVariant(run: EndReportInput): GameOverVariant<"abandoned"> {
  const { viral, ad, news } = typeShares(run);
  if (news > ad && news > viral) return "dullFeed";
  if (viral > ad) return "viralBurnout";
  return "adOverload";
}

/** Verbod: a viral majority is outrage; else several crises; else scam ads; else outrage. */
function bannedVariant(run: EndReportInput): GameOverVariant<"banned"> {
  const { viral, ad } = typeShares(run);
  if (viral >= TOXIC_FROM_VIRAL_SHARE) return "viralToxicity";
  if (crisisCount(run) >= CRISES_FROM_EVENTS) return "crises";
  return ad > viral ? "scamAds" : "viralToxicity";
}

function textOf<V extends string>(
  ending: { title: string; variants: Record<V, GameOverStory> },
  variant: V
): GameOverText {
  return { title: ending.title, variant, ...ending.variants[variant] };
}

/**
 * The game-over text that matches how the run got there (game-content D9): the shared title
 * plus the story picked from the run's played card types and crisis events. Pure.
 */
export function selectGameOverText(reason: GameOverReason, run: EndReportInput): GameOverText {
  switch (reason) {
    case "bankrupt":
      return textOf(GAME_OVER_TEXTS.bankrupt, bankruptVariant(run));
    case "abandoned":
      return textOf(GAME_OVER_TEXTS.abandoned, abandonedVariant(run));
    case "banned":
      return textOf(GAME_OVER_TEXTS.banned, bannedVariant(run));
  }
}

/** Labels and texts of the IPO report; `{name}` placeholders are filled by `buildEndReport`. */
export const END_REPORT_TEMPLATE = {
  title: "Gefeliciteerd met je beursgang!",
  intro:
    "In {turns} beurten groeide je app van een zolderkamer tot een groot techbedrijf op de [[beurs]], met {users} gebruikers. Dit is wat er niet in de folder voor [[investeerders|investeerder]] stond.",
  lines: {
    valuation: "Wat je bedrijf waard is op dag één",
    viralPosts: "Virale posts die je bovenaan zette",
    misinformationShares: "Keer dat nepnieuws werd gedeeld",
    screenHours: "Uren slaap die je gebruikers misten",
    familyFights: "Ruzies aan de keukentafel",
    adsShown: "Reclames getoond",
    factchecksRead: "Mensen die een factcheck helemaal lazen",
    crises: "Crises die je overleefde",
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
