import type { BalanceConfig, PhaseDefinition, PhaseId } from "@/features/game-engine/api";
import type { PhaseIntro } from "@/features/game-content/types/contentPresentation.types";

/**
 * Balance constants and the four phases for the full deck (score-redesign D11–D22,
 * exponential-growth D1–D3). Effects stay authored in points. A users point adds the phase's
 * fixed `usersPerPoint` plus 6 % of the current users, so growth compounds from 0; a revenue
 * point of gain pays € 0,05 per current user; costs and fines use the phase's `moneyPerPoint`.
 * Each goal is ×10 the last, so every phase takes about as many turns. Tuning against the card pool is proven by
 * `balanceSimulation.test.ts`. Changes here change difficulty: rerun the simulation.
 */
export const CONTENT_BALANCE: BalanceConfig = {
  startUsers: 0,
  startMoney: 3_000,
  userGrowthPerPoint: 0.06,
  userLossPerPoint: 0.015,
  moneyPerUserPerPoint: 0.05,
  startReputation: 60,
  newsIgnoredToxicity: 2,
  toxicityDrain: { from: 50, perPoint: 0.05 },
  reputationDecay: { afterTurnsWithoutNews: 3, amount: 3 },
  adFatigue: { window: 4, adsInWindow: 3, revenueMultiplier: 0.5, userLossMultiplier: 2 },
  echoChamber: { streak: 3, userGainMultiplier: 1.5, toxicity: 25 },
  scandal: { threshold: 35, rampPoints: 20, maxChance: 0.9, finePoints: 8 },
  eventPacing: { minTurnsBetween: 3, randomExtraTurns: 3, urgentMinTurnsBetween: 3 },
  handMix: { oneOfEach: 0.6, pair: 0.35, triple: 0.05 },
};

export const CONTENT_PHASES: PhaseDefinition[] = [
  {
    id: 1,
    name: "De Zolderkamer",
    goal: { description: "Haal 10.000 gebruikers en € 20.000.", users: 10_000, money: 20_000 },
    passiveCosts: { revenue: -1 },
    usersPerPoint: 50,
    moneyPerPoint: 200,
    reputationLossMultiplier: 0.5,
    revenueGainMultiplier: 1,
  },
  {
    id: 2,
    name: "De Scale-Up",
    goal: { description: "Haal 100.000 gebruikers en € 200.000.", users: 100_000, money: 200_000 },
    passiveCosts: { revenue: -2 },
    usersPerPoint: 500,
    moneyPerPoint: 2_000,
    reputationLossMultiplier: 1,
    revenueGainMultiplier: 1,
  },
  {
    id: 3,
    name: "Wereldwijd Platform",
    goal: {
      description: "Haal 1 miljoen gebruikers en € 2 miljoen.",
      users: 1_000_000,
      money: 2_000_000,
    },
    passiveCosts: { revenue: -2 },
    usersPerPoint: 5_000,
    moneyPerPoint: 20_000,
    reputationLossMultiplier: 1.5,
    revenueGainMultiplier: 1,
  },
  {
    id: 4,
    name: "De Beursgang",
    goal: {
      description: "Haal 10 miljoen gebruikers en € 20 miljoen.",
      users: 10_000_000,
      money: 20_000_000,
    },
    passiveCosts: { revenue: -2 },
    usersPerPoint: 50_000,
    moneyPerPoint: 200_000,
    reputationLossMultiplier: 2,
    revenueGainMultiplier: 1,
  },
];

/** Intro screen per phase, shown when the phase starts (before any milestone event). */
export const PHASE_INTROS: Record<PhaseId, PhaseIntro> = {
  1: {
    kicker: "Fase 1",
    title: "De Zolderkamer",
    body: "Op je zolderkamer lanceer je je eigen app. Je hebt nog 0 gebruikers en een klein beetje startgeld. Welke posts ga jij [[boosten|boost]]? Word je een eerlijk nieuwskanaal, of buit je je gebruikers uit?",
    tip: "Nog niemand let op je. Laat je app groeien, maar houd genoeg geld over: elke beurt kost je servers geld.",
  },
  2: {
    kicker: "Fase 2",
    title: "De Scale-Up",
    body: "Je app is een [[scale-up]] geworden. Je zit nu in een kantoor met een pingpongtafel, maar je [[investeerders|investeerder]] willen hun geld terug en de [[servers|server]] kosten nu echt geld. Hoeveel reclame durf jij te laten zien?",
    tip: "Zonder reclame ga je [[bankroet]]. Met te veel reclame lopen je gebruikers weg.",
  },
  3: {
    kicker: "Fase 3",
    title: "Wereldwijd Platform",
    body: "Miljoenen mensen gebruiken je app. Regeringen, kranten en [[adverteerders|adverteerder]] kijken mee. Kies jij ophef voor de kliks, of laat je ook echt nieuws zien?",
    tip: "Ophef maakt mensen nu sneller boos. Sla je het nieuws over, dan dreigt al snel een schandaal, en dat kost een boete.",
  },
  4: {
    kicker: "Fase 4",
    title: "De Beursgang",
    body: "Tussen de glazen torens wacht je [[beursgang]]. [[Aandeelhouders|aandeelhouder]] willen winst en de [[toezichthouder]] wacht op één fout. Pak jij het snelle geld, of blijf je eerlijk?",
    tip: "Ophef telt nu dubbel zo zwaar. Een schandaal kost een boete, en hoe groter je app, hoe groter die boete.",
  },
};
