import type { GameContent } from "@/features/game-engine/types/gameContent.types";

/**
 * Small seed content: a default balance and the four phases from the design doc, plus a
 * minimal deck (two cards per type, three events). Test fixture and placeholder until the
 * content lap supplies the full deck; numbers are first guesses, not tuned.
 */
export const SEED_CONTENT: GameContent = {
  balance: {
    startMeter: 50,
    startStats: { users: 1000, revenue: 0 },
    newsIgnoredToxicity: 2,
    reputationDecay: { afterTurnsWithoutNews: 3, amount: 3 },
    adFatigue: { window: 4, adsInWindow: 3, revenueMultiplier: 0.5, userLossMultiplier: 2 },
    echoChamber: { streak: 3, userGainMultiplier: 1.5, toxicity: 25 },
    journalismDrought: { afterTurnsWithoutNews: 5, viralToxicityMultiplier: 2 },
  },
  phases: [
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
      passiveCosts: { revenue: -5 },
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
      passiveCosts: { revenue: -6 },
      usersPerPoint: 1_000_000,
      revenuePerPoint: 100_000,
      reputationLossMultiplier: 3,
      revenueGainMultiplier: 1,
    },
  ],
  cards: [
    {
      id: "viral-livestream",
      type: "viral",
      title: "Woedende livestream",
      body: "Een influencer gaat live los op een buurman.",
      effects: { users: 12, toxicity: 8 },
    },
    {
      id: "viral-ruzie",
      type: "viral",
      title: "Ruzie tussen rappers",
      body: "Twee artiesten schelden elkaar uit in de reacties.",
      effects: { users: 15, reputation: -2, toxicity: 12 },
    },
    {
      id: "ad-gokapp",
      type: "ad",
      title: "Gok-app promo",
      body: "Gratis inzet voor nieuwe spelers!",
      effects: { revenue: 15, users: -3 },
    },
    {
      id: "ad-crypto",
      type: "ad",
      title: "Crypto-sponsor",
      body: "Word rijk met MoonCoin.",
      effects: { revenue: 20, users: -5, toxicity: 3 },
    },
    {
      id: "news-klimaat",
      type: "news",
      title: "Klimaatakkoord",
      body: "Een nuchter verslag van de onderhandelingen.",
      effects: { reputation: 8, users: -4, toxicity: -10 },
    },
    {
      id: "news-factcheck",
      type: "news",
      title: "Factcheck: virale foto nep",
      body: "Onderzoeksjournalisten ontmaskeren een hoax.",
      effects: { reputation: 10, users: -6, toxicity: -12 },
    },
  ],
  events: [
    {
      id: "event-investeerders",
      title: "Investeerders aan tafel",
      body: "Je eerste investeerders eisen rendement.",
      trigger: { kind: "milestone", phase: 2 },
      options: [
        {
          id: "a",
          kind: "commercial",
          label: "Meer advertenties per feed.",
          effects: { revenue: 15, users: -5 },
        },
        {
          id: "b",
          kind: "engagement",
          label: "Beloof nog snellere groei.",
          effects: { users: 10, toxicity: 10 },
        },
        {
          id: "c",
          kind: "journalism",
          label: "Investeer in moderatie.",
          effects: { reputation: 10, revenue: -10 },
        },
      ],
    },
    {
      id: "event-verkiezingen",
      title: "Verkiezingen & Desinformatie",
      body: "Valse claims over de verkiezingen gaan rond op je platform.",
      trigger: { kind: "toxicity", threshold: 60, phases: [3] },
      options: [
        {
          id: "a",
          kind: "commercial",
          label: "Laat de politieke micro-targeting advertenties toe.",
          effects: { revenue: 25, reputation: -5, toxicity: 15 },
        },
        {
          id: "b",
          kind: "engagement",
          label: "Laat de discussie woeden, sensatie brengt mensen naar de app.",
          effects: { users: 25, reputation: -20 },
        },
        {
          id: "c",
          kind: "journalism",
          label: "Schakel factcheckers in en label valse claims.",
          effects: { reputation: 25, revenue: -15, users: -5, toxicity: -20 },
        },
      ],
    },
    {
      id: "event-eu-boete",
      title: "EU-boete",
      body: "Brussel onderzoekt de schade die je feed aanricht.",
      trigger: { kind: "toxicity", threshold: 75 },
      options: [
        {
          id: "a",
          kind: "commercial",
          label: "Betaal de boete en ga door.",
          effects: { revenue: -25 },
        },
        {
          id: "b",
          kind: "engagement",
          label: "Maak er een virale rel van.",
          effects: { users: 10, reputation: -25 },
        },
        {
          id: "c",
          kind: "journalism",
          label: "Werk mee aan het onderzoek.",
          effects: { reputation: -5, revenue: -10, toxicity: -25 },
        },
      ],
    },
  ],
};
