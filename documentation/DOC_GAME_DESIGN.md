# **GAME DESIGN DOCUMENT: PROJECT ALGORHYTHM**

---

## **1\. High-Concept & Kernfilosofie**

* **Logline:** Als almachtig algoritme van een opkomend socialmediaplatform balanceer je advertenties, virale sensatie en journalistiek nieuws om uit te groeien van zolderkamer-app tot beursgenoteerde techreus.  
* **Doelstelling:** De speler leert door ervaring waarom sociale media structureel evolueren naar sensatie en polarisatie: de economische en dopamine-gedreven prikkels belonen engagement direct, terwijl ethische schade pas vertraagd en cumulatief terugslaat.  
* **Doelgroep:** leerlingen van ongeveer 11 jaar (groep 7/8). Ze spelen battle-royale- en brawler-games, rijden op fatbikes en kijken memes, streamers, videomakers en korte filmpjes. Alle tekst gebruikt korte zinnen en gewone woorden; moeilijke woorden zijn gemarkeerd en tonen met één tik een korte uitleg (`GLOSSARY` in `src/features/game-content/`). Kaarten en events komen uit hun wereld (skins, in-game shop, loot boxes, emotes, challenges, influencers, de klassenapp, gamestreams), zonder echte game- of merknamen. Volwassen onderwerpen (gokken, leningen, feesten met drank, rellen, oorlogsbeelden) zitten niet in het spel.  
* **Perspectief:** Hybride. De interactie toont een centrale smartphone-feed waarin content fysiek landt, terwijl de overkoepelende interface de macro-statistieken van het hele platform toont.

---

## **2\. De Score & Systeemmechanieken**

De score bestaat uit twee absolute getallen: **Gebruikers** en **Geld**. Ze staan als twee lijnen in één grafiek (beurskoers-stijl) die elk naar hun eigen gestippelde doellijn racen, in hun eigen kleur. Reputatie en Toxicity bestaan nog, maar zijn verborgen: de speler voelt ze via schandalen, niet via een balk. Bron: `documentation/jobs/temp_job_score-redesign/DECISIONS.md` D10–D32; getallen in `src/features/game-content/services/phases.ts`.

```
  100.000 - - - - - - - - - - - - - -   (doellijn Gebruikers)
  € 150.000 - - - - - - - - - - - - -   (doellijn Geld)
        ___/\___/‾‾‾‾\____ ┄┄○        (┄┄○ = voorspelling van de vastgehouden kaart)
  📈 62.000 ↑+15.000          💰 € 96.000 ↓−€ 2.000
```

### **📈 Gebruikers (direct)**

* **Wat het representeert:** dagelijks actieve gebruikers.
* **Dynamiek:** virale kaarten geven punten × `usersPerPoint` van de fase erbij. Verliezen zijn relatief: elk verliespunt kost `userLossPerPoint` (2 %) van de huidige gebruikers, zodat één nieuwskaart na een faseovergang niet een derde van je app wegvaagt (D26).
* **Geen game over:** gebruikers kunnen niet onder 0 en eindigen het spel niet (D16). Het eindscherm toont het hoogste bereik (`peakUsers`).

### **💰 Geld (direct)**

* **Wat het representeert:** de kas: advertentie-inkomsten min server-, personeels- en juridische kosten.
* **Dynamiek:** advertenties en commerciële keuzes leveren punten × `moneyPerPoint` op, maal een publieksfactor `clamp(gebruikers / audienceUsers, 0, 2)`: zonder kijkers betaalt geen adverteerder (D20). Elke beurt kost passieve kosten (fase 1: 1 punt, oplopend tot 3). Een schandaal kost bovenop de gekozen optie een boete van `finePoints` × `moneyPerPoint` (D25).
* **Game over:** **Bankroet**, zodra Geld onder € 0 zakt. Dit is het enige game over. Het verhaal op het eindscherm past bij de run: geen inkomsten, kosten groeiden te hard, reclame zonder kijkers, of schandaal na schandaal.

### **🛡️ Verborgen reputatie, Toxicity en schandalen (vertraagde boemerang)**

* **Reputatie (verborgen, 0–100, start 60):** nieuws voegt reputatie toe; virale en commerciële keuzes kosten reputatie, in latere fases zwaarder (`reputationLossMultiplier` 0,5 / 1 / 1,5 / 2).
* **Toxicity (verborgen, 0–100):** stijgt bij ophef en als nieuws genegeerd wordt. Boven 50 lekt Toxicity elke beurt reputatie weg (D21).
* **Nieuws overslaan:** na 3 beurten zonder nieuws zakt de reputatie elke beurt met 3.
* **Schandaalkans:** onder de drempel (reputatie 30) toont het bord "Schandaal dreigt: N% kans per beurt". De kans loopt lineair op tot maximaal 90 %. Op een kaartbeurt waarop een gebeurtenis mag vallen, trekt de seeded RNG een schandaal uit de fase (D22); nooit vóór de eerste kaart (D27).
* **Hints in de wereld:** volgers in de reacties mopperen als de reputatie daalt, nog vóór de schandaalwaarschuwing verschijnt.

---

## **3\. Core Loop: Selectie & Voeding**

De gameplay volgt een strakke, repetitieve cyclus van afwegen, injecteren en incasseren.

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

| Kaarttype | Primaire Voordelen | Primaire Nadelen / Risico's |
| :---- | :---- | :---- |
| **⚡ Viraal** (Meme, challenge, ruzie, clickbait, nep-giveaway) | \+++ Gebruikers, verhoogt engagement-combo | \+ Toxicity (verhoogt kans op toekomstig schandaal) |
| **💰 Advertentie** (Skins in de shop, loot box, gesponsorde stream, crypto) | \+++ Inkomsten | \- Gebruikers (licht), wekt irritatie op |
| **📰 Nieuws** (Factcheck, uitleg, onderzoek, eerlijke fout-melding) | \++ Reputatie, verlaagt Toxicity | \- Gebruikers (mensen scrollen weg), levert €0 op |

### **Type 2: Gebeurteniskaarten (Events)**

Gebeurteniskaarten onderbreken de reguliere draft. Er verschijnt één urgente situatie met drie beleidsopties. Gebeurtenissen triggeren op vaste mijlpalen of wanneer Toxicity te hoog oploopt.

**Timing (verrassing, geen stapel):** per beurt verschijnt hooguit één gebeurtenis. Na een gebeurtenis duurt het minstens 3 beurten plus een willekeurig (uit de seed) extra aantal van 0–3 beurten voordat een gewone Toxicity-gebeurtenis kan komen. Mijlpalen en crises bij heel hoge Toxicity (≥ 70) wachten maar 2 beurten. Een mijlpaal komt altijd, desnoods iets later; een Toxicity-gebeurtenis die niet meer geldt als haar beurt komt, vervalt (game-engine D10).

#### **Voorbeeld-Event: "Verkiezingen & Desinformatie"**

*Trigger: Toxicity \> 60 tijdens Mijlpaal 3\.*

* **Optie A (Commercieel):** "Laat de politieke micro-targeting advertenties toe."  
    
* *Effect:* \+++ Inkomsten, \- Reputatie, \++ Toxicity.  
    
* **Optie B (Engagement):** "Laat de discussie woeden, sensatie brengt mensen naar de app."  
    
* *Effect:* \+++ Gebruikers, \--- Reputatie.  
    
* **Optie C (Journalistiek):** "Schakel factcheckers in en label valse claims."  
    
* *Effect:* \+++ Reputatie, \-- Inkomsten, \- Gebruikers.

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

* **Virale Kaart:**  
    
* *Visueel:* Scherm schudt licht (*screen shake*), neon paars/roze explosie, vlammenanimatie rondom de engagement-teller, reactie-emoji's (🔥, 😱, 😡) vliegen over het scherm.  
    
* *Audio:* Stijgende synthesizer-tonen, applaus, luide notificatie-pings met basboost.  
    
* *Gevoel:* Directe, verslavende feedback.  
    
* **Advertentiekaart:**  
    
* *Visueel:* Gouden munten en dollartekens spatten fysiek vanuit de kaart naar de Geld-teller, getallen tellen met een snelle slotmachine-animatie op.  
    
* *Audio:* Ouderwets mechanisch kassageluid (*ka-ching\!*), rinkelend kleingeld.  
    
* *Gevoel:* Voldoening van winst en financiële zekerheid.  
    
* **Nieuwskaart:**  
    
* *Visueel:* Geen deeltjeseffecten. De kaart schuift met een strakke, droge animatie in de feed. Een klein, neutraal groen schild-icoontje verschijnt discreet bij de kaart (reputatie is verborgen).  
    
* *Audio:* Een matte, houten 'klik' of krantengeluid. Geen muziekstijging.  
    
* *Gevoel:* Functioneel, administratief, intentioneel saai.

---

## **6\. Mijlpalen & Progressie (Van Zolderkamer tot Monopolie)**

Het spel verloopt over vier fases. Elke fase heeft twee doellijnen, één voor Gebruikers en één voor Geld. Een fase is gehaald op de beurt dat beide getallen boven hun doellijn staan (D17); na fase 4 volgt de beursgang. Elke fase maakt een punt meer waard, verhoogt de kosten en weegt reputatieverlies zwaarder. Elke fase opent met een introscherm (verhaal, tip en het doel).

```
[ Fase 1: Zolderkamer ] ──► [ Fase 2: Scale-Up ] ──► [ Fase 3: Wereldwijd ] ──► [ Fase 4: De Beursgang ]
  100.000 / € 150.000        300.000 / € 600.000       1 mln / € 1,2 mln          3 mln / € 4 mln
  Kosten: 1 punt/beurt       Kosten: 2 punten/beurt    Kosten: 3 punten/beurt     Kosten: 3 punten/beurt
  Reputatieverlies × 0,5     Reputatieverlies × 1      Reputatieverlies × 1,5     Reputatieverlies × 2
```

### **Fase 1: De Zolderkamer (Startup)**

* **Doel:** 100.000 gebruikers en € 150.000.
* **Context:** niemand let op je. Reputatieschade weegt half en advertenties leveren half zoveel op. De focus ligt op groeien zonder door je geld heen te gaan.

### **Fase 2: De Scale-Up (Groeifase)**

* **Doel:** 300.000 gebruikers en € 600.000.
* **Context:** investeerders willen rendement en de servers kosten echt geld. Zonder reclame ga je bankroet; met te veel reclame lopen gebruikers weg (Ad-Fatigue).

### **Fase 3: Wereldwijd Platform (De Publieke Schandpaal)**

* **Doel:** 1 miljoen gebruikers en € 1,2 miljoen.
* **Context:** overheden en media kijken mee. Reputatieverlies weegt anderhalf keer; wie het nieuws overslaat, ziet snel "Schandaal dreigt" en betaalt boetes.

### **Fase 4: De Beursgang (IPO \- Eindspel)**

* **Doel:** 3 miljoen gebruikers en € 4 miljoen.
* **Dilemma:** aandeelhouders eisen groei en winst (pusht naar Ads/Viraal), terwijl reputatieverlies dubbel weegt en elk schandaal een grote boete kost.
* **Overwinning:** succesvolle beursgang. De speler krijgt een eindrapport met hoogste bereik en kas, en wat het platform onderweg aan schade aanrichtte (nepnieuws gedeeld, gemiste slaap, ruzies aan de keukentafel). Het resultaat is te delen als afbeelding met fase, hoogste bereik en geld aan het eind.

---

## **7\. Combo- & Sanctiesystemen (Onderliggende Formules)**

Om te voorkomen dat spelers gedachteloos één type kaart blijven spammen, sturen correctiemechanismen de balans bij:

* **Ad-Fatigue:**  
    
* Worden er binnen 4 beurten 3 Advertenties gekozen? Dan levert elke volgende advertentie 50% minder inkomsten op en kost deze dubbele Gebruikersaantallen.  
    
* **Echo-Chamber (Virale Spiraal):**  
    
* 3 Virale kaarten op rij activeert een *Engagement Frenzy* (+50% bonus op Gebruikerswinst), maar verhoogt Toxicity direct met \+25.  
    
* **Nieuws overslaan (Neglect):**  
    
* Na 3 opeenvolgende beurten zonder Nieuwskaart zakt de verborgen reputatie elke beurt met 3, en elke kaart die geen nieuws is voegt 2 Toxicity toe. Een lage reputatie geeft kans op een schandaal (§ 2). (De Journalistieke Droogte, virale kaarten rood omrand na 5 beurten, is geschrapt: balance-cleanup D1.)

* **Voorspelling (Forecast):**  
    
* Houdt de speler een kaart vast (lang indrukken, slepen, detailvenster of toetsenbordfocus), dan tekent de grafiek per lijn een stippellijn naar waar die lijn na het spelen uitkomt. De kaart toont dezelfde absolute bedragen. Turn-modifiers (Ad-Fatigue, Echo-Chamber, passieve kosten) zitten erin, omdat de engine de zet op een kopie uitrekent (D12, D32).

