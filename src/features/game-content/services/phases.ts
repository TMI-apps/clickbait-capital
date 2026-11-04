import type { BalanceConfig, PhaseDefinition, PhaseId } from "@/features/game-engine/api";
import type { PhaseIntro } from "@/features/game-content/types/contentPresentation.types";

/**
 * Balance constants and the four phases for the full deck. Goals and rule constants follow
 * the design (§ 6, § 7); tuning against the card pool is proven by
 * `balanceSimulation.test.ts`. Changes here change difficulty: rerun the simulation.
 */
export const CONTENT_BALANCE: BalanceConfig = {
  startMeter: 50,
  startStats: { users: 1000, revenue: 0 },
  newsIgnoredToxicity: 2,
  reputationDecay: { afterTurnsWithoutNews: 3, amount: 3 },
  adFatigue: { window: 4, adsInWindow: 3, revenueMultiplier: 0.5, userLossMultiplier: 2 },
  echoChamber: { streak: 3, userGainMultiplier: 1.5, toxicity: 25 },
  journalismDrought: { afterTurnsWithoutNews: 5, viralToxicityMultiplier: 2 },
};

export const CONTENT_PHASES: PhaseDefinition[] = [
  {
    id: 1,
    name: "De Zolderkamer",
    goal: {
      description: "Bereik 100.000 gebruikers.",
      conditions: [{ kind: "stat", stat: "users", atLeast: 100_000 }],
      consecutiveTurns: 1,
    },
    passiveCosts: { revenue: -1 },
    usersPerPoint: 5_000,
    revenuePerPoint: 5_000,
    reputationLossMultiplier: 0.5,
    revenueGainMultiplier: 0.5,
  },
  {
    id: 2,
    name: "De Scale-Up",
    goal: {
      description: "Bereik 5.000.000 gebruikers en € 500.000 omzet.",
      conditions: [
        { kind: "stat", stat: "users", atLeast: 5_000_000 },
        { kind: "stat", stat: "revenue", atLeast: 500_000 },
      ],
      consecutiveTurns: 1,
    },
    passiveCosts: { revenue: -3 },
    usersPerPoint: 250_000,
    revenuePerPoint: 10_000,
    reputationLossMultiplier: 1,
    revenueGainMultiplier: 1,
  },
  {
    id: 3,
    name: "Wereldwijd Platform",
    goal: {
      description: "Overleef 30 beurten met minimaal 20.000.000 gebruikers.",
      conditions: [{ kind: "stat", stat: "users", atLeast: 20_000_000 }],
      consecutiveTurns: 30,
    },
    passiveCosts: { revenue: -6 },
    usersPerPoint: 1_000_000,
    revenuePerPoint: 50_000,
    reputationLossMultiplier: 2,
    revenueGainMultiplier: 1,
  },
  {
    id: 4,
    name: "De Beursgang",
    goal: {
      description: "Houd Reputatie boven 60 en Inkomsten boven 80, 10 beurten op rij.",
      conditions: [
        { kind: "meter", meter: "reputation", above: 60 },
        { kind: "meter", meter: "revenue", above: 80 },
      ],
      consecutiveTurns: 10,
    },
    passiveCosts: { revenue: -7 },
    usersPerPoint: 1_000_000,
    revenuePerPoint: 100_000,
    reputationLossMultiplier: 3,
    revenueGainMultiplier: 1,
  },
];

/** Intro screen per phase, shown when the phase starts (before any milestone event). */
export const PHASE_INTROS: Record<PhaseId, PhaseIntro> = {
  1: {
    kicker: "Fase 1",
    title: "De Zolderkamer",
    body: "Een matras, een laptop en een app die nog niemand kent. Jij bent het algoritme: jij kiest wat er in de feed komt.",
    tip: "Niemand let nog op je. Groei is alles: haal 100.000 gebruikers binnen.",
  },
  2: {
    kicker: "Fase 2",
    title: "De Scale-Up",
    body: "Je hebt een kantoor met een pingpongtafel en investeerders met verwachtingen. De servers kosten nu echt geld.",
    tip: "Zonder advertenties ga je failliet. Met te veel lopen je gebruikers weg.",
  },
  3: {
    kicker: "Fase 3",
    title: "Wereldwijd Platform",
    body: "Miljoenen mensen beginnen en eindigen hun dag in jouw feed. Overheden, kranten en adverteerders kijken mee.",
    tip: "Reputatieverlies telt nu dubbel. Nieuws negeren komt hard terug.",
  },
  4: {
    kicker: "Fase 4",
    title: "De Beursgang",
    body: "De bel van de beurs hangt al klaar. Aandeelhouders willen winst, toezichthouders wachten op één misstap.",
    tip: "Houd Reputatie boven 60 en Inkomsten boven 80, tien beurten op rij. Elk reputatieverlies telt drie keer.",
  },
};
