# Proposal — Policy cards ("Beleid") on the company's official account

Lap: temp_job_policy-cards · Research: [RESEARCH.md](RESEARCH.md) · Brief: [BRIEF.md](BRIEF.md)

## 1. The idea in five lines

1. Phases 1–2 stay as they are: you drag **posts** (Viraal, Advertentie, Nieuws) into the feed.
2. From phase 3 the hand also holds **Beleid** cards: company decisions such as "Autoplay standaard aan" or "Vlammetjes voor elke dag". Phase 3 has one policy per hand, phase 4 two.
3. Dragging a policy into the feed posts it as an **announcement on the company's official account** (avatar, ✓, "Officieel"). The post shows the company's friendly spin ("Nóg makkelijker kijken! 🎉"); the card shows what it really does.
4. A policy has a one-time effect and then **keeps working every turn** while it is active (at most three; the oldest lapses). Risky policies unlock their own scandals and regulator events; Bescherming policies can **undo** a risky one.
5. Each policy carries an **"Echt gebeurd"** line ("In 2023 kreeg een app een boete van € 345 miljoen hiervoor.") without brand names; the sources sit on a separate page.

## 2. Why this shape

- **It follows the real arc.** A startup posts and grows; a global platform decides rules for billions. The research (RESEARCH.md § 1 "The gap") shows the deck covers posts well, and company decisions hardly at all.
- **Posts stay.** The owner likes them; phase 3 keeps two posts per hand, phase 4 one, so the old rhythm fades rather than disappears.
- **Spin versus reality is the lesson.** Kids read an official announcement that sounds kind and see on the card what it does. That gap is exactly what the research documents (A5: a pause button that saves 1,5 minutes; D2: a "hide likes" option nobody finds).
- **Persistence is what makes a policy feel like policy.** A post is gone after one turn; a rule keeps acting. Keeping the effect running is also how the delayed boomerang becomes visible: you posted "Meldingen 's nachts" four turns ago, and now parents are at your door.
- **Precedent.** Strategy and management games treat policies as persistent modifiers you adopt and revoke, separate from one-off actions: civics and policies in _Civilization_, laws in _Frostpunk_, edicts in _Tropico_, card "powers" versus "skills" in deck-builders such as _Slay the Spire_. The board shows the active set, a cap forces trade-offs, and revoking costs something. This proposal copies that pattern; it does not invent a new one.

## 3. When the shift happens

| Phase         | Hand (3 cards)      | Feed                                                                                                              |
| ------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1 Zolderkamer | 3 posts (unchanged) | Your feed (unchanged)                                                                                             |
| 2 Scale-Up    | 3 posts (unchanged) | Unchanged. The milestone "Investeerders aan tafel" ends with a teaser: "Vanaf nu beslis je ook hoe je app werkt." |
| 3 Wereldwijd  | 2 posts + 1 policy  | Policies appear as official posts; an **Actief beleid** strip (max 3) sits above the feed                         |
| 4 Beursgang   | 1 post + 2 policies | Same; the feed header becomes the company page ("Scrollo · Officieel ✓ · 10 mln volgers")                         |

The policy slot is a fixed slot in the hand, not a roll in the type mix, so a policy is always on offer from phase 3 (the hand-mix roll covers only the post slots). The phase 3 intro gets one new line explaining it. Option: start in phase 2 with one policy slot every few turns (owner question Q1).

## 4. The card

### Face (in the hand)

```
┌──────────────────────────────┐
│ 🏛 BELEID · Groei            │  ← direction colour: Groei / Geld / Bescherming
│ [image]                       │
│ Autoplay standaard aan        │  ← title
│ Na elk filmpje start meteen   │  ← body: what it really does (age-11 Dutch,
│ het volgende. Stoppen moet je │     glossary markup allowed)
│ zelf doen.                    │
│ Nu: 📈 ++    Elke beurt: 📈 + │  ← one-time and per-turn effect (visible meters only)
│ ⚠ Kan een schandaal geven     │  ← shown when the policy unlocks scandals
└──────────────────────────────┘
Detail dialog adds: flavor line · "Echt gebeurd: …" · hidden effects stay hidden.
```

### Post (in the feed, after dragging)

```
┌──────────────────────────────┐
│ (S) Scrollo ✓  Officieel · nu │
│ Nóg makkelijker kijken! 🎉    │  ← announce: the company's spin
│ Vanaf vandaag start het       │
│ volgende filmpje vanzelf.     │
│ 💬 Gamer_Gijs: eindelijk!!    │  ← follower reactions (policy cue)
│ 💬 Oma Riet: En hoe stop ik?  │
└──────────────────────────────┘
```

Each policy card therefore has two texts: `announce` (corporate tone, exclamation marks, "we" and "jij") and `body` (plain truth). Both pass the existing tone rules: no real brands, people or platforms; hard words marked for the glossary.

### Directions

Policies reuse the three event option kinds (`EventOptionKind`: commercial, engagement, journalism) instead of a new vocabulary. Player-facing labels:

| Direction       | Kind       | Always (profile)                                          | Never           |
| --------------- | ---------- | --------------------------------------------------------- | --------------- |
| **Groei**       | engagement | users +, Toxicity +                                       | money now       |
| **Geld**        | commercial | money +, reputation −                                     | reputation gain |
| **Bescherming** | journalism | reputation +, Toxicity −, and a price: users − or money − | Toxicity gain   |

The profile is enforced by a content test, like the post profile in the game-content README.

## 5. Mechanics

| Rule            | Proposal                                                                                                                                                 | Why                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| One-time effect | `effects`, same as a post, scaled per phase by the engine                                                                                                | Same feedback, forecast and juice as posts                                             |
| Ongoing effect  | `ongoing` effects applied every card turn while active, small (1–3 points per meter), shown on the card as "Elke beurt"                                  | Makes "rules keep working" visible; small values keep the exponential economy in check |
| Active cap      | at most 3 active; posting a 4th lets the **oldest lapse** (it fades out of the strip with a line in the feed: "Beleid verlopen: …")                      | Forces trade-offs without an extra choice screen                                       |
| Undo            | a Bescherming policy may name the risky policy it reverses (`revokes`); posting it removes that one at once                                              | Mirrors real reversals (filters, pause buttons, the rewards app in RESEARCH A6)        |
| Hidden meters   | reputation and Toxicity stay hidden, as now                                                                                                              | Score redesign decisions unchanged                                                     |
| Combos          | policies do not count toward Echo-Chamber or Ad-Fatigue                                                                                                  | Those rules are about posting rhythm                                                   |
| News neglect    | a Bescherming policy counts as news (resets "turns without news")                                                                                        | Otherwise phase 4 (1 post slot) forces news neglect                                    |
| Scandal hooks   | a risky policy lists the scandal events it unlocks (`trigger.requiresPolicy`); while active, those events join the phase's scandal pool                  | The boomerang is traceable to the decision                                             |
| Regulators      | regulator events (fines, "Europa onderzoekt je ontwerp") prefer an active risky policy as their subject; one option is always "Zet het uit" (revokes it) | Real pattern since 2024: regulators target a design choice (RESEARCH G2)               |
| Fines           | unchanged formula; an event option may add a fine                                                                                                        | No new money rule                                                                      |
| Forecast        | the forecast line shows the one-time effect plus the first turn of the ongoing effect; the card shows "Elke beurt" separately                            | Keeps the forecast honest without predicting many turns                                |
| End report      | lists the policies the player adopted with their "Echt gebeurd" year                                                                                     | Connects the run to the real world                                                     |

### Followers

`FOLLOWERS` gains a `policy` cue per direction. Fans cheer Groei ("Eindelijk geen knop meer nodig!"), KortingKevin loves Geld, the critics (Oma Riet, Nina_Checkt) question Groei and Geld ("Wie heeft dit bedacht?") and praise Bescherming. Over time the comments under official posts turn sour as reputation drops, as they do now.

### Balance impact (to verify in the build laps)

- Ongoing effects compound with exponential growth. Start values: Groei ongoing users +1–2, Geld ongoing money +1–2 (points), Toxicity +1–3. With a cap of 3 that is at most about +6 points per turn on one meter, about half a viral card.
- Phase 4 has only one post slot, so ads are scarcer: Geld policies must carry most of the income. Expect a retune of phase 4 costs or Geld values.
- The balance simulation needs a policy heuristic per strategy (viral-only → always Groei, ad-only → always Geld, human-like → lookahead including ongoing effects). The asserted outcomes stay: one-sided play goes bankrupt, human-like wins most runs in 25–45 turns.
- `GameState` grows (active policies), so the saved-game format needs a version step (game-save).

## 6. Fiction and the "Echt gebeurd" credit

- **No brand names** (recorded decision). The company is fictional. Proposed name: **Scrollo** (owner question Q3; the build lap checks it against the banned-name test and a quick trademark search). The official account is "Scrollo ✓ Officieel" — the ✓ itself is a wink at policy E2.
- Policies describe the decision generically ("een grote app", "een fotoapp", "een videoplatform").
- **"Echt gebeurd" line** on the card detail and in the end report, at most one sentence, year included, no brand: "Echt gebeurd: in 2023 kreeg een app € 345 miljoen boete omdat kinderaccounts standaard openbaar waren." Allegations are written as such: "Volgens een rechtszaak uit 2024 …".
- **Sources page** (`/bronnen`, linked from the end report and credits): per policy the publisher and date ("Europese Commissie, 5 augustus 2024") with a link. Link targets are real articles, so URLs and the articles themselves name the companies (owner question Q4).

## 7. Draft policy cards (25)

Effects use arrows for size: + small, ++ medium, +++ large; 📈 users, 💰 money, 🛡 reputation (hidden), ☣ Toxicity (hidden). "Unlocks" names a scandal from § 8. Research ids point to RESEARCH.md § 2. Phase: 3, 4 or 3–4.

### Groei (engagement)

| #   | Titel                            | Aankondiging (officiële post)                  | Wat het echt doet (kaarttekst)                                                         | Nu           | Elke beurt | Unlocks                                   | Phase | Echt gebeurd · research                                                        |
| --- | -------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- | ------------ | ---------- | ----------------------------------------- | ----- | ------------------------------------------------------------------------------ |
| 1   | Autoplay standaard aan           | Nóg makkelijker kijken! 🎉                     | Na elk filmpje start meteen het volgende. Stoppen moet je zelf doen.                   | 📈++ ☣+      | 📈+ ☣+     | E1, E3                                    | 3     | 2026: Europa noemt dit verslavend ontwerp · A1                                 |
| 2   | Eindeloos scrollen               | Nooit meer 'volgende pagina'!                  | De feed houdt nooit op. Er is geen moment waarop je denkt: klaar.                      | 📈++ ☣+      | 📈+ ☣+     | E1, E3                                    | 3     | De bedenker zei later dat hij er spijt van had · A2                            |
| 3   | Vlammetjes voor elke dag         | Hou je vlammetje brandend met je vrienden! 🔥  | Stuur elke dag een bericht, anders is je vlammetje weg. Ook op vakantie.               | 📈++ ☣+      | 📈+ ☣+     | E2                                        | 3     | 2024: een rechtszaak noemt dit 'onmogelijk om een dag te stoppen' · A3         |
| 4   | Meldingen, ook 's nachts         | Mis nooit meer iets! 🔔                        | Je telefoon trilt ook om twee uur 's nachts. Iemand heeft iets geliket.                | 📈+ ☣++      | 📈+ ☣+     | E1, event "Ouders en scholen slaan alarm" | 3–4   | 2026: Europa noemt meldingen verslavend ontwerp · A4                           |
| 5   | Boze reacties tellen dubbel      | We laten je zien waar mensen écht over praten! | Een bericht met veel boze reacties komt hoger in de feed. Ruzie wint.                  | 📈+++ ☣++    | ☣+         | E4                                        | 3     | 2018: een feed-wijziging maakte boze berichten groter · B1                     |
| 6   | Schoonheidsfilters voor iedereen | Laat je mooiste kant zien! ✨                  | Een filter maakt je huid glad en je neus kleiner. Zonder filter voel je je lelijker.   | 📈++ 🛡−     | ☣+         | E5                                        | 3     | Onderzoek van het bedrijf zelf: meisjes gingen zich slechter voelen · C5       |
| 7   | Misschien ken je…                | Vind sneller nieuwe vrienden! 🤝               | De app stelt vrienden voor. Ook onbekende volwassenen aan kinderen.                    | 📈++ ☣+      | 📈+        | E6                                        | 3     | Volgens een rechtszaak uit 2024 wist het bedrijf dit · C2                      |
| 8   | Geheime boostknop                | Nieuwe makers krijgen een kans!                | Medewerkers kiezen stiekem welke filmpjes viraal gaan. Niemand ziet het.               | 📈++ 🛡−     | —          | E7                                        | 3     | 2023: journalisten ontdekten zo'n knop · B2                                    |
| 9   | Punten voor kijken               | Kijk, scoor en win cadeaus! 🎁                 | Hoe langer je kijkt, hoe meer punten. Punten worden cadeaubonnen.                      | 📈+++ 💰− ☣+ | 📈+ ☣+     | E1                                        | 3–4   | 2024: Europa liet zo'n spaarprogramma stoppen · A6                             |
| 10  | Cadeautjes in livestreams        | Steun je favoriete streamer! 💖                | Kijkers kopen digitale cadeautjes voor streamers. Ook kinderen. De app houdt een deel. | 💰++ 📈+     | 💰+ ☣+     | E8                                        | 3–4   | Volgens een rechtszaak verdiende een app veel aan cadeautjes van kinderen · C8 |

### Geld (commercial)

| #   | Titel                            | Aankondiging (officiële post)                   | Wat het echt doet (kaarttekst)                                                               | Nu           | Elke beurt                      | Unlocks                                            | Phase | Echt gebeurd · research                                                                |
| --- | -------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------ | ------------------------------- | -------------------------------------------------- | ----- | -------------------------------------------------------------------------------------- |
| 11  | Reclame op maat voor kinderen    | Alleen reclame die bij jou past!                | De app houdt bij wat kinderen kijken en verkoopt dat aan adverteerders.                      | 💰++ 🛡−     | 💰+                             | E9                                                 | 3     | 2019: een videoplatform betaalde $ 170 miljoen boete · C3                              |
| 12  | Reclame als je je rot voelt      | Precies de juiste reclame op het juiste moment. | De app ziet wanneer je je onzeker voelt. Juist dan komt de reclame voor puistjescrème.       | 💰++ 🛡−−    | 💰+ ☣+                          | E9                                                 | 3     | 2017: een uitgelekt plan beschreef dit · C4                                            |
| 13  | Oplichters betalen extra         | Iedereen mag adverteren!                        | Reclame die op oplichting lijkt, mag blijven. Ze betalen wel meer.                           | 💰+++ 🛡−    | 💰+ ☣+                          | event "Oplichters beloven gratis skins"            | 3–4   | 2025: een bedrijf verdiende volgens eigen papieren 1 op 10 euro aan zulke reclame · E1 |
| 14  | Vinkje te koop                   | Krijg ook een vinkje! ✓                         | Voor € 8 per maand krijgt iedereen een vinkje. Ook nepaccounts.                              | 💰++ 🛡−     | 💰+ ☣+                          | E10                                                | 3     | 2025: Europa gaf hier € 45 miljoen boete voor · E2                                     |
| 15  | Alles staat op openbaar          | Deel je talent met de wereld! 🌍                | Nieuwe accounts van kinderen staan open voor iedereen. Privé moet je zelf zoeken.            | 📈++ 💰+ 🛡− | ☣+                              | E6                                                 | 3     | 2023: € 345 miljoen boete voor een app · C1                                            |
| 16  | Quizapps mogen gegevens meenemen | Nieuw: leuke quizzen van andere makers!         | Een quizapp neemt jouw gegevens mee. En die van al je vrienden.                              | 💰++ 🛡−     | —                               | E11                                                | 3     | 2019: $ 5 miljard boete voor een sociaal netwerk · D1                                  |
| 17  | Moderatie goedkoop uitbesteden   | Meer mensen houden de app veilig!               | Ver weg kijken mensen de hele dag naar nare filmpjes. Voor heel weinig geld.                 | 💰++ ☣+      | 💰+                             | E12                                                | 3–4   | Moderatoren werden er ziek van en stapten naar de rechter · F2                         |
| 18  | Stoppen met factcheckers         | Jullie bepalen zelf wat klopt! 💬               | Geen journalisten meer die berichten checken. Dat scheelt geld. Nepnieuws blijft staan.      | 💰++ ☣++     | ☣+                              | event "Nepnieuws over de verkiezingen"             | 4     | 2025: een groot bedrijf stopte hiermee · F1                                            |
| 19  | Lobbyen in Brussel               | We praten graag mee over goede regels.          | Je betaalt mensen die politici overhalen om de regels slapper te maken.                      | 💰− 🛡−      | boetes kleiner (fine −2 points) | —                                                  | 4     | 2025: techbedrijven gaven € 151 miljoen per jaar uit aan lobby · G1                    |
| 20  | Onderzoek in de la               | Wij nemen jullie welzijn serieus.               | Jouw eigen onderzoekers zeggen: de app maakt kinderen ongelukkig. Je laat het niemand lezen. | 💰+ 🛡−      | —                               | event "Geheime papieren uitgelekt" (higher weight) | 4     | 2021: een klokkenluider liet zulk onderzoek zien · F3                                  |

### Bescherming (journalism)

| #   | Titel                           | Aankondiging (officiële post)                   | Wat het echt doet (kaarttekst)                                                       | Nu           | Elke beurt | Revokes | Phase | Echt gebeurd · research                                  |
| --- | ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ | ------------ | ---------- | ------- | ----- | -------------------------------------------------------- |
| 21  | Kinderaccounts standaard privé  | Jouw account, jouw regels. 🔒                   | Accounts van kinderen zijn eerst privé. Alleen vrienden zien wat je post.            | 🛡++ ☣− 📈−  | 🛡+        | 15, 7   | 3     | Na een boete gingen apps dit doen · C1                   |
| 22  | Een pauzeknop die echt werkt    | Tijd voor iets anders? We helpen je.            | Na een uur stopt de feed echt. Niet 'nog één filmpje'.                               | 🛡++ ☣− 📈−  | 🛡+ ☣−     | 1, 2    | 3–4   | Een oude pauzeknop scheelde maar 1,5 minuut per dag · A5 |
| 23  | Likes verbergen (standaard aan) | Minder vergelijken, meer plezier.               | Niemand ziet meer hoeveel likes je hebt. Ook jij niet.                               | 🛡+ ☣− 📈−   | ☣−         | 6       | 3     | 2021: het kon, maar de knop zat diep verstopt · D2       |
| 24  | Echte leeftijdscheck            | Veilig vanaf de eerste dag.                     | Wie jonger is dan de leeftijdsgrens, kan geen account maken. Je verliest gebruikers. | 🛡++ ☣− 📈−− | 🛡+        | 9, 10   | 4     | 2025: een land verbood sociale media onder de 16 · C7    |
| 25  | Ons onderzoek voor iedereen     | Dit weten we over onze app. Eerlijk is eerlijk. | Je publiceert wat je eigen onderzoekers vonden. Ook het slechte nieuws.              | 🛡+++ 💰−    | 🛡+        | 20      | 4     | Het bedrijf uit 2021 deed dit pas na het lek · F3        |

New glossary terms the build lap adds (if not present): _autoplay_, _beleid_, _lobby_, _moderator_, _privé_, _verificatie_ (vinkje). Existing terms reused: _adverteerder_, _nepaccount_, _journalist_, _algoritme_, _toezichthouder_, _klokkenluider_, _data_, _privacy_.

## 8. New event ideas (10)

All scandals keep the three-option shape (A commercial, B engagement, C journalism) and the existing pacing. "Requires" uses the new `requiresPolicy` trigger; without it the event is a normal phase scandal.

| #   | Titel                                 | Situatie (age-11 Dutch)                                                                      | Requires     | Phase | Options (A / B / C)                                                                                                    | Research |
| --- | ------------------------------------- | -------------------------------------------------------------------------------------------- | ------------ | ----- | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| E1  | Europa onderzoekt je ontwerp          | De [[toezichthouder]] in Brussel zegt: jouw app is gemaakt om verslavend te zijn.            | 1, 2, 4 or 9 | 3–4   | A: advocaten inhuren (💰−) · B: niks veranderen, het werkt (📈+ boete) · C: zet het uit (revokes the policy, 🛡+)      | A1       |
| E2  | Vlammetjes-paniek in de zomervakantie | Kinderen geven hun wachtwoord aan vrienden, zodat die hun vlammetje redden.                  | 3            | 3     | A: verkoop een 'vlammetje-redder' (💰+) · B: meer vlammetjes (📈+ ☣+) · C: vlammetjes mogen een week pauze (revokes 3) | A3       |
| E3  | Klas slaapt in                        | Een hele klas komt te laat. Ze keken tot diep in de nacht.                                   | 1 or 2       | 3–4   | A: reclame voor koffie (💰+) · B: 'Ze kiezen het zelf' (📈+ 🛡−) · C: nachtstand vanaf 21.00 (🛡+ 📈−)                 | A1, A4   |
| E4  | Boos, bozer, boost                    | Twee groepen maken elkaar uit. Jouw feed zet hun ruzie overal bovenaan.                      | 5            | 3     | as event "Streamers maken ruzie"                                                                                       | B1       |
| E5  | Filterspiegel                         | Meisjes zeggen in het nieuws: zonder filter durf ik niet meer op de foto.                    | 6            | 3     | A: verkoop extra filters (💰+) · B: meer filters (📈+) · C: filters krijgen een label (🛡+)                            | C5       |
| E6  | Vreemde berichten                     | Kinderen krijgen berichten van volwassenen die ze niet kennen. Ouders zijn boos.             | 7 or 15      | 3     | C revokes 7 or 15                                                                                                      | C1, C2   |
| E7  | De boostknop lekt uit                 | Een journalist ontdekt dat medewerkers stiekem hun eigen filmpjes viraal maakten.            | 8            | 3–4   | C: knop weg en uitleg (revokes 8)                                                                                      | B2       |
| E8  | Zakgeld weg in een avond              | Een kind gaf al zijn zakgeld uit aan cadeautjes voor een streamer.                           | 10           | 3–4   | C: kinderen kunnen geen cadeautjes meer kopen (revokes 10)                                                             | C8, C10  |
| E9  | Wat weet de app over mij?             | Een school laat zien wat de app over kinderen bijhoudt. Het is een lange lijst.              | 11 or 12     | 3–4   | C: geen reclame op maat voor kinderen (revokes 11/12)                                                                  | C3, C4   |
| E10 | Nep met vinkje                        | Een nepaccount met vinkje doet alsof het een bank is. Mensen raken geld kwijt.               | 14           | 3–4   | C: vinkje alleen na echte check (revokes 14)                                                                           | E2       |
| E11 | Quizapp lekt alles                    | Een quizapp heeft de gegevens van miljoenen mensen doorverkocht.                             | 16           | 4     | C: sorry, uitleg en strengere regels (revokes 16)                                                                      | D1       |
| E12 | Moderatoren slaan alarm               | De mensen die nare filmpjes moeten bekijken, worden er ziek van. Ze stappen naar de rechter. | 17           | 4     | A: schikken (💰−) · B: nieuw bedrijf zoeken, nog goedkoper (💰+ 🛡−−) · C: betere zorg en loon (💰− 🛡+)               | F2       |

(12 listed; pick 6–10 in the content lap. E3 and E4 are the strongest; E11 and E12 the most adult.)

Milestone idea for phase 4, no policy needed: **"Een land verbiedt je app voor kinderen"** (C7) — options: fight it, comply, build a kids' version (C6).

## 9. Build laps (each M or smaller)

| Lap                | Size | What                                                                                                                                                                                                                                                                                                                                                           | Depends on                                       |
| ------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1 `policy-engine`  | M    | Engine schema: policy card definition (`direction`, `announce`, `effects`, `ongoing`, `revokes`, `unlocks`), policy slots per phase, active-policy state (cap, oldest lapses, revoke), ongoing effects in the turn report, `requiresPolicy` event trigger, Bescherming resets news neglect; seed content + engine tests; saved-game format version (game-save) | owner answers Q1–Q2                              |
| 2 `policy-content` | M    | 15–20 policies from § 7 and 6–8 events from § 8, glossary entries, follower `policy` lines, content tests (direction profile, no brands), balance-simulation heuristics and retune, game-content README + `DOC_GAME_DESIGN.md`                                                                                                                                 | 1; Q3, Q5                                        |
| 3 `policy-board`   | M    | Policy card face in the draft, official-account post in the feed, active-policy strip, forecast with "Elke beurt", juice event for a posted / lapsed / revoked policy, phase 3 intro and how-to-play copy                                                                                                                                                      | 1 (can start on seed content in parallel with 2) |
| 4 `policy-imagery` | S    | Images per policy and the company avatar (same licences as card-imagery)                                                                                                                                                                                                                                                                                       | 2                                                |
| 5 `real-cases`     | S    | "Echt gebeurd" line in the detail dialog and end report, `/bronnen` page with sources                                                                                                                                                                                                                                                                          | 2; Q4                                            |

Order: 1 → (2 ∥ 3) → (4 ∥ 5). Laps 2 and 3 touch different feature areas, so the orchestrator can run them in parallel.

## 10. Owner decisions

| #   | Question                                              | Options (recommended first)                                                                                                                                                                                                                                                      |
| --- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | When do policy cards come in?                         | **A (recommended):** phase 3 one policy per hand, phase 4 two; phases 1–2 unchanged. · B: start in phase 2 with an occasional policy. · C: phase 4 only, then every card is a policy.                                                                                            |
| Q2  | How does a policy work after you drag it?             | **A (recommended):** one-time effect plus a small effect every turn; at most 3 active, the oldest lapses; Bescherming can undo a risky one. · B: one-time only, like a post (simplest, but policies feel like posts). · C: stays active forever (strongest, hardest to balance). |
| Q3  | What is the company called?                           | **A (recommended):** a fixed invented name, "Scrollo" (checked against real brands first). · B: the player names the app at the start. · C: no name, "Jouw app · Officieel".                                                                                                     |
| Q4  | How do we show that it really happened?               | **A (recommended):** "Echt gebeurd" line on the card detail and in the end report, without brand names, plus a separate sources page with links (the linked articles do name the companies). · B: the line only, no links. · C: nothing in the game; sources only in the repo.   |
| Q5  | Which heavy topics may come in (softened for age 11)? | **A (recommended):** moderators who get ill, unknown adults in friend suggestions, live gifts (money only), loose AI chat rules; leave out violence abroad (Myanmar) and sexual exploitation. · B: only light topics (design, ads, data). · C: everything, softened.             |
