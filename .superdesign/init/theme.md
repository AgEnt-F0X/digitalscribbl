# Theme

**Part 1 — token digest** (compact, machine-readable)
**Part 2 — raw source dumps** (`tailwind.config.ts`, `app/globals.css`)

---

# Part 1 — Token digest

## Known facts to carry forward

- **Brand accent is a singular violet `#6f54df`** (`brand.DEFAULT`). No second brand hue.
- **Amber CTAs are OFF-system.** `app/page.tsx` and `app/onboarding/page.tsx` use raw
  Tailwind `bg-amber-600` / `hover:bg-amber-700` / `text-amber-600` for their primary CTAs,
  and `CountdownTimer` chips use `bg-amber-100`. Amber is not in the theme; it only exists
  on landing, onboarding, the countdown badge, and admin/yearbook badges.
- **`ink-800` is an UNDEFINED token.** The `ink` scale is **900 / 700 / 500 / 300 / 100**
  only (`--ink-300` and `--ink-100` exist only in Tailwind, not in `:root`). Yet `ink-800`
  is referenced in `app/page.tsx:45` (`hover:bg-ink-800`), `app/page.tsx:111` (`text-ink-800`),
  `app/onboarding/page.tsx:250`, `app/onboarding/page.tsx:320`,
  `app/dashboard/page.tsx:353`, `app/dashboard/ApprovalInbox.tsx:128`, and
  `app/dev/ia-map/InteractiveIAMap.tsx:226`. Those classes silently produce no CSS.
- **Two independent sources of truth.** `tailwind.config.ts` and `app/globals.css` each
  hardcode the same ~19 hex values as separate literals. The `:root` CSS variables are the
  ones component code actually references at runtime (`var(--ink-900)`, `var(--brand)`,
  `var(--line-soft)`, …); the Tailwind colour scale is a *parallel copy*, not a bridge. Any
  change to one must be made in both.
- **No dark mode.** There is no `.dark` block, no `darkMode` key, no `prefers-color-scheme`
  handling anywhere in the config or globals.

## Colors — Tailwind scale (`tailwind.config.ts`)

| Token | Hex |
|---|---|
| `paper-50` | `#FFFDF7` |
| `paper-100` (also `paper.DEFAULT`) | `#FFF6D9` |
| `paper-200` | `#FFF0C2` |
| `paper-300` | `#F4EAD8` |
| `paper-400` | `#EFDFBC` |
| `cream-50` | `#FFFDF7` |
| `cream-100` / `cream.DEFAULT` | `#FFF6D9` |
| `cream-200` | `#FFF0C2` |
| `ink-900` / `ink.DEFAULT` | `#1A1208` |
| `ink-700` | `#3D2E14` |
| `ink-500` | `#6B4E1E` |
| `ink-300` | `#A07040` |
| `ink-100` | `#D6C3A3` |
| `brand.DEFAULT` | `#6f54df` |
| `brand.soft` | `#ECE8FB` |
| `brand.hover` | `#5B41C9` |
| `brand.ring` | `rgba(111, 84, 223, 0.30)` |
| `whiteboard.surface` / `DEFAULT` | `#F8F8F2` |
| `whiteboard.frame` | `#cfd5da` |
| `whiteboard.frameEdge` | `#9ba2aa` |
| `marker.blue` | `#2563EB` |
| `marker.black` | `#1A1208` |
| `marker.red` | `#D83F6B` |
| `marker.green` | `#5F8B48` |
| `scribble.black` | `#2D2923` |
| `scribble.red` | `#E8453C` |
| `scribble.blue` | `#2563EB` |
| `scribble.green` | `#5F8B48` |
| `scribble.purple` | `#7C3AED` |
| `scribble.orange` | `#EA580C` |
| `scribble.yellow` | `#D97706` |
| `scribble.pink` | `#D83F6B` |
| `scribble.teal` | `#0891B2` |
| `shirt.white` | `#F8F8F8` |
| `shirt.cream` | `#F5F0E0` |
| `shirt.black` | `#1C1C1C` |
| `shirt.navy` | `#1E3A5F` |
| `shirt.sage` | `#6B8E6B` |
| `success` | `#5F8B48` |
| `warning` | `#D97706` |
| `danger` | `#D83F6B` |
| `info` | `#2563EB` |

Note: `paper`/`cream` are near-duplicate scales (identical 50/100/200 values); `paper` alone
also carries `300` and `400`.

## Colors — `:root` CSS custom properties (`app/globals.css`)

30 declarations. Fonts (5), paper (4), ink (3), brand (4), whiteboard (4), marker (4),
micro-interaction (3), edges (3).

| Variable | Value |
|---|---|
| `--font-display` | `'Caveat', 'Patrick Hand', 'Segoe Print', cursive` |
| `--font-hand` | `'Patrick Hand', 'Caveat', cursive` |
| `--font-marker` | `'Permanent Marker', 'Caveat', cursive` |
| `--font-body` | `'Inter', system-ui, -apple-system, sans-serif` |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` |
| `--paper-50` | `#FFFDF7` |
| `--paper-100` | `#FFF6D9` |
| `--paper-200` | `#FFF0C2` |
| `--paper-300` | `#F4EAD8` |
| `--ink-900` | `#1A1208` |
| `--ink-700` | `#3D2E14` |
| `--ink-500` | `#6B4E1E` |
| `--brand` | `#6f54df` |
| `--brand-soft` | `#ECE8FB` |
| `--brand-hover` | `#5B41C9` |
| `--brand-ring` | `rgba(111, 84, 223, 0.30)` |
| `--whiteboard-surface` | `#F8F8F2` |
| `--whiteboard-frame` | `#cfd5da` |
| `--whiteboard-frame-edge` | `#9ba2aa` |
| `--whiteboard-erased` | `rgba(155, 162, 170, 0.04)` |
| `--marker-blue` | `#2563EB` |
| `--marker-black` | `#1A1208` |
| `--marker-red` | `#D83F6B` |
| `--marker-green` | `#5F8B48` |
| `--pencil-shade-color` | `rgba(45, 41, 35, 1)` |
| `--ink-bleed` | `rgba(61, 46, 20, 0.85)` |
| `--ink-stamp-green` | `#5F8B48` |
| `--line-soft` | `rgba(45, 41, 35, 0.14)` |
| `--line-softer` | `rgba(45, 41, 35, 0.08)` |
| `--line-strong` | `rgba(45, 41, 35, 0.28)` |

Registered animatable property: `--pencil-shade-strength` (`<percentage>`, initial `4%`,
`inherits: false`).

## Fonts + type scale

| Family | Tailwind key | Google font (weights) | Variable |
|---|---|---|---|
| Display | `font-display` | Caveat (`400 500 600 700`) | `--font-display` |
| Hand | `font-hand` | Patrick Hand (`400`) | `--font-hand` |
| Marker | `font-marker` | Permanent Marker (`400`) | `--font-marker` |
| Body | `font-body` | Inter (`400 500 600 700`) | `--font-body` |
| Mono | `font-mono` | JetBrains Mono (`400 500`) | `--font-mono` |

Scale (mobile-first, base bumped for mobile readability):
`xs 12/16 · sm 14/20 · base 16/24 · lg 18/28 · xl 20/30 · 2xl 24/32 · 3xl 30/36 · 4xl 36/44 · 5xl 48/56`

Role-based typography utilities (`@layer utilities` in globals):

| Class | Definition |
|---|---|
| `.text-hero-name` | display, `clamp(48px, 6vw, 72px)`, 600, lh 1.0, `--ink-900` |
| `.text-hero-display` | display, `clamp(32px, 4.5vw, 48px)`, 600, lh 1.1, `--ink-900` |
| `.text-eyebrow-display` | display, `clamp(20px, 2.5vw, 24px)`, 500, `--ink-700` |
| `.text-eyebrow-uppercase` | body, `clamp(11px, 1.1vw, 12px)`, 600, uppercase, `0.18em`, `--ink-500` |
| `.text-marker` | marker family, lh 1.1, `0.01em` |
| `.text-handwritten-note` | hand, 17px, lh 1.55, `--ink-bleed`, ink-bleed text-shadow |
| `.text-nostalgia` | hand, `clamp(16px, 1.6vw, 18px)`, lh 1.4, `--ink-700` |

## Border radius

Standard Tailwind radii are untouched. Added **sketch (asymmetric hand-drawn) radii**:

| Token | Value |
|---|---|
| `rounded-sketch-sm` | `8px 10px 7px 9px` |
| `rounded-sketch` | `14px 16px 13px 15px` |
| `rounded-sketch-lg` | `18px 16px 20px 15px` |
| `rounded-sketch-xl` | `24px 22px 26px 21px` |

The same four shapes are also hardcoded inside CSS classes (`.sketch-panel` uses
`18px 16px 20px 15px`, `.sketch-panel-flat` / `.pencil-button` use `14px 16px 13px 15px`,
`.paper-note` uses `10px 12px 9px 11px`) — a third place the radii live.

## Shadows

| Token | Value |
|---|---|
| `shadow-paper` | `0 12px 28px rgba(45, 35, 22, 0.08)` |
| `shadow-paper-soft` | `0 6px 16px rgba(45, 35, 22, 0.05)` |
| `shadow-paper-deep` | `0 18px 48px rgba(45, 35, 22, 0.10)` |
| `shadow-sticker` | `0 8px 12px rgba(45, 35, 22, 0.12)` |
| `shadow-pencil` | `inset 0 0 0 1px rgba(45, 41, 35, 0.12), 0 2px 6px rgba(45, 35, 22, 0.06)` |

## Breakpoints

Default Tailwind scale (`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`) **plus** one
addition:

| Token | Value |
|---|---|
| `xs` | `420px` |

Used by `ScribbleBottomBar` to reveal the status sentence on small phones.

## Spacing (custom)

| Token | Value |
|---|---|
| `safe-bottom` | `env(safe-area-inset-bottom, 0px)` |
| `safe-top` | `env(safe-area-inset-top, 0px)` |
| `nav-bottom` | `calc(72px + env(safe-area-inset-bottom, 0px))` |

## Animations & keyframes

Tailwind-config animations → keyframes:

| `animate-*` | Duration / easing | Keyframe behaviour |
|---|---|---|
| `paper-shimmer` | 1.8s ease-in-out infinite | opacity 0.55 → 0.85 → 0.55 (drives `.paper-skeleton`) |
| `confetti-in` | 0.6s ease-out | `scale(0.8)` + opacity 0 → 1 |
| `badge-bounce` | 0.2s ease-out | `scale(1) → scale(1.3) → scale(1)` (drives the bell badge) |
| `fade-in-up` | 0.3s ease-out | opacity 0 + `translateY(8px)` → 0 |
| `fade-in` | 0.2s ease-out | opacity 0 → 1 |
| `scribble-draw` | 0.4s ease-out | `strokeDashoffset 100 → 0`, opacity 0.4 → 1 |

CSS-only keyframes that live **outside** `@layer` (appended at the end of globals.css,
"Round 5" block, not exposed as Tailwind animations):

| `@keyframes` | Consumer | Behaviour |
|---|---|---|
| `stamp-land` | `.stamp-success` (`StampSuccess`) | 260 ms ease-out overshoot: `scale(1.3) rotate(8deg)` → `scale(1) rotate(5deg)` |
| `attention-wiggle` | `.hand-drawn-arrow--attention` (`HandDrawnArrow`) | 600 ms ease-in-out ×3, ±2° rotate |
| `place-fade-to-ambient` | `.place-layer--fading` (`PlaceBackground`) | opacity 0.80→0.10, `filter: none → blur(3px)`; 1800 ms desktop, **1100 ms** under 768 px |

Global behaviours outside `@layer`: `.sticker-note` / `.paper-note` / `.paper-note-tape`
auto-apply the handwritten treatment (`--font-hand` + `--ink-bleed` + ink-bleed
text-shadow); a bare `::-webkit-scrollbar` rule duplicates `.scrollbar-slim`; and a
`@media (prefers-reduced-motion: reduce)` block collapses all animation/transition
durations and force-disables all seven theme animations.

Component-class audit: `.stamp-success`, `.hand-drawn-arrow`, and
`.hand-drawn-arrow--attention` **do** have rules (the Round 5 block).
`.ink-underline` and `.ink-check` (applied by `InkUnderline` / `InkCheckbox`) have **no
base rule** — only reduced-motion overrides — so their visuals come entirely from the
inline `strokeDashoffset` transitions, not from CSS.

---

# Part 2 — Raw dumps

## `tailwind.config.ts` (complete)

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paper surfaces — warmed in round 3 of doc 18 (Sunlit Lawn theme).
        // paper-100 went from #FFF9E6 → #FFF6D9 (~8% warmer toward golden hour).
        paper: {
          50:  '#FFFDF7',
          100: '#FFF6D9',
          200: '#FFF0C2',
          300: '#F4EAD8',
          400: '#EFDFBC',
          DEFAULT: '#FFF6D9',
        },
        cream: {
          50:  '#FFFDF7',
          100: '#FFF6D9',
          200: '#FFF0C2',
          DEFAULT: '#FFF6D9',
        },
        // Ink — text + dark surfaces
        ink: {
          900: '#1A1208',
          700: '#3D2E14',
          500: '#6B4E1E',
          300: '#A07040',
          100: '#D6C3A3',
          DEFAULT: '#1A1208',
        },
        // Brand — singular purple accent
        brand: {
          DEFAULT: '#6f54df',
          soft:    '#ECE8FB',
          hover:   '#5B41C9',
          ring:    'rgba(111, 84, 223, 0.30)',
        },
        // Whiteboard — round 4 of doc 18 (renamed from chalkboard).
        // Dry-erase board: off-white surface + aluminum frame.
        whiteboard: {
          surface:   '#F8F8F2',
          frame:     '#cfd5da',
          frameEdge: '#9ba2aa',
          DEFAULT:   '#F8F8F2',
        },
        // Marker palette — dry-erase colours, used on whiteboard text only.
        marker: {
          blue:  '#2563EB',
          black: '#1A1208',
          red:   '#D83F6B',
          green: '#5F8B48',
        },
        // Scribble palette — what users draw with on shirts
        scribble: {
          black:  '#2D2923',
          red:    '#E8453C',
          blue:   '#2563EB',
          green:  '#5F8B48',
          purple: '#7C3AED',
          orange: '#EA580C',
          yellow: '#D97706',
          pink:   '#D83F6B',
          teal:   '#0891B2',
        },
        // Shirt fabric colours (the t-shirt background)
        shirt: {
          white:  '#F8F8F8',
          cream:  '#F5F0E0',
          black:  '#1C1C1C',
          navy:   '#1E3A5F',
          sage:   '#6B8E6B',
        },
        // Status
        success: '#5F8B48',
        warning: '#D97706',
        danger:  '#D83F6B',
        info:    '#2563EB',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        hand:    ['var(--font-hand)', 'Caveat', 'cursive'],
        marker:  ['var(--font-marker)', 'Caveat', 'cursive'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Slightly larger base for mobile readability
        'xs':    ['12px', { lineHeight: '16px' }],
        'sm':    ['14px', { lineHeight: '20px' }],
        'base':  ['16px', { lineHeight: '24px' }],
        'lg':    ['18px', { lineHeight: '28px' }],
        'xl':    ['20px', { lineHeight: '30px' }],
        '2xl':   ['24px', { lineHeight: '32px' }],
        '3xl':   ['30px', { lineHeight: '36px' }],
        '4xl':   ['36px', { lineHeight: '44px' }],
        '5xl':   ['48px', { lineHeight: '56px' }],
      },
      borderRadius: {
        'sketch-sm': '8px 10px 7px 9px',
        'sketch':    '14px 16px 13px 15px',
        'sketch-lg': '18px 16px 20px 15px',
        'sketch-xl': '24px 22px 26px 21px',
      },
      boxShadow: {
        'paper':       '0 12px 28px rgba(45, 35, 22, 0.08)',
        'paper-soft':  '0 6px 16px rgba(45, 35, 22, 0.05)',
        'paper-deep':  '0 18px 48px rgba(45, 35, 22, 0.10)',
        'sticker':     '0 8px 12px rgba(45, 35, 22, 0.12)',
        'pencil':      'inset 0 0 0 1px rgba(45, 41, 35, 0.12), 0 2px 6px rgba(45, 35, 22, 0.06)',
      },
      animation: {
        'paper-shimmer': 'paper-shimmer 1.8s ease-in-out infinite',
        'confetti-in':   'confetti-in 0.6s ease-out',
        'badge-bounce':  'badge-bounce 0.2s ease-out',
        'fade-in-up':    'fade-in-up 0.3s ease-out',
        'fade-in':       'fade-in 0.2s ease-out',
        'scribble-draw': 'scribble-draw 0.4s ease-out',
      },
      keyframes: {
        'paper-shimmer': {
          '0%, 100%': { opacity: '0.55' },
          '50%':       { opacity: '0.85' },
        },
        'confetti-in': {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        'badge-bounce': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scribble-draw': {
          '0%':   { strokeDashoffset: '100', opacity: '0.4' },
          '100%': { strokeDashoffset: '0',   opacity: '1' },
        },
      },
      screens: {
        // Standard Tailwind + a small-mobile breakpoint
        'xs': '420px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-top':    'env(safe-area-inset-top, 0px)',
        'nav-bottom':  'calc(72px + env(safe-area-inset-bottom, 0px))',
      },
    },
  },
  plugins: [],
}

export default config
```

## `app/globals.css` (complete)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/*
 * `@property` registrations for animatable custom properties.
 * Must live at top level (not inside :root) so the browser can register the
 * syntax + initial value before any animation kicks in. Pencil-shade is what
 * powers the school-physics button hover specced in doc 18 § 14.
*/
@property --pencil-shade-strength {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 4%;
}

@layer base {
  :root {
    /* Fonts — set by next/font/google in layout.tsx */
    --font-display: 'Caveat', 'Patrick Hand', 'Segoe Print', cursive;
    --font-hand:    'Patrick Hand', 'Caveat', cursive;
    --font-marker:  'Permanent Marker', 'Caveat', cursive;
    --font-body:    'Inter', system-ui, -apple-system, sans-serif;
    --font-mono:    'JetBrains Mono', ui-monospace, monospace;

    /*
     * Paper surfaces — warmed in round 3 of doc 18 (Sunlit Lawn theme).
     * paper-100 went from #FFF9E6 → #FFF6D9 (~8% warmer toward golden hour).
     * The Place layer illustrations rely on `mix-blend-mode: multiply` against
     * this substrate to produce the golden-hour atmospheric effect.
     */
    --paper-50:   #FFFDF7;
    --paper-100:  #FFF6D9;
    --paper-200:  #FFF0C2;
    --paper-300:  #F4EAD8;

    /* Ink */
    --ink-900:    #1A1208;
    --ink-700:    #3D2E14;
    --ink-500:    #6B4E1E;

    /* Brand */
    --brand:        #6f54df;
    --brand-soft:   #ECE8FB;
    --brand-hover:  #5B41C9;
    --brand-ring:   rgba(111, 84, 223, 0.30);

    /*
     * Whiteboard — round 4 rename from chalkboard (doc 18 § 7).
     * Off-white surface + aluminum frame + dry-erase marker text.
     */
    --whiteboard-surface:    #F8F8F2;
    --whiteboard-frame:      #cfd5da;
    --whiteboard-frame-edge: #9ba2aa;
    --whiteboard-erased:     rgba(155, 162, 170, 0.04);

    /* Marker palette — dry-erase colours, used on whiteboard text only */
    --marker-blue:   #2563EB;
    --marker-black:  #1A1208;
    --marker-red:    #D83F6B;
    --marker-green:  #5F8B48;

    /*
     * Micro-interaction tokens — doc 18 § 14.
     * Pencil-shade powers button hover (school-physics replacement for the
     * SaaS `translateY(-1px)`). Ink-bleed powers input focus underlines, ink
     * checkmarks, signature mode, and the warm-brown handwriting feel.
     */
    --pencil-shade-color: rgba(45, 41, 35, 1);
    --ink-bleed:          rgba(61, 46, 20, 0.85);
    --ink-stamp-green:    #5F8B48;

    /* Edges */
    --line-soft:    rgba(45, 41, 35, 0.14);
    --line-softer:  rgba(45, 41, 35, 0.08);
    --line-strong:  rgba(45, 41, 35, 0.28);
  }

  * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  html {
    /* Prevent iOS auto-zoom on input focus */
    -webkit-text-size-adjust: 100%;
  }

  body {
    @apply bg-paper-100 text-ink-900 font-body antialiased;
    /* Mobile safe-area defaults */
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  /* Disable iOS bounce overscroll behavior */
  body {
    overscroll-behavior-y: contain;
  }

  /* Inputs at 16px+ to prevent iOS zoom-on-focus */
  input, textarea, select {
    @apply text-base;
  }

  /* Fabric.js canvas cursor cleanup */
  canvas {
    outline: none;
    touch-action: none;
  }

  /* Smoother typography on dark text */
  h1, h2, h3, h4, h5, h6 {
    @apply text-ink-900;
    text-rendering: optimizeLegibility;
  }
}

@layer components {
  /* ── Page surface ──────────────────────────────────────────── */
  .scribbl-page {
    background:
      radial-gradient(circle at 18% 10%, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0) 28%),
      radial-gradient(circle at 86% 90%, rgba(111, 84, 223, 0.04), transparent 30%),
      linear-gradient(90deg, rgba(45, 41, 35, 0.025) 1px, transparent 1px),
      linear-gradient(180deg, rgba(45, 41, 35, 0.020) 1px, transparent 1px),
      var(--paper-100);
    background-size: auto, auto, 34px 34px, 34px 34px, auto;
    min-height: 100vh;
    min-height: 100dvh;
  }

  /* Soft purple vignette behind avatar — the hero glow from the mocks */
  .avatar-glow {
    background:
      radial-gradient(ellipse at center, rgba(111, 84, 223, 0.12), transparent 60%);
  }

  /* ── Panels and cards ──────────────────────────────────────── */
  .sketch-panel {
    @apply border bg-white/85 backdrop-blur-sm;
    border-color: var(--line-soft);
    border-radius: 18px 16px 20px 15px;
    box-shadow:
      0 18px 48px rgba(45, 35, 22, 0.06),
      inset 0 0 0 1px rgba(255, 255, 255, 0.42);
  }

  .sketch-panel-flat {
    @apply border bg-white/70;
    border-color: var(--line-soft);
    border-radius: 14px 16px 13px 15px;
    box-shadow: 0 6px 16px rgba(45, 35, 22, 0.05);
  }

  /*
   * `.card` is the alias the onboarding flow and a handful of other surfaces
   * use. Keeps the call site readable (`<div className="card p-6">`) while
   * we standardise on `sketch-panel` as the underlying primitive.
   * Don't add styling here — extend `sketch-panel` instead.
   */
  .card {
    @apply sketch-panel;
  }

  .paper-note {
    @apply bg-paper-200 shadow-paper;
    border: 1px solid rgba(45, 41, 35, 0.16);
    border-radius: 10px 12px 9px 11px;
    position: relative;
  }

  .paper-note-tape {
    @apply paper-note;
  }

  .paper-note-tape::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 16px;
    width: 56px;
    height: 18px;
    background: rgba(255, 230, 130, 0.75);
    border: 1px solid rgba(45, 41, 35, 0.10);
    transform: rotate(-3deg);
    box-shadow: 0 1px 2px rgba(45, 35, 22, 0.08);
    border-radius: 2px;
  }

  /*
   * ── Buttons ─────────────────────────────────────────────────
   *
   * School-physics hover state (doc 18 § 14): the pencil texture animates
   * from 4% → 18% → 28% opacity to feel like a pencil shading-in the button.
   * Replaces the SaaS `translateY(-1px)` we used to ship. `@property` makes
   * the gradient opacity smoothly interpolate. Browsers without @property
   * support degrade to instant transition + the same visual end-state.
   */
  .pencil-button {
    @apply inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold;
    @apply min-h-[44px];
    --pencil-shade-strength: 4%;
    border: 1px solid var(--line-strong);
    border-radius: 14px 16px 13px 15px;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0)),
      repeating-linear-gradient(
        -12deg,
        rgba(45, 41, 35, calc(var(--pencil-shade-strength) / 100)) 0 2px,
        transparent 2px 8px
      ),
      #dceced;
    color: var(--ink-900);
    transition:
      --pencil-shade-strength 200ms ease-out,
      border-color 200ms ease-out,
      transform 100ms ease-out;
  }
  .pencil-button:hover {
    --pencil-shade-strength: 18%;
    border-color: rgba(45, 41, 35, 0.42);
  }
  .pencil-button:active {
    --pencil-shade-strength: 28%;
    transform: translateY(1px);
  }

  .pencil-button-primary {
    @apply pencil-button text-white;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0)),
      repeating-linear-gradient(
        -12deg,
        rgba(255, 255, 255, calc(var(--pencil-shade-strength) / 100 * 1.5)) 0 2px,
        transparent 2px 8px
      ),
      var(--brand);
    border-color: var(--brand-hover);
  }
  .pencil-button-primary:hover {
    background:
      linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0)),
      repeating-linear-gradient(
        -12deg,
        rgba(255, 255, 255, calc(var(--pencil-shade-strength) / 100 * 1.5)) 0 2px,
        transparent 2px 8px
      ),
      var(--brand-hover);
  }

  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-ink-900 text-white text-sm font-medium rounded-2xl shadow-paper-soft transition hover:bg-ink-700 active:scale-[0.98];
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-white text-ink-900 text-sm font-medium rounded-2xl border border-ink-100 transition hover:bg-paper-50 active:scale-[0.98];
  }

  .btn-ghost {
    @apply inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 text-ink-700 text-sm font-medium rounded-xl transition hover:bg-paper-50 active:scale-[0.98];
  }

  /*
   * Keyboard-focus rings for every button family.
   *
   * The browser default focus outline disappears on the cream paper
   * surface — keyboard users had no idea where they were. We pin a single
   * brand-coloured ring to the four button utilities. `:focus-visible`
   * (not `:focus`) so it never fires on mouse / touch clicks.
   */
  .pencil-button:focus-visible,
  .pencil-button-primary:focus-visible,
  .btn-primary:focus-visible,
  .btn-secondary:focus-visible,
  .btn-ghost:focus-visible {
    outline: 2px solid var(--brand);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--brand-ring);
  }

  /*
   * ── Stickers (floating speech bubbles outside shirt) ───────
   * Lift-off-paper hover (doc 18 § 14): shadow grows + slight scale, rotation
   * preserved via inline transform composition.
   */
  .sticker-note {
    @apply absolute rounded-2xl border px-4 py-3 font-display text-base leading-6 shadow-sticker;
    border-color: rgba(45, 41, 35, 0.14);
    filter: drop-shadow(0 8px 12px rgba(45, 35, 22, 0.10));
    transition: filter 180ms ease-out, transform 180ms ease-out;
  }
  .sticker-note:hover {
    filter: drop-shadow(0 14px 22px rgba(80, 90, 105, 0.18));
  }

  .sticker-reaction {
    @apply absolute h-12 w-12 grid place-items-center rounded-full border bg-white text-2xl shadow-sticker;
    border-color: rgba(45, 41, 35, 0.12);
    filter: drop-shadow(0 8px 12px rgba(45, 35, 22, 0.12));
    transition: filter 180ms ease-out;
  }
  .sticker-reaction:hover {
    filter: drop-shadow(0 14px 22px rgba(80, 90, 105, 0.18));
  }

  /*
   * ── Marker colour utilities ────────────────────────────────
   * Used on whiteboard text only (doc 18 § 7). Each colour ships with its own
   * 0.5px-blur text-shadow so the marker visually "bleeds" into the surface.
   */
  .marker-blue   { color: var(--marker-blue);  text-shadow: 0 0 0.5px var(--marker-blue); }
  .marker-black  { color: var(--marker-black); text-shadow: 0 0 0.5px var(--marker-black); }
  .marker-red    { color: var(--marker-red);   text-shadow: 0 0 0.5px var(--marker-red); }
  .marker-green  { color: var(--marker-green); text-shadow: 0 0 0.5px var(--marker-green); }

  /* ── Hand-drawn accents ────────────────────────────────────── */
  .scribble-underline {
    background-image: linear-gradient(90deg, transparent, var(--brand) 12%, var(--brand) 82%, transparent);
    background-position: 0 100%;
    background-repeat: no-repeat;
    background-size: 100% 3px;
    padding-bottom: 4px;
  }

  .rough-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(45,41,35,0.18), rgba(45,41,35,0.06), transparent);
  }

  /* ── Forms ──────────────────────────────────────────────────── */
  .input {
    @apply w-full min-h-[44px] px-3 py-2.5 rounded-xl border bg-white text-ink-900 text-base transition;
    border-color: var(--line-soft);
  }
  .input:focus {
    @apply outline-none;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px var(--brand-ring);
  }

  .label {
    @apply block text-xs font-semibold text-ink-500 mb-1.5 uppercase tracking-wide;
  }

  /* ── Panel-tabs (shirt front/back, etc) ──────────────────── */
  .panel-tab {
    @apply px-3.5 py-2 rounded-xl text-sm font-semibold transition min-h-[40px] inline-flex items-center;
  }
  .panel-tab[data-active='true'] {
    @apply bg-brand text-white;
  }
  .panel-tab[data-active='false'] {
    @apply text-ink-500 hover:bg-paper-50;
  }

  /* ── Skeleton loaders ──────────────────────────────────────── */
  .paper-skeleton {
    @apply animate-paper-shimmer rounded-xl bg-paper-300;
  }

  /* ── Bottom nav (mobile) ──────────────────────────────────── */
  .bottom-nav {
    @apply fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t;
    border-color: var(--line-soft);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-shadow: 0 -4px 12px rgba(45, 35, 22, 0.04);
  }

  /*
   * Inactive label hits ~4.0:1 on `--ink-300` against paper-100 — under
   * the WCAG AA 4.5:1 floor for small text. `ink-500` measures ~6.6:1.
   */
  .bottom-nav-item {
    @apply flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[11px] font-medium text-ink-500 transition min-h-[56px];
  }
  .bottom-nav-item[data-active='true'] {
    @apply text-brand;
  }

  /* ── Floating CTA (the + Sign button in center of bottom nav) ─── */
  .nav-fab {
    @apply h-14 w-14 -mt-6 text-white grid place-items-center shadow-paper-deep transition;
    --pencil-shade-strength: 4%;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0)),
      repeating-linear-gradient(
        -12deg,
        rgba(255, 255, 255, calc(var(--pencil-shade-strength) / 100 * 1.5)) 0 2px,
        transparent 2px 8px
      ),
      var(--brand);
    border: 1.5px solid var(--brand-hover);
    border-radius: 18px 16px 20px 15px;
    transition:
      --pencil-shade-strength 200ms ease-out,
      border-color 200ms ease-out,
      transform 100ms ease-out;
  }
  .nav-fab:hover {
    --pencil-shade-strength: 18%;
  }
  .nav-fab:active {
    --pencil-shade-strength: 28%;
    transform: scale(0.95) translateY(1px);
  }
}

@layer utilities {
  /* Truncate to N lines */
  .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
  .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

  /* Mobile-friendly tap target enforcement */
  .tap-44 { min-height: 44px; min-width: 44px; }

  /* No tap highlight */
  .no-tap-highlight { -webkit-tap-highlight-color: transparent; }

  /* Scrollbar — hidden on mobile, slim on desktop */
  .scrollbar-slim::-webkit-scrollbar { width: 6px; height: 6px; }
  .scrollbar-slim::-webkit-scrollbar-track { background: transparent; }
  .scrollbar-slim::-webkit-scrollbar-thumb { background: rgba(45, 41, 35, 0.20); border-radius: 999px; }

  /*
   * ── Typography ladder (doc 18 § 9) ──────────────────────────
   * Use these utility classes instead of one-off Tailwind sizes for the
   * design-system text moments. Each class encodes family + size + weight +
   * leading + colour for a specific *role*, so usage stays self-documenting.
   * Mobile and desktop sizes differ — handled by clamp() or responsive variants.
   */
  .text-hero-name {
    font-family: var(--font-display);
    font-size: clamp(48px, 6vw, 72px);
    font-weight: 600;
    line-height: 1.0;
    color: var(--ink-900);
    letter-spacing: -0.01em;
  }

  .text-hero-display {
    font-family: var(--font-display);
    font-size: clamp(32px, 4.5vw, 48px);
    font-weight: 600;
    line-height: 1.1;
    color: var(--ink-900);
  }

  .text-eyebrow-display {
    font-family: var(--font-display);
    font-size: clamp(20px, 2.5vw, 24px);
    font-weight: 500;
    line-height: 1.2;
    color: var(--ink-700);
  }

  .text-marker {
    font-family: var(--font-marker);
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: 0.01em;
  }

  /*
   * `.text-handwritten-note` — the ink-on-paper effect (doc 18 § 9).
   * Pen-written feel: Patrick Hand + warm-brown ink + subtle ink bleed.
   * Auto-applies inside `.sticker-note`, `.paper-note`, `.paper-note-tape`
   * (see selectors below).
   */
  .text-handwritten-note {
    font-family: var(--font-hand);
    font-size: 17px;
    line-height: 1.55;
    font-weight: 400;
    color: var(--ink-bleed);
    letter-spacing: 0.01em;
    text-shadow:
      0 0 0.6px currentColor,
      0 0.4px 0 rgba(0, 0, 0, 0.04);
  }

  .text-nostalgia {
    font-family: var(--font-hand);
    font-size: clamp(16px, 1.6vw, 18px);
    font-weight: 400;
    line-height: 1.4;
    color: var(--ink-700);
  }

  .text-eyebrow-uppercase {
    font-family: var(--font-body);
    font-size: clamp(11px, 1.1vw, 12px);
    font-weight: 600;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--ink-500);
  }

  /*
   * ── Tilt utilities ─────────────────────────────────────────
   * Strategic ±2° rotation primitives for sticker notes, paper notes, and
   * washi tape (doc 18 § 6). Never apply to body text, buttons, or panels.
   */
  .tilt-left  { transform: rotate(-2deg); }
  .tilt-right { transform: rotate(2deg); }
  .tilt-tiny  { transform: rotate(1deg); }
  .tilt-tiny-left { transform: rotate(-1deg); }

  /*
   * ── Place layer utilities ──────────────────────────────────
   * Used by `<PlaceBackground>` (doc 18 § 4) to layer illustrated campus
   * backgrounds underneath the substrate via `mix-blend-mode: multiply`.
   * Two states: vivid (first visit, login) and ambient (settled background).
   */
  .place-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    user-select: none;
    overflow: hidden;
  }
  .place-layer--vivid {
    opacity: 0.80;
    filter: none;
    mix-blend-mode: multiply;
  }
  .place-layer--ambient {
    opacity: 0.10;
    filter: blur(3px);
    mix-blend-mode: multiply;
  }
  .place-layer--fading {
    animation: place-fade-to-ambient 1800ms ease-out forwards;
    mix-blend-mode: multiply;
    will-change: opacity, filter;
  }
  @keyframes place-fade-to-ambient {
    0%   { opacity: 0.80; filter: none; }
    100% { opacity: 0.10; filter: blur(3px); }
  }
  @media (max-width: 768px) {
    .place-layer--fading {
      animation-duration: 1100ms;
    }
  }

  /*
   * ── Avatar halo ────────────────────────────────────────────
   * The soft brand-soft radial gradient behind the user's avatar (doc 18 § 8,
   * round-5 primitive). Confirmed by the original concept image. Sits between
   * place layer and avatar; no card chrome.
   */
  .avatar-halo {
    position: absolute;
    background: radial-gradient(ellipse at center, var(--brand-soft) 0%, transparent 65%);
    pointer-events: none;
    z-index: 0;
  }
}

/*
 * ── Handwritten ink-on-paper auto-application ────────────────────────────
 * Any text inside a sticker-note, paper-note, or paper-note-tape inherits
 * the handwritten-note treatment by default. Override per-element if a
 * specific note needs Inter or Caveat (e.g. signatures).
 */
.sticker-note,
.paper-note,
.paper-note-tape {
  font-family: var(--font-hand);
  color: var(--ink-bleed);
  text-shadow:
    0 0 0.6px currentColor,
    0 0.4px 0 rgba(0, 0, 0, 0.04);
  letter-spacing: 0.01em;
}

/* Global scrollbar default — slim, paper-coloured */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(45, 41, 35, 0.20); border-radius: 999px; }

/*
 * Reduced motion — respect the OS preference. The paper-shimmer skeletons,
 * confetti, badge-bounce, and the page-fade transitions all carry meaning
 * on hover/focus, so we don't strip them entirely; we just collapse to a
 * near-instant duration and stop the infinite shimmer. This is the
 * minimum WCAG SC 2.3.3 / 2.2.2 hand-shake.
 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }

  .paper-skeleton,
  .animate-paper-shimmer,
  .animate-confetti-in,
  .animate-fade-in-up,
  .animate-fade-in,
  .animate-badge-bounce,
  .animate-scribble-draw {
    animation: none !important;
  }

  /*
   * Sunlit Lawn motion neutralisation (doc 18 § 14).
   * SVG stroke-dasharray reveals jump straight to the drawn state. Place
   * layer skips the fade keyframe and renders at ambient immediately.
   * Pencil-shade variable still ramps via transition: 0.001ms (instant).
   */
  .place-layer--fading {
    animation: none !important;
    opacity: 0.10 !important;
    filter: blur(3px) !important;
  }
  .ink-underline path,
  .ink-check path,
  .hand-drawn-arrow path {
    stroke-dashoffset: 0 !important;
  }
  .stamp-success {
    transform: scale(1) rotate(5deg) !important;
    opacity: 0.85 !important;
  }
  .hand-drawn-arrow--attention {
    animation: none !important;
  }
}

/*
 * ── Round 5 — added by Subagent A ─────────────────────────────────────────
 * Keyframes referenced by the micro-interaction components shipped in
 * Phase 1B. The reduced-motion block above already neutralises all three;
 * these are the un-reduced animation definitions.
 */
@keyframes stamp-land {
  0%   { opacity: 0;    transform: scale(1.3) rotate(8deg); }
  60%  { opacity: 0.85; transform: scale(0.97) rotate(2deg); }
  100% { opacity: 0.85; transform: scale(1)    rotate(5deg); }
}

.stamp-success {
  animation: stamp-land 260ms ease-out forwards;
  transform-origin: 50% 50%;
}

@keyframes attention-wiggle {
  0%, 100% { transform: rotate(0deg); }
  25%      { transform: rotate(2deg); }
  75%      { transform: rotate(-2deg); }
}

.hand-drawn-arrow--attention {
  animation: attention-wiggle 600ms ease-in-out 3;
  transform-origin: 50% 50%;
}
```