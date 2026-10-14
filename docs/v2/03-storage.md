# 03 — Storage: Supabase + Cloudinary

> Draft 2026-08-14.

## Split

| Supabase | Cloudinary |
|---|---|
| Auth | PFP |
| People, batch, groups, membership | Solo photos (3 + convocation) |
| Shirt rows, occupancy, lock, primary | Group photos |
| Scribble **SVG + JSON** (tiny, operational) | Flattened shirt PNGs (yearbook / download) |
| Notes, marks (text; optional small doodle SVG in DB) | — |
| Notifications, reports, phase flags | — |
| `media_assets.cloudinary_public_id` | The bytes |

**Never** store only a `res.cloudinary.com` URL on `users`.  
**Never** put scribble vectors in Cloudinary.  
**Never** use Supabase Storage as the primary blob store in v2.

Shirt download = Cloudinary (or Sharp → Cloudinary) derivative. Collision / replay / moderation always use SVG in Postgres.

## Folders

```text
scribbl/cse-2026/heads/{userId}
scribbl/cse-2026/solos/{userId}
scribbl/cse-2026/groups/{groupId}
scribbl/cse-2026/shirts/{shirtId}
```

Cohort in the path so a later school doesn’t mix files.

## Upload path

1. Client requests `/api/media/sign` with `kind` + slot.
2. Server checks auth, phase, quota, slot empty-or-replace.
3. Server returns a **signed** Cloudinary upload (not an unsigned preset).
4. Client uploads **directly to Cloudinary** (Vercel does not hold the 5 MB file).
5. Server confirms and inserts `media_assets` + join row.
6. UI always displays via transforms (`f_auto,q_auto,w_400` / `w_1600`).

Heads still go through Sharp on the server if we need a consistent face crop — then signed upload of the processed buffer. That’s the one exception where the server holds bytes.

v1 `lib/utils/cloudinary.ts` uses an unsigned preset. **Do not keep that for v2.**

## Recompress or the 25 GB dies

Phone originals are 2–5 MB. Incoming cap ~5–8 MB, then:

- Longest side **1600px**
- WebP / auto format
- Stored original is the compressed file, not the dump

Target stored size **~300–400 KB** per photo.

## Caps

| Asset | Cap |
|---|---|
| PFP | 1, replace in place |
| Solo | 3 slots |
| Convocation solo | 1 slot, locked until `convocation_uploads = on` |
| Group photos | **50 / group** (starting) |
| Shirt renders | Derived; overwrite when the shirt changes (scribble phase) then freeze |
| Voice | **0** |
| Video | **0** |
| Personal folders / zip upload | **0** |

Replace-in-slot only. No extra “album pages.”

## 25 GB math

Cloudinary free: **25 GB** storage + transformations on the same `public_id` (URL transforms don’t duplicate the original).

| Cohort | Rough assets | At ~350 KB | At 3 MB originals |
|---|---|---|---|
| 500 people | ~2.5–3.5k photos + shirt PNGs | ~1–2 GB | ~10+ GB |
| 1,000 people | ~5–7k | ~2–3 GB | ~15+ GB |
| 4–5k images | — | **fits easily** | **tight / fail** |

**4–5k images are fine if we transcode.** They are not fine as raw camera rolls.

Shirt PNG/WebP composites are small (~80–150 KB each × 2 sides × ≤3 shirts).

If another school joins later: same caps, new folder prefix. Don’t lift caps “because 25 GB looks big.”

## Deleting

- Hide photo: keep bytes (restore).
- Remove photo / user opt-out: delete Cloudinary `public_id` then the row.
- Hidden scribble: keep SVG; don’t regenerate public shirt PNG until admin restore or rebuild.

Store `cloudinary_public_id` or you cannot delete.

## Soft-degrade flags (keep the v1 idea)

```text
disable_scribble_writes
disable_new_signups
disable_head_uploads
disable_media_uploads      — new; covers solos + group photos
disable_realtime_presence
disable_realtime_broadcast
```

Drop: `disable_voice_notes`, `disable_share_link_creation`, `disable_email_digest` (unless digest returns).
