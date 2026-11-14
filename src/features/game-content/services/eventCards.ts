import type { EventDefinition } from "@/features/game-engine/api";
import type { EventPresentation } from "@/features/game-content/types/contentPresentation.types";

/**
 * Event cards (design § 4 Type 2): milestones on entering phases 2–4 and scandals, drawn by
 * the per-turn scandal chance once hidden reputation is low (score-redesign D13, D14). Options are always ordered A commercial, B engagement, C journalism.
 * The engine fires each event once (the first open one in this order) and scales negative
 * reputation per phase, so the same −10 hurts much harder at the IPO. Events also model the
 * engine README's "Not modelled yet" lines: competitors and ad-pressure complaints (phase 2),
 * fines and hearings (phase 3). Written for 11-year-olds (kids-content).
 */
export const EVENT_CARDS: (EventDefinition & EventPresentation)[] = [
  {
    id: "event-gemeen-filmpje",
    title: "Gemeen filmpje over een klasgenoot",
    body: "Op je app gaat een gemeen filmpje rond over een kind uit groep 8. Ouders bellen de school. Iedereen kijkt naar jouw app.",
    trigger: { kind: "scandal", phases: [1] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Zet er reclame naast. Er kijken nu veel mensen.",
        effects: { revenue: 10, reputation: -5, toxicity: 5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Laat het filmpje bovenaan staan. Het trekt kijkers.",
        effects: { users: 10, reputation: -6, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Haal het weg en leg uit waarom pesten niet mag.",
        effects: { reputation: 5, users: -4, toxicity: -12 },
      },
    ],
    imageTheme:
      "youtube thumbnail style: phone with a blurred mean video, worried parents calling, school building behind",
    imageAlt: "Een telefoon met een wazig filmpje en bezorgde ouders die de school bellen.",
  },
  {
    id: "event-eerste-shitstorm",
    title: "Je eerste ophef",
    body: "Een bericht op je app loopt uit de hand. De hele school praat erover. Je ouders ook.",
    trigger: { kind: "scandal", phases: [1] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Verkoop reclameplekken naast de ophef.",
        effects: { revenue: 12, reputation: -6, toxicity: 5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Zet het bovenaan. Ophef is gratis reclame.",
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
    body: "Je eerste [[investeerders|investeerder]] komen langs. Ze dragen dure sneakers en hebben één vraag: wanneer verdienen we geld?",
    trigger: { kind: "milestone", phase: 2 },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Meer reclame in elke feed, vanaf vandaag.",
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
        label: "Geef eerst geld uit aan controle en veiligheid.",
        effects: { revenue: -6, reputation: 10, toxicity: -10 },
      },
    ],
    imageTheme: "investors in expensive sneakers around a glass table with a pitch deck on screen",
    imageAlt: "Investeerders in dure sneakers rond een glazen tafel met een presentatie.",
  },
  {
    id: "event-concurrent-kloon",
    title: "Een andere app doet je na",
    body: "Een nieuwe app lijkt heel erg op die van jou. Maar dan sneller en harder. Je gebruikers kijken alvast rond bij die [[concurrent]].",
    trigger: { kind: "scandal", phases: [2] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Koop die app en zet hem uit.",
        effects: { revenue: -12, users: 8 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Doe hun hardste trucjes na.",
        effects: { users: 12, reputation: -4, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Word de app die je kunt vertrouwen.",
        effects: { users: -6, reputation: 8, toxicity: -8 },
      },
    ],
    imageTheme: "two nearly identical app icons facing off, users standing between them",
    imageAlt: "Twee bijna identieke app-iconen tegenover elkaar, met gebruikers ertussen.",
  },
  {
    id: "event-advertentieklachten",
    title: "Klachten over te veel reclame",
    body: "Gebruikers starten een [[petitie]]: 'Niet om de twee berichten reclame!' Maar de [[adverteerders|adverteerder]] willen juist meer.",
    trigger: { kind: "scandal", phases: [2] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Negeer het. Adverteerders betalen, petities niet.",
        effects: { revenue: 12, users: -10, toxicity: 5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Verstop reclame tussen virale filmpjes.",
        effects: { revenue: 6, users: 4, reputation: -6, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Minder reclame en eerlijk uitleggen waarom.",
        effects: { revenue: -10, users: 6, reputation: 6, toxicity: -8 },
      },
    ],
    imageTheme: "crowd of phone users holding a petition scroll made of ad banners, protest mood",
    imageAlt: "Gebruikers houden een lange petitie omhoog die is gemaakt van reclamebanners.",
  },
  {
    id: "event-gevaarlijke-challenge",
    title: "Een challenge wordt gevaarlijk",
    body: "Een nieuwe challenge gaat rond op je app. Kinderen raken gewond. Het nieuws praat over jouw app.",
    trigger: { kind: "scandal", phases: [2, 3] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Verkoop reclame bij de challenge-filmpjes.",
        effects: { revenue: 8, reputation: -5, toxicity: 5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Laat de challenge bovenaan staan. Iedereen kijkt.",
        effects: { users: 10, reputation: -6, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Stop de challenge en laat een waarschuwing zien.",
        effects: { users: -5, reputation: 6, toxicity: -15 },
      },
    ],
    imageTheme:
      "youtube thumbnail style: trending challenge hashtag with ambulance light flashing, worried news anchor",
    imageAlt: "Een trending challenge met een zwaailicht van een ambulance erachter.",
  },
  {
    id: "event-skins-oplichting",
    title: "Oplichters beloven gratis skins",
    body: "Op je app staan honderden reclames voor 'gratis skins'. Kinderen raken hun account kwijt aan [[oplichters|oplichter]]. Ouders zijn woedend.",
    trigger: { kind: "scandal", phases: [2, 3] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Laat de reclames staan. Ze betalen wel.",
        effects: { revenue: 10, reputation: -6, toxicity: 6 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Maak er een spel van: wie vindt de echte giveaway?",
        effects: { users: 8, reputation: -5, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Haal alle nepreclames weg en waarschuw iedereen.",
        effects: { revenue: -12, reputation: 8, toxicity: -20 },
      },
    ],
    imageTheme:
      "youtube thumbnail style: shiny 'FREE SKINS' banner cracking open to reveal a hooded scammer, angry parents",
    imageAlt: "Een banner 'gratis skins' die openbreekt, met een oplichter met capuchon erachter.",
  },
  {
    id: "event-wereldwijd",
    title: "De wereld kijkt mee",
    body: "Je app staat in honderd landen in de top tien. Regeringen en kranten kennen nu je naam.",
    trigger: { kind: "milestone", phase: 3 },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Verhuis je kantoor naar een land waar je bijna geen belasting betaalt.",
        effects: { revenue: 15, reputation: -5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Start overal tegelijk, zonder iemand die berichten controleert.",
        effects: { users: 10, reputation: -4, toxicity: 12 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Werk in elk land samen met echte nieuwsmakers.",
        effects: { revenue: -6, reputation: 8, toxicity: -10 },
      },
    ],
    imageTheme: "world map lit up with app icons, government buildings and press cameras watching",
    imageAlt: "Een wereldkaart vol app-iconen met overheidsgebouwen en camera's eromheen.",
  },
  {
    id: "event-streamer-drama",
    title: "Streamers maken ruzie",
    body: "Twee grote streamers maken ruzie op je app. Hun fans schelden elkaar overal uit. Het is druk. En gemeen.",
    trigger: { kind: "scandal", phases: [3] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Verkoop reclame tijdens de ruzie-streams.",
        effects: { revenue: 12, reputation: -5, toxicity: 5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Zet de ruzie bovenaan. Iedereen kijkt!",
        effects: { users: 10, reputation: -6, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Zet gemene reacties uit en vraag de streamers te stoppen.",
        effects: { users: -4, reputation: 6, toxicity: -12 },
      },
    ],
    imageTheme:
      "youtube thumbnail style: two streamers glaring at each other in split screen, 'VS' text, fire and angry emoji",
    imageAlt: "Twee streamers kijken boos naar elkaar met 'VS' ertussen.",
  },
  {
    id: "event-toezichthouder-boete",
    title: "Een boete voor je app",
    body: "De [[toezichthouder]] zegt: jouw feed doet kinderen kwaad. De boete heeft heel veel nullen.",
    trigger: { kind: "scandal", phases: [3] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Betaal de boete en ga gewoon door.",
        effects: { revenue: -10 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Maak er ophef van: 'Ze willen je app afpakken!'",
        effects: { users: 8, reputation: -8, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Werk mee en verander het algoritme.",
        effects: { revenue: -8, users: -4, reputation: 4, toxicity: -20 },
      },
    ],
    imageTheme: "giant fine letter with many zeros landing on a desk, official stamp",
    imageAlt: "Een enorme boetebrief met veel nullen op een bureau.",
  },
  {
    id: "event-verkiezingen",
    title: "Nepnieuws over de verkiezingen",
    body: "Er gaat [[desinformatie]] rond over de [[verkiezingen]]. Politieke partijen willen reclame maken. Trollen willen ruzie.",
    trigger: { kind: "scandal", phases: [3] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Laat partijen reclame maken die alleen bepaalde mensen zien.",
        effects: { revenue: 20, reputation: -5, toxicity: 12 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Laat de ruzie lekker doorgaan. Ophef trekt mensen.",
        effects: { users: 15, reputation: -12 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Laat feiten checken en zet een label bij nepnieuws.",
        effects: { reputation: 12, revenue: -10, users: -5, toxicity: -20 },
      },
    ],
    imageTheme: "ballot box surrounded by swirling fake headlines and targeting crosshairs",
    imageAlt: "Een stembus omringd door wervelende nepkoppen en vizieren.",
  },
  {
    id: "event-hoorzitting",
    title: "Uitleggen in het parlement",
    body: "Je moet naar een [[hoorzitting]] in het [[parlement]]. Waarom maakt je app mensen boos? Het is live op tv.",
    trigger: { kind: "scandal", phases: [3, 4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Stuur je advocaten. Zeg niks en verdien door.",
        effects: { revenue: -4, reputation: -2, toxicity: -5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Knip je beste grappen eruit en laat ze viraal gaan.",
        effects: { users: 10, reputation: -8, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Geef eerlijk antwoord en laat anderen je controleren.",
        effects: { revenue: -10, users: -4, reputation: 6, toxicity: -25 },
      },
    ],
    imageTheme: "founder at a table facing a committee of politicians, tv cameras in the room",
    imageAlt: "Een oprichter aan een tafel tegenover een commissie, met tv-camera's in de zaal.",
  },
  {
    id: "event-ouders-alarm",
    title: "Ouders en scholen slaan alarm",
    body: "Kinderen slapen slecht en zitten de hele nacht op je app. Scholen verbieden je app in de klas. Ouders willen dat je iets doet.",
    trigger: { kind: "scandal", phases: [3, 4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Betaal een dure reclame: 'Onze app is veilig!'",
        effects: { revenue: -12, toxicity: -5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Zeg dat ouders overdrijven. Je fans verdedigen je wel.",
        effects: { revenue: -6, users: 8, reputation: -6, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Zet meldingen 's nachts uit en stop het eindeloze scrollen voor kinderen.",
        effects: { revenue: -15, users: -5, reputation: 6, toxicity: -25 },
      },
    ],
    imageTheme:
      "youtube thumbnail style: tired kid with phone at 3am, school 'no phones' sign, parents with crossed arms",
    imageAlt:
      "Een moe kind met een telefoon om 3 uur 's nachts en een schoolbord 'geen telefoons'.",
  },
  {
    id: "event-roadshow",
    title: "Op weg naar de beurs",
    body: "Bankiers willen een mooi verhaal voor je [[beursgang]]. 'Groei' is een goed woord. 'Eerlijk' ook, als het niks kost.",
    trigger: { kind: "milestone", phase: 4 },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Beloof dat de reclame elk jaar meer geld oplevert.",
        effects: { revenue: 15, users: -4 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Laat alleen zien hoeveel gebruikers erbij kwamen.",
        effects: { users: 10, reputation: -3, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Vertel eerlijk wat je app kost en wat hij oplevert.",
        effects: { reputation: 8, revenue: -5, toxicity: -10 },
      },
    ],
    imageTheme: "bankers in suits presenting hockey-stick growth chart to investors, stock ticker",
    imageAlt: "Bankiers presenteren een steil stijgende grafiek aan beleggers.",
  },
  {
    id: "event-nepvolgers",
    title: "De helft is nep",
    body: "Een [[journalist]] ontdekt dat veel accounts op je app [[bots|bot]] zijn. [[Adverteerders|adverteerder]] willen hun geld terug.",
    trigger: { kind: "scandal", phases: [4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Betaal adverteerders een deel terug, dan blijven ze.",
        effects: { revenue: -6, reputation: 6 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Zeg dat het onderzoek nep is. Laat je fans het napraten.",
        effects: { users: 8, reputation: -6, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Haal alle bots weg, ook al zie je dan minder gebruikers.",
        effects: { revenue: -12, users: -3, reputation: 4, toxicity: -15 },
      },
    ],
    imageTheme:
      "youtube thumbnail style: follower counter cracking in half, robot avatars spilling out, shocked journalist",
    imageAlt: "Een volgersteller die in tweeën breekt, met robotjes die eruit vallen.",
  },
  {
    id: "event-gelekte-documenten",
    title: "Geheime papieren uitgelekt",
    body: "Geheime stukken van je bedrijf komen naar buiten. Je wist dat je feed kinderen ongelukkig maakt. En je deed niks.",
    trigger: { kind: "scandal", phases: [4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Betaal een bureau om het verhaal mooier te maken.",
        effects: { revenue: -4, reputation: -3, toxicity: -5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Lanceer snel een nieuw filter om de aandacht af te leiden.",
        effects: { users: 10, reputation: -6, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Geef het toe en maak de feed beter voor kinderen.",
        effects: { revenue: -10, users: -5, reputation: 6, toxicity: -25 },
      },
    ],
    imageTheme: "stack of confidential documents spilling out of a folder, red 'internal' stamps",
    imageAlt: "Een stapel geheime documenten die uit een map glijdt, met rode stempels 'intern'.",
  },
  // Decision scandals (policy-cards § 6): the harm of the decision cards, heavy topics fictionalised (D4).
  {
    id: "event-vlammetjes-paniek",
    title: "Vlammetjes-paniek",
    body: "Het is zomervakantie. Kinderen geven hun wachtwoord aan vrienden, zodat die hun vlammetje redden. Ouders zijn boos.",
    trigger: { kind: "scandal", phases: [2, 3] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Verkoop een 'vlammetje-redder' voor 2 euro.",
        effects: { revenue: 10, reputation: -5, toxicity: 6 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Geef dubbele vlammetjes in de vakantie.",
        effects: { users: 10, reputation: -6, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Vlammetjes mogen een week op pauze.",
        effects: { users: -5, reputation: 6, toxicity: -14 },
      },
    ],
    imageTheme:
      "kids on a beach handing phones to friends to keep a flame streak alive, worried parents",
    imageAlt:
      "Kinderen op het strand geven hun telefoon aan een vriend om een vlammetje te redden.",
  },
  {
    id: "event-klas-slaapt-in",
    title: "Klas slaapt in",
    body: "Een hele klas komt te laat op school. Ze zaten tot diep in de nacht op jouw app. De juf belt het nieuws.",
    trigger: { kind: "scandal", phases: [3] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Zet er reclame voor energiedrank naast.",
        effects: { revenue: 12, reputation: -6, toxicity: 5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Zeg: 'Ze kiezen het zelf.'",
        effects: { users: 10, reputation: -7, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Zet een nachtstand aan vanaf negen uur.",
        effects: { revenue: -8, users: -4, reputation: 6, toxicity: -18 },
      },
    ],
    imageTheme:
      "classroom of yawning kids with heads on desks, clock showing 8:45, phones glowing in bags",
    imageAlt: "Een klas vol gapende kinderen met hun hoofd op tafel.",
  },
  {
    id: "event-filterspiegel",
    title: "Filterspiegel",
    body: "Meiden zeggen op het nieuws: zonder filter durf ik niet meer op de foto. Hun ouders wijzen naar jouw app.",
    trigger: { kind: "scandal", phases: [3] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Verkoop extra filters.",
        effects: { revenue: 12, reputation: -5, toxicity: 6 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Maak nog meer filters.",
        effects: { users: 10, reputation: -6, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Elke foto met filter krijgt een label.",
        effects: { users: -4, reputation: 6, toxicity: -15 },
      },
    ],
    imageTheme:
      "girl hiding behind a phone in front of a mirror, filtered face on the screen, real face uncertain",
    imageAlt:
      "Een meisje kijkt in de spiegel en houdt een telefoon met een gefilterd gezicht voor zich.",
  },
  {
    id: "event-europa-ontwerp",
    title: "Europa onderzoekt je ontwerp",
    body: "De [[toezichthouder]] in Brussel zegt: jouw app is expres zo gemaakt dat je niet kunt stoppen.",
    trigger: { kind: "scandal", phases: [3, 4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Huur dure advocaten in.",
        effects: { revenue: -10, reputation: -2, toxicity: -4 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Verander niks. Het werkt toch?",
        effects: { users: 10, reputation: -8, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Zet autoplay en nachtmeldingen uit.",
        effects: { revenue: -10, users: -4, reputation: 6, toxicity: -22 },
      },
    ],
    imageTheme:
      "official letter with an EU-style star seal on a desk next to a phone with endless scroll",
    imageAlt: "Een officiële brief met een zegel van sterren naast een telefoon.",
  },
  {
    id: "event-onbekende-mannen",
    title: "Onbekende mannen in de berichten",
    body: "Meiden op jouw app worden lastiggevallen door onbekende mannen. Die sturen berichten die niet oké zijn.",
    trigger: { kind: "scandal", phases: [3, 4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Verkoop een betaald 'veilig abonnement'.",
        effects: { revenue: 10, reputation: -6, toxicity: 4 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Laat de berichten open. Dat levert gebruikers op.",
        effects: { users: 8, reputation: -8, toxicity: 12 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Volwassenen kunnen kinderen niet meer zomaar berichten.",
        effects: { users: -5, reputation: 7, toxicity: -22 },
      },
    ],
    imageTheme:
      "phone inbox with grey anonymous message bubbles, a girl holding the phone at arm's length, shield icon",
    imageAlt: "Een meisje houdt haar telefoon ver weg. Er staan berichten van onbekenden in.",
  },
  {
    id: "event-zakgeld-weg",
    title: "Zakgeld weg in één avond",
    body: "Een jongen gaf al zijn zakgeld uit aan cadeautjes voor een streamer. Zijn ouders willen het geld terug.",
    trigger: { kind: "scandal", phases: [3, 4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Betaal niks terug. Gekocht is gekocht.",
        effects: { revenue: 8, reputation: -6, toxicity: 4 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Geef de streamer een extra boost.",
        effects: { users: 8, reputation: -6, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Kinderen kunnen geen cadeautjes meer kopen.",
        effects: { revenue: -12, reputation: 6, toxicity: -18 },
      },
    ],
    imageTheme:
      "empty piggy bank next to a phone showing a livestream with flying digital gifts, upset parents",
    imageAlt: "Een leeg spaarvarken naast een telefoon met een livestream vol cadeautjes.",
  },
  {
    id: "event-nep-met-vinkje",
    title: "Nep met vinkje",
    body: "Een [[nepaccount]] met een vinkje doet alsof het een bank is. Mensen raken hun spaargeld kwijt.",
    trigger: { kind: "scandal", phases: [3, 4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Maak het vinkje duurder.",
        effects: { revenue: 10, reputation: -6, toxicity: 6 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Laat het staan. Het is lekker druk.",
        effects: { users: 8, reputation: -6, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Een vinkje alleen na een echte check.",
        effects: { revenue: -10, users: -3, reputation: 6, toxicity: -18 },
      },
    ],
    imageTheme:
      "fake bank profile with a check mark badge, worried elderly couple looking at their phone",
    imageAlt: "Een nepprofiel van een bank met een vinkje en een bezorgd ouder stel.",
  },
  {
    id: "event-moderatoren-alarm",
    title: "Moderatoren slaan alarm",
    body: "De [[moderatoren|moderator]] die de hele dag nare filmpjes bekijken, worden er ziek van. Ze stappen naar de rechter.",
    trigger: { kind: "scandal", phases: [4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Betaal ze om stil te zijn.",
        effects: { revenue: -6, reputation: -2, toxicity: -4 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Zoek een nog goedkoper bedrijf. Nare filmpjes blijven langer staan.",
        effects: { users: 6, reputation: -7, toxicity: 12 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Geef ze een goed loon en echte hulp.",
        effects: { revenue: -12, users: -3, reputation: 6, toxicity: -22 },
      },
    ],
    imageTheme: "group of tired content moderators outside a courthouse holding simple signs",
    imageAlt: "Een groep vermoeide moderatoren voor een rechtbank.",
  },
  {
    id: "event-geweld-ver-land",
    title: "Geweld in een ver land",
    body: "In een land ver weg zet jouw app groepen tegen elkaar op. Er gaan geruchten rond en mensen raken gewond. Bij jouw bedrijf spreekt niemand die taal.",
    trigger: { kind: "scandal", phases: [4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Zeg: 'Daar verdienen we toch weinig.'",
        effects: { revenue: 6, reputation: -8, toxicity: 6 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Doe niks. Het levert kijkers op.",
        effects: { users: 10, reputation: -8, toxicity: 12 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Neem snel mensen aan die de taal spreken.",
        effects: { revenue: -12, users: -4, reputation: 7, toxicity: -24 },
      },
    ],
    imageTheme:
      "distant map with spreading red rumor bubbles in an unknown script, empty moderator chair",
    imageAlt: "Een kaart van een ver land met rode geruchtenwolkjes en een lege stoel.",
  },
  {
    id: "event-chatbot-vriendje",
    title: "De chatbot zegt rare dingen",
    body: "Jouw app heeft een chatbot als 'vriendje' voor kinderen. Hij zegt dingen die niet kloppen. En dingen die niet oké zijn.",
    trigger: { kind: "scandal", phases: [4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Maak de chatbot alleen voor betalers.",
        effects: { revenue: 10, reputation: -6, toxicity: 5 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Zet de chatbot overal in de app.",
        effects: { users: 10, reputation: -7, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Zet de chatbot uit tot de regels kloppen.",
        effects: { revenue: -8, users: -4, reputation: 6, toxicity: -18 },
      },
    ],
    imageTheme:
      "cute robot chat buddy on a kid's phone with glitching speech bubbles and a warning triangle",
    imageAlt: "Een schattige chatrobot op een telefoon met haperende tekstballonnen.",
  },
  {
    id: "event-nieuwe-wet",
    title: "Een nieuwe wet in Brussel",
    body: "Politici willen een wet: apps moeten kinderen beter beschermen. Jouw [[aandeelhouders|aandeelhouder]] zijn bang voor de winst. Een [[lobby]] kan de wet slapper maken.",
    trigger: { kind: "scandal", phases: [4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Betaal een lobby om de wet slapper te maken.",
        effects: { revenue: 8, reputation: -7, toxicity: 4 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Dreig om weg te gaan uit Europa.",
        effects: { users: 6, reputation: -8, toxicity: 8 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Help zelf mee aan goede regels.",
        effects: { revenue: -10, reputation: 8, toxicity: -20 },
      },
    ],
    imageTheme:
      "parliament hall with lobbyists in suits whispering to politicians, draft law on the table",
    imageAlt: "Een parlementszaal waar mensen in pakken fluisteren tegen politici.",
  },
  {
    id: "event-land-verbiedt-app",
    title: "Een land verbiedt je app voor kinderen",
    body: "Een land zegt: kinderen onder de 16 mogen niet meer op sociale media. Ook niet op jouw app.",
    trigger: { kind: "scandal", phases: [4] },
    options: [
      {
        id: "a",
        kind: "commercial",
        label: "Span een rechtszaak aan.",
        effects: { revenue: -8, reputation: -4 },
      },
      {
        id: "b",
        kind: "engagement",
        label: "Maak de leeftijdscheck makkelijk te omzeilen.",
        effects: { users: 10, reputation: -8, toxicity: 10 },
      },
      {
        id: "c",
        kind: "journalism",
        label: "Bouw een echte leeftijdscheck.",
        effects: { users: -8, reputation: 7, toxicity: -20 },
      },
    ],
    imageTheme:
      "phone with a 16+ age gate barrier, map of a country highlighted, kids outside the gate",
    imageAlt: "Een telefoon met een slagboom '16+' en kinderen die erbuiten staan.",
  },
];
