Design the FRONT COVER of the Scribbl Class of 2026 yearbook. This is a brand-new page that does not exist in the codebase yet — it is the first page of the yearbook phase that opens on 30 November. Mobile-first, 390px wide, full-bleed, no scrolling.

LAYOUT, top to bottom:

1. Top row, flush left and flush right: "BENNETT UNIVERSITY" on the left and "B.TECH - CSE" on the right. Both in small uppercase monospace with wide letter-spacing, in the muted on-dark rule colour.

2. Middle, and the only focal point: the year "2026" set enormous in the display serif, centred, with the gold foil gradient treatment defined in the design system (see `.cover__title` — a gold gradient clipped to the letterforms). It is the single largest element on the page and nothing competes with it. Leave generous space above and below it. The year may be the only thing that bleeds close to the edges.

3. Directly beneath the year, a centred uppercase monospace line with wide letter-spacing in gold: "SCRIBBL - THE COLLEGIATE VOLUME".

4. A single 1px gold hairline rule, inset from both edges, with generous space around it.

5. Bottom block, left aligned: "COMPUTER SCIENCE & ENGINEERING" in uppercase monospace, and beneath it one line in the body sans at 14px, cream at reduced opacity: "A record of one last month, signed by the people who were there."

6. At the very bottom, a 1px on-dark rule with "CLASS OF 2026" on the left and "SCAN TO OPEN" on the right, both in uppercase monospace.

STRICT CONSTRAINTS - follow the design system exactly:

- Use ONLY the fonts, colors, spacing, radius, shadow and component styles defined in the design system. Do not introduce any fonts, colors, or visual styles not in the design system.
- The cover is typographic only. No logo, no mascot, no illustration, no photograph, no paper texture or grain, no hand-drawn element, no emoji, no background image, no badge, no ribbon.
- The page background is the deep navy from the design system. The only gradient permitted anywhere is the gold foil sheen on the year.
- The year "2026" is the ONLY gold element on the page. Everything else is cream, on-dark muted, or white.
- Spacing uses only 4/8/12/16/24/32/48/64/96. No shadows except at most one soft lift under the year.
- Type roles: the year uses the display role (.t-display); everything else uses .t-micro or .t-caption, except the single body sentence which uses the body role.
- There is exactly ONE display-size element on the page.
- The year is a numeral, not a word. Keep the letter-spacing tight and negative so the four digits read as one engraved mass.
