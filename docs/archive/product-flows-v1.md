# Scribbl Product Flows

This file is the working map for the connected-user Scribbl ecosystem. It keeps UI, data, and empty states aligned before more screen work happens.

## 1. First-Time User

- Landing/login: explain that each student owns a farewell shirt and signs others.
- Onboarding profile: name, enrollment, academic group, program, batch.
- Avatar creation: choose body/shirt template, upload front face, optionally add back hair/head later.
- Empty dashboard: no scribbles, no groups, no activity; primary actions are share shirt, find classmates, create/join group.
- First invite: user shares profile link or QR; recipient lands on public profile and can request/sign depending on permission.

## 2. Shirt Signing

- Public profile shows the owner avatar and shirt state.
- If allowed, signer enters the shirt studio.
- Direct mode is default: draw naturally on the clipped shirt SVG region.
- Compose mode: create a compact note/sticker in a scratch canvas, then place it inside the shirt region.
- Saved scribbles stay on the shirt layer only.
- External reactions/social notes stay outside the shirt layer.

## 3. Social Loop

- Owner receives activity when someone signs.
- Owner can sign back from activity, dashboard, or profile.
- Reactions can be added to existing scribbles.
- Dashboard surfaces “sign next” classmates and pending requests.
- Groups keep signing loops focused around classes, hostel wings, and friend circles.

## 4. Explore And Groups

- Explore lists batchmates and eligible users, with empty states for no results and no batchmates yet.
- Groups can be created, joined by invite, left, and managed by admins.
- Group cards should show member count, recent avatars, and obvious next action.
- Every group state needs empty, partial, and active versions.

## 5. Moderation And Levels

- Reports and removals hide unsafe scribbles without deleting history.
- Shirt levels use verified unique signers, not raw account volume.
- Admins can override a shirt level when fake-account behavior or special cases are found.
- Suspended users cannot scribble or inflate levels.

## 6. Yearbook Transition

- During the scribbling phase, the dashboard is social/avatar-first.
- After the deadline, shirts lock and the app shifts into yearbook mode.
- Yearbook mode preserves the final layered avatar/shirt composition, but no longer accepts new scribbles.
