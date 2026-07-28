/**
 * Castiqq marka sembolü ve lockup'ı — Marka Kimliği Kılavuzu 02.
 *
 * Sembol: bir viewfinder çerçevesinin dört köşesi; sol alt köşe daha
 * kalın ve vurgulu çizilerek "seçildi" işaretine dönüşür. Casting'in
 * özü: bakılan çok şey içinden birinin işaretlenmesi.
 *
 * Wordmark: "Cast" foreground, "iqq" marka renginde — çift q markanın
 * imzası olduğu için ayrı renklendirilir, törpülenmez.
 */

type Tone = 'light' | 'dark' | 'mono' | 'onBrand'

const MARK_TONES: Record<Tone, { frame: string; select: string }> = {
  // Açık zeminde: çerçeve mürekkep, seçim köşesi indigo
  light:   { frame: '#11181c', select: '#6366f1' },
  // Koyu zeminde: çerçeve beyaz, seçim köşesi açık indigo aksan
  dark:    { frame: '#ffffff', select: '#a5b4fc' },
  // Tek renk baskı
  mono:    { frame: 'currentColor', select: 'currentColor' },
  // Marka renkli/gradient zemin üzerinde
  onBrand: { frame: '#ffffff', select: '#ffffff' },
}

export function CastiqqMark({
  size = 32,
  tone = 'light',
  className,
}: {
  size?: number
  tone?: Tone
  className?: string
}) {
  const { frame, select } = MARK_TONES[tone]
  // Seçim köşesi kılavuzda diğerlerinden ~%30 kalın çiziliyor.
  const w = 7
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 40 L20 20 L40 20" stroke={frame} strokeWidth={w} />
        <path d="M60 20 L80 20 L80 40" stroke={frame} strokeWidth={w} />
        <path d="M80 60 L80 80 L60 80" stroke={frame} strokeWidth={w} />
        <path d="M40 80 L20 80 L20 60" stroke={select} strokeWidth={w + 2} />
      </g>
    </svg>
  )
}

/** Yatay lockup: sembol + wordmark. */
export function CastiqqLogo({
  size = 32,
  tone = 'light',
  className = '',
}: {
  size?: number
  tone?: Tone
  className?: string
}) {
  const onDark = tone === 'dark' || tone === 'onBrand'
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <CastiqqMark size={size} tone={tone} />
      <span
        className="font-extrabold tracking-[-0.03em] leading-none"
        style={{ fontSize: size * 0.72, color: onDark ? '#ffffff' : '#11181c' }}
      >
        Cast<span style={{ color: onDark ? '#a5b4fc' : '#6366f1' }}>iqq</span>
      </span>
    </span>
  )
}
