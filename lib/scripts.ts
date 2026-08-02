// Senaryo sınırları. Ayrı modülde çünkü app/actions/scripts.ts 'use server'
// ve yalnızca async fonksiyon export edebiliyor — sabitler oradan çıkamaz.

/** Rol başına senaryo sayısı sınırı — sınırsız bırakmak hem UI'ı hem depolamayı bozar. */
export const MAX_SCRIPTS_PER_ROLE = 10

/** Dosya başına üst sınır (byte). Tam senaryolar ~5–10MB olabiliyor. */
export const MAX_SCRIPT_BYTES = 20 * 1024 * 1024
