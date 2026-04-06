import { useMemo, useState } from 'react'
import { BookOpen, Briefcase, Dumbbell, HandHeart, Home, Palette, Plane, Sprout, Wallet } from 'lucide-react'

const PILLAR_ICONS = {
  WC: Briefcase,
  FH: Dumbbell,
  FW: Wallet,
  TR: Plane,
  RE: HandHeart,
  CG: Palette,
  PG: BookOpen,
  MF: Sprout,
  SP: Sprout,
  HL: Home,
  PL: Home,
  NP: Briefcase,
}

function PillarIcon({ code, size = 15 }) {
  const Icon = PILLAR_ICONS[code] || Briefcase
  return <Icon size={size} strokeWidth={2} />
}

export default function MobilePillarNav({ pillars = [], activePillarId, onSwitch }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const active = useMemo(() => pillars.find(p => p.id === activePillarId) || pillars[0], [pillars, activePillarId])

  if (!pillars.length) return null

  return (
    <>
      <div
        className="mpn-hide-desktop"
        style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--app-border)',
          borderRadius: 99,
          padding: '0.45rem 0.65rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {pillars.slice(0, 4).map(pl => (
          <button
            key={pl.id}
            type="button"
            onClick={() => { onSwitch(pl.id); setSheetOpen(false) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 99,
              border: 'none',
              background: pl.id === activePillarId ? 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))' : 'var(--app-bg2)',
              color: pl.id === activePillarId ? '#fff' : 'var(--app-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.18s',
              whiteSpace: 'nowrap',
            }}
          >
            <PillarIcon code={pl.emoji} />
            <span style={{ display: pl.id === activePillarId ? 'inline' : 'none' }}>
              {(pl.name || '').split(' ')[0]}
            </span>
          </button>
        ))}

        {pillars.length > 4 && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              background: sheetOpen ? 'var(--app-accent)' : 'var(--app-bg2)',
              color: sheetOpen ? '#fff' : 'var(--app-muted)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            +{pillars.length - 4}
          </button>
        )}
      </div>

      {sheetOpen && (
        <>
          <div className="mpn-hide-desktop" onClick={() => setSheetOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 899, background: 'rgba(0,0,0,0.25)' }} />
          <div
            className="mpn-hide-desktop"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 901,
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              border: '1px solid var(--app-border)',
              borderBottom: 'none',
              padding: '1rem 1rem 2rem',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
              animation: 'mpnSlide 0.22s ease',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--app-border)', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-muted)', marginBottom: '0.75rem', fontFamily: "'DM Sans',sans-serif" }}>
              Switch focus area
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {pillars.map(pl => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => { onSwitch(pl.id); setSheetOpen(false) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 12,
                    border: `1.5px solid ${pl.id === active.id ? 'var(--app-accent)' : 'var(--app-border)'}`,
                    background: pl.id === active.id ? 'var(--app-bg2)' : '#fff',
                    color: pl.id === active.id ? 'var(--app-accent)' : 'var(--app-text)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    textAlign: 'left',
                  }}
                >
                  <PillarIcon code={pl.emoji} size={18} />
                  {pl.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes mpnSlide { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @media(min-width:768px){ .mpn-hide-desktop{ display:none !important } }
      `}</style>
    </>
  )
}
