# Brief — desk-wide

**Problem (owner via orchestrator):** "On my computer screen there is only a tiny bit of space for the chart and a lot of white space between the feed side and the chart side. It would be nice if the chart would just flexibly use all of the space on the page. The chart and title and sound and pause button can be on the left side on larger screens, and on the far right side we have the column with the feed and the cards to pick."

**Success check:** at 1024x768, 1280x720, 1440x900, 1920x1080 and 2560x1440 the board fills the viewport without document scroll; the chart fills the left column; feed and hand are fully visible in the right column; a drag from hand to feed plays the card and the forecast shows. 390x844 and 360x640 (and a sideways phone, 800x400) measure the same as on main.

**In scope:** `board-desk` layout of `PlayingBoard` / `MeterPanel`; score-chart sizing for large boxes; READMEs and decision log.
**Out of scope:** phone and sideways-phone layouts; juice recipes and sounds (parallel lap `fix/juice-tone-down`).

**Size:** S.
