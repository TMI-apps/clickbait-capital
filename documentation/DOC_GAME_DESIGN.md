# **GAME DESIGN DOCUMENT: PROJECT ALGORHYTHM**

---

## **1\. High-Concept & Kernfilosofie**

* **Logline:** Als almachtig algoritme van een opkomend socialmediaplatform balanceer je advertenties, virale sensatie en journalistiek nieuws om uit te groeien van studenten-app tot beursgenoteerde techreus.  
* **Doelstelling:** De speler leert door ervaring waarom sociale media structureel evolueren naar sensatie en polarisatie: de economische en dopamine-gedreven prikkels belonen engagement direct, terwijl ethische schade pas vertraagd en cumulatief terugslaat.  
* **Perspectief:** Hybride. De interactie toont een centrale smartphone-feed waarin content fysiek landt, terwijl de overkoepelende interface de macro-statistieken van het hele platform toont.

---

## **2\. De Drie Kernmeters & Systeemmechanieken**

Bovenaan het scherm staan drie primaire resources. Alle meters hebben een schaal van 0 tot 100 (startwaarde: 50). Raken de meters 0, dan resulteert dit direct in een specifieke **Game Over**.

```
[ 💰 INKOMSTEN: 50/100 ]   [ 📈 GEBRUIKERS: 50/100 ]   [ 🛡️ REPUTATIE: 50/100 ]

```

### **💰 Inkomsten (Korte termijn / Direct)**

* **Wat het representeert:** Operationeel kapitaal, advertentie-inkomsten en serverbudget.  
* **Dynamiek:** Reageert per direct op advertentiekaarten (+). Daalt passief per beurt door server- en personeelskosten (-).  
* **Game Over (0%):** **Bankroet.** De servers gaan offline wegens onbetaalde rekeningen; investeerders trekken de stekker eruit.

### **📈 Gebruikers (Korte termijn / Direct)**

* **Wat het representeert:** Dagelijks actieve gebruikers (DAU) en schermtijd/engagement.  
* **Dynamiek:** Reageert direct op virale content (+). Daalt wanneer feeds gevuld worden met saaie artikelen of advertentie-overdaad (-).  
* **Game Over (0%):** **Verlaten Platform.** Gebruikers lopen massaal over naar concurrerende apps; de feed sterft uit.

### **🛡️ Reputatie (Lange termijn / Vertraagde Decay & Boemerang)**

* **Wat het representeert:** Merkvertrouwen, maatschappelijke acceptatie, afwezigheid van overheidstoezicht.  
    
* **Mechaniek van het Boemerang-effect:**  
    
* **Directe feedback:** Journalistieke berichten voegen direct reputatie toe (+). Virale bagger of advertenties tasten reputatie niet altijd *meteen* zichtbaar aan.  
    
* **Onzichtbare Toxicity Pool:** Elke keer dat een speler virale ophef kiest of nieuws negeert, stijgt een interne meter: **Toxicity**.  
    
* **Passieve Reputatie-Decay:** Als de speler \$X\$ beurten achter elkaar géén nieuws selecteert, treedt er een passieve vermindering van Reputatie op (-3 per beurt).  
    
* **De Boemerang:** Zodra Toxicity een drempelwaarde overschrijdt, activeert het spel een geforceerde **Gebeurteniskaart** (bijv. EU-boete, consumentenboycot of hoorzitting) die in één klap zware reputatieschade en financiële straffen uitdeelt.  
    
* **Game Over (0%):** **Verbod & Regulering.** Het platform wordt via wetgeving verboden of gedwongen opgesplitst wegens maatschappelijke ontwrichting.

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
│ 3. Executie: Game Juice knalt; meters updaten direct   │
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

Elke beurt krijgt de speler exact drie kaarten gepresenteerd. Eén van elk subtype:

| Kaarttype | Primaire Voordelen | Primaire Nadelen / Risico's |
| :---- | :---- | :---- |
| **⚡ Viraal** (Meme, ruzie, sensationele video) | \+++ Gebruikers, verhoogt engagement-combo | \+ Toxicity (verhoogt kans op toekomstig schandaal) |
| **💰 Advertentie** (Sponsoring, dropshipping, crypto) | \+++ Inkomsten | \- Gebruikers (licht), wekt irritatie op |
| **📰 Nieuws** (Onderzoeksjournalistiek, verificatie) | \++ Reputatie, verlaagt Toxicity | \- Gebruikers (mensen scrollen weg), levert €0 op |

### **Type 2: Gebeurteniskaarten (Events)**

Gebeurteniskaarten onderbreken de reguliere draft. Er verschijnt één urgente situatie met drie beleidsopties. Gebeurtenissen triggeren op vaste mijlpalen of wanneer Toxicity te hoog oploopt.

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
    
* *Visueel:* Gouden munten en dollartekens spatten fysiek vanuit de kaart naar de Inkomstenmeter, getallen tellen met een snelle slotmachine-animatie op.  
    
* *Audio:* Ouderwets mechanisch kassageluid (*ka-ching\!*), rinkelend kleingeld.  
    
* *Gevoel:* Voldoening van winst en financiële zekerheid.  
    
* **Nieuwskaart:**  
    
* *Visueel:* Geen deeltjeseffecten. De kaart schuift met een strakke, droge animatie in de feed. Een klein, neutraal groen schild-icoontje verschijnt discreet bij de Reputatiemeter.  
    
* *Audio:* Een matte, houten 'klik' of krantengeluid. Geen muziekstijging.  
    
* *Gevoel:* Functioneel, administratief, intentioneel saai.

---

## **6\. Mijlpalen & Progressie (Van Zolderkamer tot Monopolie)**

Het spel verloopt over vier fases. Elke fase verhoogt de operationele kosten en schaalt de impact van reputatieverlies exponentieel op.

```
[ Fase 1: Zolderkamer ] ──► [ Fase 2: Scale-Up ] ──► [ Fase 3: Wereldmacht ] ──► [ Fase 4: De Beursgang ]
  Serverkosten: Laag          Serverkosten: Medium      Serverkosten: Hoog         Winstvereiste: Maximaal
  Regulering: Geen            Regulering: Lokaal        Regulering: Wereldwijd     Ethische Druk: Dodelijk

```

### **Fase 1: De Zolderkamer (Startup)**

* **Doel:** Bereik 100.000 gebruikers.  
* **Context:** Niemand let op je. Reputatieschade heeft nauwelijks impact; advertenties leveren weinig op. De focus ligt puur op virale groei.  
* **Systeemeigenschap:** Lage serverkosten per beurt. Geen actieve toezichthouders.

### **Fase 2: De Scale-Up (Groeifase)**

* **Doel:** Bereik 5.000.000 gebruikers en € 500.000 omzet.  
* **Context:** Investeerders eisen rendement. Serverkosten stijgen hard; je móét vaker advertenties plaatsen om niet bankroet te gaan.  
* **Systeemeigenschap:** Eerste klachten van gebruikers over advertentiedruk; concurrentie probeert gebruikers af te snoepen als engagement daalt.

### **Fase 3: Wereldwijd Platform (De Publieke Schandpaal)**

* **Doel:** Overleef 12 beurten met minimaal 20.000.000 gebruikers.  
* *Wijziging (balance-pass, 2026-11-04):* de orchestrator verlaagde de houdtijd van 30 naar 12 beurten voor de runlengte; met 30 beurten was fase 3 de helft van een run (~63 beurten), nu duurt een run ~45 beurten.  
* **Context:** Overheden en traditionele media kijken mee. De Boemerang-mechaniek wordt meedogenloos: het negeren van nieuws leidt direct tot boetes en advertentieboycots.  
* **Systeemeigenschap:** Hoge Toxicity triggert zware parlementaire onderzoeken.

### **Fase 4: De Beursgang (IPO \- Eindspel)**

* **Doel:** Beursnotering succesvol afronden (Behoud Reputatie \> 60 én Inkomsten \> 80 gedurende 10 opeenvolgende beurten).  
* **Dilemma:** De ultieme stresstest. Aandeelhouders eisen maximale winst (pusht naar Ads/Viraal), terwijl toezichthouders wachten op één misstap (eist Nieuws).  
* **Overwinning:** Succesvolle IPO. De speler krijgt een eindrapport dat toont hoeveel maatschappelijke schade, desinformatie en mentale gezondheidsproblemen hun platform heeft aangericht om dit doel te bereiken.

---

## **7\. Combo- & Sanctiesystemen (Onderliggende Formules)**

Om te voorkomen dat spelers gedachteloos één type kaart blijven spammen, sturen correctiemechanismen de balans bij:

* **Ad-Fatigue:**  
    
* Worden er binnen 4 beurten 3 Advertenties gekozen? Dan levert elke volgende advertentie 50% minder inkomsten op en kost deze dubbele Gebruikersaantallen.  
    
* **Echo-Chamber (Virale Spiraal):**  
    
* 3 Virale kaarten op rij activeert een *Engagement Frenzy* (+50% bonus op Gebruikerswinst), maar verhoogt Toxicity direct met \+25.  
    
* **Journalistieke Droogte (Neglect):**  
    
* Na 5 opeenvolgende beurten zonder Nieuwskaart wordt de tekst op alle volgende Virale kaarten rood omrand: het risico op directe schandalen verdubbelt.

