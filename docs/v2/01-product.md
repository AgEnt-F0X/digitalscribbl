# 01 — Product

> Draft 2026-08-14. Update when the pitch or calendar changes.

## What it is

Scribbl is a **Class of 2026 CSE memory ritual**.

1. Friends sign a virtual shirt (the thing we never got to do on campus).
2. At convocation, people add real photos (solo, family, friend groups).
3. The yearbook becomes a **public archive**. Opening a person still puts the **shirt in the center**. The grid tile can be the gown photo or the scribble avatar.

It is not Instagram, not Drive, not a second college WhatsApp.

## Why this calendar

College ended **May 2026**. Convocation is **November 2026**. A “last month of college” product is already late. The honest pitch:

> We missed scribble day. Sign before convocation. Then we keep a public record of us.

## Audience (v2 launch)

| Who | What they get |
|---|---|
| **Verified — Bennett B.Tech CSE 2026** | Shirt, yearbook page, batch album view, groups |
| **Guest** (other Google accounts) | Can sign an open / invited shirt. No shirt of their own. No yearbook page |
| **Family** | No accounts. The student uploads the family picture |
| **Admin** | Hide scribble / photo, suspend, phase flags |

Other schools and courses: **out**. Leave `program_requests` so people can ask. Do not build the picker until a second program is real.

Target: ~1,400 CSE batchmates. **500–1,000 live pages would be a real archive.** Design empty states for 80 and for 800. Do not render 1,400 ghost cards.

## Timeline

```text
now → ~2 weeks          polish + this spec + new backend
early September         ship scribble (CSE 2026 only)
September → October     signing window (~2 months)
late October            countdown; shirts seal
November                convocation photo slot opens
                        yearbook goes public
then                    archive (reads + hide/delete only)
```

If ship slips, **shorten scribble**. Do not run signing and convocation uploads as one mixed mode.

Onboarding share step is non-negotiable: **send this shirt link on WhatsApp tonight.** Explore does not recruit 500 people.

## What a person owns

- **1–3 shirts.** They choose which is **primary** (yearbook + share link).
- **1 PFP.**
- **3 solo photos** from day one (college / friends / you — not a file manager).
- **1 convocation slot**, visible but locked until the November flag.
- **Membership in several friend groups** (cap), each with an album + a one-mark wall.
- **One batch** (CSE 2026). Not multiple batches unless they truly have two programs — they don’t in v2.

## Shirt vs photos vs groups

| Layer | Job |
|---|---|
| **Shirt** | The ritual. Vector scribbles + public notes. Hero of the profile |
| **Solo photos** | A short film strip. Batch can see. One featured shot can be the yearbook *card* |
| **Friend group** | Circle: members, photos, one memorable mark each |
| **Batch / yearbook** | The class wall. Not a 1,400-person whiteboard |

Photos are **not** composited onto the shirt in v2. That is the polaroid-on-garment idea we still refuse (collision, occupancy, export). If people later want to pin a photo on the shirt, it becomes a sticker that *points at* a media id.

## Voice and notes

- **Voice: out** for this ship.
- **Public notes** (short text / sticker around the shirt): **in**.
- **Private notes** (only owner + writer): see [06-open-decisions](./06-open-decisions.md).

## Yearbook

- Grid: searchable Class of 2026 CSE. Tile = graduation photo **or** scribble avatar (`yearbook_card_style`).
- Profile `/u/[slug]`: **shirt first**, then quote, film strip, group badges, extra shirts.
- Public means **the internet can open the profile** (see privacy in 02). Albums stay logged-in.
- Only onboarded, not-hidden people appear. Sparse and real beats a hollow directory.

## What this is not

- Not unlimited personal storage.
- Not a batch graffiti wall.
- Not a guest yearbook for juniors.
- Not print-on-demand.
- Not a forever social network. After archive, it should feel finished.
