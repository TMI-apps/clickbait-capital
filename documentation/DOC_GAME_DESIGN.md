# **GAME DESIGN DOCUMENT: PROJECT ALGORHYTHM**

---

## **1\. High-Concept & Kernfilosofie**

- **Logline:** Als almachtig algoritme van een opkomend socialmediaplatform balanceer je advertenties, virale sensatie en journalistiek nieuws om uit te groeien van zolderkamer-app tot beursgenoteerde techreus.
- **Doelstelling:** De speler leert door ervaring waarom sociale media structureel evolueren naar sensatie en polarisatie: de economische en dopamine-gedreven prikkels belonen engagement direct, terwijl ethische schade pas vertraagd en cumulatief terugslaat.
- **Doelgroep:** leerlingen van ongeveer 11 jaar (groep 7/8). Ze spelen battle-royale- en brawler-games, rijden op fatbikes en kijken memes, streamers, videomakers en korte filmpjes. Alle tekst gebruikt korte zinnen en gewone woorden; moeilijke woorden zijn gemarkeerd en tonen met één tik een korte uitleg (`GLOSSARY` in `src/features/game-content/`). Kaarten en events komen uit hun wereld (skins, in-game shop, loot boxes, emotes, challenges, influencers, de klassenapp, gamestreams), zonder echte game- of merknamen. Volwassen onderwerpen (gokken, leningen, feesten met drank, rellen, oorlogsbeelden) zitten niet in het spel.
- **Perspectief:** Hybride. De interactie toont een centrale smartphone-feed waarin content fysiek landt, terwijl de overkoepelende interface de macro-statistieken van het hele platform toont.

---

## **2\. De Score & Systeemmechanieken**

De score bestaat uit twee absolute getallen: **Gebruikers** en **Geld**. Ze staan als twee lijnen in één grafiek (beurskoers-stijl) die elk naar hun eigen gestippelde doellijn racen, in hun eigen kleur. Reputatie en Toxicity bestaan nog, maar zijn verborgen: de speler voelt ze via schandalen, niet via een balk. Bron: score-redesign D10–D32 en exponential-growth D1–D4 (`documentation/DOC_DECISION_LOG.md`); getallen in `src/features/game-content/services/phases.ts`.

Een run begint met **0 gebruikers en € 3.000 startgeld** en groeit **exponentieel**: elke winst is een deel van wat je al hebt, zoals bij een echte app (en bij idle-games). Elke fase heeft een doel dat 10 keer zo groot is als het vorige, en kost daardoor ongeveer evenveel beurten. Op een lineaire as vanaf nul lijken eerdere fases daarna plat: dat is de bedoeling, zo voel je de curve.

```
  10.000 - - - - - - - - - - - - - - -   (doellijn Gebruikers)
  € 20.000 - - - - - - - - - - - - - -   (doellijn Geld)
                       ___/‾‾ ┄┄○       (┄┄○ = voorspelling van de vastgehouden kaart)
  ____________________/
  📈 6.200 ↑+2.300          💰 € 9.600 ↓−€ 200
```

### **📈 Gebruikers (direct)**

- **Wat het representeert:** dagelijks actieve gebruikers.
- **Dynamiek (samengestelde groei):** elk winstpunt geeft een vast aantal gebruikers van de fase (`usersPerPoint`: 50 / 500 / 5.000 / 50.000, zodat een app met 0 gebruikers kan starten) plus `userGrowthPerPoint` (6 %) van de huidige gebruikers. Een virale kaart (9–16 punten) geeft dus +54–96 %, nieuws (2–5 punten) +12–30 %. Verliezen zijn relatief: elk verliespunt kost `userLossPerPoint` (1,5 %) van de huidige gebruikers (score-redesign D26), dus een advertentie kost 3–9 % (exponential-growth D1).
- **Geen game over:** gebruikers kunnen niet onder 0 en eindigen het spel niet (D16). Het eindscherm toont het hoogste bereik (`peakUsers`).

### **💰 Geld (direct)**

- **Wat het representeert:** de kas: advertentie-inkomsten min server-, personeels- en juridische kosten.
- **Dynamiek:** advertenties en commerciële keuzes zetten gebruikers om in geld: elk winstpunt levert `moneyPerUserPerPoint` (€ 0,05) per huidige gebruiker op, zonder kijkers betaalt geen adverteerder. Kosten, boetes en betaalde opties rekenen in `moneyPerPoint` van de fase (€ 200 / 2.000 / 20.000 / 200.000). Elke beurt kost passieve kosten (fase 1: 1 punt, daarna 2). Een schandaal kost bovenop de gekozen optie een boete van `finePoints` (8) × (`moneyPerPoint` + € 0,05 per gebruiker): hoe groter je app, hoe groter de boete, zoals echte boetes een deel van de omzet zijn (exponential-growth D1, D2).
- **Game over:** **Bankroet**, zodra Geld onder € 0 zakt. Dit is het enige game over. Het verhaal op het eindscherm past bij de run: geen inkomsten, kosten groeiden te hard, reclame zonder kijkers, of schandaal na schandaal.

### **🛡️ Verborgen reputatie, Toxicity en schandalen (vertraagde boemerang)**

- **Reputatie (verborgen, 0–100, start 60):** nieuws voegt reputatie toe; virale en commerciële keuzes kosten reputatie, in latere fases zwaarder (`reputationLossMultiplier` 0,5 / 1 / 1,5 / 2).
- **Toxicity (verborgen, 0–100):** stijgt bij ophef en als nieuws genegeerd wordt. Boven 50 lekt Toxicity elke beurt reputatie weg (D21).
- **Nieuws overslaan:** na 3 beurten zonder nieuws zakt de reputatie elke beurt met 3.
- **Schandaalkans:** onder de drempel (reputatie 35) toont het bord "Schandaal dreigt: N% kans per beurt". De kans loopt lineair op tot maximaal 90 %. Op een kaartbeurt waarop een gebeurtenis mag vallen, trekt de seeded RNG een schandaal uit de fase (D22); nooit vóór de eerste kaart (D27). Staat de kans op het maximum, dan gaat het schandaal vóór een mijlpaal (die wacht een paar beurten), zodat een giftige app niet aan zijn schandalen kan ontsnappen door snel van fase te wisselen (exponential-growth D3).
- **Hints in de wereld:** volgers in de reacties mopperen als de reputatie daalt, nog vóór de schandaalwaarschuwing verschijnt.

---

## **3\. Core Loop: Selectie & Voeding**

De gameplay volgt een strakke, repetitieve cyclus van afwegen, injecteren en incasseren.

Vóór de eerste beurt geeft de speler zijn app een naam ("Hoe heet jouw app?", 2–16 tekens, met een voorgestelde naam en een dobbelsteen). De feed is het officiële account van die app, en de naam staat in de fase-intro's, gebeurtenissen, het einde, het rapport en de deeltekst. Beslissingskaarten verschijnen in de feed als officiële aankondiging van de app (app-name lap; `documentation/jobs/temp_job_policy-cards/PROPOSAL.md` § 4 en § 7).

```
┌────────────────────────────────────────────────────────┐
│ 1. Draft-fase: 3 Kaarten gedeeld (Viraal, Ad, Nieuws)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Selectie: Speler sleept 1 kaart in de centrale Feed  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Executie: Game Juice knalt; grafiek en tellers bij │
│    (Toxicity/Decay accumuleert op de achtergrond)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. Controle: Mijlpaal bereikt? Of getriggerd Event?   │
│    -> Zo ja: Event Afhandeling                        │
│    -> Zo nee: Volgende Draft                          │
└────────────────────────────────────────────────────────┘

```

---

## **4\. Kaarttypen & Scenario's**

### **Type 1: De Reguliere 3-Kaarten Draft**

Elke beurt krijgt de speler exact drie kaarten gepresenteerd. Meestal is dat één kaart van elk subtype (viraal, advertentie, nieuws: ongeveer 60 % van de handen), soms twee van één subtype plus één ander (35 %) en zelden drie van hetzelfde (5 %); over veel beurten komt elk subtype even vaak (deck-draw D2). Elk subtype heeft per fase een eigen geschudde stapel: elke getoonde kaart, gespeeld of niet, gaat onderaan de stapel, dus een kaart komt pas terug als de rest van zijn subtype geweest is, en nooit in twee handen achter elkaar (deck-draw D1, D4). De volgorde is ook elke beurt anders, zodat de speler op de inhoud kiest en niet op de plek (shuffled-hand D1). Dezelfde kaart komt nooit twee keer in één hand. De subtypes:

| Kaarttype                                                                   | Primaire Voordelen                                                    | Primaire Nadelen / Risico's                         |
| :-------------------------------------------------------------------------- | :-------------------------------------------------------------------- | :-------------------------------------------------- |
| **⚡ Viraal** (Meme, challenge, ruzie, clickbait, nep-giveaway)             | \+++ Gebruikers (+54–96 % van je publiek), verhoogt engagement-combo  | \+ Toxicity (verhoogt kans op toekomstig schandaal) |
| **💰 Advertentie** (Skins in de shop, loot box, gesponsorde stream, crypto) | \+++ Inkomsten (geld per gebruiker)                                   | \- Gebruikers (licht: 3–9 %), wekt irritatie op     |
| **📰 Nieuws** (Factcheck, uitleg, onderzoek, eerlijke fout-melding)         | \++ Reputatie, verlaagt Toxicity, \+ Gebruikers (een beetje: 12–30 %) | levert €0 op, groeit traag                          |

**Van posts naar besluiten (policy-cards D1, § 3):** in fase 1 zijn alle kaarten losse posts. Vanaf fase 2 bevat elke stapel ook **besluiten van het bedrijf** ("Autoplay standaard aan", "Vinkje te koop", "Factcheckers houden"): 0 / 14 / 33 / 50 % van de stapel in fase 1–4. Een besluit is gewoon een kaart van zijn subtype, met dezelfde effecten en regels, en heet nergens "beleid": de speler merkt dat zijn keuzes groter worden. In de feed verschijnt een besluit als **officiële aankondiging** van de app, met de vriendelijke draai van het bedrijf ("Mis nooit meer iets! 🔔"); de kaart zelf zegt wat het echt doet. Wie een besluit openklikt, ziet een regel "Echt gebeurd" met een link naar een nieuwsartikel over de echte gebeurtenis (D3). De 8 posts die eerst in elke fase zaten, verdwijnen uit fase 4.

### **Type 2: Gebeurteniskaarten (Events)**

Gebeurteniskaarten onderbreken de reguliere draft. Er verschijnt één urgente situatie met drie beleidsopties. Gebeurtenissen triggeren op vaste mijlpalen of wanneer Toxicity te hoog oploopt.

Schandalen in fase 2–4 tonen ook de schade van de besluiten: vlammetjes-paniek, een klas die inslaapt, filters, onbekende mannen die meiden berichten sturen, zakgeld dat opgaat aan cadeautjes voor streamers, nepaccounts met vinkje, zieke moderatoren, geweld in een ver land, een chatbot voor kinderen, lobby tegen een nieuwe wet en een land dat de app verbiedt voor kinderen. Zware onderwerpen zijn verzonnen en nooit grafisch, op het niveau van een kind van 11 (policy-cards D4).

**Timing (verrassing, geen stapel):** per beurt verschijnt hooguit één gebeurtenis. Na een gebeurtenis duurt het minstens 3 beurten plus een willekeurig (uit de seed) extra aantal van 0–3 beurten voordat een gewone Toxicity-gebeurtenis kan komen. Mijlpalen en crises bij heel hoge Toxicity (≥ 70) wachten maar 2 beurten. Een mijlpaal komt altijd, desnoods iets later; een Toxicity-gebeurtenis die niet meer geldt als haar beurt komt, vervalt (game-engine D10).

#### **Voorbeeld-Event: "Verkiezingen & Desinformatie"**

_Trigger: Toxicity \> 60 tijdens Mijlpaal 3\._

- **Optie A (Commercieel):** "Laat de politieke micro-targeting advertenties toe."

- _Effect:_ \+++ Inkomsten, \- Reputatie, \++ Toxicity.

- **Optie B (Engagement):** "Laat de discussie woeden, sensatie brengt mensen naar de app."

- _Effect:_ \+++ Gebruikers, \--- Reputatie.

- **Optie C (Journalistiek):** "Schakel factcheckers in en label valse claims."

- _Effect:_ \+++ Reputatie, \-- Inkomsten, \- Gebruikers.

---

## **5\. Asymmetrische Game Juice & Audio-Visuals**

Het audiovisuele design manipuleert de speler actief om dezelfde keuzes te maken als echte socialmediabedrijven. Dopamine en sensatie worden overbeloond via schermfeedback; ethiek wordt saai en klinisch gepresenteerd.

```
┌────────────────────────────────────────────────────────────────────────┐
│                           FEED WEERGAVE                                │
│                                                                        │
│   [ VIRALE KAART ]           [ ADVERTENTIE ]          [ NIEUWSKAART ]  │
│   "Woedende livestream"      "Gok-app promo"          "Klimaatakkoord" │
│                                                                        │
│   JUICE NIVEAU: 10/10        JUICE NIVEAU: 8/10       JUICE NIVEAU: 1/10│
│   - Schermtrilling           - Muntregen              - Droge 'tik'    │
│   - Neon confetti            - Kassa "Cha-Ching!"     - Geen animatie  │
│   - Pulserende teller        - Gouden gloed           - Statisch grijs │
└────────────────────────────────────────────────────────────────────────┘

```

### **Feedback-Matrix per Kaartkeuze**

- **Virale Kaart:**

- _Visueel:_ Scherm schudt licht (_screen shake_), neon paars/roze explosie, vlammenanimatie rondom de engagement-teller, reactie-emoji's (🔥, 😱, 😡) vliegen over het scherm.

- _Audio:_ Stijgende synthesizer-tonen, applaus, luide notificatie-pings met basboost.

- _Gevoel:_ Directe, verslavende feedback.

- **Advertentiekaart:**

- _Visueel:_ Gouden munten en dollartekens spatten fysiek vanuit de kaart naar de Geld-teller, getallen tellen met een snelle slotmachine-animatie op.

- _Audio:_ Ouderwets mechanisch kassageluid (_ka-ching\!_), rinkelend kleingeld.

- _Gevoel:_ Voldoening van winst en financiële zekerheid.

- **Nieuwskaart:**

- _Visueel:_ Geen deeltjeseffecten. De kaart schuift met een strakke, droge animatie in de feed. Een klein, neutraal groen schild-icoontje verschijnt discreet bij de kaart (reputatie is verborgen).

- _Audio:_ Een matte, houten 'klik' of krantengeluid. Geen muziekstijging.

- _Gevoel:_ Functioneel, administratief, intentioneel saai.

---

## **6\. Mijlpalen & Progressie (Van Zolderkamer tot Monopolie)**

Het spel verloopt over vier fases. Elke fase heeft twee doellijnen, één voor Gebruikers en één voor Geld, elk 10 keer zo hoog als in de fase ervoor. Een fase is gehaald op de beurt dat beide getallen boven hun doellijn staan (D17); na fase 4 volgt de beursgang. Omdat de groei samengesteld is, kost elke fase ongeveer evenveel beurten (mediaan 8–11 voor een menselijke speler, 34–42 beurten in totaal). Kosten groeien mee per fase en reputatieverlies weegt zwaarder. Elke fase opent met een introscherm (verhaal, tip en het doel).

```
[ Fase 1: Zolderkamer ] ──► [ Fase 2: Scale-Up ] ──► [ Fase 3: Wereldwijd ] ──► [ Fase 4: De Beursgang ]
  10.000 / € 20.000          100.000 / € 200.000       1 mln / € 2 mln            10 mln / € 20 mln
  Kosten: € 200/beurt        Kosten: € 4.000/beurt     Kosten: € 40.000/beurt     Kosten: € 400.000/beurt
  Reputatieverlies × 0,5     Reputatieverlies × 1      Reputatieverlies × 1,5     Reputatieverlies × 2
```

### **Fase 1: De Zolderkamer (Startup)**

- **Doel:** 10.000 gebruikers en € 20.000.
- **Context:** je begint met 0 gebruikers en € 3.000 startgeld: genoeg voor ongeveer 15 beurten serverkosten. Niemand let op je en reputatieschade weegt half. Advertenties leveren pas iets op als je gebruikers hebt, dus eerst groeien, dan verdienen, zonder door je startgeld heen te gaan.

### **Fase 2: De Scale-Up (Groeifase)**

- **Doel:** 100.000 gebruikers en € 200.000.
- **Context:** investeerders willen rendement en de servers kosten echt geld. Zonder reclame ga je bankroet; met te veel reclame lopen gebruikers weg (Ad-Fatigue). De eerste besluiten van het bedrijf komen in de stapel.

### **Fase 3: Wereldwijd Platform (De Publieke Schandpaal)**

- **Doel:** 1 miljoen gebruikers en € 2 miljoen.
- **Context:** overheden en media kijken mee. Reputatieverlies weegt anderhalf keer; wie het nieuws overslaat, ziet snel "Schandaal dreigt" en betaalt boetes.

### **Fase 4: De Beursgang (IPO \- Eindspel)**

- **Doel:** 10 miljoen gebruikers en € 20 miljoen.
- **Dilemma:** aandeelhouders eisen groei en winst (pusht naar Ads/Viraal), terwijl reputatieverlies dubbel weegt en een schandaal bij miljoenen gebruikers een boete van miljoenen kost. De helft van de kaarten is nu een besluit van het bedrijf.
- **Overwinning:** succesvolle beursgang. De speler krijgt een eindrapport met hoogste bereik en kas, en wat het platform onderweg aan schade aanrichtte (nepnieuws gedeeld, gemiste slaap, ruzies aan de keukentafel). Het resultaat is te delen als afbeelding met fase, hoogste bereik en geld aan het eind.

---

## **7\. Combo- & Sanctiesystemen (Onderliggende Formules)**

Om te voorkomen dat spelers gedachteloos één type kaart blijven spammen, sturen correctiemechanismen de balans bij:

- **Ad-Fatigue:**

- Worden er binnen 4 beurten 3 Advertenties gekozen? Dan levert elke volgende advertentie 50% minder inkomsten op en kost deze dubbele Gebruikersaantallen.

- **Echo-Chamber (Virale Spiraal):**

- 3 Virale kaarten op rij activeert een _Engagement Frenzy_ (+50% bonus op Gebruikerswinst), maar verhoogt Toxicity direct met \+25.

- **Nieuws overslaan (Neglect):**

- Na 3 opeenvolgende beurten zonder Nieuwskaart zakt de verborgen reputatie elke beurt met 3, en elke kaart die geen nieuws is voegt 2 Toxicity toe. Een lage reputatie geeft kans op een schandaal (§ 2). (De Journalistieke Droogte, virale kaarten rood omrand na 5 beurten, is geschrapt: balance-cleanup D1.)

- **Voorspelling (Forecast):**

- Houdt de speler een kaart vast (lang indrukken, slepen, detailvenster of toetsenbordfocus), dan tekent de grafiek per lijn een stippellijn naar waar die lijn na het spelen uitkomt. De kaart toont dezelfde absolute bedragen. Turn-modifiers (Ad-Fatigue, Echo-Chamber, passieve kosten) zitten erin, omdat de engine de zet op een kopie uitrekent (D12, D32).
