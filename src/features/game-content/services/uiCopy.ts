/**
 * All Dutch UI copy for the game screens, grouped by screen. UI laps import `UI_COPY` from
 * the game-content api instead of writing strings in components. `{name}` placeholders are
 * filled with `fillTemplate` from the same api.
 */
export const UI_COPY = {
  app: {
    name: "Clickbait Capital",
    tagline: "Jij bent het algoritme.",
  },
  start: {
    title: "Clickbait Capital",
    intro:
      "Speel het algoritme van een opkomend socialmediaplatform. Kies wat er in de feed komt en groei van zolderkamer tot beursgang.",
    startButton: "Start spel",
    continueButton: "Verder spelen",
    newGameButton: "Nieuw spel",
    howToPlayButton: "Hoe werkt het?",
  },
  tutorial: [
    "Elke beurt krijg je drie kaarten: Viraal, Advertentie en Nieuws.",
    "Sleep één kaart naar de feed, of tik erop om hem te plaatsen.",
    "Viraal brengt gebruikers. Advertenties brengen geld. Nieuws brengt vertrouwen.",
    "Houd Inkomsten, Gebruikers en Reputatie boven nul. Raakt er één de nul, dan is het voorbij.",
    "Let op: niet alles wat je doet zie je meteen terug. Sommige keuzes komen later hard terug.",
  ],
  meters: {
    revenue: { label: "Inkomsten", description: "Geld voor servers en personeel." },
    users: { label: "Gebruikers", description: "Hoeveel mensen dagelijks scrollen." },
    reputation: {
      label: "Reputatie",
      description: "Vertrouwen van publiek, adverteerders en overheid.",
    },
  },
  cardTypes: {
    viral: { label: "Viraal", shortLabel: "Viraal" },
    ad: { label: "Advertentie", shortLabel: "Reclame" },
    news: { label: "Nieuws", shortLabel: "Nieuws" },
  },
  board: {
    phaseLabel: "Fase {phase} van 4",
    goalLabel: "Doel",
    turnLabel: "Beurt {turn}",
    goalStreakLabel: "Doel gehaald: {streak} van {needed} beurten op rij",
    usersStatLabel: "{users} gebruikers",
    revenueStatLabel: "{revenue} omzet",
    dragHint: "Sleep een kaart naar je feed",
    tapHint: "Tik op een kaart om hem te kiezen",
    confirmPlay: "In de feed",
    cancelPlay: "Toch niet",
    feedLabel: "Je feed",
    menuButton: "Menu",
    pauseTitle: "Gepauzeerd",
    resumeButton: "Verder",
    quitButton: "Stoppen",
    quitConfirm: "Weet je zeker dat je stopt? Je voortgang gaat verloren.",
    modifiers: {
      journalismDrought: {
        label: "Journalistieke droogte",
        description: "Al vijf beurten geen nieuws. Virale kaarten zijn nu extra riskant.",
      },
      echoChamber: {
        label: "Echokamer",
        description: "Drie keer viraal op rij: meer gebruikers, maar de sfeer wordt grimmig.",
      },
      adFatigue: {
        label: "Reclamemoeheid",
        description: "Te veel reclame: advertenties leveren minder op en jagen mensen weg.",
      },
      reputationDecay: {
        label: "Vertrouwen lekt weg",
        description: "Je feed negeert het nieuws. Je reputatie zakt elke beurt.",
      },
    },
    effectLabels: {
      gain: "+{value}",
      loss: "−{value}",
    },
  },
  phaseIntro: {
    continueButton: "Aan de slag",
  },
  events: {
    kicker: "Spoed",
    prompt: "Kies je beleid",
    optionKinds: {
      commercial: "Commercieel",
      engagement: "Ophef",
      journalism: "Journalistiek",
    },
    confirmButton: "Kies dit",
  },
  results: {
    wonKicker: "Beursgang geslaagd",
    lostKicker: "Game over",
    playAgainButton: "Opnieuw spelen",
    backToStartButton: "Naar het begin",
    shareButton: "Deel je resultaat",
    shareText:
      "Ik speelde Clickbait Capital en haalde fase {phase} in {turns} beurten. Kun jij het algoritme beter bespelen?",
    shareCopied: "Link gekopieerd",
    statsTitle: "Jouw platform",
    turnsLabel: "Beurten",
    phaseReachedLabel: "Fase bereikt",
    usersLabel: "Gebruikers",
    revenueLabel: "Totale omzet",
    playedTitle: "Wat je in de feed stopte",
  },
  settings: {
    title: "Instellingen",
    sound: "Geluid",
    music: "Muziek",
    vibration: "Trillen",
    reducedMotion: "Minder beweging",
    reducedMotionHint: "Geen schermtrilling of vliegende emoji.",
    resetProgress: "Voortgang wissen",
    resetConfirm: "Weet je het zeker? Dit kan niet ongedaan worden.",
    on: "Aan",
    off: "Uit",
    closeButton: "Sluiten",
  },
  credits: {
    title: "Over dit spel",
    body: "Clickbait Capital laat zien waarom sociale media steeds meer draaien om ophef: aandacht en reclame betalen meteen, de schade komt later.",
    disclaimer:
      "Alle bedrijven, merken, personen en gebeurtenissen in dit spel zijn verzonnen. Elke gelijkenis met echte platforms is helaas geen toeval.",
    madeBy: "Gemaakt door TMI",
    imagesHeading: "Beelden",
    imagesIntro:
      "Alle foto's staan onder een open licentie (CC0 of CC BY). Met dank aan de makers:",
    audioHeading: "Geluid",
    closeButton: "Sluiten",
  },
  errors: {
    generic: "Er ging iets mis. Probeer het opnieuw.",
    gameCrashed: "Het spel liep vast. Je kunt opnieuw beginnen.",
    invalidMove: "Die kaart kun je nu niet spelen.",
    offline: "Je bent offline. Het spel werkt gewoon door, delen lukt pas als je weer online bent.",
    saveFailed: "Je voortgang kon niet worden bewaard.",
    loadFailed: "Je opgeslagen spel kon niet worden geladen. Begin een nieuw spel.",
    retryButton: "Opnieuw proberen",
    restartButton: "Nieuw spel",
  },
  emptyStates: {
    noSavedGame: "Nog geen spel bezig. Start een nieuw spel.",
    noResults: "Je hebt nog niet gespeeld. Je eerste beursgang wacht.",
    emptyFeed: "Je feed is nog leeg. Sleep er een kaart in.",
    noEvents: "Geen crises. Nog niet.",
  },
  loading: {
    game: "Feed laden…",
    shuffle: "Kaarten schudden…",
  },
} as const;
