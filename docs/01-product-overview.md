# 01 — Product Overview

## The problem

Final-year university students do a real-world ritual on their last day: they wear plain white shirts and ask everyone they know to sign them with permanent markers. Inside jokes, life advice, "stay in touch," doodles, hearts. The shirt becomes the most precious object from their college years.

But it's brittle:
- The shirt fades, tears, gets lost in a move.
- Only people physically present that one day can sign.
- The moment is over in a few hours.
- Distant friends, exchange semesters, sick days, internships — all missed.

## The product

**Scribbl** recreates scribble day as a one-month online ritual, then preserves it forever.

Each student gets:
- A **virtual shirt** they own (up to 3 if the first fills up)
- A **personalized avatar** (their AI-generated head on an illustrated body wearing their shirt)
- A **profile link / QR code** they share with anyone
- A **mobile signing studio** where friends draw messages, leave voice notes, drop stickers
- A **yearbook export** at the end — PNG downloads of every shirt + a class composite

## Why it works

| Real scribble day | Scribbl |
|---|---|
| Lasts a few hours | Lasts one month |
| Only present friends | Anyone with the link |
| Shirt fades or rips | Stored forever, exportable |
| You can't read your back | Shirt rotates front/back instantly |
| One canvas | Up to 3 shirts if you fill them |
| Forgotten in a drawer | Lives on phones, gets reshared |

## Who it's for

- **Primary:** Final-year students at a single university (target launch: ~1,200 students in the user's batch)
- **Secondary:** Their friends and juniors who want to sign (invited via link — limited access)
- **Tertiary:** Alumni who want to revisit and add late signatures during the open window

## Scale targets

| Metric | Number |
|---|---|
| Total accounts | 1,000–2,000 |
| Peak concurrent users (farewell day evening) | 100–200 |
| Avg scribbles per shirt | 50–150 |
| Total scribbles across platform | ~150,000 |
| Storage budget | 1 GB total (Supabase free) |
| DB budget | 500 MB (Supabase free) |
| Realtime concurrent connections | <200 (Supabase free) |

## What makes it special

These are the design bets that make Scribbl feel different from "a drawing app with social features":

1. **Mobile-first, compose-mode-default.** Most signing happens on phones in hallways; the drawing surface and the placement are decoupled so you don't fight with fat fingers on a tiny shirt.
2. **The shirt looks like a shirt.** Not a flat rectangle — illustrated, with collar, placket, pocket, fabric folds, soft pencil shading. Scribbles sit on a *believable garment*.
3. **The avatar is yours.** Personal AI-generated head + body pose you choose. No avatar bank, no Roblox-style identical clones. People want to look like themselves.
4. **Handwriting and voice carry emotion.** Multiple handwriting font styles, optional 10-second voice notes, anonymous-until-deadline scribbles, and a thank-you message the owner writes once that fires to every signer.
5. **The world feels like a paper notebook.** Cream paper background, pencil borders, sticky-note stickers, scribble-style underlines. Calm, warm, nostalgic — not bright SaaS-tech.
6. **The end has weight.** When the deadline passes, the shirt locks with a brief ceremony animation, then transitions into yearbook mode where everything is preserved forever.

## Single launch

There is no "v2." Scribble day comes once per cohort. Everything we ship is what users will experience. Items deferred to "later in the build" are listed in [`06-revisit-later.md`](./06-revisit-later.md) — they will either be built before launch or explicitly cut.
