import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Castiqq — Casting Yönetim Platformu'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Marka Kimliği Kılavuzu 06 — OG / link önizleme görseli.
 * Zemin Deep Space → Indigo Night, sol üstte gradient blob, wordmark
 * "Cast" beyaz + "iqq" açık indigo. Sembol Satori'de güvenilir çizilsin
 * diye SVG yerine kenarlıklı div'lerle kuruluyor.
 */

const BRACKET = 8
const ARM = 34

function Corner({
  sides,
  color,
  thickness = BRACKET,
  style,
}: {
  sides: ('top' | 'right' | 'bottom' | 'left')[]
  color: string
  thickness?: number
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        position: 'absolute',
        width: ARM,
        height: ARM,
        borderStyle: 'solid',
        borderColor: color,
        borderTopWidth: sides.includes('top') ? thickness : 0,
        borderRightWidth: sides.includes('right') ? thickness : 0,
        borderBottomWidth: sides.includes('bottom') ? thickness : 0,
        borderLeftWidth: sides.includes('left') ? thickness : 0,
        ...style,
      }}
    />
  )
}

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1040 100%)',
          position: 'relative',
        }}
      >
        {/* Marka gradienti — kılavuz: cerrahi kullanılır, zemin değil aksan */}
        <div
          style={{
            position: 'absolute',
            width: 620,
            height: 620,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)',
            opacity: 0.2,
            top: -220,
            left: -160,
          }}
        />

        {/* Sembol: seçim işareti */}
        <div style={{ position: 'relative', display: 'flex', width: 96, height: 96, marginBottom: 34 }}>
          <Corner sides={['top', 'left']}     color="#ffffff" style={{ top: 0, left: 0, borderTopLeftRadius: 6 }} />
          <Corner sides={['top', 'right']}    color="#ffffff" style={{ top: 0, right: 0, borderTopRightRadius: 6 }} />
          <Corner sides={['bottom', 'right']} color="#ffffff" style={{ bottom: 0, right: 0, borderBottomRightRadius: 6 }} />
          <Corner
            sides={['bottom', 'left']}
            color="#a5b4fc"
            thickness={BRACKET + 3}
            style={{ bottom: 0, left: 0, borderBottomLeftRadius: 6 }}
          />
        </div>

        <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, letterSpacing: -3 }}>
          <span style={{ color: '#ffffff' }}>Cast</span>
          <span style={{ color: '#a5b4fc' }}>iqq</span>
        </div>

        <div
          style={{
            fontSize: 26,
            color: '#c7c9f5',
            textAlign: 'center',
            maxWidth: 720,
            lineHeight: 1.45,
            marginTop: 22,
          }}
        >
          Casting yönetiminde dağınıklığa son. Yapım şirketleri ve menajerlikler için tek platform.
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
          {['Self-tape İnceleme', 'Menajerlik CRM’i', 'Teklif Pipeline’ı', 'Rol Paylaşımı'].map(label => (
            <div
              key={label}
              style={{
                padding: '9px 18px',
                borderRadius: 99,
                background: 'rgba(99,102,241,0.18)',
                border: '1px solid rgba(165,180,252,0.35)',
                color: '#a5b4fc',
                fontSize: 17,
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 40, color: 'rgba(255,255,255,0.32)', fontSize: 18 }}>
          castiqq.app
        </div>
      </div>
    ),
    { ...size },
  )
}
