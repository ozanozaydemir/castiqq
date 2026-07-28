import { google } from 'googleapis'
import { getGoogleClientForOrg } from '@/lib/google'

export type BookingCalendarInput = {
  client_name: string
  title: string | null
  job_type: string
  work_date: string
  work_date_end: string | null
  is_ongoing: boolean
  google_event_id: string | null
}

// Google Calendar'ın all-day event formatında end.date "hariç" (exclusive) sayılıyor —
// tek günlük bir iş için end de work_date olsa bile bir sonraki güne çekmemiz gerekiyor.
function nextDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().split('T')[0]
}

// Booking'i bağlı hesabın (ajansın) "primary" takviminde organizer olarak
// oluşturur/günceller. Oyuncunun kayıtlı e-postası varsa attendee olarak
// eklenir — Google bunu otomatik olarak oyuncunun kendi Google Calendar'ına
// düşürür (Gmail ise anında görünür), Apple/Outlook kullanıyorsa .ics ekli
// bir davet e-postası gönderir ve tek tıkla kendi takvimine eklenir. Yani
// oyuncu Castiqq'i hiç kullanmadan, kendi takviminde bu işi görebiliyor.
//
// is_ongoing (devam eden dizi) bookingler senkronize edilmiyor — sabit bir
// bitiş tarihi olmadığından anlamlı bir all-day etkinlik oluşturulamıyor.
export async function syncBookingToGoogleCalendar(
  orgId: string,
  booking: BookingCalendarInput,
  talentName: string,
  talentEmail: string | null,
): Promise<string | null> {
  if (booking.is_ongoing) {
    if (booking.google_event_id) await deleteGoogleCalendarEvent(orgId, booking.google_event_id)
    return null
  }

  const oauth2Client = await getGoogleClientForOrg(orgId)
  if (!oauth2Client) return null

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  const eventBody = {
    summary: `[Castiqq] ${talentName} — ${booking.client_name}`,
    description: [booking.title, `İş türü: ${booking.job_type}`].filter(Boolean).join('\n'),
    start: { date: booking.work_date },
    end: { date: nextDay(booking.work_date_end ?? booking.work_date) },
    attendees: talentEmail ? [{ email: talentEmail, displayName: talentName }] : undefined,
  }

  try {
    if (booking.google_event_id) {
      const { data } = await calendar.events.update({
        calendarId: 'primary',
        eventId: booking.google_event_id,
        requestBody: eventBody,
        sendUpdates: talentEmail ? 'all' : 'none',
      })
      return data.id ?? booking.google_event_id
    }
    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventBody,
      sendUpdates: talentEmail ? 'all' : 'none',
    })
    return data.id ?? null
  } catch (err) {
    // Kullanıcı event'i takvimden elle silmiş olabilir — yeniden oluşturmayı dene.
    if (booking.google_event_id) {
      try {
        const { data } = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventBody,
          sendUpdates: talentEmail ? 'all' : 'none',
        })
        return data.id ?? null
      } catch (retryErr) {
        console.error('[googleCalendar] event insert retry failed', (retryErr as Error).message)
        return null
      }
    }
    console.error('[googleCalendar] event sync failed', (err as Error).message)
    return null
  }
}

export async function deleteGoogleCalendarEvent(orgId: string, googleEventId: string): Promise<void> {
  const oauth2Client = await getGoogleClientForOrg(orgId)
  if (!oauth2Client) return

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  try {
    // sendUpdates: 'all' — davetli oyuncuya iptal bildirimi gitsin, kendi
    // takviminden de kaldırılsın.
    await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId, sendUpdates: 'all' })
  } catch (err) {
    console.error('[googleCalendar] event delete failed', (err as Error).message)
  }
}
