# Scribbl Design System

## Direction

Scribbl should feel like a clean school farewell notebook: structured like a real product, textured like paper and fabric, with controlled pencil/sticker expression.

## Tokens

- Paper: `#fffaf0`, `#f8f5ee`, `#f4ead8`
- Ink: `#1A1208`, `#3D2E14`
- Pencil border: `rgba(45, 41, 35, 0.14)` to `rgba(45, 41, 35, 0.28)`
- Social accents: blue `#2563EB`, green `#5f8b48`, purple `#7C3AED`, orange `#EA580C`, pink `#d83f6b`
- Shirt canvas: fixed logical coordinate space `shirt-v1-400x600`

## Type

- Readable system sans for body, controls, feeds, forms, tables.
- Handwritten display only for expressive headings, notes, stickers, and emotional labels.
- Never use handwritten text for dense UI or long paragraphs.

## Components

- `sketch-panel`: main app card/panel surface with subtle imperfect radius and low-contrast border.
- `paper-note`: personal/greeting/empty-state note.
- `pencil-button`: primary handmade action button.
- `sticker-note`: external social comment, never shirt scribble content.
- `sticker-reaction`: external reaction bubble around avatar.
- Shirt scribbles: vector layers clipped by the shirt SVG drawable path.

## Layout Rules

- Dashboard is avatar-first, not card-first.
- Shirt content and social decoration are separate layers.
- Main structure stays grid-based; floating stickers are reusable controlled components.
- Empty states should show what will fill the space without faking user data.

## Interaction States

- Direct signing: user draws into the clipped shirt SVG region.
- Compose signing: user writes in a small scratch canvas, then places the note on the shirt.
- Drawing mode defaults to avatar visible, with a shirt-only toggle.
- Level color phase changes only from trusted social activity or admin override.
