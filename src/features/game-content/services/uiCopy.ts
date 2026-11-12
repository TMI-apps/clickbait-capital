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
      "Jij bent het algoritme van een nieuwe app. Kies wat er in de feed komt en groei van zolderkamer tot beursgang.",
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
      "Jij bent het [[algoritme]] van een nieuwe app. Je groeit in vier fases van zolderkamer tot [[beursgang]].",
    phasesTitle: "Vier fases",
    phases:
      "Zolderkamer, Scale-Up, Wereldwijd Platform en Beursgang. Elke fase heeft twee doellijnen: één voor gebruikers en één voor geld. Haal je ze allebei, dan ga je naar de volgende fase. Daar zijn de kosten hoger en let de wereld beter op.",
    scoreTitle: "Gebruikers en geld",
    score:
      "Je begint met 0 gebruikers. Hoe meer gebruikers je hebt, hoe sneller je groeit en hoe meer reclame oplevert. De grafiek laat zien hoe je gebruikers en je geld groeien. Houd een kaart ingedrukt of sleep hem: een stippellijn laat zien waar je uitkomt. Elke beurt kost je app geld. Zakt je geld onder nul, dan ben je [[bankroet]].",
    eventsTitle: "Spoed!",
    events:
      "Soms gaat er iets mis op je app. Dan kies je uit drie opties: geld verdienen, ophef maken of eerlijk nieuws. Pas na je keuze zie je wat die doet.",
    scandalTitle: "Schandaal dreigt",
    scandal:
      "Ophef en reclame zonder nieuws maken mensen boos. Dat zie je niet meteen. Staat er 'Schandaal dreigt', dan kan er elke beurt een schandaal komen. Dat kost een boete: hoe meer gebruikers, hoe hoger. Eerlijk nieuws maakt de kans kleiner.",
    winTitle: "Winnen",
    win: "Haal in de laatste fase 10 miljoen gebruikers en € 20 miljoen. Dan gaat je app naar de [[beurs]]. Daarna krijg je een rapport: wat kostte jouw succes de rest van de wereld?",
    startButton: "Start spel",
    backButton: "Naar het begin",
  },
  tutorial: [
    "Elke beurt krijg je drie kaarten: Viraal, Advertentie en Nieuws.",
    "Sleep één kaart naar de [[feed]]. Of tik erop: dan lees je meer en kies je 'In de feed'.",
    "Houd een kaart ingedrukt: de stippellijn op de grafiek laat zien wat hij met je gebruikers en geld doet.",
    "Viraal brengt veel nieuwe gebruikers, Nieuws een paar. Advertenties maken van je gebruikers geld. Nieuws houdt schandalen weg.",
    "Haal elke fase de doellijn voor gebruikers én voor geld. Zakt je geld onder nul, dan ben je [[bankroet]].",
    "Let op: je ziet niet alles meteen. Zie je 'Schandaal dreigt', dan komen je keuzes hard terug.",
  ],
  meters: {
    revenue: { label: "Geld" },
    users: { label: "Gebruikers" },
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
    dragHint: "Sleep een kaart naar je feed",
    confirmPlay: "In de feed",
    cancelPlay: "Toch niet",
    feedLabel: "Je feed",
    menuButton: "Menu",
    pauseTitle: "Gepauzeerd",
    resumeButton: "Verder",
    quitButton: "Stoppen",
    resumedAnnouncement: "Spel hervat. Fase {phase} van 4: {name}. Beurt {turn}.",
  },
  resume: {
    kicker: "Opgeslagen spel",
    title: "Verder waar je was?",
    body: "Je vorige spel staat nog klaar. Kies je Nieuw spel, dan is het oude spel weg.",
  },
  phaseIntro: {
    continueButton: "Aan de slag",
  },
  events: {
    kicker: "Spoed",
    prompt: "Wat doe je?",
    outcomeKicker: "Je koos",
    continueButton: "Verder",
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
      "Ik speelde Clickbait Capital en haalde fase {phase} in {turns} beurten, met {users} gebruikers op mijn hoogtepunt. Kun jij het algoritme beter bespelen?",
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
    moneyLabel: "Geld aan het eind",
    playedTitle: "Wat je in de feed stopte",
  },
  settings: {
    title: "Instellingen",
    sound: "Geluid",
    music: "Muziek",
    vibration: "Trillen",
    vibrationHint: "Een korte tik bij grote momenten, zoals een schandaal of je doel halen.",
    reducedMotion: "Minder beweging",
    reducedMotionHint: "Geen trillend scherm of vliegende emoji.",
    resetProgress: "Voortgang wissen",
    resetConfirm: "Weet je het zeker? Dit kun je niet terugdraaien.",
    on: "Aan",
    off: "Uit",
    closeButton: "Sluiten",
    openButton: "Instellingen",
    backButton: "Terug",
    motion: "Beweging",
    motionHint: "Verminderd: geen trillend scherm, confetti of vliegende emoji.",
    motionOptions: { system: "Systeem", reduced: "Verminderd", full: "Volledig" },
    colorMode: "Weergave",
    colorModeOptions: { light: "Licht", dark: "Donker", system: "Systeem" },
    resetHint:
      "Wist je keuzes voor geluid, trillen en beweging en een bewaard spel op dit apparaat.",
    resetConfirmButton: "Ja, wissen",
    resetCancelButton: "Annuleren",
    resetDone: "Voortgang gewist.",
  },
  credits: {
    title: "Over dit spel",
    body: "Clickbait Capital laat zien waarom sociale media steeds meer om ophef draaien. Aandacht en reclame leveren meteen geld op. De schade komt later.",
    disclaimer:
      "Alle bedrijven, merken, personen en gebeurtenissen in dit spel zijn verzonnen. Lijkt iets op een echte app? Dat is helaas geen toeval.",
    madeBy: "Gemaakt door TMI",
    imagesHeading: "Beelden",
    imagesIntro:
      "De meeste foto's komen van Unsplash: iedereen mag ze gebruiken, met de naam van de maker erbij. Een paar foto's zijn van TMI zelf en één plaatje is met AI gemaakt. Met dank aan de makers:",
    audioHeading: "Geluid",
    privacyLink: "Privacy",
    closeButton: "Sluiten",
  },
  /** Every claim must match the code: audit in documentation/DOC_DECISION_LOG.md § launch-basics. */
  privacy: {
    title: "Privacy",
    intro: "Kort gezegd: je hebt geen account nodig en we volgen je niet.",
    points: [
      "Geen account en geen inlog. We vragen nooit je naam of e-mailadres.",
      "Geen cookies, geen reclame, geen bezoekerstellers en geen [[trackers|tracker]].",
      "Je instellingen (weergave, geluid, trillen en beweging) en een spel dat nog bezig is, bewaart je browser alleen op dit apparaat. Zo kun je later verder spelen. Niets daarvan gaat ergens heen. Het spel wordt gewist zodra het afgelopen is.",
      "Je browser bewaart de bestanden van het spel en de kaartfoto's op dit apparaat. Zo kun je ook zonder internet spelen.",
      "De site draait bij Cloudflare. Zoals bij elke website ziet die [[server]] je [[IP-adres]], anders kan hij de pagina niet sturen. Wij gebruiken dat niet om je te volgen.",
    ],
    errorReports:
      "Loopt het spel vast, dan sturen we een foutmelding naar onze server: wat er misging, op welke pagina en in welke browser. Zonder je naam of andere gegevens over jou.",
    clearHint:
      "Alles wissen? Verwijder de gegevens van deze site in je browser. Geluid, beweging en een opgeslagen spel wis je ook via Instellingen.",
    creditsHint: "Wie de foto's en geluiden maakte, staat bij",
    creditsLink: "Credits",
    closeButton: "Sluiten",
  },
  errors: {
    generic: "Er ging iets mis. Probeer het opnieuw.",
    gameCrashed: "Het spel liep vast. Je kunt opnieuw beginnen.",
    invalidMove: "Die kaart kun je nu niet spelen.",
    offline:
      "Je hebt geen internet. Het spel werkt gewoon door. Delen lukt pas als je weer internet hebt.",
    saveFailed: "Je voortgang kon niet worden bewaard.",
    loadFailed: "Je opgeslagen spel kon niet worden geladen. Begin een nieuw spel.",
    retryButton: "Opnieuw proberen",
    restartButton: "Nieuw spel",
  },
  appStatus: {
    offlineBanner: "Je hebt geen internet. Het spel werkt gewoon door.",
    offlineTitle: "Geen internet",
    offlineBody: "Deze pagina staat nog niet op je apparaat. Zoek internet en probeer het opnieuw.",
    loadFailedTitle: "Laden mislukt",
    loadFailedBody:
      "Het spel kon niet worden geladen. Probeer het opnieuw of ga terug naar het begin.",
    unsupportedTitle: "Browser niet ondersteund",
    unsupportedBody: "Deze browser kan het spel niet spelen. Er missen onderdelen.",
    browserTip: "Tip: speel in een recente versie van Chrome, Safari, Firefox of Edge.",
    retryButton: "Opnieuw proberen",
    homeButton: "Naar het begin",
  },
  comments: {
    label: "Reacties van je volgers",
    moreOne: "+1 reactie",
    more: "+{count} reacties",
    leftLine: "{name} ontvolgt je 👋",
    announcement: "Reactie: {name}: {text}",
  },
  emptyStates: {
    noSavedGame: "Nog geen spel bezig. Start een nieuw spel.",
    noResults: "Je hebt nog niet gespeeld. Je eerste beursgang wacht.",
    emptyFeed: "Je feed is nog leeg. Sleep er een kaart in.",
    noEvents: "Geen problemen. Nog niet.",
  },
  loading: {
    game: "Feed laden…",
    shuffle: "Kaarten schudden…",
  },
} as const;

/**
 * Hard words in the player-facing copy, with a short meaning for 11-year-olds (kids-content
 * D1). Strings mark a word as `[[woord]]` or `[[getoonde vorm|term]]`; the kit's
 * `GlossaryText` shows the meaning on tap. Keys are lower case. `gameContent.test.ts` checks that
 * every marked term is here and every entry is used.
 */
export const GLOSSARY: Readonly<Record<string, string>> = {
  aandeelhouder:
    "Iemand die een stukje van een bedrijf bezit. Die wil dat het bedrijf veel winst maakt.",
  abonnement: "Je betaalt elke maand opnieuw, tot je stopt.",
  adverteerder: "Een bedrijf dat betaalt om zijn reclame te laten zien.",
  advertentie: "Een ander woord voor reclame.",
  algoritme:
    "Een computerregel die kiest wat jij te zien krijgt. Hij kiest vaak wat je lang laat kijken.",
  anoniem: "Je weet niet wie het is.",
  "battle pass": "Een betaalde pas in een game. Hoe meer je speelt, hoe meer beloningen je krijgt.",
  beurs: "Een markt waar mensen stukjes van bedrijven kopen en verkopen.",
  beursgang:
    "Het moment dat iedereen stukjes van je bedrijf kan kopen. Dan ben je een heel groot bedrijf.",
  bankroet: "Als een bedrijf zijn rekeningen niet meer kan betalen. Dan is het voorbij.",
  boost: "Een post extra vaak laten zien, zodat veel meer mensen hem zien.",
  bot: "Een computerprogramma dat doet alsof het een mens is.",
  bron: "Waar informatie vandaan komt. Zo kun je checken of het klopt.",
  clickbait: "Een titel of plaatje dat expres overdreven is, zodat jij erop klikt.",
  complot:
    "Een verhaal dat zegt dat een geheime groep stiekem alles regelt. Meestal zonder bewijs.",
  concurrent: "Een ander bedrijf dat hetzelfde doet en jouw klanten wil hebben.",
  cryptomunt: "Geld dat alleen op internet bestaat. Het kan heel snel veel minder waard worden.",
  data: "Gegevens over jou: wat je kijkt, liket en zoekt.",
  datalek: "Als geheime gegevens, zoals wachtwoorden, bij de verkeerde mensen terechtkomen.",
  deepfake:
    "Een nepvideo, gemaakt met AI. Iemand zegt of doet daarin dingen die nooit gebeurd zijn.",
  desinformatie: "Nepnieuws dat expres wordt verspreid om mensen voor de gek te houden.",
  detox:
    "Een kuur die je lichaam zogenaamd schoonmaakt. Dokters zeggen: dat doet je lichaam zelf al.",
  dropshipping:
    "Spullen online verkopen die je zelf nooit ziet. De fabriek stuurt ze meteen naar de koper.",
  factcheck: "Uitzoeken of iets echt waar is.",
  feed: "De lijst met berichten en filmpjes die je ziet als je scrolt.",
  hoorzitting: "Een vergadering waar politici jou vragen stellen. Jij moet antwoord geven.",
  inflatie: "Als alles duurder wordt. Met hetzelfde geld kun je dan minder kopen.",
  influencer:
    "Iemand met veel volgers. Bedrijven betalen influencers om hun spullen aan te prijzen.",
  investeerder: "Iemand die geld in je bedrijf stopt en later meer geld terug wil.",
  "ip-adres":
    "Het adres van je apparaat op internet. Zo weet een website waar hij de pagina heen moet sturen.",
  journalist: "Iemand die uitzoekt wat er echt gebeurt en daar eerlijk over schrijft.",
  klokkenluider: "Iemand die vertelt wat er in een bedrijf fout gaat, ook al wil de baas dat niet.",
  "loot box":
    "Een kist in een game die je met echt geld koopt. Je weet niet wat erin zit. Meestal is het iets saais.",
  misleidend: "Het klopt niet helemaal en zet je op het verkeerde spoor.",
  nepaccount: "Een account dat doet alsof het van iemand anders is.",
  nepnieuws: "Een bericht dat doet alsof het waar is, maar niet klopt.",
  oplichter: "Iemand die mensen bedriegt om hun geld of spullen af te pakken.",
  parlement: "De groep politici die de wetten van een land maakt.",
  petitie: "Een lijst met namen van mensen die samen iets willen veranderen.",
  premium: "Een betaalde versie van een app, met extra's.",
  privacy: "Dat je zelf bepaalt wie wat over jou weet.",
  rectificatie: "Een bericht waarin je zegt: wat we eerder schreven, klopte niet.",
  "scale-up": "Een jong bedrijf dat heel snel groeit.",
  server:
    "Een computer die websites en apps naar je toestuurt. Een eigen server kost elke maand geld.",
  sponsor: "Een bedrijf dat iemand betaalt om zijn product te laten zien.",
  toezichthouder:
    "Een organisatie die controleert of bedrijven zich aan de regels houden. Die kan boetes geven.",
  tracker: "Een stukje code dat bijhoudt wat jij op internet doet.",
  transparant: "Open en eerlijk laten zien hoe iets werkt.",
  verdienmodel: "De manier waarop een bedrijf geld verdient.",
  verkiezingen: "Als volwassenen stemmen wie het land of de gemeente gaat besturen.",
};
