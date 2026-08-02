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
  { params }: { params: Promise<{ token: string; scriptId: string }> },
) {
  const { token, scriptId } = await params
  const admin = createAdminClient()

  const { data: audition } = await admin
    .from('auditions')
    .select('id, talent_name, talent(full_name), project_roles(name)')
    .eq('token', token)
    .single()

  if (!audition) {
    return new NextResponse('Geçersiz link', { status: 404 })
  }

  // Yetkilendirme sınırı: senaryonun role ait olması YETMEZ, bu davete
  // gönderilmiş olmalı. Aksi halde token sahibi, kendisine yollanmayan
  // sahneleri de indirebilirdi.
  const { data: link } = await admin
    .from('audition_scripts')
    .select('script_id, role_scripts(storage_path, original_name, label)')
    .eq('audition_id', audition.id)
    .eq('script_id', scriptId)
    .maybeSingle()

  const script = link?.role_scripts as unknown as
    { storage_path: string; original_name: string; label: string | null } | null

  if (!script) {
    return new NextResponse('Bu senaryoya erişiminiz yok', { status: 404 })
  }

  const talentName = normalizeTr(
    (audition.talent as unknown as { full_name: string } | null)?.full_name
    ?? audition.talent_name
    ?? 'Oyuncu'
  )
  const roleName = (audition.project_roles as unknown as { name: string } | null)?.name ?? 'rol'

  const { data: fileData, error } = await admin.storage
    .from('scripts')
    .download(script.storage_path)

  if (error || !fileData) {
    return new NextResponse('Senaryo bulunamadi', { status: 404 })
  }

  const originalBytes = await fileData.arrayBuffer()

  try {
    const pdfDoc = await PDFDocument.load(originalBytes)
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const pages = pdfDoc.getPages()

    const watermarkText = `${talentName} - GIZLI`
    const dateText = new Date().toLocaleDateString('tr-TR')

    for (const page of pages) {
      const { width, height } = page.getSize()

      for (const pos of [
        { x: width * 0.1, y: height * 0.75 },
        { x: width * 0.1, y: height * 0.45 },
        { x: width * 0.1, y: height * 0.15 },
      ]) {
        page.drawText(watermarkText, {
          x: pos.x, y: pos.y, size: 36, font,
          color: rgb(0.7, 0.7, 0.7), opacity: 0.18, rotate: degrees(35),
        })
      }

      page.drawText(`${talentName} | ${dateText}`, {
        x: 30, y: 18, size: 14, font,
        color: rgb(0.6, 0.6, 0.6), opacity: 0.5,
      })
    }

    const watermarkedBytes = await pdfDoc.save()

    // Dosya adı: etiket varsa onu kullan (kullanıcı "Sahne 12" yazmışsa
    // indirilen dosya da öyle görünsün), yoksa rol adına düş.
    const base = script.label?.trim() || `${roleName}-senaryo`
    const filename = normalizeTr(base).replace(/[^a-zA-Z0-9._-]+/g, '-').toLowerCase() + '.pdf'

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
