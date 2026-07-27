'use server'

import { requireOrg } from '@/lib/require-org'
import { getGoogleClientForOrg } from '@/lib/google'
import { google } from 'googleapis'
import { revalidatePath } from 'next/cache'

export type ExportResult = { error?: string; url?: string }

const HEADER = [
  'Ad Soyad', 'E-posta', 'Telefon', 'Cinsiyet', 'Doğum Yılı',
  'Şehir', 'Boy (cm)', 'Ajans', 'Menajer', 'Müsaitlik',
]

export async function exportTalentToSheets(): Promise<ExportResult> {
  const { supabase, orgId } = await requireOrg()

  const oauth2Client = await getGoogleClientForOrg(orgId)
  if (!oauth2Client) return { error: 'not_connected' }

  const { data: talent, error: dbError } = await supabase
    .from('talent')
    .select('full_name, email, phone, gender, birth_year, city, height_cm, agency_name, manager_name, availability')
    .order('full_name')

  if (dbError) return { error: dbError.message }

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

  try {
    const { data: spreadsheet } = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: `Castiqq Oyuncular — ${new Date().toLocaleDateString('tr-TR')}` },
      },
    })

    const spreadsheetId = spreadsheet.spreadsheetId
    if (!spreadsheetId) return { error: 'create_failed' }

    type TalentRow = {
      full_name: string
      email: string | null
      phone: string | null
      gender: string | null
      birth_year: number | null
      city: string | null
      height_cm: number | null
      agency_name: string | null
      manager_name: string | null
      availability: string | null
    }

    const rows = ((talent ?? []) as TalentRow[]).map(t => [
      t.full_name, t.email ?? '', t.phone ?? '', t.gender ?? '', t.birth_year ?? '',
      t.city ?? '', t.height_cm ?? '', t.agency_name ?? '', t.manager_name ?? '', t.availability ?? '',
    ])

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER, ...rows] },
    })

    return { url: spreadsheet.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${spreadsheetId}` }
  } catch (err) {
    console.error('[exportTalentToSheets]', err)
    return { error: 'export_failed' }
  }
}

export type ImportResult = { error?: string; imported?: number; skipped?: number }

// Bilinen başlık varyantlarını (TR/EN) talent kolonlarına eşleştirir.
// Tanınmayan kolonlar yok sayılır — özel bir kolon eşleştirme ekranı yerine
// kendi export formatımızla ve makul yaygın isimlerle uyumlu, basit bir eşleşme.
const HEADER_ALIASES: Record<string, string> = {
  'ad soyad': 'full_name', 'isim': 'full_name', 'full name': 'full_name', 'name': 'full_name',
  'e-posta': 'email', 'email': 'email', 'eposta': 'email',
  'telefon': 'phone', 'phone': 'phone',
  'cinsiyet': 'gender', 'gender': 'gender',
  'doğum yılı': 'birth_year', 'dogum yili': 'birth_year', 'birth year': 'birth_year',
  'şehir': 'city', 'sehir': 'city', 'city': 'city',
  'boy (cm)': 'height_cm', 'boy': 'height_cm', 'height': 'height_cm', 'height_cm': 'height_cm', 'height (cm)': 'height_cm',
  'ajans': 'agency_name', 'agency': 'agency_name', 'agency name': 'agency_name',
  'menajer': 'manager_name', 'manager': 'manager_name', 'manager name': 'manager_name',
  'müsaitlik': 'availability', 'musaitlik': 'availability', 'availability': 'availability',
}
const ALLOWED_AVAILABILITY = new Set(['available', 'busy', 'unavailable'])

function extractSpreadsheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : input.trim()
}

export async function importTalentFromSheets(sheetUrlOrId: string): Promise<ImportResult> {
  const { supabase, orgId } = await requireOrg()

  const oauth2Client = await getGoogleClientForOrg(orgId)
  if (!oauth2Client) return { error: 'not_connected' }

  const spreadsheetId = extractSpreadsheetId(sheetUrlOrId)
  if (!spreadsheetId) return { error: 'invalid_url' }

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

  try {
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:Z1000',
    })

    const values = data.values ?? []
    if (values.length < 2) return { error: 'empty_sheet' }

    const [headerRow, ...dataRows] = values
    const columnMap = headerRow.map((h: string) => HEADER_ALIASES[String(h).trim().toLowerCase()] ?? null)

    if (!columnMap.includes('full_name')) return { error: 'missing_name_column' }

    let imported = 0
    let skipped = 0
    const rowsToInsert: Record<string, unknown>[] = []

    for (const row of dataRows) {
      const record: Record<string, unknown> = { organization_id: orgId }
      columnMap.forEach((field, i) => {
        if (!field) return
        const raw = row[i]
        if (raw === undefined || raw === '') return

        if (field === 'birth_year' || field === 'height_cm') {
          const num = parseInt(String(raw), 10)
          if (!Number.isNaN(num)) record[field] = num
        } else if (field === 'availability') {
          const normalized = String(raw).trim().toLowerCase()
          if (ALLOWED_AVAILABILITY.has(normalized)) record[field] = normalized
        } else {
          record[field] = String(raw).trim()
        }
      })

      if (!record.full_name) {
        skipped++
        continue
      }
      rowsToInsert.push(record)
    }

    if (rowsToInsert.length > 0) {
      const { error: insertError, count } = await supabase
        .from('talent')
        .insert(rowsToInsert, { count: 'exact' })

      if (insertError) return { error: 'insert_failed' }
      imported = count ?? rowsToInsert.length
      revalidatePath('/oyuncular')
    }

    return { imported, skipped }
  } catch (err) {
    console.error('[importTalentFromSheets]', err)
    return { error: 'import_failed' }
  }
}
