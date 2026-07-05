import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Castiqq — Casting Yönetim Platformu'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1040 50%, #0f0f1a 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
          }}
        />

        {/* Logo area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}
          >
            🎬
          </div>
          <span style={{ fontSize: 48, fontWeight: 800, color: '#ffffff', letterSpacing: -2 }}>
            Castiqq
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Casting sürecini yeniden tanımla.
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 12, marginTop: 40 }}>
          {['Video İnceleme', '5 Yıldız Puanlama', 'Ekip İşbirliği', 'WhatsApp'].map((label) => (
            <div
              key={label}
              style={{
                padding: '8px 16px',
                borderRadius: 99,
                background: 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.4)',
                color: '#a5b4fc',
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{ position: 'absolute', bottom: 40, color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>
          castiqq.app
        </div>
      </div>
    ),
    { ...size },
  )
}
