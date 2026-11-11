import type { BalanceConfig, PhaseDefinition, PhaseId } from "@/features/game-engine/api";
import type { PhaseIntro } from "@/features/game-content/types/contentPresentation.types";

/**
 * Balance constants and the four phases for the full deck (score-redesign D11–D22). Effects
 * stay authored in points; each phase sets what a point is worth in users and euros, and
 * every goal is two goal lines. Tuning against the card pool is proven by
 * `balanceSimulation.test.ts`. Changes here change difficulty: rerun the simulation.
 */
export const CONTENT_BALANCE: BalanceConfig = {
  startUsers: 50_000,
  startMoney: 100_000,
  userLossPerPoint: 0.02,
  startReputation: 60,
  newsIgnoredToxicity: 2,
  toxicityDrain: { from: 50, perPoint: 0.05 },
  reputationDecay: { afterTurnsWithoutNews: 3, amount: 3 },
  adFatigue: { window: 4, adsInWindow: 3, revenueMultiplier: 0.5, userLossMultiplier: 2 },
  echoChamber: { streak: 3, userGainMultiplier: 1.5, toxicity: 25 },
  journalismDrought: { afterTurnsWithoutNews: 5, viralToxicityMultiplier: 2 },
  scandal: { threshold: 30, rampPoints: 15, maxChance: 0.7, finePoints: 16 },
  eventPacing: { minTurnsBetween: 3, randomExtraTurns: 3, urgentMinTurnsBetween: 3 },
};

export const CONTENT_PHASES: PhaseDefinition[] = [
  {
    id: 1,
    name: "De Zolderkamer",
    goal: { description: "Haal 100.000 gebruikers en € 150.000.", users: 100_000, money: 150_000 },
    passiveCosts: { revenue: -1 },
    usersPerPoint: 1_500,
    moneyPerPoint: 2_000,
    audienceUsers: 60_000,
    reputationLossMultiplier: 0.5,
    revenueGainMultiplier: 0.5,
  },
  {
    id: 2,
    name: "De Scale-Up",
    goal: { description: "Haal 300.000 gebruikers en € 600.000.", users: 300_000, money: 600_000 },
    passiveCosts: { revenue: -2 },
    usersPerPoint: 8_000,
    moneyPerPoint: 10_000,
    audienceUsers: 150_000,
    reputationLossMultiplier: 1,
    revenueGainMultiplier: 1,
  },
  {
    id: 3,
    name: "Wereldwijd Platform",
    goal: {
      description: "Haal 1 miljoen gebruikers en € 1,2 miljoen.",
      users: 1_000_000,
      money: 1_200_000,
    },
    passiveCosts: { revenue: -3 },
    usersPerPoint: 25_000,
    moneyPerPoint: 25_000,
    audienceUsers: 500_000,
    reputationLossMultiplier: 1.5,
    revenueGainMultiplier: 1,
  },
  {
    id: 4,
    name: "De Beursgang",
    goal: {
      description: "Haal 3 miljoen gebruikers en € 4 miljoen.",
      users: 3_000_000,
      money: 4_000_000,
    },
    passiveCosts: { revenue: -3 },
    usersPerPoint: 75_000,
    moneyPerPoint: 60_000,
    audienceUsers: 1_500_000,
    reputationLossMultiplier: 2,
    revenueGainMultiplier: 1,
  },
];

/** Intro screen per phase, shown when the phase starts (before any milestone event). */
export const PHASE_INTROS: Record<PhaseId, PhaseIntro> = {
  1: {
    kicker: "Fase 1",
    title: "De Zolderkamer",
    body: "Een matras, een laptop en een nieuwe app die nog niemand kent. Jij bent het [[algoritme]]: jij kiest wat iedereen in de [[feed]] ziet.",
    tip: "Nog niemand let op je. Laat je app groeien: haal 100.000 gebruikers en € 150.000.",
  },
  2: {
    kicker: "Fase 2",
    title: "De Scale-Up",
    body: "Je app is nu een [[scale-up]]. Je hebt een kantoor met een pingpongtafel en [[investeerders|investeerder]] die geld terug willen. De [[servers|server]] kosten nu echt geld.",
    tip: "Zonder reclame ga je failliet. Met te veel reclame lopen je gebruikers weg.",
  },
  3: {
    kicker: "Fase 3",
    title: "Wereldwijd Platform",
    body: "Miljoenen mensen kijken elke dag naar jouw feed. Regeringen, kranten en [[adverteerders|adverteerder]] letten nu goed op.",
    tip: "Verlies je reputatie, dan telt dat nu anderhalf keer. Wie het nieuws overslaat, krijgt een schandaal.",
  },
  4: {
    kicker: "Fase 4",
    title: "De Beursgang",
    body: "Bijna klaar voor de [[beursgang]]. [[Aandeelhouders|aandeelhouder]] willen winst. De [[toezichthouder]] wacht op één fout.",
    tip: "Haal 3 miljoen gebruikers en € 4 miljoen. Elk verlies van reputatie telt nu dubbel. Eén schandaal kan je beursgang kosten.",
  },
};
