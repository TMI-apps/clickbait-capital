# Decisions — screen-reader

| id | topic | status | choice | source | notes |
|----|-------|--------|--------|--------|-------|
| D1 | Turn announcement | closed | One polite message per action from a pure game-board service: post / chosen policy, changed meters ("Inkomsten 8 omhoog naar 58"), goal line, danger, drought start | loop-refine | rejected: live meters (three regions per turn = spam), assertive (interrupts the player's own reading) |
| D2 | Focus after a play | closed | Card in the same draft slot; after an event answer the same slot; after the phase intro the board heading | loop-refine | the played card unmounts, so focus fell to body; same slot keeps the player's place (common card-game / list-removal pattern) |
| D3 | Meter tile reading | closed | `role="meter"` carries label, value, change and danger/max; visible number, delta and icons `aria-hidden` | loop-refine | one stop per meter instead of three |
| D4 | Effects on cards | closed | Kit GameCardEffects: sr-only "Effecten:" prefix and an unlabelled list, so name/description from content include the effects | loop-refine | an `aria-label` on the list replaced its content in the card's description |
| D5 | Flow headings | closed | Kicker spoken inside the focused heading (sr-only), step dots hidden; results heading starts with sr-only "Je rapport." | loop-build | a lost ending and its results had the same heading |
