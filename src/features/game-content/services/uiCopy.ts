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
    howToPlayButton: "Hoe speel je?",
    settingsButton: "Instellingen",
    creditsButton: "Credits",
    privacyLink: "Privacy",
  },
  howToPlay: {
    title: "Hoe speel je?",
    intro:
      "Jij bent het algoritme van een nieuw socialmediaplatform. Groei in vier fases van zolderkamer tot beursgang.",
    phasesTitle: "Vier fases",
    phases:
      "Zolderkamer, Scale-up, Wereldplatform en Beursgang. Elke fase heeft een doel; haal je het, dan stijgen de kosten en kijkt de wereld scherper mee.",
    eventsTitle: "Spoed!",
    events:
      "Soms onderbreekt een crisis je feed. Kies dan een van drie beleidsopties: commercieel, ophef of journalistiek.",
    winTitle: "Winnen",
    win: "Houd in de laatste fase je reputatie en inkomsten lang genoeg hoog en je platform gaat naar de beurs.",
    startButton: "Start spel",
    backButton: "Naar het begin",
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
    resumedAnnouncement: "Spel hervat. Fase {phase} van 4: {name}. Beurt {turn}.",
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
  resume: {
    kicker: "Opgeslagen spel",
    title: "Verder waar je was?",
    body: "Je vorige spel staat nog klaar. Kies je Nieuw spel, dan wordt het gewist.",
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
    reportButton: "Bekijk je rapport",
    shareButton: "Deel je resultaat",
    shareText:
      "Ik speelde Clickbait Capital en haalde fase {phase} in {turns} beurten. Kun jij het algoritme beter bespelen?",
    shareCopied: "Link gekopieerd.",
    shareDoneStatus: "Gedeeld. Benieuwd wie het algoritme beter bespeelt.",
    shareSavedAndCopiedStatus: "Afbeelding opgeslagen en link gekopieerd.",
    shareSavedStatus: "Afbeelding opgeslagen.",
    shareFailedStatus: "Delen lukte niet. Probeer het nog eens.",
    shareCardFooter: "Speel gratis op",
    shareFileName: "clickbait-capital-resultaat.png",
    statsTitle: "Jouw platform",
    turnsLabel: "Beurten",
    phaseReachedLabel: "Fase bereikt",
    usersLabel: "Hoogste bereik",
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
    openButton: "Instellingen",
    backButton: "Terug",
    motion: "Beweging",
    motionHint: "Verminderd: geen schermtrilling, confetti of vliegende emoji.",
    motionOptions: { system: "Systeem", reduced: "Verminderd", full: "Volledig" },
    colorMode: "Weergave",
    colorModeOptions: { light: "Licht", dark: "Donker", system: "Systeem" },
    resetHint: "Wist je geluid- en bewegingskeuze en een bewaard spel op dit apparaat.",
    resetConfirmButton: "Ja, wissen",
    resetCancelButton: "Annuleren",
    resetDone: "Voortgang gewist.",
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
    privacyLink: "Privacy",
    closeButton: "Sluiten",
  },
  /** Every claim must match the code: audit in documentation/jobs/temp_job_launch-basics/BRIEF.md. */
  privacy: {
    title: "Privacy",
    intro: "Kort gezegd: je hebt geen account nodig en we volgen je niet.",
    points: [
      "Geen account en geen inlog. We vragen nooit je naam of e-mailadres.",
      "Geen cookies, geen advertenties, geen bezoekersstatistieken en geen trackers.",
      "Je instellingen (weergave, geluid en beweging) en een spel dat nog bezig is, bewaart je browser alleen op dit apparaat, zodat je later verder kunt spelen. Niets daarvan gaat ergens heen, en het spel wordt gewist zodra het afgelopen is.",
      "Om ook offline te kunnen spelen, bewaart je browser de bestanden van het spel en de kaartfoto's op dit apparaat.",
      "De site draait bij Cloudflare. Zoals bij elke website ziet die server je IP-adres om de pagina te kunnen sturen. Wij gebruiken dat niet om je te volgen.",
    ],
    errorReports:
      "Loopt het spel vast, dan sturen we een foutmelding naar onze server: wat er misging, op welke pagina en in welke browser. Zonder naam of andere gegevens over jou.",
    clearHint:
      "Alles wissen? Verwijder de websitegegevens van deze site in je browser. Geluid, beweging en een opgeslagen spel wis je ook via Instellingen.",
    creditsHint: "Wie de foto's en geluiden maakte, staat bij",
    creditsLink: "Credits",
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
  appStatus: {
    offlineBanner: "Je bent offline. Het spel werkt gewoon door.",
    offlineTitle: "Je bent offline",
    offlineBody:
      "Deze pagina is nog niet op je apparaat bewaard. Maak verbinding en probeer het opnieuw.",
    loadFailedTitle: "Laden mislukt",
    loadFailedBody:
      "Het spel kon niet worden geladen. Probeer het opnieuw of ga terug naar het begin.",
    unsupportedTitle: "Browser niet ondersteund",
    unsupportedBody: "Deze browser mist onderdelen die het spel nodig heeft.",
    browserTip: "Tip: speel in een recente versie van Chrome, Safari, Firefox of Edge.",
    retryButton: "Opnieuw proberen",
    homeButton: "Naar het begin",
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
