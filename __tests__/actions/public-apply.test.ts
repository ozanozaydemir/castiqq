import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock'lar ──────────────────────────────────────────────────────

const mockRateLimit = vi.fn()
vi.mock('../../lib/rate-limit', () => ({ rateLimit: mockRateLimit }))

const mockHeaders = vi.fn()
vi.mock('next/headers', () => ({ headers: mockHeaders }))

const mockSingle   = vi.fn()
const mockMaybeSingle = vi.fn()
const mockInsert   = vi.fn()
const mockUpdate   = vi.fn()
const mockSelect   = vi.fn()
const mockEq       = vi.fn()
const mockDelete   = vi.fn()

function buildChain(terminal: () => unknown) {
  const chain: Record<string, unknown> = {}
  chain.select  = (..._a: unknown[]) => { mockSelect(); return chain }
  chain.insert  = (d: unknown)       => { mockInsert(d); return chain }
  chain.update  = (d: unknown)       => { mockUpdate(d); return chain }
  chain.delete  = ()                 => { mockDelete(); return chain }
  chain.eq      = (...a: unknown[])  => { mockEq(...a); return chain }
  chain.single  = ()                 => terminal()
  chain.maybeSingle = ()             => mockMaybeSingle()
  return chain
}

let adminFromImpl: (table: string) => unknown

vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: (t: string) => adminFromImpl(t) }),
}))

// ── Helpers ───────────────────────────────────────────────────────

const VALID_DATA = {
  full_name: 'Ali Veli',
  email: 'ali@example.com',
  phone: '05551234567',
}

function setupHeaders(ip = '1.2.3.4') {
  mockHeaders.mockResolvedValue({ get: (h: string) => (h === 'x-forwarded-for' ? ip : null) })
}

function setupRateLimit(ok = true) {
  mockRateLimit.mockReturnValue({ ok, retryAfter: ok ? undefined : 60 })
}

function setupRole(override: Record<string, unknown> = {}) {
  adminFromImpl = (table) => {
    if (table === 'project_roles') {
      return buildChain(() => ({
        data: { id: 'role-1', name: 'Başrol', organization_id: 'org-1', status: 'open', is_public: true, ...override },
      }))
    }
    if (table === 'auditions') {
      return buildChain(() => mockMaybeSingle())
    }
    if (table === 'talent') {
      return buildChain(() => ({ data: { id: 'talent-1' } }))
    }
    if (table === 'talent_languages' || table === 'talent_experiences') {
      return buildChain(() => ({ error: null }))
    }
    return buildChain(() => ({ data: null, error: null }))
  }
  mockMaybeSingle.mockResolvedValue({ data: null })
}

// ── Testler ───────────────────────────────────────────────────────

describe('submitPublicApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupHeaders()
    setupRateLimit(true)
    setupRole()
    // fresh import her testte
    vi.resetModules()
  })

  it('isim boş olunca hata döner', async () => {
    const { submitPublicApplication } = await import('../../app/actions/public-apply')
    const result = await submitPublicApplication('token-1', { ...VALID_DATA, full_name: '   ' })
    expect(result).toEqual({ error: 'İsim zorunludur.' })
  })

  it('rate limit aşıldığında hata döner', async () => {
    setupRateLimit(false)
    vi.resetModules()
    const { submitPublicApplication } = await import('../../app/actions/public-apply')
    const result = await submitPublicApplication('token-1', VALID_DATA)
    expect(result).toEqual({ error: expect.stringContaining('Çok fazla') })
  })

  it('rol bulunamazsa hata döner', async () => {
    adminFromImpl = () => buildChain(() => ({ data: null }))
    vi.resetModules()
    const { submitPublicApplication } = await import('../../app/actions/public-apply')
    const result = await submitPublicApplication('gecersiz-token', VALID_DATA)
    expect(result).toEqual({ error: 'Rol bulunamadı.' })
  })

  it('is_public=false ise hata döner', async () => {
    setupRole({ is_public: false })
    vi.resetModules()
    const { submitPublicApplication } = await import('../../app/actions/public-apply')
    const result = await submitPublicApplication('token-1', VALID_DATA)
    expect(result).toEqual({ error: 'Bu rol için başvuru kapalı.' })
  })

  it('rol durumu filled ise hata döner', async () => {
    setupRole({ status: 'filled' })
    vi.resetModules()
    const { submitPublicApplication } = await import('../../app/actions/public-apply')
    const result = await submitPublicApplication('token-1', VALID_DATA)
    expect(result).toEqual({ error: 'Bu rol için başvuru kapalı.' })
  })

  it('aynı email ile daha önce başvurulduysa mevcut token döner', async () => {
    adminFromImpl = (table) => {
      if (table === 'project_roles') {
        return buildChain(() => ({
          data: { id: 'role-1', name: 'Başrol', organization_id: 'org-1', status: 'open', is_public: true },
        }))
      }
      if (table === 'auditions') {
        return buildChain(() => mockMaybeSingle())
      }
      return buildChain(() => ({ data: null }))
    }
    mockMaybeSingle.mockResolvedValue({ data: { token: 'existing-token-abc', talent_id: null } })
    vi.resetModules()
    const { submitPublicApplication } = await import('../../app/actions/public-apply')
    const result = await submitPublicApplication('token-1', VALID_DATA)
    expect(result).toEqual({ success: true, uploadToken: 'existing-token-abc', isExisting: true })
  })

  it('rate limit ip\'yi x-forwarded-for\'dan okumalı', async () => {
    setupHeaders('5.6.7.8')
    vi.resetModules()
    const { submitPublicApplication } = await import('../../app/actions/public-apply')
    await submitPublicApplication('token-1', { ...VALID_DATA, full_name: '' })
    expect(mockRateLimit).toHaveBeenCalledWith(
      expect.stringContaining('5.6.7.8'),
      expect.any(Number),
      expect.any(Number),
    )
  })
})
