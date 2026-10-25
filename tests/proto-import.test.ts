import { describe, it, expect } from 'vitest'
import { isPrototypeMode, getPrototypeStore, createPrototypeClient } from '../lib/supabase/prototype'

describe('prototype module smoke test', () => {
  it('imports cleanly and detects prototype mode', () => {
    expect(isPrototypeMode({ PROTOTYPE_MODE: 'false' })).toBe(false)
    expect(isPrototypeMode({ NEXT_PUBLIC_SUPABASE_URL: 'https://real-project.supabase.co' })).toBe(false)
    expect(isPrototypeMode({ PROTOTYPE_MODE: 'true' })).toBe(true)
    expect(isPrototypeMode({ NEXT_PUBLIC_SUPABASE_URL: '' })).toBe(true)
  })

  it('materialises the store when prototype mode is on', () => {
    expect(getPrototypeStore()).toBeDefined()
  })

  it('createPrototypeClient returns the store-backed client', async () => {
    const db = createPrototypeClient()
    expect(db).toBeDefined()
    expect(db.auth).toBeDefined()
    expect(db.from).toBeDefined()
    const res = await db.from('users').select('id,email,display_name').eq('email', 'you@bennett.edu.in').single()
    expect(res.error).toBeNull()
    expect(res.data?.email).toBe('you@bennett.edu.in')
  })
})
