import type { EventDefinition } from "@/features/game-engine/api";
import type { EventPresentation } from "@/features/game-content/types/contentPresentation.types";

/**
 * Event cards (design § 4 Type 2): milestones on entering phases 2–4 and Toxicity
 * boomerangs. Options are always ordered A commercial, B engagement, C journalism.
 * The engine fires each event once and scales negative reputation per phase, so the
 * same −10 hurts three times as hard at the IPO. Events also model the engine README's
 * "Not modelled yet" lines: competitors and ad-pressure complaints (phase 2), fines and
 * hearings (phase 3).
 */
export const EVENT_CARDS: (EventDefinition & EventPresentation)[] = [
  {
    id: "event-eerste-shitstorm",
    title: "Je eerste shitstorm",
    body: "Een bericht op je app ontspoort. De campus praat nergens anders over. Je ouders bellen.",
    trigger: { kind: "toxicity", threshold: 35, phases: [1] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Verkoop advertentieruimte naast de ophef.",
        effects: { revenue: 12, reputation: -6, toxicity: 5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Zet het bovenaan. Ophef is gratis marketing.",
        effects: { users: 12, reputation: -8, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Haal het weg en leg uit waarom.",
        effects: { reputation: 6, users: -5, toxicity: -15 },
      },
    ],
    imageTheme: "storm cloud made of angry emoji raining over a tiny attic startup desk",
    imageAlt: "Een onweerswolk van boze emoji boven een klein bureau op een zolderkamer.",
  },
  {
    id: "event-investeerders",
    title: "Investeerders aan tafel",
    body: "Je eerste investeerders zitten aan tafel. Ze hebben dure sneakers en één vraag: wanneer verdienen we geld?",
    trigger: { kind: "milestone", phase: 2 },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Meer advertenties per feed, vanaf vandaag.",
        effects: { revenue: 18, users: -5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Beloof nog snellere groei, wat het ook kost.",
        effects: { revenue: 8, users: 10, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Investeer eerst in moderatie en betrouwbaarheid.",
        effects: { revenue: 4, reputation: 10, toxicity: -10 },
      },
    ],
    imageTheme:
      "venture capitalists in expensive sneakers around a glass table, pitch deck glowing",
    imageAlt: "Investeerders in dure sneakers rond een glazen tafel met een presentatie.",
  },
  {
    id: "event-concurrent-kloon",
    title: "Een concurrent kopieert je app",
    body: "Een nieuwe app lijkt verdacht veel op die van jou, maar dan sneller en harder. Je gebruikers kijken alvast rond.",
    trigger: { kind: "toxicity", threshold: 15, phases: [2] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Koop de concurrent op en zet hem uit.",
        effects: { revenue: -12, users: 8 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Kopieer hun hardste functies terug.",
        effects: { users: 12, reputation: -4, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Profileer je als de betrouwbare app.",
        effects: { users: -6, reputation: 8, toxicity: -8 },
      },
    ],
    imageTheme:
      "two near-identical app icons facing off, one slightly louder and neon, users drifting",
    imageAlt: "Twee bijna identieke app-iconen tegenover elkaar, met gebruikers ertussen.",
  },
  {
    id: "event-advertentieklachten",
    title: "Klachten over reclamedruk",
    body: "Gebruikers starten een petitie: 'Laat ons scrollen zonder reclame om de twee posts'. Adverteerders willen juist meer.",
    trigger: { kind: "toxicity", threshold: 35, phases: [2] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Negeer de petitie. Adverteerders betalen, petities niet.",
        effects: { revenue: 12, users: -10, toxicity: 5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Verstop reclame tussen virale clips.",
        effects: { revenue: 6, users: 4, reputation: -6, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Minder reclame en een eerlijke uitleg.",
        effects: { revenue: -10, users: 6, reputation: 6, toxicity: -8 },
      },
    ],
    imageTheme: "crowd of phone users holding a petition scroll made of ad banners, protest mood",
    imageAlt: "Gebruikers houden een lange petitie omhoog die is gemaakt van reclamebanners.",
  },
  {
    id: "event-moderatoren",
    title: "Moderatoren slaan alarm",
    body: "Je kleine moderatieteam verdrinkt in haat en nepnieuws. Ze willen meer mensen, of ze stoppen.",
    trigger: { kind: "toxicity", threshold: 55, phases: [2, 3] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Besteed moderatie uit aan het goedkoopste bureau.",
        effects: { revenue: 5, reputation: -6, toxicity: 6 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Laat een AI modereren. Die klaagt niet.",
        effects: { users: 8, reputation: -5, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Neem twintig extra moderatoren aan.",
        effects: { revenue: -12, reputation: 8, toxicity: -20 },
      },
    ],
    imageTheme:
      "exhausted content moderators at screens, sticky note 'help', flood of flagged posts",
    imageAlt: "Uitgeputte moderatoren achter schermen vol gemarkeerde berichten.",
  },
  {
    id: "event-wereldwijd",
    title: "De wereld kijkt mee",
    body: "Je app staat in honderd landen in de top tien. Overheden en kranten weten nu hoe je heet.",
    trigger: { kind: "milestone", phase: 3 },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Open een kantoor in een belastingparadijs.",
        effects: { revenue: 15, reputation: -5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Lanceer overal tegelijk, zonder lokale moderatie.",
        effects: { users: 10, reputation: -4, toxicity: 12 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Werk per land samen met lokale nieuwsredacties.",
        effects: { revenue: -6, reputation: 8, toxicity: -10 },
      },
    ],
    imageTheme: "world map lit up with app icons, government buildings and press cameras watching",
    imageAlt: "Een wereldkaart vol app-iconen met overheidsgebouwen en camera's eromheen.",
  },
  {
    id: "event-toezichthouder-boete",
    title: "Boete van de toezichthouder",
    body: "Een Europese toezichthouder stelt vast dat je feed schade aanricht. De boete heeft veel nullen.",
    trigger: { kind: "toxicity", threshold: 45, phases: [3] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Betaal de boete en ga gewoon door.",
        effects: { revenue: -18, toxicity: -5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Maak er een rel van: 'Brussel wil je feed afpakken!'",
        effects: { users: 8, reputation: -8, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Werk mee en pas het algoritme aan.",
        effects: { revenue: -8, users: -4, reputation: 4, toxicity: -20 },
      },
    ],
    imageTheme:
      "oversized fine letter with many zeros landing on a tech office desk, EU-blue tones",
    imageAlt: "Een enorme boetebrief met veel nullen op een bureau.",
  },
  {
    id: "event-verkiezingen",
    title: "Verkiezingen & Desinformatie",
    body: "Valse claims over de verkiezingen gaan rond op je platform. Partijen willen adverteren, trollen willen ruzie.",
    trigger: { kind: "toxicity", threshold: 60, phases: [3] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Laat de politieke micro-targeting advertenties toe.",
        effects: { revenue: 20, reputation: -5, toxicity: 12 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Laat de discussie woeden, sensatie brengt mensen naar de app.",
        effects: { users: 15, reputation: -12 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Schakel factcheckers in en label valse claims.",
        effects: { reputation: 12, revenue: -10, users: -5, toxicity: -20 },
      },
    ],
    imageTheme: "ballot box surrounded by swirling fake headlines and targeting crosshairs",
    imageAlt: "Een stembus omringd door wervelende nepkoppen en vizieren.",
  },
  {
    id: "event-hoorzitting",
    title: "Parlementaire hoorzitting",
    body: "Je moet komen uitleggen waarom je feed mensen boos maakt. Live op televisie.",
    trigger: { kind: "toxicity", threshold: 70, phases: [3, 4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Stuur je advocaten. Zeg niets, verdien door.",
        effects: { revenue: -6, reputation: -6 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Knip je beste oneliners en zet ze viral.",
        effects: { users: 10, reputation: -8, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Geef open antwoord en beloof onafhankelijk toezicht.",
        effects: { revenue: -10, users: -4, reputation: 6, toxicity: -25 },
      },
    ],
    imageTheme:
      "tech founder at a hearing table facing a parliament panel, TV cameras, sweaty brow",
    imageAlt: "Een oprichter aan een tafel tegenover een commissie, met tv-camera's in de zaal.",
  },
  {
    id: "event-adverteerdersboycot",
    title: "Adverteerders boycotten je",
    body: "Grote merken willen niet langer naast haatberichten staan. Ze trekken hun budget terug.",
    trigger: { kind: "toxicity", threshold: 80, phases: [3, 4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Lok ze terug met korting en garanties op papier.",
        effects: { revenue: -12, toxicity: -5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Wie heeft merken nodig? Meer ophef, meer kleine adverteerders.",
        effects: { revenue: -6, users: 8, reputation: -6, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Ruim de feed op en laat een audit doen.",
        effects: { revenue: -15, users: -5, reputation: 6, toxicity: -25 },
      },
    ],
    imageTheme: "brand logos walking out of a door, empty billboard spaces, frowning accountant",
    imageAlt: "Merklogo's lopen een deur uit en laten lege reclameborden achter.",
  },
  {
    id: "event-roadshow",
    title: "Roadshow voor de beurs",
    body: "Bankiers willen een verhaal voor beleggers. 'Groei' is een goed woord. 'Verantwoordelijk' ook, als het niets kost.",
    trigger: { kind: "milestone", phase: 4 },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Beloof elk kwartaal meer advertentie-inkomsten.",
        effects: { revenue: 15, users: -4 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Toon de gebruikersgroei, laat de rest weg.",
        effects: { users: 10, reputation: -3, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Leg eerlijk uit wat het platform kost en oplevert.",
        effects: { reputation: 8, revenue: -5, toxicity: -10 },
      },
    ],
    imageTheme: "bankers in suits presenting hockey-stick growth chart to investors, stock ticker",
    imageAlt: "Bankiers presenteren een steil stijgende grafiek aan beleggers.",
  },
  {
    id: "event-shortseller",
    title: "Rapport van een shortseller",
    body: "Een belegger die op je val gokt, publiceert een rapport: je groei zou vooral uit bots en ruzie bestaan.",
    trigger: { kind: "toxicity", threshold: 40, phases: [4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Koop eigen aandelen in om de koers te redden.",
        effects: { revenue: -12, reputation: 4 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Zet je fans op hem af.",
        effects: { users: 8, reputation: -6, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Laat een onafhankelijke accountant de cijfers controleren.",
        effects: { revenue: -6, reputation: 6, toxicity: -15 },
      },
    ],
    imageTheme: "red downward stock chart over a thick critical report, bear silhouette",
    imageAlt: "Een dalende koersgrafiek boven een dik kritisch rapport.",
  },
  {
    id: "event-gelekte-documenten",
    title: "Gelekte documenten",
    body: "Interne stukken lekken uit: je wist dat de feed jongeren ongelukkig maakt en deed niets.",
    trigger: { kind: "toxicity", threshold: 65, phases: [4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Laat een pr-bureau het verhaal draaien.",
        effects: { revenue: -8, reputation: -4 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Lanceer snel een nieuwe filter om de aandacht af te leiden.",
        effects: { users: 10, reputation: -6, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Erken het en pas de feed voor jongeren aan.",
        effects: { revenue: -10, users: -5, reputation: 6, toxicity: -25 },
      },
    ],
    imageTheme: "stack of confidential documents spilling out of a folder, red 'internal' stamps",
    imageAlt:
      "Een stapel vertrouwelijke documenten met rode stempels 'intern' die uit een map glijdt.",
  },
];
