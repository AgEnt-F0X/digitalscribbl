/**
 * Seed data for prototype mode.
 *
 * Exists so the app can boot and be clicked through with **no database at all**.
 * Deliberately fictional: no real student names and nothing that could be
 * mistaken for the private convocation list — `lib/identity/roster.ts` exists
 * to keep that out of git, and this file is its opposite: committed, fake, and
 * disposable.
 *
 * State lives in memory and resets whenever the dev server restarts. Server
 * state is the source of truth; a browser-side copy is seeded identically but
 * is not a mirror of server writes. Prototype mode previews flows — it does not
 * test persistence.
 */

type Row = Record<string, unknown>

export const PROTOTYPE_IDS = {
  /** The signed-in demo account. */
  you: '00000000-0000-4000-8000-000000000001',
  mate1: '00000000-0000-4000-8000-000000000002',
  mate2: '00000000-0000-4000-8000-000000000003',
  mate3: '00000000-0000-4000-8000-000000000004',
  admin: '00000000-0000-4000-8000-000000000005',
  institution: '00000000-0000-4000-8000-000000000010',
  btechCse: '00000000-0000-4000-8000-000000000011',
  bba: '00000000-0000-4000-8000-000000000012',
} as const

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString()
}

/**
 * Stand-in for the roster lookup. `program_name` must equal the seeded
 * `programs.name` exactly — `/api/onboarding/lookup` matches them with `ilike`.
 *
 * Try these on the onboarding screen:
 *   E22CSEU0001  (CSE, has sections)      E22BBAU0001  (course-wide, no sections)
 */
export const PROTOTYPE_ROSTER = [
  {
    enrollment_number: 'E22CSEU0001',
    name: 'Aria Mehta',
    program_level: 'UG',
    program_name: 'Bachelor of Technology (Computer Science and Engineering)',
    graduation_year: 2026,
    cse_batch: 3,
    batch_selection_required: true,
  },
  {
    enrollment_number: 'E22CSEU0002',
    name: 'Dev Kapoor',
    program_level: 'UG',
    program_name: 'Bachelor of Technology (Computer Science and Engineering)',
    graduation_year: 2026,
    cse_batch: 7,
    batch_selection_required: true,
  },
  {
    enrollment_number: 'E22BBAU0001',
    name: 'Mira Iyer',
    program_level: 'UG',
    program_name: 'Bachelor of Business Administration',
    graduation_year: 2026,
    cse_batch: null,
    batch_selection_required: false,
  },
]

const CSE = 'Bachelor of Technology (Computer Science and Engineering)'
const BASE_USER = {
  academic_group_id: PROTOTYPE_IDS.institution,
  program_id: PROTOTYPE_IDS.btechCse,
  avatar_config: {},
  yearbook_quote: null,
  thank_you_message: null,
  verification_status: 'verified',
  is_admin: false,
  is_suspended: false,
  is_deleted: false,
  is_guest: false,
  is_university_verified: true,
  onboarding_completed: true,
  yearbook_visibility: 'public',
  yearbook_card_style: null,
  created_at: iso(-90 * DAY),
}

function mkUser(
  n: number,
  displayName: string,
  enrollment: string,
  overrides: Row = {},
): Row {
  return {
    ...BASE_USER,
    id: `00000000-0000-4000-8000-00000000000${n}`,
    email: `demo${n}@bennett.edu.in`,
    display_name: displayName,
    enrollment_number: enrollment,
    last_seen: iso(-n * HOUR),
    updated_at: BASE_USER.created_at,
    ...overrides,
  }
}

export function buildPrototypeStore(): Map<string, Row[]> {
  const store = new Map<string, Row[]>()

  const b3 = '00000000-0000-4000-8000-000000000023'
  const b7 = '00000000-0000-4000-8000-000000000027'

  const users: Row[] = [
    mkUser(1, 'You', 'E22CSEU0001', {
      email: 'you@bennett.edu.in',
      batch_id: b3,
      body_style: 'M1',
      shirt_color: '#F5F0E0',
      yearbook_quote: 'Signing before convocation.',
      verification_status: 'pending',
      last_seen: iso(-1 * HOUR),
    }),
    mkUser(2, 'Sam Rivera', 'E22CSEU0002', {
      email: 'sam@bennett.edu.in',
      batch_id: b3,
      body_style: 'M2',
      shirt_color: '#1E3A5F',
      thank_you_message: 'Thanks for signing mine ❤️',
    }),
    mkUser(3, 'Noor Ali', 'E22CSEU0003', {
      email: 'noor@bennett.edu.in',
      batch_id: b7,
      body_style: 'F1',
      shirt_color: '#6B8E6B',
    }),
    mkUser(4, 'Jen Okafor', 'E22CSEU0004', {
      email: 'jen@bennett.edu.in',
      batch_id: b7,
      body_style: 'F2',
      shirt_color: '#F8F8F8',
    }),
    mkUser(5, 'A Admin', 'E22CSEU9999', {
      email: 'admin@bennett.edu.in',
      batch_id: null,
      body_style: 'M3',
      shirt_color: '#1C1C1C',
      is_admin: true,
    }),
  ]

  const programs: Row[] = [
    {
      id: PROTOTYPE_IDS.btechCse,
      academic_group_id: PROTOTYPE_IDS.institution,
      name: CSE,
      key: 'btech-cse',
      level: 'UG',
      graduation_year: 2026,
      batches_enabled: true,
      batch_count: 8,
      created_at: iso(-90 * DAY),
    },
    {
      id: PROTOTYPE_IDS.bba,
      academic_group_id: PROTOTYPE_IDS.institution,
      name: 'Bachelor of Business Administration',
      key: 'bba',
      level: 'UG',
      graduation_year: 2026,
      batches_enabled: false,
      batch_count: null,
      created_at: iso(-90 * DAY),
    },
  ]

  // Sections only exist as an Explore filter, so a handful reads better than the
  // real 52 — and no page treats the count as a contract.
  const batches: Row[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    id: `00000000-0000-4000-8000-0000000000${20 + n}`,
    program_id: PROTOTYPE_IDS.btechCse,
    graduation_year: 2026,
    batch_number: n,
    label: `Batch ${n}`,
    created_at: iso(-90 * DAY),
  }))

  store.set('academic_groups', [
    { id: PROTOTYPE_IDS.institution, name: 'Bennett University', created_at: iso(-90 * DAY) },
  ])
  store.set('programs', programs)
  store.set('batches', batches)
  store.set('users', users)
  store.set('platform_settings', [
    { key: 'phase', value: 'scribble_open', updated_at: iso(-30 * DAY) },
    { key: 'scribble_deadline', value: iso(45 * DAY), updated_at: iso(-30 * DAY) },
    { key: 'extraction_deadline', value: iso(60 * DAY), updated_at: iso(-30 * DAY) },
    { key: 'launch_deadline', value: iso(50 * DAY), updated_at: iso(-30 * DAY) },
  ])
  store.set('profile_slugs', [
    {
      id: '00000000-0000-4000-8000-000000000031',
      user_id: PROTOTYPE_IDS.you,
      slug: 'you-demo',
      is_current: true,
      created_at: iso(-90 * DAY),
    },
  ])

  seedShirts(store)
  seedActivity(store)

  return store
}

function seedShirts(store: Map<string, Row[]>) {
  // One shirt per demo account. `you` is deliberately on `approval` so the
  // dashboard's approval inbox has something in it on first load, while the
  // classmates are `open` so you can sign them immediately, and one is `circle`
  // to show the guest-list mode without needing a second session.
  const configs: { owner: string; visibility: string; occupants: number }[] = [
    { owner: PROTOTYPE_IDS.you, visibility: 'approval', occupants: 46 },
    { owner: PROTOTYPE_IDS.mate1, visibility: 'open', occupants: 72 },
    { owner: PROTOTYPE_IDS.mate2, visibility: 'open', occupants: 30 },
    { owner: PROTOTYPE_IDS.mate3, visibility: 'circle', occupants: 12 },
    { owner: PROTOTYPE_IDS.admin, visibility: 'open', occupants: 5 },
  ]

  const shirts = configs.map((c, i) => ({
    id: `00000000-0000-4000-8000-0000000001${String(i + 1).padStart(2, '0')}`,
    owner_id: c.owner,
    group_id: null,
    shirt_number: 1,
    front_texture_url: null,
    back_texture_url: null,
    sleeves_texture_url: null,
    front_occupancy: c.occupants,
    back_occupancy: 0,
    sleeves_occupancy: 0,
    is_locked: false,
    visibility: c.visibility,
    avatar_config_override: null,
    level_override: null,
    level_override_reason: null,
    created_at: iso(-90 * DAY),
  }))

  store.set('shirts', shirts)

  // The private shirt's guest list, plus one person who is blocked outright, so
  // `ShirtAccessPanel` has real rows to render on both lists.
  store.set('shirt_circle', [
    { shirt_id: shirts[3].id, user_id: PROTOTYPE_IDS.you, added_by: PROTOTYPE_IDS.mate3, created_at: iso(-40 * DAY) },
    { shirt_id: shirts[3].id, user_id: PROTOTYPE_IDS.mate1, added_by: PROTOTYPE_IDS.mate3, created_at: iso(-40 * DAY) },
  ])
  store.set('shirt_blocks', [
    { shirt_id: shirts[2].id, blocked_id: PROTOTYPE_IDS.mate1, reason: null, created_at: iso(-20 * DAY) },
  ])
}

const SIGNATURE_STYLES = ['#2D2923', '#3B4CC0', '#5F8B48', '#B4531A', '#7A3E9D']

/** A small standalone signature-ish mark — rendering reads `canvas_svg` only. */
function mark(index: number): { canvas_svg: string; canvas_json: unknown } {
  const colour = SIGNATURE_STYLES[index % SIGNATURE_STYLES.length]
  const y = 140 + ((index * 37) % 320)
  return {
    canvas_svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" fill="none">` +
      `<path d="M90 ${y} c40 -40 70 40 110 0 s60 -50 110 -10" stroke="${colour}" stroke-width="4" stroke-linecap="round"/>` +
      `</svg>`,
    canvas_json: { objects: [], version: '6.0.0' },
  }
}

/** Scribbles, notifications, notes, reactions and one friend group. */
function seedActivity(store: Map<string, Row[]>) {
  const shirts = store.get('shirts') ?? []
  const yourShirt = shirts[0]?.id as string
  const mates: string[] = [PROTOTYPE_IDS.mate1, PROTOTYPE_IDS.mate2, PROTOTYPE_IDS.mate3]

  const scribbles: Row[] = []
  const notifications: Row[] = []

  let n = 0
  function addScribble(shirtId: string, scribbler: string, approval: string, ageDays: number) {
    n += 1
    const id = `00000000-0000-4000-8000-0000000002${String(n).padStart(2, '0')}`
    const artwork = mark(n)
    scribbles.push({
      id,
      shirt_id: shirtId,
      scribbler_id: scribbler,
      panel: 'front',
      x: 60 + ((n * 29) % 240),
      y: 120 + ((n * 53) % 320),
      w: 140,
      h: 70,
      placement_mode: 'compose',
      template_id: 'tee-classic',
      coordinate_space: 'shirt-400x600',
      is_anonymous: false,
      voice_url: null,
      voice_duration_ms: null,
      is_flagged: false,
      flag_count: 0,
      is_hidden: false,
      approval_status: approval,
      decided_at: approval === 'approved' ? iso(-ageDays * DAY) : null,
      decided_by: approval === 'approved' ? shirtId : null,
      created_at: iso(-ageDays * DAY),
      ...artwork,
    })
    return id
  }

  // Signatures already on the demo user's shirt.
  mates.forEach((who, i) => addScribble(yourShirt!, who, 'approved', 30 - i * 6))

  // Two waiting for approval — this is what puts "Waiting on you" on the
  // dashboard without anyone having to sign first.
  const pendingA = addScribble(yourShirt!, PROTOTYPE_IDS.mate1, 'pending', 1)
  const pendingB = addScribble(yourShirt!, PROTOTYPE_IDS.mate3, 'pending', 0)

  // Classmates' shirts, signed by the demo user, so Explore/profiles are lived-in.
  addScribble(shirts[1].id as string, PROTOTYPE_IDS.you, 'approved', 12)
  addScribble(shirts[2].id as string, PROTOTYPE_IDS.you, 'approved', 9)

  notifications.push(
    {
      id: '00000000-0000-4000-8000-000000000301',
      user_id: PROTOTYPE_IDS.you,
      type: 'scribble_pending_approval',
      title: 'Sam Rivera drew on your shirt — waiting for you',
      body: 'On the front',
      is_read: false,
      related_user_id: PROTOTYPE_IDS.mate1,
      related_scribble_id: pendingA,
      created_at: iso(-1 * DAY),
    },
    {
      id: '00000000-0000-4000-8000-000000000302',
      user_id: PROTOTYPE_IDS.you,
      type: 'scribble_pending_approval',
      title: 'Jen Okafor drew on your shirt — waiting for you',
      body: 'On the front',
      is_read: false,
      related_user_id: PROTOTYPE_IDS.mate3,
      related_scribble_id: pendingB,
      created_at: iso(-3 * HOUR),
    },
    {
      id: '00000000-0000-4000-8000-000000000303',
      user_id: PROTOTYPE_IDS.you,
      type: 'scribble_received',
      title: 'Sam Rivera signed your shirt',
      body: 'On the front',
      is_read: true,
      related_user_id: PROTOTYPE_IDS.mate1,
      related_scribble_id: null,
      created_at: iso(-30 * DAY),
    },
  )

  store.set('scribbles', scribbles)
  store.set('notifications', notifications)

  store.set('shirt_social_notes', [
    {
      id: '00000000-0000-4000-8000-000000000401',
      shirt_id: yourShirt,
      note_type: 'text',
      body: 'Let the scribbles begin!',
      emoji: null,
      x: 8,
      y: 12,
      rotation: -4,
      is_hidden: false,
      created_at: iso(-20 * DAY),
    },
    {
      id: '00000000-0000-4000-8000-000000000402',
      shirt_id: yourShirt,
      note_type: 'text',
      body: 'You are a legend',
      emoji: null,
      x: 62,
      y: 70,
      rotation: 6,
      is_hidden: false,
      created_at: iso(-14 * DAY),
    },
  ])

  store.set('scribble_reactions', [
    {
      id: '00000000-0000-4000-8000-000000000411',
      scribble_id: scribbles[0]?.id ?? null,
      user_id: PROTOTYPE_IDS.mate2,
      emoji: '❤️',
      created_at: iso(-5 * DAY),
    },
  ])

  store.set('friend_groups', [
    {
      id: '00000000-0000-4000-8000-000000000501',
      name: 'Lab bench 4',
      kind: 'friend',
      admin_id: PROTOTYPE_IDS.you,
      invite_token: 'demo-token',
      created_at: iso(-50 * DAY),
    },
  ])
  store.set('friend_group_members', [
    { group_id: '00000000-0000-4000-8000-000000000501', user_id: PROTOTYPE_IDS.you, joined_at: iso(-50 * DAY) },
    { group_id: '00000000-0000-4000-8000-000000000501', user_id: PROTOTYPE_IDS.mate1, joined_at: iso(-48 * DAY) },
  ])
}

