import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  // R2 virtual-hosted-style adreslemeyi (bucket.accountid.r2.cloudflarestorage.com)
  // desteklemiyor — TLS sertifikası yalnızca hesap seviyesindeki wildcard'ı
  // karşılıyor, bu olmadan SSL handshake hatası alınıyor.
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

export async function deleteFromR2(storagePath: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: storagePath }))
}

// Proje/rol/audition silindiğinde audition_videos CASCADE ile gidiyor —
// R2 nesneleri de temizlenmezse depolama faturası kalıcı olarak şişer.
// DeleteObjects tek çağrıda en fazla 1000 anahtar kabul eder.
export async function deleteManyFromR2(storagePaths: string[]): Promise<void> {
  const keys = storagePaths.filter(Boolean)
  if (keys.length === 0) return

  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000)
    const res = await r2.send(new DeleteObjectsCommand({
      Bucket: R2_BUCKET,
      Delete: { Objects: batch.map(Key => ({ Key })), Quiet: true },
    }))
    // Quiet mode yalnızca hataları döner; kalan nesneler sessizce sızmasın.
    if (res.Errors?.length) {
      console.error('[r2] batch delete errors:', res.Errors.map(e => `${e.Key}: ${e.Message}`).join(', '))
    }
  }
}
