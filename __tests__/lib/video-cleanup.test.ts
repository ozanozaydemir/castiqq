import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock hoisted edildiği için mock referansı da hoisted olmalı.
const { sendMock, queueUpsert, queueDelete } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  queueUpsert: vi.fn().mockResolvedValue({ error: null }),
  queueDelete: vi.fn().mockResolvedValue({ error: null }),
}))

// purgeR2 artık yolları önce silme kuyruğuna yazıyor (admin client gerekiyor).
// Kuyruğa yazmak, R2 çağrısı patlarsa yolun kaybolmamasını sağlıyor.
vi.mock('../../lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      upsert: queueUpsert,
      delete: () => ({ in: queueDelete }),
    }),
  }),
}))

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class { send = sendMock },
  DeleteObjectCommand: class { constructor(public input: unknown) {} },
  DeleteObjectsCommand: class { constructor(public input: unknown) {} },
}))

import { deleteManyFromR2 } from '../../lib/r2'
import { projectVideoPaths, roleVideoPaths, auditionVideoPaths, purgeR2 } from '../../lib/video-cleanup'

// audition_videos → auditions → project_roles → projects zincirini taklit eden
// minimal Supabase query builder sahtesi.
function fakeSupabase(tables: Record<string, unknown[]>) {
  return {
    from(table: string) {
      const rows = tables[table] ?? []
      const builder = {
        _filtered: rows,
        select() { return builder },
        eq(col: string, val: unknown) {
          builder._filtered = builder._filtered.filter(r => (r as Record<string, unknown>)[col] === val)
          return Promise.resolve({ data: builder._filtered }) as never
        },
        in(col: string, vals: unknown[]) {
          builder._filtered = builder._filtered.filter(r => vals.includes((r as Record<string, unknown>)[col]))
          return Promise.resolve({ data: builder._filtered }) as never
        },
      }
      return builder
    },
  }
}

beforeEach(() => {
  sendMock.mockReset()
  sendMock.mockResolvedValue({ Errors: [] })
})

describe('deleteManyFromR2', () => {
  it('boş listede R2 çağrısı yapmaz', async () => {
    await deleteManyFromR2([])
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('1000 anahtarı tek batch olarak gönderir', async () => {
    const keys = Array.from({ length: 1000 }, (_, i) => `v/${i}.mp4`)
    await deleteManyFromR2(keys)
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('1000 üstünü böler — S3 DeleteObjects limiti', async () => {
    const keys = Array.from({ length: 2500 }, (_, i) => `v/${i}.mp4`)
    await deleteManyFromR2(keys)
    expect(sendMock).toHaveBeenCalledTimes(3)

    const sizes = sendMock.mock.calls.map(
      ([cmd]) => (cmd.input as { Delete: { Objects: unknown[] } }).Delete.Objects.length
    )
    expect(sizes).toEqual([1000, 1000, 500])
  })

  it('boş/undefined yolları eler', async () => {
    await deleteManyFromR2(['a.mp4', '', 'b.mp4'])
    const objects = (sendMock.mock.calls[0][0].input as { Delete: { Objects: { Key: string }[] } }).Delete.Objects
    expect(objects.map(o => o.Key)).toEqual(['a.mp4', 'b.mp4'])
  })
})

describe('cascade silme öncesi yol toplama', () => {
  const db = {
    project_roles: [
      { id: 'role-1', project_id: 'proj-1' },
      { id: 'role-2', project_id: 'proj-1' },
      { id: 'role-3', project_id: 'proj-2' },
    ],
    auditions: [
      { id: 'aud-1', role_id: 'role-1' },
      { id: 'aud-2', role_id: 'role-2' },
      { id: 'aud-3', role_id: 'role-3' },
    ],
    audition_videos: [
      { storage_path: 'v/1.mp4', audition_id: 'aud-1' },
      { storage_path: 'v/2.mp4', audition_id: 'aud-1' },
      { storage_path: 'v/3.mp4', audition_id: 'aud-2' },
      { storage_path: 'v/4.mp4', audition_id: 'aud-3' },
    ],
  }

  it('proje silinince tüm rollerin videolarını toplar', async () => {
    const paths = await projectVideoPaths(fakeSupabase(db), 'proj-1')
    expect(paths.sort()).toEqual(['v/1.mp4', 'v/2.mp4', 'v/3.mp4'])
  })

  it('başka projenin videolarına dokunmaz', async () => {
    const paths = await projectVideoPaths(fakeSupabase(db), 'proj-2')
    expect(paths).toEqual(['v/4.mp4'])
  })

  it('rol silinince yalnızca o rolün videolarını toplar', async () => {
    const paths = await roleVideoPaths(fakeSupabase(db), 'role-1')
    expect(paths.sort()).toEqual(['v/1.mp4', 'v/2.mp4'])
  })

  it('audition silinince yalnızca o auditionın videolarını toplar', async () => {
    const paths = await auditionVideoPaths(fakeSupabase(db), 'aud-2')
    expect(paths).toEqual(['v/3.mp4'])
  })

  it('videosuz proje boş liste döner, R2 çağrısı olmaz', async () => {
    const paths = await projectVideoPaths(fakeSupabase(db), 'proj-yok')
    expect(paths).toEqual([])
    await purgeR2(paths)
    expect(sendMock).not.toHaveBeenCalled()
  })
})

describe('purgeR2', () => {
  it('R2 hatası fırlatmaz — DB silmesi bloklanmamalı', async () => {
    sendMock.mockRejectedValue(new Error('R2 down'))
    await expect(purgeR2(['v/1.mp4'])).resolves.toBeUndefined()
  })

  // Eskiden hata yutuluyordu ve nesne kalıcı olarak sızıyordu. Artık yol
  // kuyrukta kalıyor, cron yeniden deniyor.
  it('R2 patlarsa yol kuyrukta kalır', async () => {
    queueUpsert.mockClear(); queueDelete.mockClear()
    sendMock.mockRejectedValue(new Error('R2 down'))
    await purgeR2(['v/kayip.mp4'], 'org-1')
    expect(queueUpsert).toHaveBeenCalledTimes(1)
    expect(queueDelete).not.toHaveBeenCalled()
  })

  it('R2 başarılıysa kuyruktan düşer', async () => {
    queueUpsert.mockClear(); queueDelete.mockClear()
    sendMock.mockResolvedValue({})
    await purgeR2(['v/ok.mp4'], 'org-1')
    expect(queueUpsert).toHaveBeenCalledTimes(1)
    expect(queueDelete).toHaveBeenCalledTimes(1)
  })

  it('boş listede hiçbir şey yapmaz', async () => {
    queueUpsert.mockClear()
    await purgeR2([])
    expect(queueUpsert).not.toHaveBeenCalled()
  })
})
