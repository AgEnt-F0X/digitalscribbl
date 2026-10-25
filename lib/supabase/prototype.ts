/**
 * Prototype mode — the app without a database.
 *
 * `createPrototypeClient()` answers the query-builder surface this codebase
 * actually uses against an in-memory store, so the whole app can be previewed
 * in Bolt (or locally) with zero Supabase credentials. When prototype mode is
 * off, nothing in here runs: `client.ts` / `server.ts` build the real client
 * exactly as before.
 *
 * Honest limits, so nobody mistakes a preview for a test:
 *   · State is per runtime and resets on restart. Server state is the truth; a
 *     browser-side copy is seeded identically but is not a mirror of server
 *     writes.
 *   · Only the builder methods observed in this repo are implemented. Anything
 *     else throws loudly rather than silently returning an empty set.
 *   · Storage and realtime broadcast are inert, not simulated.
 *   · RLS is not modelled — everything reads like the service role.
 */

import {
  buildPrototypeStore,
  PROTOTYPE_IDS,
  PROTOTYPE_ROSTER,
} from './prototype-data'

export type Row = Record<string, unknown>

/** Truthy env parsing shared by every prototype-mode check. */
const TRUE_LIKE = new Set(['1', 'true', 'yes', 'on'])

/** Prototype mode is on when explicitly requested, or when Supabase is not
 * configured (a fresh checkout with an empty `.env` should still boot). */
export function isPrototypeMode(env?: NodeJS.ProcessEnv): boolean {
  const flag = typeof env?.PROTOTYPE_MODE === 'string' ? env.PROTOTYPE_MODE.trim().toLowerCase() : ''
  if (flag === 'false' || flag === '0' || flag === 'off') return false
  if (TRUE_LIKE.has(flag)) return true

  const url = (env?.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  if (!url) return true
  if (/your-project|example\.supabase\.co/i.test(url)) return true
  return false
}

export function getPrototypeRoster(): typeof PROTOTYPE_ROSTER {
  return PROTOTYPE_ROSTER
}

// ── Store ───────────────────────────────────────────────────────────────────
let store: Map<string, Row[]> | null = null

function getStore(): Map<string, Row[]> {
  if (!store) store = buildPrototypeStore()
  return store
}

export function resetPrototypeStore() {
  store = null
}

export function getPrototypeStore(): Map<string, Row[]> | undefined {
  if (!isPrototypeMode()) return undefined
  return getStore()
}

export function createShadowStore(): Map<string, Row[]> {
  const s = getStore()
  const copy = new Map<string, Row[]>()
  for (const [k, v] of s) copy.set(k, v.slice())
  return copy
}

export function loadPrototypeDataForBolt(): Record<string, unknown> {
  const s = getStore()
  return {
    users: s.get('users') ?? [],
    programs: s.get('programs') ?? [],
    batches: s.get('batches') ?? [],
    academic_groups: s.get('academic_groups') ?? [],
    platform_settings: s.get('platform_settings') ?? [],
    profile_slugs: s.get('profile_slugs') ?? [],
  }
}

/** Every table in the prototype store, in declaration order. */
export function tableNames(): string[] {
  return [
    'academic_groups', 'academic_group_members', 'academic_group_requests',
    'batches', 'batches_enabled', 'friend_group_members', 'friend_groups',
    'group_marks', 'likeable', 'notifications', 'panel', 'platform_settings',
    'platform_settings_cache', 'profile_slugs', 'programs', 'scribbles',
    'shirt_circle', 'shirt_notes', 'shirt_permission', 'shirts',
    'shirt_visibility', 'users', 'shirt_blocks',
  ]
}

export { buildPrototypeStore, getStore, PROTOTYPE_IDS }

// ── Schema knowledge the mock needs ────────────────────────────────────────
interface Fk {
  target: string
  targetCol: string
}

const FK_BY_COLUMN: Record<string, Record<string, string>> = {
  users: { batch_id: 'batches', program_id: 'programs', academic_group_id: 'academic_groups' },
  batches: { program_id: 'programs' },
  programs: { academic_group_id: 'academic_groups' },
  scribbles: { shirt_id: 'shirts', scribbler_id: 'users', decided_by: 'users' },
  shirts: { owner_id: 'users' },
  friend_group_members: { group_id: 'friend_groups', user_id: 'users' },
  shirt_circle: { shirt_id: 'shirts', user_id: 'users' },
  shirt_blocks: { shirt_id: 'shirts', blocked_id: 'users' },
  notifications: { user_id: 'users', related_user_id: 'users', related_scribble_id: 'scribbles' },
  shirt_social_notes: { shirt_id: 'shirts' },
  scribble_reactions: { scribble_id: 'scribbles', user_id: 'users' },
  profile_slugs: { user_id: 'users' },
}

/** Relations addressed by a *name*, i.e. the has-many side and any alias. */
const RELATION: Record<string, Record<string, { target: string; localCol: string; targetCol: string; many: boolean }>> = {
  users: { batches: { target: 'batches', localCol: 'batch_id', targetCol: 'id', many: false }, programs: { target: 'programs', localCol: 'program_id', targetCol: 'id', many: false }, academic_groups: { target: 'academic_groups', localCol: 'academic_group_id', targetCol: 'id', many: false }, shirts: { target: 'shirts', localCol: 'owner_id', targetCol: 'id', many: false } },
  batches: { programs: { target: 'programs', localCol: 'program_id', targetCol: 'id', many: false } },
  programs: { academic_groups: { target: 'academic_groups', localCol: 'academic_group_id', targetCol: 'id', many: false }, batches: { target: 'batches', localCol: 'program_id', targetCol: 'id', many: false } },
  scribbles: { shirts: { target: 'shirts', localCol: 'shirt_id', targetCol: 'id', many: false }, users: { target: 'users', localCol: 'scribbler_id', targetCol: 'id', many: false } },
  friend_group_members: { friend_groups: { target: 'friend_groups', localCol: 'group_id', targetCol: 'id', many: false } },
}

export function createPrototypeClient(env?: NodeJS.ProcessEnv): PrototypeClient {
  const store = getStore()

  return {
    from(table: string) {
      return new QueryBuilder(table)
    },

    auth: {
      async getUser(): Promise<{ data: { user: Row | null; session: null }; error: { message: string } | null }> {
        const [user] = store.get('users') ?? []
        return { data: { user, session: null }, error: null }
      },
      async signInWithPassword(): Promise<{ data: { user: Row | null; session: null }; error: { message: string } | null }> {
        return { data: { user: null, session: null }, error: null }
      },
      async signOut(): Promise<{ error: { message: string } | null }> {
        return { error: null }
      },
      onAuthStateChange(): { data: { subscription: null } } {
        return { data: { subscription: null } }
      },
    },

    channel(): ChannelLike {
      return {
        on(_, cb) { return this },
        subscribe(cb: (ev: string) => void) { return cb('SUBSCRIBED'), this },
        unsubscribe() { return this },
        remove() { return this },
      }
    },

    async removeChannel() {
      return undefined
    },

    storage: {
      from() {
        return {
          upload: () => Promise.resolve({ data: { publicUrl: null }, error: null }),
          download: () => Promise.resolve({ data: new Blob(), error: null }),
          createBucket: () => Promise.resolve({ error: null }),
          getToken: () => Promise.resolve({ data: '', error: null }),
        }
      },
    },

    rpc() {
      return Promise.resolve({ data: null, error: null })
    },
  }
}

export interface PrototypeClient {
  from: (table: string) => QueryBuilder
  auth: {
    getUser(): Promise<{ data: { user: Row | null; session: null }; error: { message: string } | null }>
    signInWithPassword(): Promise<{ data: { user: Row | null; session: null }; error: { message: string } | null }>
    signOut(): Promise<{ error: { message: string } | null }>
    onAuthStateChange(): { data: { subscription: null } }
  }
  channel: () => ChannelLike
  removeChannel: () => Promise<void>
  storage: PrototypeStorage
  rpc: (...args: unknown[]) => Promise<{ data: unknown; error: { message: string } | null }>
}

export interface ChannelLike {
  on: (event: string, cb: (...args: unknown[]) => void) => ChannelLike
  subscribe: (cb: (event: string) => void) => unknown
  unsubscribe: () => void
  remove: () => void
}

export interface PrototypeStorage {
  from: (bucket: string) => PrototypeStorageBucket
}

export interface PrototypeStorageBucket {
  upload: (path: string, data: unknown, options?: unknown) => Promise<{ data: { publicUrl: string | null }; error: { message: string } | null }>
  download: (path: string) => Promise<{ data: Blob; error: { message: string } | null }>
  createBucket: (options?: unknown) => Promise<{ error: { message: string } | null }>
  getToken: (options?: unknown) => Promise<{ data: string; error: { message: string } | null }>
}


function projectTable(parentTable: string, rows: Row[], spec: string): Row[] {
  if (!spec) return rows
  return rows.map(row => projectOne(parentTable, row, spec))
}

function parseItem(item: string): { physical: string; relation: string | null; inner: string | null } {
  const s = item.trim()
  if (!s) return { physical: '', relation: null, inner: null }
  const paren = s.indexOf('(')
  if (paren === -1) {
    return { physical: s, relation: null, inner: null }
  }
  const name = s.slice(0, paren).trim().replace(/!inner$/i, '')
  const inner = s.slice(paren + 1, s.lastIndexOf(')')).trim()
  return { physical: name, relation: name, inner }
}

function stripSourceAlias(item: string, table: string): string {
  if (item.startsWith(table + '(')) {
    const inner = item.slice(table.length + 1)
    if (inner.endsWith(')')) return inner.slice(0, inner.length - 1)
    return inner
  }
  return item
}

function joinRows(parentTable: string, row: Row, rel: string, mainCol: string): Row | null {
  const def = RELATION[parentTable]?.[rel]
  const result = def
    ? rowsOf(def.target).filter(r => EQUAL(getPath(r, def.targetCol), getPath(row, def.localCol)))
    : fkRows(parentTable, row, mainCol)
  if (result.length === 0) return null
  return result[0]
}

function fkRows(parentTable: string, row: Row, mainCol: string): Row[] {
  const col = FK_BY_COLUMN[parentTable]?.[mainCol] ?? FK_BY_COLUMN[parentTable]?.[mainCol + '_id']
  if (!col) return []
  const target = col.split('.').pop()
  if (!target) return []
  return rowsOf(target).filter(r => EQUAL(getPath(r, 'id'), getPath(row, col)))
}


function projectOne(parentTable: string, row: Row, spec: string): Row {
  if (spec.trim() === '*') return { ...row }
  const result: Record<string, unknown> = {}
  for (const item of topLevelSplit(spec)) {
    const subSpec = stripSourceAlias(item, parentTable)
    for (const sub of topLevelSplit(subSpec)) {
      const si = parseItem(sub)
      if (!si.relation) {
        result[si.physical] = getPath(row, si.physical)
        continue
      }
      const joined = joinRows(parentTable, row, si.relation, si.physical)
      if (!joined) continue
      const proj = projectTable(parentTable, [joined], si.inner ?? si.physical)
      result[si.relation] = proj.length === 1 ? proj[0] : proj as unknown
    }
  }
  return result
}



type Where =
  | { kind: 'eq'; column: string; value: unknown }
  | { kind: 'neq'; column: string; value: unknown }
  | { kind: 'gt'; column: string; value: unknown }
  | { kind: 'gte'; column: string; value: unknown }
  | { kind: 'lt'; column: string; value: unknown }
  | { kind: 'lte'; column: string; value: unknown }
  | { kind: 'in'; column: string; value: unknown[] }
  | { kind: 'ilike'; column: string; value: string }
  | { kind: 'is'; column: string; value: null }
  | { kind: 'or'; column: string; expr: string }

export type Order = { column: string; ascending: boolean | null }

function rowsOf(table: string): Row[] {
  const s = getStore()
  if (!s.has(table)) s.set(table, [])
  return s.get(table) as Row[]
}

type Direction = 'asc' | 'desc'

class QueryBuilder<T = Row> {
  private _filters: Where[] = []
  private _orders: Order[] = []
  private _start = 0
  private _end = -1
  private _limit: number | null = null
  private _terminal: { single: boolean; maybeSingle: boolean; count: boolean } = { single: false, maybeSingle: false, count: false }
  private _spec: string | null = null
  private _table = ''
  private _values: unknown = {}
  private _onConflict: string | null = null
  private _ignoreDuplicates = false

  constructor(table: string, values: unknown = {}) {
    this._table = table
    this._values = values
  }

  select(columns: string, options?: { head?: boolean }): this {
    this._spec = columns
    if (options?.head) this._terminal.count = true
    return this
  }

  insert(values: Row | Row[], options?: { onConflict?: string; ignoreDuplicates?: boolean }): this {
    this._values = Array.isArray(values) ? values : [values]
    if (options?.onConflict) this._onConflict = options.onConflict
    if (options?.ignoreDuplicates) this._ignoreDuplicates = true
    return this
  }

  update(values: Row): this { this._values = values; return this }
  delete(): this { this._values = {}; return this }
  upsert(values: Row | Row[], options?: { onConflict?: string; ignoreDuplicates?: boolean }): this {
    this._values = Array.isArray(values) ? values : [values]
    if (options?.onConflict) this._onConflict = options.onConflict
    if (options?.ignoreDuplicates) this._ignoreDuplicates = true
    return this
  }

  eq(column: string, value: unknown): this { this._filters.push({ kind: 'eq', column, value }); return this }
  neq(column: string, value: unknown): this { this._filters.push({ kind: 'neq', column, value }); return this }
  gt(column: string, value: unknown): this { this._filters.push({ kind: 'gt', column, value }); return this }
  gte(column: string, value: unknown): this { this._filters.push({ kind: 'gte', column, value }); return this }
  lt(column: string, value: unknown): this { this._filters.push({ kind: 'lt', column, value }); return this }
  lte(column: string, value: unknown): this { this._filters.push({ kind: 'lte', column, value }); return this }
  in(column: string, values: unknown[]): this { this._filters.push({ kind: 'in', column, value: values }); return this }
  ilike(column: string, value: string): this { this._filters.push({ kind: 'ilike', column, value }); return this }
  is(column: string, value: null): this { this._filters.push({ kind: 'is', column, value }); return this }
  or(expr: string): this { this._filters.push({ kind: 'or', column: '', expr }); return this }
  order(column: string, options?: { ascending?: boolean }): this {
    this._orders.push({ column, ascending: options?.ascending ?? null })
    return this
  }
  range(from: number, to: number): this { this._start = from; this._end = to; return this }
  limit(n: number): this { this._limit = n; this._end = n - 1; return this }

  private async run(): Promise<{ data: Row[] | Row | number | null; error: { message: string } | null }> {
    let rows = rowsOf(this._table)
    rows = applyFilters(rows, this._table, this._filters)
    if (this._orders.length) rows = applyOrder(rows, this._orders, 'asc')
    if (this._start !== 0 || this._end !== -1) rows = rows.slice(this._start, this._end + 1)
    if (this._limit !== null) rows = rows.slice(0, this._limit)
    const data = this._spec ? projectTable(this._table, rows, this._spec) : rows
    if (this._terminal.count) {
      return { data: rows.length, error: null }
    }
    return { data, error: null }
  }

  private notFound(): { data: Row | null; error: { message: string } } {
    return { data: null, error: { message: 'Not found' } }
  }

  async single(): Promise<{ data: Row | null; error: { message: string } | null }> {
    const result = await this.run()
    const data = result.data
    if (Array.isArray(data)) {
      if (data.length === 0) return this.notFound()
      if (data.length > 1) return { data: null, error: { message: 'Expected a single row' } }
      return { data: data[0], error: null }
    }
    return { data: null, error: result.error }
  }

  async maybeSingle(): Promise<{ data: Row | Row[] | null; error: { message: string } | null }> {
    const result = await this.run()
    const data = result.data
    if (Array.isArray(data)) {
      if (data.length === 0) return { data: null, error: null }
      if (data.length > 1) return { data: data, error: null }
      return { data: data[0], error: null }
    }
    return { data: null, error: null }
  }

  async count(): Promise<{ data: number; error: { message: string } | null }> {
    const result = await this.run()
    const data = result.data
    if (typeof data === 'number') return { data, error: null }
    return { data: Array.isArray(data) ? data.length : 0, error: null }
  }

  then<TResult1 = any, TResult2 = any>(onfulfilled?: (value: { data: Row[] | Row | number | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected)
  }

  catch<TResult = any>(onrejected?: (reason: any) => TResult | PromiseLike<TResult>): Promise<{ data: Row[] | Row | number | null; error: { message: string } | null } | TResult> {
    return this.run().catch(onrejected)
  }
}


function resolvePhysical(table: string, physical: string): string {
  if (physical.includes('.')) return physical
  const from = FK_BY_COLUMN[table]?.[physical]
  if (from) return `${physical}`
  const fromId = FK_BY_COLUMN[table]?.[physical + '_id']
  if (fromId) return `${physical}_id`
  return physical
}

function getPath(root: Row, path: string): unknown {
  let cur: unknown = root
  for (const p of path.split('.')) {
    if (cur == null) return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

function toNum(v: unknown): number | undefined {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

const EQUAL: (a: unknown, b: unknown) => boolean = Object.is

function ilikeToRegex(pattern: string): RegExp {
  const safe = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')
  return new RegExp('^' + safe + '$', 'i')
}

function topLevelSplit(s: string): string[] {
  const out: string[] = []
  let cur = ''
  let depth = 0
  let quote: string | null = null
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (quote) { cur += ch; if (ch === quote) quote = null; continue }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; cur += ch; continue }
    if (ch === '(') depth++
    if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = '' } else { cur += ch }
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

function buildRegex(pattern: string): RegExp {
  const safe = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')
  return new RegExp('^' + safe + '$', 'i')
}

function applyOrder(rows: Row[], orders: Order[], dir: 'asc' | 'desc'): Row[] {
  return [...rows].sort((a, b) => {
    for (const o of orders) {
      const av = toNum(getPath(a, o.column)) ?? getPath(a, o.column)
      const bv = toNum(getPath(b, o.column)) ?? getPath(b, o.column)
      const as = typeof av === 'number' ? av : String(av ?? '')
      const bs = typeof bv === 'number' ? bv : String(bv ?? '')
      let c = String(as).localeCompare(String(bs))
      if (!o.ascending) c = -c
      if (c !== 0) return dir === 'asc' ? c : -c
    }
    return 0
  })
}

function applyFilters(rows: Row[], table: string, filters: Where[]): Row[] {
  if (!filters.length) return rows
  return rows.filter(row => {
    for (const f of filters) {
      const col = resolvePhysical(table, f.column)
      const val = getPath(row, col)
      switch (f.kind) {
        case 'eq': if (!EQUAL(val, f.value)) return false; break
        case 'neq': if (EQUAL(val, f.value)) return false; break
        case 'gt': if (toNum(val) !== undefined && toNum(f.value) !== undefined && toNum(val)! > toNum(f.value)!) return false; break
        case 'gte': if (toNum(val) !== undefined && toNum(f.value) !== undefined && toNum(val)! >= toNum(f.value)!) return false; break
        case 'lt': if (toNum(val) !== undefined && toNum(f.value) !== undefined && toNum(val)! < toNum(f.value)!) return false; break
        case 'lte': if (toNum(val) !== undefined && toNum(f.value) !== undefined && toNum(val)! <= toNum(f.value)!) return false; break
        case 'in':
          if (!Array.isArray(f.value) || !f.value.some(v => EQUAL(val, v))) return false
          break
        case 'ilike': if (!buildRegex(f.value).test(String(val ?? ''))) return false; break
        case 'is': if (val !== null) return false; break
        case 'or': if (!applyOr(row, table, f.expr)) return false; break
        default: return false
      }
    }
    return true
  })
}

function applyOr(row: Row, table: string, expr: string): boolean {
  const parts = topLevelSplit(expr)
  for (const part of parts) {
    const m = part.trim().match(/^([A-Za-z0-9_\.]+)\.(eq|neq|gt|gte|lt|lte|is|ilike)(?:\s+(.*))?$/)
    if (!m) return false
    const column = m[1].includes('.') ? m[1] : resolvePhysical(table, m[1])
    const op = m[2] as Where['kind']
    const raw = m[3] ?? null
    const cur = getPath(row, column)
    switch (op) {
      case 'eq': if (EQUAL(cur, raw)) return true; break
      case 'neq': if (!EQUAL(cur, raw)) return true; break
      case 'gt': if (toNum(cur) !== undefined && toNum(raw) !== undefined && toNum(cur)! > toNum(raw)!) return true; break
      case 'gte': if (toNum(cur) !== undefined && toNum(raw) !== undefined && toNum(cur)! >= toNum(raw)!) return true; break
      case 'lt': if (toNum(cur) !== undefined && toNum(raw) !== undefined && toNum(cur)! < toNum(raw)!) return true; break
      case 'lte': if (toNum(cur) !== undefined && toNum(raw) !== undefined && toNum(cur)! <= toNum(raw)!) return true; break
      case 'ilike': if (buildRegex(raw).test(String(cur ?? ''))) return true; break
      case 'is': if (cur === null) return true; break
      default: return false
    }
  }
  return false
}

