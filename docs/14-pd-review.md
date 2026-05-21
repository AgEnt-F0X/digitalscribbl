# 14 — Senior Product Designer Review (Scribbl)

> Read the docs cold, traced every component you listed. Below is the 30-minute crit. Two caveats: real avatar/shirt SVGs are still in QA per `docs/08-avatar-shirt-assets.md`, so I'm not grading the body illustration. Mobile and emotional fit are weighted higher than visual perfection.

## 1. Design system audit

The cream-paper notebook direction is a defensible point of view. Caveat / Patrick Hand / Inter / brand purple `#6f54df` as a single accent — lineup is correct, fonts wired through `next/font/google`, and `app/globals.css` ships three usable surface primitives: `sketch-panel`, `paper-note`, `paper-note-tape`. The asymmetric border-radius on `.sketch-panel` (`18px 16px 20px 15px`) reads as hand-cut paper without screaming.

Where it drifts:

- **Four purples.** Token `#6f54df`. `ScribbleStudio` hardcodes `#6d4aff` / `#5434d6` / `#5b35d5`. `tailwind.config.ts` declares `scribble.purple: '#7C3AED'`. Sticker SVGs stroke at `#7c4dff`. Replace literals with `bg-brand` / `text-brand`.
- **Three creams.** Dashboard nav `bg-[#fffaf0]/88`, onboarding `bg-cream-50`, `ScribbleStudio` `bg-[#f7f1e8]`. Token is `--paper-100: #FFF9E6`. One paper colour the eye can trust is the whole point.
- **`.card` is undefined.** `app/onboarding/page.tsx` puts `<div className="card p-6 space-y-4">` on every step. There is no `.card` rule in `globals.css`. The four panels render as bare divs — no border, no shadow, no texture. Single most visible regression for first-time users.
- **Palette drift.** `tailwind.config.ts` says `scribble.red: '#E8453C'` where `docs/02` says `#d83f6b`; `CANVAS_COLORS` in `lib/constants.ts` ships `#16A34A` where the system declares `#5F8B48`. Three truths for two colors.
- **Two skin-tone components.** `app/onboarding/page.tsx` uses the curated slider (correct). `SkinTonePicker.tsx` is the legacy 5-swatch picker, still used by `AvatarOnboardingFlow` — its own comment says delete-when-rebuilt.

Most drift is hex literals creeping into the scribble flow, not a confused metaphor.

## 2. Theme & visual identity

Yes — Scribbl has a recognizable feel. A friend would spot it in a screenshot. The identity is carried by three small assets:

1. The "Scribbl" wordmark in Caveat with `.scribble-underline`. Strongest piece of brand equity.
2. `.paper-note-tape::before` — yellow sticky note with a rotated washi-tape pseudo-element. Quiet, never overplayed.
3. `.sticker-reaction` — 48px white circles with soft drop-shadow. `app/dashboard/page.tsx` lines 533–544 float these around the avatar; the composition is the truest expression of "outside = social, inside = memory."

What's just decoration: five `border-l border-t` divs at random angles in `app/dashboard/page.tsx` lines 511–515 don't read as scribbles, they read as filler texture. Same call on the in-page Lucide icons (`<Send size={48}>`, `<Star size={36}>`) layered over the avatar — clean modern icons fighting a Caveat headline. Your 12 sticker SVGs already speak the language; use those instead.

## 3. User journey walkthrough

**First-time onboarding (4 steps + popup).** Completing `/onboarding` routes to `/onboarding/avatar` for *another* style → front-face → review pass. Confetti fires at "Looks like you?"; the second studio appears and the reward dilutes. The thank-you popup only fires when `profile.onboarding_completed === true`, but the first flow saves it as `false` (line 189), so the popup waits behind the second flow. Step 2 is the steepest cliff: copy says *"Generate a cartoon portrait in ChatGPT or Ideogram, then upload it here"* but the copyable prompt from `docs/08 §"Step 2"` is **not** rendered on the page. Step 3 uses 👦/👧 emoji as body-pose previews. Step 4 review only offers "Edit body." **Fix:** one flow, one confetti, one popup; AI prompt inline with a "use a placeholder for now" link.

**Daily dashboard return.** Top-to-bottom on a 1440 desktop: nav, sticky-note, quest, stats, share card, *then* the avatar. Brand hero is below the fold. Reads as a SaaS dashboard with a shirt embedded, not a shirt with a frame. Three trust regressions: Front/Back view pills (lines 500–501) are `<span>` that don't toggle; the QR "preview" (lines 476–480) is a hand-rolled 5×5 grid, not a real QR; the share card exposes the bare profile URL `…/profile/<uuid>` where `docs/08` says canonical is `/u/[slug]` or `/i/[code]`. **Fix:** lift the avatar above the fold; remove or wire up the fakes.

**Signing someone else's shirt.** Desktop is clean — `lg:grid-cols-[260px_minmax(0,1fr)_340px]` reads as a Figma-style studio. Mobile: side panels do not collapse. Toolbar, workspace, and inspector stack vertically — ~2400px of scroll on a 375 phone just to draw and publish. `docs/02 §"Mobile-first principles"` rule 3 says *"Side panels collapse to bottom sheets on mobile"* — promise unkept. Voice copy says "Max 12 seconds" (`ScribbleInspectorPanel.tsx` line 90), system says 10. Color swatches in `ScribbleToolbar.tsx` are `h-8 w-8` (32px); brand rule is 44px. **Fix:** single bottom sheet with tools / text / stickers / voice tabs; pin canvas to top 60%.

**Receiving a scribble.** `NotificationBell` is composed into `AppShell.tsx` *and* inlined in the dashboard nav — same nav, two implementations, and the dashboard skips `AppShell` entirely. Pick one shell.

**Receiving a request.** "Pending requests" card with approve/decline inline (`ScribbleRequestActions`) is the right amount of friction. Keep it.

**Sharing your link.** Covered above.

**Browsing explore / groups.** Not deeply reviewed. The "Your groups" card with `+N` badges is a good preview pattern — extend it to explore.

**Settings.** Settings is the only place to fix face/body/skin after onboarding, so the missing Edit basics / Edit face buttons in step 4 ship users somewhere they don't trust without a hand-off.

## 4. Visual hierarchy & information density

Dashboard ships seven `font-display text-2xl font-bold` H2s on one screen ("Your shirt at a glance," "Your shirt link," "Your Shirt," "Your groups," "On your shirt," "Pending requests," "Sign next"). Everything shouts in the same handwriting, so the eye lands on whatever's largest — the `Trophy` and "Lv N" badge — the gamification trim, not the avatar. Keep one hero per screen: avatar header in Caveat, demote sidebar titles to `text-lg` body-cased, lean on existing UPPERCASE eyebrows ("Social avatar mode," "Sign-back loop") for the rest.

Scribble studio: three equal-weight surfaces are fine on desktop, but every panel headline ("Signing for," "Publish options," "Add shirt text," "Quick notes," "Stickers") uses the same `font-display text-2xl font-bold`. The canvas should be the only loud thing; panels should whisper.

## 5. Mobile-first reality check

At 375×667:

- **Dashboard.** Single column, bottom nav reachable, safe-area handled. `.bottom-nav-item` targets `min-h-[56px]` — perfect. Avatar appears around 800px scrolled; move it up.
- **Scribble studio.** Stacks instead of bottom-sheeting (see §3). Canvas uses Fabric.js with `touch-action: none` — correct for pinch. Zoom is a numeric stepper, not pinch — feels desktop-y. Publish CTA appears in *both* `ScribbleTopBar` and `ScribbleBottomBar` — drop the top one on mobile.
- **Onboarding.** Step 1's 6×9 batch grid (`grid-cols-6 gap-1.5`) yields ~52px tiles with 12px text; targets pass but reads as a wall of identical chips.
- **Drag/drop.** Outside-notes use a desktop-style rotation `range` slider in the inspector — no real drag handle on a phone. Should live in a bottom sheet on selection.
- **Keyboard.** Inputs at `text-base` (16px) globally per `globals.css` line 58 — iOS won't auto-zoom. Good.
- **Modals.** `ThankYouMessagePopup` is `z-[60]`, `bg-black/40 backdrop-blur-sm`, with a close button. Solid.

## 6. Accessibility quick scan

- **Contrast.** `--ink-300` (`#A07040`) on `--paper-100` measures ~4.0:1 — below WCAG AA 4.5. Used on `.bottom-nav-item` inactive labels. Bump to `--ink-500`.
- **Alt text.** `<Image alt="Avatar head" />` for every headshot in `AvatarDisplay`. Thread display name: `alt="${displayName}'s avatar"`.
- **Focus.** `.input` has a 3px brand-ring focus glow. `.pencil-button` / `.btn-primary` / `.btn-secondary` / `.btn-ghost` rely on browser default focus, invisible on cream. Add `:focus-visible` ring with `var(--brand-ring)`.
- **ARIA.** `aria-current="page"` on `BottomNav` is only set on Home — apply to whichever tab is active. Notification bell needs an `aria-label` with unread count.
- **Reduced motion.** `paper-shimmer` runs `infinite` with no `@media (prefers-reduced-motion: reduce)` anywhere in `globals.css`.

## 7. Top 5 UI wins

1. **The wordmark.** "Scribbl" in Caveat with `.scribble-underline`, used as both logo and signature.
2. **Paper-note + washi-tape.** `.paper-note-tape::before` is 14 lines of CSS that read as craft.
3. **Sticker layer around the avatar.** Floating `.sticker-note` / `.sticker-reaction` on the dashboard teach the inside/outside metaphor without copy.
4. **Skeleton-as-paper loading.** `paper-skeleton` + per-route `PageLoading` shapes (list / shirt / form / studio / table). Most apps ship one spinner.
5. **`PageError`.** *"Something tore the paper."* on `paper-note` with 📓 + digest. On-brand, auto-reports. Don't replace with "Something went wrong."

## 8. Top 5 UI pain points

1. **Two onboardings.** Confetti at end of step 4 followed by a second avatar flow. User thinks they're done; they aren't. Popup waits behind the second flow.
2. **`.card` undefined.** Onboarding panels render without their frame. Most likely "this looks unfinished" moment.
3. **Mobile scribble studio stacks instead of bottom-sheeting.** Three full-width panels vertical on a 375 phone.
4. **Hex literal sprawl on the scribble route.** `#fffdf7`, `#fffaf1`, `#f7f1e8`, `#6d4aff`, `#5b35d5`, `#5434d6`, `#f2c84b`, `#fff2a8` — none match a token.
5. **Fake interactives on the dashboard.** Front/Back "tabs" that don't switch. A QR "preview" of 25 squares. A profile URL exposed as a UUID.

## 9. Concrete design improvements before launch

**Must-fix (blocks first impression):**
- Define `.card` in `globals.css` as an alias of `.sketch-panel`, or replace `card` with `sketch-panel` in `app/onboarding/page.tsx` (4 occurrences).
- Inline the AI prompt + "use a placeholder, edit later" link in onboarding step 2.
- Convert `ScribbleStudio` mobile to one bottom sheet (Tools / Text / Stickers / Voice tabs); pin canvas to top 60%.
- Front/Back pills in `app/dashboard/page.tsx` lines 500–501: real `<button>`s routing to `?panel=front|back`, or remove.
- Replace `bg-[#fffaf0]/88` / `bg-[#fffdf7]` / `bg-[#f7f1e8]` / `bg-cream-50` with `bg-paper-100` everywhere.
- Replace every literal purple in `ScribbleStudio*` and the sticker SVGs with `--brand`.

**Should-fix (before friend test):**
- Voice copy "Max 12 seconds" → "Max 10 seconds" in `ScribbleInspectorPanel.tsx`.
- Onboarding review step: add Edit basics / Edit face / Edit body.
- Skin-tone slider: `h-2` → `h-3` plus a visible `::-webkit-slider-thumb`.
- Color swatches in `ScribbleToolbar` (`h-8 w-8`): wrap in 44×44 tap area, keep visible swatch at 32.
- `.bottom-nav-item` inactive: `text-ink-300` → `text-ink-500` for AA contrast.
- Add `:focus-visible` ring to `.pencil-button` / `.btn-primary` / `.btn-secondary` / `.btn-ghost`.
- Re-tone `ScribbleBottomBar` status pill — it's a hint, not a status.
- Hide the raw UUID profile URL in the dashboard share card until `/u/[slug]` ships.

**Nice-to-have (post-launch):**
- `@media (prefers-reduced-motion: reduce)` on `paper-shimmer`, `confetti-in`, `fade-in-up`.
- `alt={display_name + " avatar"}` in `AvatarDisplay`.
- Replace floating `<Send>` / `<Star>` Lucide icons with existing sticker SVGs.
- Retire `SkinTonePicker.tsx` once `AvatarOnboardingFlow` migrates.
- Replace 👦/👧 body-pose emoji in step 3 with silhouette SVGs alongside the asset upgrade in `docs/08-avatar-shirt-assets.md`.

## 10. Verdict

**Design coherence: 6/10** — the system has a defendable point of view and the foundation primitives (`sketch-panel`, `paper-note`, `pencil-button`, `scribble-underline`) are correct, but the scribble studio and second avatar flow drift in measurable ways: four purples, four creams, an undefined `.card`.

**Most important visual fix today:** define `.card` in `globals.css` (or replace it with `sketch-panel` in `app/onboarding/page.tsx`). The first 60 seconds currently render bare divs where the brand should land hardest.

**Protect:** the wordmark + paper-note-tape + sticker-reaction triad. Don't let anyone "modernize" the asymmetric corners or flatten the sticky tape — those imperfections are what makes Scribbl feel like a yearbook page and not a SaaS card.
