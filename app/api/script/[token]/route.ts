import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'

// Türkçe karakterleri ASCII'ye çevir (pdf-lib StandardFonts desteği için)
function normalizeTr(text: string): string {
  return text
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const admin = createAdminClient()

  // Token → audition + senaryo yolu
  const { data: audition } = await admin
    .from('auditions')
    .select(`
      id,
      talent_name,
      talent(full_name),
      project_roles(script_url, name)
    `)
    .eq('token', token)
    .single()

  if (!audition) {
    return new NextResponse('Geçersiz link', { status: 404 })
  }

  const role = audition.project_roles as unknown as { script_url: string | null; name: string } | null
  if (!role?.script_url) {
    return new NextResponse('Bu rol için senaryo henüz yüklenmedi', { status: 404 })
  }

  const talentName = normalizeTr(
    (audition.talent as unknown as { full_name: string } | null)?.full_name
    ?? audition.talent_name
    ?? 'Oyuncu'
  )

  // Storage'dan PDF'i çek (admin client — private bucket)
  const { data: fileData, error } = await admin.storage
    .from('scripts')
    .download(role.script_url)

  if (error || !fileData) {
    return new NextResponse('Senaryo bulunamadi', { status: 404 })
  }

  const originalBytes = await fileData.arrayBuffer()

  // Watermark ekle
  try {
    const pdfDoc = await PDFDocument.load(originalBytes)
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const pages = pdfDoc.getPages()

    const watermarkText = `${talentName} - GIZLI`
    const date = new Date().toLocaleDateString('tr-TR')
    const dateText = `${date}`
    const fontSize = 36
    const smallFontSize = 14

    for (const page of pages) {
      const { width, height } = page.getSize()

      // Diagonal büyük watermark — 3 satır
      const positions = [
        { x: width * 0.1, y: height * 0.75 },
        { x: width * 0.1, y: height * 0.45 },
        { x: width * 0.1, y: height * 0.15 },
      ]

      for (const pos of positions) {
        page.drawText(watermarkText, {
          x: pos.x,
          y: pos.y,
          size: fontSize,
          font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.18,
          rotate: degrees(35),
        })
      }

      // Alt köşede küçük imza
      page.drawText(`${talentName} | ${dateText}`, {
        x: 30,
        y: 18,
        size: smallFontSize,
        font,
        color: rgb(0.6, 0.6, 0.6),
        opacity: 0.5,
      })
    }

    const watermarkedBytes = await pdfDoc.save()

    const filename = normalizeTr(`${role.name}-senaryo.pdf`)
      .replace(/\s+/g, '-')
      .toLowerCase()

    return new NextResponse(Buffer.from(watermarkedBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache',
      },
    })
  } catch {
    return new NextResponse('PDF isleme hatasi', { status: 500 })
  }
}
