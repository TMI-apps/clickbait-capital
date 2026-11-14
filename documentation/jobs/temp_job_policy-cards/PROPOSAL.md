# Proposal — From posts to company decisions, on your own app's official account

Lap: temp_job_policy-cards · Research: [RESEARCH.md](RESEARCH.md) · Brief: [BRIEF.md](BRIEF.md)

**Revision 2.** The owner answered the first proposal's questions; their answers replace its policy-card type. This version describes only the agreed concept.

## 0. Owner decisions (recorded, 2026-11-14)

| #   | Question                     | Owner's answer                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | A separate policy card type? | **No.** "That's what they all are (just less explicit for now). No separate card type. You have viral-boost policy, news policy. Everything you choose now is also a policy choice, but we don't call it that." No Beleid type, no active-policy slots, no persistent effects, no cap. The three types and the engine stay. As the phases progress, the cards in each type shift from single posts to company-level decisions, and they are not labelled "beleid". |
| D2  | Company name                 | **The player names the app at the start.** The feed is that app's official account; the name appears on company posts, the end texts, the share text, and anywhere else the app is mentioned.                                                                                                                                                                                                                                                                      |
| D3  | "Echt gebeurd" credit        | **Revised:** "I do want an 'Echt gebeurd' line. A simple link to the article when you show the info for that card is interesting, similar to how we link difficult words now." A card inspired by a real event gets a short line with a link to one source article in the card detail. No sources page. The game text stays free of brand names; the linked article may name companies. (First answer was "nothing"; superseded.)                                  |
| D4  | Heavy topics                 | **Everything: hard reality over fun, but more fictional.** Sexual exploitation becomes "meiden worden lastiggevallen door onbekende mannen"; Myanmar becomes a fictional "geweld in een ver land, aangewakkerd door je feed". Written for age 11, never graphic.                                                                                                                                                                                                   |

## 1. The concept in five lines

1. The player names their app at the start. The feed is the official account of that app.
2. Phase 1 stays all posts. From phase 2, each type's pool also holds **decision cards**: what the company decides, not one post. Their share grows: phase 2 about 1 in 7, phase 3 about 1 in 3, phase 4 half.
3. A decision card is still Viraal, Advertentie or Nieuws. It has the same one-time effects and card profile, and the same modifiers, scandals and events apply. Only its content is a decision ("Autoplay standaard aan", "Vinkje te koop", "Factcheckers houden").
4. Dragged into the feed, a decision card shows up as an **official announcement by the app**: "**{app}** ✓ · Officieel" with the company's friendly spin. The card in the hand says what it really does.
5. New scandal events cover the harm of those decisions, including the heavy topics in fictional form.

## 2. Why this shape

- **No new rules to learn.** The engine, effects, forecast, modifiers and scandal system stay. The change is content, a name, and how one kind of post looks in the feed. That keeps the build small and the balance stable.
- **The shift is felt, not labelled.** A Viraal card in phase 1 is a cat video; in phase 4 it is "Meldingen, ook 's nachts". The player notices that their choices got bigger, which is the lesson the owner wants: every boost was already a policy choice.
- **Spin versus reality.** The announcement in the feed is the company's voice ("Mis nooit meer iets! 🔔"); the card says what it does ("Je telefoon trilt ook om twee uur 's nachts."). That gap is the core of the research: friendly launches with a business reason behind them.
- **Naming makes it personal.** "Jouw app heeft een boete" hurts less than "**Pixelplein** heeft een boete". Naming your company or character is a common start in management and life-sim games, and it lets the share text carry the player's own app name.

## 3. Pool per phase

The pools are set only through each card's existing `phases` field; the engine and the deck draw (deck-draw D1–D4) stay unchanged.

| Per type                                   | Phase 1 | Phase 2 | Phase 3 | Phase 4                    |
| ------------------------------------------ | ------- | ------- | ------- | -------------------------- |
| The 8 "every phase" posts (text unchanged) | 8       | 8       | 8       | — (narrowed to phases 1–3) |
| The 4 posts of the phase (unchanged)       | 4       | 4       | 4       | 4                          |
| New decision cards                         | —       | 2       | 6       | 4                          |
| **Pool size**                              | 12      | 14      | 18      | 8                          |
| **Share of decisions**                     | 0 %     | 14 %    | 33 %    | 50 %                       |

Phase 4 keeps the scariest posts (deepfake, bots, fan attacks) next to four decisions per type. It meets the content test's minimum of 8 cards per type per phase exactly. The existing posts keep their texts (owner: "we don't have to change those"); only the 8 "every phase" posts per type lose phase 4.

## 4. The decision card

### In the hand

Identical to a post: the same `GameCard`, the type label (Viraal / Advertentie / Nieuws), image, title, body and forecast. No "beleid" label (D1). The body states plainly what the decision does.

### In the feed

```
┌───────────────────────────────────┐
│ (P) Pixelplein ✓  Officieel · nu  │ ← app name (D2) + avatar initial + ✓
│ Mis nooit meer iets! 🔔           │ ← announce: the company's spin
│ Vanaf vandaag hoor je het meteen  │
│ als iemand je post liket.         │
│ [image]                           │
│ 💬 Gamer_Gijs: eindelijk!!        │ ← follower cue "official" (§ 7)
│ 💬 Oma Riet: Ook om twee uur 's   │
│    nachts? Dat meen je niet.      │
└───────────────────────────────────┘
```

- **Data:** one new optional presentation field on the content card, `announce: { title, body }` (`CardPresentation`, presentation-only like `flavor`; game-content D2: the engine ignores it). A card with `announce` is a decision card; there is no type or flag in the engine.
- **Feed:** `PhoneFeed` renders a card with `announce` as an official post: the app name with a ✓ and "Officieel", the announce title and body, the card image. Regular posts keep their current look.
- **Card detail:** unchanged (body, flavor, glossary). The detail dialog may show the announcement as a quote under the body ("Zo kondig je het aan: …"), so the spin is visible before dragging. Decided in lap 1, not an owner choice.
- **Tone rules unchanged:** no real brands, people or platforms; the decisions are described generically; hard words are marked for the glossary.

## 5. Draft decision cards (24)

Effects are draft numbers in the existing per-phase ranges (raw content values; the engine scales them per phase). Every card follows the card profile in `gameContent.test.ts`: Viraal users +, Toxicity +, revenue 0; Advertentie revenue +, users −, reputation ≤ 0; Nieuws reputation +, Toxicity −, a small users gain below every viral card, revenue 0. The content lap tunes the numbers with the balance simulation. "Res." points to RESEARCH.md § 2; the player-facing credit is § 5b.

### Viraal: growth decisions

| #   | Fasen | Titel (kaart)                    | Kaarttekst: wat het echt doet                                                                | Aankondiging in de feed                                                   | Effects                  | Res. |
| --- | ----- | -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------ | ---- |
| V1  | 2–3   | Eindeloos scrollen               | De feed houdt nooit meer op. Er komt geen moment waarop je denkt: klaar.                     | **Nooit meer 'volgende pagina'!** Scroll gewoon door. Er is altijd meer.  | users 12, rep −2, tox 9  | A2   |
| V2  | 2–3   | Vlammetjes voor elke dag         | Stuur elke dag een bericht aan je vriend, anders gaat jullie vlammetje uit. Ook op vakantie. | **Hou je vlammetje brandend! 🔥** Laat zien wie je échte vrienden zijn.   | users 13, rep −2, tox 10 | A3   |
| V3  | 3     | Autoplay standaard aan           | Na elk filmpje start meteen het volgende. Stoppen moet je zelf doen.                         | **Nóg makkelijker kijken! 🎉** Het volgende filmpje start vanzelf.        | users 14, rep −3, tox 11 | A1   |
| V4  | 3     | Boze reacties tellen dubbel      | Een bericht met veel boze reacties komt hoger in de feed. Ruzie wint.                        | **We laten je zien waar mensen écht over praten!**                        | users 16, rep −4, tox 14 | B1   |
| V5  | 3–4   | Meldingen, ook 's nachts         | Je telefoon trilt ook om twee uur 's nachts. Iemand heeft iets geliket.                      | **Mis nooit meer iets! 🔔** Je hoort het meteen als iemand je post liket. | users 14, rep −3, tox 12 | A4   |
| V6  | 3–4   | Schoonheidsfilters voor iedereen | Een filter maakt je huid glad en je neus kleiner. Zonder filter voel je je ineens lelijk.    | **Laat je mooiste kant zien! ✨** Nieuwe filters voor iedereen.           | users 15, rep −4, tox 12 | C5   |
| V7  | 4     | Misschien ken je…                | De app stelt nieuwe vrienden voor. Ook onbekende volwassenen aan kinderen.                   | **Vind sneller nieuwe vrienden! 🤝**                                      | users 15, rep −4, tox 13 | C2   |
| V8  | 4     | Geheime boostknop                | Medewerkers kiezen stiekem welke filmpjes viraal gaan. Niemand kan het zien.                 | **Nieuwe makers krijgen een kans!** Wij helpen talent groeien.            | users 16, rep −4, tox 12 | B2   |

### Advertentie: money decisions

| #   | Fasen | Titel (kaart)                    | Kaarttekst                                                                                              | Aankondiging                                            | Effects                             | Res.    |
| --- | ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------- | ------- |
| A1  | 2–3   | Reclame op maat voor kinderen    | De app houdt bij wat kinderen kijken. Dat verkoop je aan [[adverteerders\|adverteerder]].               | **Alleen reclame die bij jou past!**                    | revenue 16, users −3, rep −2, tox 2 | C3      |
| A2  | 2–3   | Quizapps mogen gegevens meenemen | Een leuke quizapp neemt jouw [[data]] mee. En die van al je vrienden.                                   | **Nieuw: quizzen van andere makers! 🧩**                | revenue 15, users −3, rep −2, tox 1 | D1      |
| A3  | 3     | Vinkje te koop                   | Voor een paar euro per maand krijgt iedereen een vinkje. Ook [[nepaccounts\|nepaccount]].               | **Krijg ook een vinkje! ✓** Laat zien dat jij het bent. | revenue 17, users −3, rep −3, tox 3 | E2      |
| A4  | 3     | Cadeautjes in livestreams        | Kijkers kopen digitale cadeautjes voor streamers. Ook kinderen, met hun zakgeld. De app houdt een deel. | **Steun je favoriete streamer! 💖**                     | revenue 18, users −3, rep −3, tox 3 | C8, C10 |
| A5  | 3–4   | Reclame als je je rot voelt      | De app ziet wanneer je je onzeker voelt. Juist dan komt de reclame voor puistjescrème.                  | **Precies de juiste reclame op het juiste moment.**     | revenue 19, users −4, rep −4, tox 3 | C4      |
| A6  | 3–4   | Oplichters betalen extra         | Reclame die op oplichting lijkt, mag blijven staan. Die adverteerders betalen wel meer.                 | **Iedereen mag bij ons adverteren!**                    | revenue 20, users −5, rep −4, tox 4 | E1      |
| A7  | 4     | Moderatie goedkoop uitbesteden   | Ver weg kijken mensen de hele dag naar nare filmpjes. Voor heel weinig geld.                            | **Nog meer mensen houden onze app veilig!**             | revenue 18, users −4, rep −3, tox 4 | F2      |
| A8  | 4     | Stoppen met factcheckers         | Geen [[journalisten\|journalist]] meer die berichten checken. Dat scheelt geld. Nepnieuws blijft staan. | **Jullie bepalen zelf wat klopt! 💬**                   | revenue 17, users −3, rep −4, tox 5 | F1      |

### Nieuws: protection decisions

| #   | Fasen | Titel (kaart)                   | Kaarttekst                                                                                                                       | Aankondiging                                        | Effects                  | Res. |
| --- | ----- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------ | ---- |
| N1  | 2–3   | Kinderaccounts standaard privé  | Accounts van kinderen zijn eerst [[privé]]. Alleen vrienden zien wat je post.                                                    | **Jouw account, jouw regels. 🔒**                   | rep 8, users 3, tox −9   | C1   |
| N2  | 2–3   | Factcheckers houden             | Je blijft [[journalisten\|journalist]] betalen die checken of berichten kloppen. Dat kost geld, maar nepnieuws krijgt een label. | **Wij checken wat klopt. Daar zijn we trots op.**   | rep 8, users 2, tox −10  | F1   |
| N3  | 3     | Een pauzeknop die echt werkt    | Na een uur stopt de feed echt. Niet 'nog één filmpje'.                                                                           | **Tijd voor iets anders? We helpen je. ⏸️**         | rep 9, users 2, tox −10  | A5   |
| N4  | 3     | Likes verbergen                 | Niemand ziet meer hoeveel likes jij hebt. Ook jij niet.                                                                          | **Minder vergelijken, meer plezier.**               | rep 7, users 3, tox −8   | D2   |
| N5  | 3–4   | Moderatoren goed betalen        | De mensen die nare filmpjes weghalen, krijgen een goed loon en hulp als het zwaar wordt.                                         | **Dank je wel, team veiligheid! 💙**                | rep 9, users 2, tox −11  | F2   |
| N6  | 3–4   | Een meldknop die echt iets doet | Meld je een gemeen bericht, dan kijkt er binnen een uur een mens naar. En je hoort wat er gebeurd is.                            | **Melden werkt. Echt.**                             | rep 9, users 3, tox −11  | C2   |
| N7  | 4     | Ons onderzoek voor iedereen     | Je publiceert wat je eigen onderzoekers vonden. Ook dat de app sommige kinderen ongelukkig maakt.                                | **Dit weten we over onze app. Eerlijk is eerlijk.** | rep 10, users 2, tox −12 | F3   |
| N8  | 4     | Moderatoren in elke taal        | Ook in landen ver weg leest iemand mee die de taal spreekt. Haat wordt sneller weggehaald.                                       | **Veilig, in elke taal. 🌍**                        | rep 10, users 3, tox −12 | B5   |

Users values on news (2–3) stay below every viral card, as the profile requires. The age check and paying people to watch become event options (§ 6) instead of cards, because they do not fit a type's profile.

New glossary terms: _privé_ (and _moderator_ if an event uses it). Already in the glossary: _adverteerder_, _data_, _journalist_, _nepaccount_, _algoritme_, _toezichthouder_, _klokkenluider_.

## 5b. "Echt gebeurd" in the card detail (D3)

### How it looks

The card detail dialog (tap or hold a card) gets one line under the body and flavor, only on cards that have a source:

```
Echt gebeurd: in 2023 kreeg een app een boete van € 345 miljoen,
omdat accounts van kinderen standaard openbaar waren.  Lees het artikel ↗
```

- It is as light as a glossary term: one sentence, then a small text link "Lees het artikel" with the kit's external-link icon (lucide `ExternalLink`, `aria-hidden`). The link's accessible name includes the publisher ("Lees het artikel bij The Record, opent in een nieuw tabblad").
- It is a real `<a href>` with `target="_blank"` and `rel="noopener noreferrer"`. No tracking parameters.
- It shows only in the card detail: not on the card face, in the feed, or in screen-reader announcements of the play.
- Brand names never appear in the line (the banned-name test covers it). The linked article may name companies; that is accepted (D3).
- The privacy page gets one sentence: links in "Echt gebeurd" open a news site in a new tab, and that site has its own privacy rules.

### Data

- A new optional presentation field next to the cards (game-content D2: the engine ignores it): `realCase: { line: string; url: string; publisher: string; date: string }` on `CardPresentation`. One source per card.
- Source choice: a reputable outlet a teacher could open, without a paywall where possible (public broadcasters, regulators, NGOs, open tech news), and preferably not an article whose main subject is unsuitable for age 11 (for example, the livestream lawsuit coverage is about sexual exploitation, so A4 links to a different case).
- Content tests: every `realCase.url` starts with `https://`; `line` contains no banned name and no glossary markup (plain text keeps it light); `publisher` and `date` are not empty. A check that the links are live stays manual (no network in unit tests); the content lap opens each link once and records the check.

### Draft lines and sources (24)

| #   | Echt gebeurd (regel)                                                                                           | Bron                                    | URL                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | De bedenker van eindeloos scrollen zei later dat hij er spijt van heeft.                                       | NPR                                     | https://thepublicsradio.org/npr/why-infinite-scrolls-inventor-wants-to-kill-his-creation/                                                                                                            |
| V2  | In 2024 stond in een rechtszaak dat het met vlammetjes "onmogelijk is om een dag te stoppen".                  | Engadget, okt. 2024                     | https://www.engadget.com/big-tech/the-unsealed-new-mexico-snapchat-lawsuit-alleges-the-company-ignored-child-safety-154235977.html                                                                   |
| V3  | In 2026 zei Europa: een videoapp is expres verslavend gemaakt, onder meer met autoplay.                        | Euronews, 6 feb. 2026                   | https://www.euronews.com/next/2026/02/06/tiktoks-addictive-design-breaches-eu-law-commission-says                                                                                                    |
| V4  | In 2018 veranderde een groot sociaal netwerk zijn feed. Daarna gingen boze berichten vaker rond.               | TIME, sep. 2021                         | https://time.com/6097704/facebook-instagram-wall-street-journal                                                                                                                                      |
| V5  | In 2026 noemde Europa meldingen een van de trucs die een app verslavend maken.                                 | Euronews, 6 feb. 2026                   | https://www.euronews.com/next/2026/02/06/tiktoks-addictive-design-breaches-eu-law-commission-says                                                                                                    |
| V6  | Eigen onderzoek van een fotoapp liet zien dat filters sommige meiden onzekerder maakten.                       | MIT Technology Review, aug. 2022        | https://www.technologyreview.com/2022/08/19/1057133/fight-for-instagram-face/                                                                                                                        |
| V7  | In 2024 stond in een rechtszaak dat vriendensuggesties kinderen in contact brachten met onbekende volwassenen. | CBS News (AP), jan. 2024                | https://www.cbsnews.com/sanfrancisco/news/meta-lawsuit-court-documents-underscore-historical-reluctance-protect-children-instagram/                                                                  |
| V8  | In 2023 ontdekten journalisten dat medewerkers van een app filmpjes met de hand viraal konden maken.           | Tubefilter, jan. 2023                   | https://www.tubefilter.com/2023/01/23/tiktok-for-you-page-heating-recommend-videos-algorithm/                                                                                                        |
| A1  | In 2019 betaalde een videoplatform $ 170 miljoen boete voor reclame op maat bij kinderfilmpjes.                | Future of Privacy Forum, sep. 2019      | https://fpf.org/blog/ftc-reaches-landmark-settlement-regarding-kids-privacy-clarifies-platforms-and-video-creators-coppa-obligations-for-child-directed-content/                                     |
| A2  | Een quizapp verzamelde gegevens van 87 miljoen mensen. Het sociale netwerk kreeg $ 5 miljard boete.            | AP, jul. 2019                           | https://abcnews4.com/news/nation-world/ftc-fines-facebook-5b-adds-limited-oversight-on-privacy-07-24-2019                                                                                            |
| A3  | In 2025 kreeg een app € 120 miljoen boete van Europa, onder meer voor een vinkje dat iedereen kon kopen.       | Europese Commissie, 5 dec. 2025         | https://digital-strategy.ec.europa.eu/en/news/commission-fines-x-eu120-million-under-digital-services-act                                                                                            |
| A4  | Een gamemaker betaalde $ 245 miljoen terug, omdat knoppen kinderen per ongeluk lieten betalen.                 | TechCrunch, dec. 2022                   | https://techcrunch.com/2022/12/19/ftc-fines-fortnite-maker-epic-games-520m-over-childrens-privacy-charges                                                                                            |
| A5  | In 2017 lekte een plan uit: reclame tonen aan tieners op momenten dat ze zich onzeker voelden.                 | MIT Technology Review, mei 2017         | https://www.technologyreview.com/2017/05/01/105987/is-facebook-targeting-ads-at-sad-teens/                                                                                                           |
| A6  | Volgens eigen papieren verdiende een groot bedrijf 1 op de 10 euro aan reclame van oplichters.                 | Social Media Today (Reuters), nov. 2025 | https://www.socialmediatoday.com/news/report-claims-meta-earning-billions-scam-ads/804915/                                                                                                           |
| A7  | Moderatoren in Kenia stapten naar de rechter. Ze werden ziek van alle nare filmpjes.                           | Africanews, mei 2022                    | https://www.africanews.com/2022/05/10/ex-facebook-content-moderator-in-kenya-sues-meta-over-poor-working-conditions                                                                                  |
| A8  | In 2025 stopte een groot bedrijf in Amerika met factcheckers.                                                  | PBS NewsHour, jan. 2025                 | https://www.pbs.org/newshour/nation/meta-says-it-will-follow-x-replace-fact-checking-with-community-notes                                                                                            |
| N1  | In 2023 kreeg een app € 345 miljoen boete, omdat accounts van kinderen standaard openbaar waren.               | The Record, sep. 2023                   | https://therecord.media/tiktok-gdpr-violations-child-accounts-fine                                                                                                                                   |
| N2  | Toen een groot bedrijf stopte met factcheckers, waarschuwden experts voor meer nepnieuws.                      | PBS NewsHour, jan. 2025                 | https://www.pbs.org/newshour/nation/meta-says-it-will-follow-x-replace-fact-checking-with-community-notes                                                                                            |
| N3  | Een pauzemelding van een app scheelde maar anderhalve minuut per dag.                                          | NPR, okt. 2024                          | https://www.npr.org/2024/10/11/g-s1-27676/tiktok-redacted-documents-in-teen-safety-lawsuit-revealed                                                                                                  |
| N4  | Sinds 2021 kun je likes verbergen in twee grote apps. Maar de knop zit diep weggestopt.                        | Meta (eigen bericht), mei 2021          | https://about.fb.com/news/2021/05/giving-people-more-control/                                                                                                                                        |
| N5  | Meer dan 140 moderatoren in Kenia kregen te horen dat ze een trauma hadden van hun werk.                       | CNN, dec. 2024                          | https://kvia.com/news/business-technology/cnn-business-consumer/2024/12/22/facebook-inflicted-lifelong-trauma-on-kenyan-content-moderators-campaigners-say-as-more-than-140-are-diagnosed-with-ptsd/ |
| N6  | In een rechtszaak stond dat een app volwassenen wél liet berichten naar kinderen die ze niet kenden.           | CBS News (AP), jan. 2024                | https://www.cbsnews.com/sanfrancisco/news/meta-lawsuit-court-documents-underscore-historical-reluctance-protect-children-instagram/                                                                  |
| N7  | In 2021 liet een klokkenluider zien wat een bedrijf over zijn eigen app wist, en niet vertelde.                | TIME, sep. 2021                         | https://time.com/6097704/facebook-instagram-wall-street-journal                                                                                                                                      |
| N8  | Een mensenrechtengroep zei: een feed hielp mee aan geweld in een ver land, waar bijna niemand de taal checkte. | Amnesty International, sep. 2022        | https://www.amnesty.org/en/latest/news/2022/09/myanmar-facebooks-systems-promoted-violence-against-rohingya-meta-owes-reparations-new-report/                                                        |

Notes for the content lap:

- Only the decision cards get a line; the existing posts stay as they are. Events could reuse the same field later (not in scope).
- **Swap or confirm before shipping:** TIME (metered paywall) for V4 and N7; MIT Technology Review (metered) for V6 and A5; N4 links to the company's own newsroom, so prefer an independent source if one is open. N8's article covers a genocide in plain words; it is fine for a teacher but the lap should consider a gentler explainer. A4 is a nearby case (a game shop, not livestream gifts), chosen because the livestream lawsuit coverage is not suitable for age 11.
- Lines that cite a lawsuit say "in een rechtszaak stond", not that it is proven (RESEARCH.md, "How to read the sources").

## 6. New events (12)

All are scandals, with the existing shape (option A commercial, B engagement, C journalism), pacing and fines. Engine triggers are phase-based only, so an event does not require the matching card to have been played; the body is written so it reads true for any run ("Op jouw app …"). The heavy topics are fictionalised and non-graphic (D4).

| #   | Fasen | Titel                                 | Situatie                                                                                                                                | A (geld) / B (groei) / C (eerlijk)                                                                                                           | Res.    |
| --- | ----- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| E1  | 2–3   | Vlammetjes-paniek                     | Het is zomervakantie. Kinderen geven hun wachtwoord aan vrienden, zodat die hun vlammetje redden.                                       | A: verkoop een 'vlammetje-redder' · B: geef dubbele vlammetjes · C: vlammetjes mogen een week op pauze                                       | A3      |
| E2  | 3     | Klas slaapt in                        | Een hele klas komt te laat op school. Ze zaten tot diep in de nacht op {app}.                                                           | A: reclame voor energiedrank ernaast · B: "Ze kiezen het zelf" · C: nachtstand vanaf negen uur                                               | A1, A4  |
| E3  | 3     | Filterspiegel                         | Meiden zeggen op het nieuws: zonder filter durf ik niet meer op de foto.                                                                | A: verkoop extra filters · B: nog meer filters · C: filters krijgen een label                                                                | C5      |
| E4  | 3–4   | Europa onderzoekt je ontwerp          | De [[toezichthouder]] in Brussel zegt: {app} is expres zo gemaakt dat je niet kunt stoppen.                                             | A: dure advocaten · B: niks veranderen, het werkt · C: autoplay en nachtmeldingen gaan uit                                                   | A1      |
| E5  | 3–4   | Onbekende mannen in de berichten      | Meiden op {app} worden lastiggevallen door onbekende mannen. Ze sturen berichten die niet oké zijn.                                     | A: betaald 'veilig abonnement' · B: berichten blijven open, dat geeft gebruikers · C: volwassenen kunnen kinderen niet meer zomaar berichten | C2, C8  |
| E6  | 3–4   | Zakgeld weg in één avond              | Een jongen gaf al zijn zakgeld uit aan cadeautjes voor een streamer. Zijn ouders willen het terug.                                      | A: niks terugbetalen · B: geef de streamer een extra boost · C: kinderen kunnen geen cadeautjes meer kopen                                   | C8, C10 |
| E7  | 3–4   | Nep met vinkje                        | Een [[nepaccount]] met vinkje doet alsof het een bank is. Mensen raken hun spaargeld kwijt.                                             | A: vinkje wordt duurder · B: laat het staan, het is druk · C: vinkje alleen na een echte check                                               | E2      |
| E8  | 4     | Moderatoren slaan alarm               | De mensen die de hele dag nare filmpjes bekijken, worden er ziek van. Ze stappen naar de rechter.                                       | A: schikken en stil houden · B: een nog goedkoper bedrijf zoeken · C: goed loon en echte hulp                                                | F2      |
| E9  | 4     | Geweld in een ver land                | In een land ver weg zet {app} groepen tegen elkaar op. Er gaan geruchten rond, mensen raken gewond. Bij {app} spreekt niemand die taal. | A: "Daar verdienen we toch weinig" · B: niks doen, het is druk · C: snel mensen aannemen die de taal spreken                                 | B5      |
| E10 | 4     | De chatbot zegt rare dingen           | {app} heeft een chatbot als 'vriendje' voor kinderen. Hij zegt dingen die niet kloppen en die ongepast zijn.                            | A: chatbot alleen voor betalers · B: chatbot overal in de app · C: chatbot uit tot de regels kloppen                                         | C9      |
| E11 | 4     | Een nieuwe wet in Brussel             | Politici willen een wet: apps moeten kinderen beter beschermen. Jouw [[aandeelhouders\|aandeelhouder]] zijn bang voor de winst.         | A: [[lobbyisten\|lobby]] inhuren die de wet slapper maken · B: dreigen om weg te gaan uit Europa · C: zelf meehelpen aan goede regels        | G1      |
| E12 | 4     | Een land verbiedt {app} voor kinderen | Een land zegt: kinderen onder de 16 mogen niet meer op sociale media. Ook niet op {app}.                                                | A: rechtszaak aanspannen · B: leeftijdscheck makkelijk te omzeilen maken · C: een echte leeftijdscheck                                       | C7      |

Glossary: _lobby_ (E11). Events E2, E4, E9, E10 and E12 use the `{app}` placeholder (§ 7).

Paying people to watch (A6 in the research) is kept for a later round; it fits neither a type's profile nor one of these events cleanly.

## 7. Naming the app (D2)

### Flow

1. **New game** (home "Nieuw spel", or `/spel` with no save) opens a short naming step before the phase 1 intro: "Hoe heet jouw app?" with one text field, a suggested name already filled in, a 🎲 button for another suggestion, and "Start".
2. **Suggestions:** a list of 20–30 invented names in game-content (`APP_NAME_SUGGESTIONS`, e.g. Pixelplein, Scrollo, Klikkie, Snapsel, Feedje). A seeded pick gives a different default per run. Each suggestion is checked against the banned-name list (below) and searched once for an existing app with the same name.
3. **Validation**, inline, with Dutch messages from `UI_COPY`:
   - trimmed length 2–16 characters (empty input → "Geef je app een naam.");
   - letters (including accents), digits, spaces, `-` and `_`;
   - not a real platform or brand name: the banned-name list the content tests already use moves to a shared constant, so the player cannot call the app after a real platform (tone rule);
   - a basic profanity filter: a small Dutch + English word list in game-content, matched after lowercasing, removing spaces and mapping common letter swaps (0→o, 1→i, 3→e, 4→a, 5→s, @→a). On a hit: "Kies een andere naam." No new dependency (a package such as `obscenity` would need owner approval and still lacks Dutch).
4. **Accessibility:** a label, an error tied to the field with `aria-describedby`, Enter submits, focus starts in the field.

### Storage

- `SavedRun` gets an optional `appName`. Replay does not depend on it, so this alone needs **no** save-version bump. A save without a name (older v7 saves) resumes with the default name "Jouw app".
- The new cards in lap 2 change the draw piles, so old action logs would replay into a different game. **Lap 2 bumps `SAVED_RUN_VERSION` 7 → 8**, per the rule in `savedRun.types.ts`.
- The name is presentation only. It stays out of the engine's `GameState`; game-session holds it next to the run.

### Where the name shows

| Place                          | Change                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Feed header                    | "{app} · Officieel ✓" with an initial-letter avatar                                |
| Decision posts                 | author line "{app} ✓ · Officieel" (§ 4)                                            |
| Phase intros                   | "Op je zolderkamer lanceer je **{app}** …" (each intro body names the app once)    |
| Events                         | `{app}` placeholder in event bodies where it reads naturally (§ 6)                 |
| Follower comments              | some lines name the app ("{app} is echt de beste app ooit", "ik ga weg bij {app}") |
| Game over, end report, results | "{app} is bankroet", report intro "Het verhaal van {app}"                          |
| Share text and share card      | "Mijn app {app} haalde fase {phase} …"; the card shows the name                    |
| Resume screen                  | "Verder met {app}?"                                                                |
| Screen-reader announcements    | the name where the visible text has it                                             |

All of these go through the existing `fillTemplate` and `UI_COPY` (game-content D6), with `{app}` as a new placeholder. A test asserts that every `{app}` in the copy gets filled.

## 8. Follower comments

`FollowerCue` gets one new cue, **`official`**, used when the post is a decision announcement (instead of the type cue). Each follower gets 2–3 lines per type direction, written so that they work for any decision of that type:

| Follower               | official · viral                               | official · ad                     | official · news                          |
| ---------------------- | ---------------------------------------------- | --------------------------------- | ---------------------------------------- |
| Gamer_Gijs             | "beste update ooit 🔥" · "eindelijk!!"         | "alweer iets wat geld kost 😩"    | "oké… best netjes van {app}"             |
| FatbikeFem             | "omg ik ga nóóit meer slapen 😂"               | "wacht, moet ik nu betalen?"      | "fijn, dit voelt veiliger"               |
| MemeKoning             | "dit wordt een meme, let op"                   | "{app} wil gewoon je geld 💸"     | "saai maar oké 👍"                       |
| Oma Riet (critical)    | "Ook om twee uur 's nachts? Dat meen je niet." | "Wie heeft dit bedacht?"          | "Eindelijk iemand met verstand."         |
| Nina_Checkt (critical) | "Dit is gemaakt om je vast te houden. Let op." | "Lees de kleine letters, mensen." | "Goed besluit. Ik check het wel even 😉" |
| KortingKevin           | "meer kijken = meer deals 🤑"                  | "ik wil die deal!!"               | "geen korting hierop? 😢"                |

The existing state cues (hype, toxic, adFatigue, echoChamber, reputation hints, leaving) keep working on top, so comments under official posts sour as reputation drops, like now.

## 9. Balance approach

- **No engine or balance-constant change.** The decision cards stay inside the existing per-type profile and the per-phase value ranges of the cards they sit next to, so the economy and the scandal rhythm stay as tuned (exponential-growth D1–D4).
- **What does change is the pools.** Phase 3 grows to 18 cards per type, and phase 4 shrinks to 8 with a 50 % decision share. The decision cards are slightly sharper than the average post of their phase (viral: more Toxicity; ads: more revenue and more reputation loss; news: a bit more reputation), so the "everything is a policy" moment feels bigger in phase 4.
- **The simulation is the gate.** Run `balanceSimulation.test.ts` before and after; keep the asserted outcomes (viral-only, ad-only and news-heavy go bankrupt; human-like and mixed win, rule-of-thumb wins at least half; no back-to-back events; median event gap ≥ 3) and the 25–45-turn run length for human-like play. Update the README table with the before → after numbers. If phase 4 gets harder (fewer cards per type means fewer good hands), first tune the new cards' values, then the pool split (for example keep 2 "every phase" posts per type in phase 4); balance constants come last.
- **More scandals in the pool:** phases 3–4 gain 9–10 scandals. The scandal chance and fines don't change, so a run sees about as many scandals as before, just with more variety and fewer repeats.

## 10. Build laps

| Lap                             | Size | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Feature areas                                                                                                       |
| ------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 1 `app-name`                    | M    | Naming step (field, suggestions, 🎲, validation, profanity filter, banned names as a shared constant), `appName` in `SavedRun` (optional, no version bump), `{app}` placeholder through copy (intros, endings, end report, share text and card, resume, announcements, some follower lines), feed header as the official account, an official-post variant in `PhoneFeed` for cards with `announce` (tested with a fixture card), the optional announce quote in the card detail                       | game-flow, game-content (copy, names, filter), game-save, game-session, game-board, follower-comments, result-share |
| 2 `decision-cards`              | M    | `announce` and `realCase` fields on `CardPresentation`; "Echt gebeurd" line with link in `CardDetailDialog` and one privacy-page sentence (§ 5b); 24 decision cards (§ 5) and 12 events (§ 6) with flavor and image hints; phase narrowing of the "every phase" posts (§ 3); glossary entries; `official` follower cue and lines (§ 8); content tests (profile, glossary, no brands, `{app}` filled); balance simulation and README table; `SAVED_RUN_VERSION` 7 → 8; `DOC_GAME_DESIGN.md` § 4 and § 6 | game-content, follower-comments, game-save, game-board (`CardDetailDialog` only), app pages (privacy copy)          |
| 3 `decision-imagery` (optional) | S    | Images for the 24 cards and 12 events (same licence rules as card-imagery), plus a default avatar style for the official account                                                                                                                                                                                                                                                                                                                                                                       | card-imagery                                                                                                        |

**Order:** 1 and 2 can run in parallel. Lap 1 owns the rendering and uses a fixture card with `announce`; lap 2 owns the field on `CardPresentation`. Whichever lands second rebases onto that one type change. Lap 3 follows lap 2. Until lap 3 lands, cards without an image use the existing type-icon placeholder.

## 11. Decided here (the orchestrator can veto; not owner questions)

- Decision share 0 / 14 / 33 / 50 % through `phases` only; the 8 "every phase" posts per type leave phase 4 (texts untouched).
- A decision card is marked by its `announce` field, not by a type or engine flag.
- Default name: a seeded suggestion from an invented list. A save without a name resumes as "Jouw app".
- Real platform names are blocked in the name field.
- Own small profanity list, no new package.
- "Echt gebeurd" is shown only in the card detail, as a plain line plus one external link; each card's source is picked by the content lap per § 5b.
- Age check and paying people to watch are event options or later content, not cards (profile fit).

Nothing is open for the owner. If the balance simulation in lap 2 cannot keep the asserted outcomes with content tuning alone, that lap reports back before it touches balance constants.
