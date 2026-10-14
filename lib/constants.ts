// ── Shirt Canvas ─────────────────────────────────────────────
// Server-side compositing dimensions. Do NOT change after launch
// without migrating existing texture images.
export const SHIRT_W = 400
export const SHIRT_H = 600

// ── Bounding Box ─────────────────────────────────────────────
export const BOX_MIN_SIZE = 40
export const BOX_MAX_SIZE = 300

// ── Realtime Throttling ───────────────────────────────────────
export const THROTTLE_BOX_MS    = 60   // ghost box position broadcast
export const THROTTLE_STROKE_MS = 50   // stroke broadcast

// ── Shirt Occupancy ───────────────────────────────────────────
export const OCCUPANCY_FULL_THRESHOLD    = 100  // % — unlock next shirt

// ── Head Images ──────────────────────────────────────────────
export const HEAD_MAX_DIMENSION = 512   // px — resize on upload
export const HEAD_MAX_BYTES     = 5 * 1024 * 1024  // 5 MB

// ── Supabase Storage Buckets ─────────────────────────────────
export const BUCKET_HEADS    = 'avatar-heads'
export const BUCKET_TEXTURES = 'shirt-textures'

// ── Body Styles ──────────────────────────────────────────────
//
// LEGACY (Route 1 deprecation — see docs/07-changelog.md "Route 1
// architecture lock"). The avatar system now uses
// `src/features/avatar/data/avatarPresets.ts` together with
// `lib/utils/avatarResolve.ts`. The 6-id shape below (M1–M3, F1–F3)
// only exists to keep `users.body_style` reads working for rows that
// were created before Route 1 — see `LEGACY_BODY_STYLE_MAP` in
// `lib/utils/avatarResolve.ts` for the mapping into hero presets.
//
// New code MUST NOT use `BODY_STYLES`. Use `HERO_PRESETS` (or the full
// `AVATAR_PRESETS` catalogue) from `lib/utils/avatarResolve.ts` instead.
// This export is kept to avoid breaking still-untouched callers; it
// will be removed once every reader has migrated.
export const BODY_STYLES = [
  { id: 'M1', label: 'Chill Guy',    gender: 'M' },
  { id: 'M2', label: 'Sporty Dude',  gender: 'M' },
  { id: 'M3', label: 'Sharp Fit',    gender: 'M' },
  { id: 'F1', label: 'Cool Girl',    gender: 'F' },
  { id: 'F2', label: 'Artsy Vibes',  gender: 'F' },
  { id: 'F3', label: 'Boss Energy',  gender: 'F' },
] as const

// ── Shirt Colours ─────────────────────────────────────────────
//
// LEGACY (Route 1: one canonical white shirt — see docs/07-changelog.md
// "Route 1 architecture lock"). The shirt-colour picker has been removed
// from onboarding and settings. Every avatar renders the same canonical
// white shirt drawn by `lib/utils/shirtTemplate.ts`, and every scribble
// canvas uses that one drawable polygon.
//
// The `users.shirt_color` column is left in the DB for back-compat reads
// only (e.g. old yearbook exports that recorded a colour at the time).
// New UI MUST NOT expose this picker, and new code MUST NOT branch on
// shirt colour. The export is kept so untouched legacy readers keep
// compiling; it will be removed once they're migrated.
export const SHIRT_COLORS = [
  { id: 'white',  label: 'Classic White', hex: '#F8F8F8' },
  { id: 'cream',  label: 'Vintage Cream', hex: '#F5F0E0' },
  { id: 'black',  label: 'Midnight Black', hex: '#1C1C1C' },
  { id: 'navy',   label: 'Deep Navy',     hex: '#1E3A5F' },
  { id: 'sage',   label: 'Sage Green',    hex: '#6B8E6B' },
] as const

// ── Drawing Tools ─────────────────────────────────────────────
// Freehand-style brushes (all built on Fabric `PencilBrush` with
// distinct stroke params — see `components/scribble/DrawingCanvas.tsx`).
export const TOOL_PEN         = 'pen'
export const TOOL_PENCIL      = 'pencil'      // rougher freehand
export const TOOL_MARKER      = 'marker'      // thick, opaque, rounded caps
export const TOOL_HIGHLIGHTER = 'highlighter' // wide, semi-transparent, flat caps
export const TOOL_BRUSH       = 'brush'       // textured brush, mid-opacity

// Text + shape primitives + canvas-level helpers.
export const TOOL_TEXT    = 'text'
export const TOOL_LINE    = 'line'
export const TOOL_CIRCLE  = 'circle'
export const TOOL_RECT    = 'rect'
export const TOOL_ARROW   = 'arrow'
export const TOOL_ERASER  = 'eraser'
export const TOOL_SELECT  = 'select'   // move / resize placed objects

// Canvas drawing palette. MUST stay in sync with the `scribble.*` colours
// in `tailwind.config.ts` — those are the canonical, hand-drawn / muted
// tones that ship in the design system (docs/02-design-system.md).
// White is retained as a "chalk" stroke option for layering over darker
// scribbles already on the shirt — the shirt itself is one canonical
// white surface (Route 1), so white-on-white isn't a primary use case.
export const CANVAS_COLORS = [
  '#2D2923', '#FFFFFF', '#E8453C', '#2563EB',
  '#5F8B48', '#7C3AED', '#EA580C', '#D97706',
] as const

export const MAX_UNDO_STEPS = 20

// ── Navigation ────────────────────────────────────────────────
export const ROUTES = {
  login:      '/login',
  callback:   '/auth/callback',
  onboarding: '/onboarding',
  dashboard:  '/dashboard',
  profile:    (id: string) => `/profile/${id}`,
  // The studio is keyed by shirt, not by person: a shirt's access mode is what
  // decides who may sign it, so the studio URL has to carry the shirt id.
  shirtScribble: (shirtId: string) => `/shirts/${shirtId}/scribble`,
  explore:    '/explore',
  groups:     '/groups',
  group:      (id: string) => `/groups/${id}`,
  admin:      '/admin',
} as const

// ── Presence ──────────────────────────────────────────────────
export const ONLINE_THRESHOLD_MS = 15 * 60 * 1000  // 15 minutes
