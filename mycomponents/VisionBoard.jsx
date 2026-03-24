// src/components/VisionBoard.jsx
// ─────────────────────────────────────────────
// Full vision board — phase lock, pillar presets,
// independent collapse (max 3 open), Today's Target,
// before/after upload, quarterly review, export
// ─────────────────────────────────────────────

import { useState, useRef } from 'react'

const PILLAR_PRESETS = [
  { emoji: '💼', name: 'Work & Career'   },
  { emoji: '💪', name: 'Fitness & Health'},
  { emoji: '💰', name: 'Finance & Wealth'},
  { emoji: '✈️', name: 'Travel'          },
  { emoji: '❤️', name: 'Relationships'   },
  { emoji: '🎨', name: 'Creative Goals'  },
  { emoji: '📚', name: 'Personal Growth' },
  { emoji: '🧘', name: 'Mindfulness'     },
  { emoji: '🌿', name: 'Spiritual'       },
  { emoji: '🏠', name: 'Home & Life'     },
]

const uid = () => Math.random().toString(36).slice(2, 9)

function freshPillar(emoji = '💡', name = 'New Pillar') {
  return {
    id: uid(), emoji, name,
    beforeImage: null, afterImage: null,
    beforeState: '', beforeDesc: '',
    afterState: '', afterDesc: '',
    resources: [''], activities: [''],
    outputs: [''], weeklyActions: [''],
    shortOutcome: '', mediumOutcome: '', longOutcome: '',
    collapsed: false,
  }
}

function freshPhase(n) {
  return {
    id: uid(), name: `Phase ${n}`, period: `Q${n}`,
    affirmation: 'I am becoming who I was always meant to be.',
    pillars: [
      freshPillar('💼', 'Work & Career'),
      freshPillar('💪', 'Personal Life'),
      freshPillar('🌿', 'Spiritual'),
    ],
    impact: 'Write your ultimate transformation for this phase.',
    reviewWorked: '', reviewDrained: '', reviewPaid: '', reviewStrategy: '',
  }
}

function load() {
  try { const s = localStorage.getItem('phasr_vb'); return s ? JSON.parse(s) : null } catch { return null }
}
function save(d) { localStorage.setItem('phasr_vb', JSON.stringify(d)) }

const FREE_PHASE_LIMIT = 2

/* ── Shared input styles ── */
const inp = (extra = {}) => ({
  width: '100%', padding: '0.38rem 0.6rem',
  border: '1.5px solid var(--app-border)', borderRadius: 8,
  fontFamily: "'DM Sans',sans-serif", fontSize: '0.8rem',
  color: 'var(--app-text)', background: '#fff', outline: 'none',
  marginBottom: '0.28rem', transition: 'border-color 0.2s',
  ...extra,
})
const ta = (extra = {}) => ({
  width: '100%', padding: '0.4rem 0.6rem',
  border: '1.5px solid var(--app-border)', borderRadius: 8,
  fontFamily: "'DM Sans',sans-serif", fontSize: '0.8rem',
  color: 'var(--app-text)', background: '#fff', outline: 'none',
  resize: 'vertical', minHeight: 56, lineHeight: 1.5,
  transition: 'border-color 0.2s', ...extra,
})
const focus = e => { e.target.style.borderColor = 'var(--app-accent)' }
const blur  = e => { e.target.style.borderColor = 'var(--app-border)' }

export default function VisionBoard({ user }) {
  const isPro = false // wire to user.plan once Stripe is set up

  const [data, setData] = useState(() =>
    load() || { boardTitle: 'My Vision Board', phases: [freshPhase(1)] }
  )
  const [phaseId,    setPhaseId]    = useState(() => (load() || { phases: [freshPhase(1)] }).phases[0]?.id)
  const [editing,    setEditing]    = useState(false)
  const [checked,    setChecked]    = useState({})
  const [presetOpen, setPresetOpen] = useState(null)

  function upd(fn) {
    setData(prev => {
      const next = fn(JSON.parse(JSON.stringify(prev)))
      save(next)
      return next
    })
  }

  const phase    = data.phases.find(p => p.id === phaseId) || data.phases[0]
  const openCount = phase?.pillars?.filter(p => !p.collapsed).length || 0

  /* ── Mutations ── */
  const updatePhase = (key, val) => upd(d => { const ph = d.phases.find(p => p.id === phaseId); if (ph) ph[key] = val; return d })
  const updatePillar = (plId, key, val) => upd(d => { const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId); if (pl) pl[key] = val; return d })
  const updateArr    = (plId, key, idx, val) => upd(d => { const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId); if (pl) pl[key][idx] = val; return d })
  const addArr       = (plId, key) => upd(d => { const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId); if (pl) pl[key].push(''); return d })
  const delArr       = (plId, key, idx) => upd(d => { const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId); if (pl && pl[key].length > 1) pl[key].splice(idx, 1); return d })

  function toggleCollapse(plId) {
    upd(d => {
      const ph = d.phases.find(p => p.id === phaseId)
      const pl = ph?.pillars.find(p => p.id === plId)
      if (!pl) return d
      if (pl.collapsed && openCount >= 3) {
        const first = ph.pillars.find(p => !p.collapsed && p.id !== plId)
        if (first) first.collapsed = true
      }
      pl.collapsed = !pl.collapsed
      return d
    })
  }

  const addPillar  = () => upd(d => { const ph = d.phases.find(p => p.id === phaseId); if (ph) ph.pillars.push(freshPillar()); return d })
  const delPillar  = (plId) => upd(d => { const ph = d.phases.find(p => p.id === phaseId); if (ph && ph.pillars.length > 1) ph.pillars = ph.pillars.filter(p => p.id !== plId); return d })

  const addPhase   = () => {
    if (!isPro && data.phases.length >= FREE_PHASE_LIMIT) return
    upd(d => { const p = freshPhase(d.phases.length + 1); d.phases.push(p); setPhaseId(p.id); return d })
  }
  const delPhase   = (pid) => {
    if (data.phases.length <= 1) return
    upd(d => { d.phases = d.phases.filter(p => p.id !== pid); setPhaseId(d.phases[0].id); return d })
  }

  const applyPreset = (plId, preset) => {
    updatePillar(plId, 'emoji', preset.emoji)
    updatePillar(plId, 'name',  preset.name)
    setPresetOpen(null)
  }

  const toggleCheck = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }))

  const uploadImg = (plId, slot) => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'
    i.onchange = e => {
      const f = e.target.files[0]; if (!f) return
      const r = new FileReader()
      r.onload = ev => updatePillar(plId, slot, ev.target.result)
      r.readAsDataURL(f)
    }
    i.click()
  }

  const todayTarget = phase?.pillars?.[0]?.weeklyActions?.[0] || 'Complete 1 action from your current phase'

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1.5rem 1rem 4rem', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        {/* ── Today's Target ── */}
        <div style={{
          background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))',
          borderRadius: 12, padding: '0.85rem 1.4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem',
          boxShadow: '0 4px 16px rgba(233,100,136,0.25)',
        }}>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: '0.18rem' }}>
              Today's Target — {phase?.name}
            </p>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{todayTarget}</p>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
            Log it in Daily Check-in
          </p>
        </div>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          {editing
            ? <input value={data.boardTitle} onChange={e => upd(d => { d.boardTitle = e.target.value; return d })} style={inp({ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.4rem,4vw,2.2rem)', fontWeight: 700, color: 'var(--app-accent)', background: 'transparent', border: 'none', borderBottom: '2px solid var(--app-border)', textAlign: 'center', width: '100%', maxWidth: 560, marginBottom: 0 })} onFocus={focus} onBlur={blur} />
            : <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 700, lineHeight: 1.15, background: 'linear-gradient(135deg,var(--app-accent),var(--app-accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{data.boardTitle}</h1>
          }
          <p style={{ color: 'var(--app-muted)', fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.3rem' }}>
            {phase?.pillars?.map(p => p.name).join(' · ')}
          </p>
          <button onClick={() => setEditing(e => !e)} style={{
            marginTop: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.33rem 1rem', borderRadius: 99,
            border: `1.5px solid ${editing ? 'transparent' : 'var(--app-border)'}`,
            background: editing ? 'linear-gradient(135deg,#65c47c,#3da85a)' : 'var(--app-bg2)',
            color: editing ? '#fff' : 'var(--app-accent)',
            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
          }}>{editing ? '✓ Save' : '✏ Personalise'}</button>
        </div>

        {/* ── Phase Tabs ── */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.2rem', alignItems: 'center' }}>
          {data.phases.map(p => (
            <div key={p.id} style={{ position: 'relative' }}>
              <button onClick={() => setPhaseId(p.id)} style={{
                padding: '0.48rem 1.1rem', borderRadius: 99,
                border: `1.5px solid ${phaseId === p.id ? 'transparent' : 'var(--app-border)'}`,
                background: phaseId === p.id ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : '#fff',
                color: phaseId === p.id ? '#fff' : 'var(--app-muted)',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: phaseId === p.id ? '0 4px 14px rgba(233,100,136,0.28)' : 'none',
                transition: 'all 0.2s', textAlign: 'center',
              }}>
                {editing && phaseId === p.id
                  ? <span onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <input value={p.name}   onChange={e => updatePhase('name',   e.target.value)} style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.6)', color: '#fff', fontWeight: 600, fontSize: '0.78rem', outline: 'none', width: 70 }} />
                      <input value={p.period} onChange={e => updatePhase('period', e.target.value)} style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', outline: 'none', width: 35 }} />
                    </span>
                  : <>{p.name}<span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 400, opacity: 0.85, marginTop: 1 }}>{p.period}</span></>
                }
              </button>
              {editing && data.phases.length > 1 && (
                <button onClick={() => delPhase(p.id)} style={{ position: 'absolute', top: -5, right: -5, width: 15, height: 15, borderRadius: '50%', background: '#fff', border: '1.5px solid var(--app-border)', color: 'var(--app-accent)', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1 }}>✕</button>
              )}
            </div>
          ))}
          {(!isPro && data.phases.length >= FREE_PHASE_LIMIT)
            ? <div style={{ padding: '0.48rem 1.1rem', borderRadius: 99, border: '1.5px dashed var(--app-border)', color: 'var(--app-muted)', fontSize: '0.74rem', opacity: 0.7 }}>🔒 Upgrade for more phases</div>
            : <button onClick={addPhase} style={{ padding: '0.48rem 1.1rem', borderRadius: 99, border: '1.5px dashed var(--app-border)', background: 'transparent', color: 'var(--app-accent2)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: '0.3rem' }}>+ add phase</button>
          }
        </div>

        {/* ── Affirmation ── */}
        <div style={{ background: 'linear-gradient(135deg,var(--app-bg2),#fff)', border: '1.5px solid var(--app-border)', borderRadius: 12, padding: '0.85rem 1.4rem', marginBottom: '1.2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', top: -10, left: 10, fontFamily: "'Playfair Display',serif", fontSize: '5rem', color: 'var(--app-border)', lineHeight: 1, pointerEvents: 'none' }}>"</span>
          {editing
            ? <input value={phase?.affirmation || ''} onChange={e => updatePhase('affirmation', e.target.value)} placeholder="Your phase mantra..." style={inp({ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: '1rem', color: 'var(--app-accent)', background: 'transparent', border: 'none', borderBottom: '1.5px solid var(--app-border)', textAlign: 'center', marginBottom: 0, position: 'relative', zIndex: 1 })} onFocus={focus} onBlur={blur} />
            : <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 'clamp(0.9rem,2.2vw,1.05rem)', color: 'var(--app-accent)', position: 'relative', zIndex: 1, lineHeight: 1.6 }}>{phase?.affirmation}</p>
          }
        </div>

        {/* ── Pillars ── */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min((phase?.pillars?.length || 1) + (editing ? 1 : 0), 4)}, 1fr)`, gap: '1rem', marginBottom: '1.5rem' }}>
          {phase?.pillars?.map(pl => (
            <PillarCard
              key={pl.id} pl={pl} editing={editing} checked={checked} phaseId={phaseId}
              presetOpen={presetOpen === pl.id}
              onCollapse={() => toggleCollapse(pl.id)}
              onUpdate={(k, v) => updatePillar(pl.id, k, v)}
              onUpdateArr={(k, i, v) => updateArr(pl.id, k, i, v)}
              onAddArr={k => addArr(pl.id, k)}
              onDelArr={(k, i) => delArr(pl.id, k, i)}
              onCheck={toggleCheck}
              onUpload={slot => uploadImg(pl.id, slot)}
              onDel={() => delPillar(pl.id)}
              onPreset={() => setPresetOpen(presetOpen === pl.id ? null : pl.id)}
              onApplyPreset={p => applyPreset(pl.id, p)}
              onClosePreset={() => setPresetOpen(null)}
            />
          ))}
          {editing && (
            <button onClick={addPillar} style={{ border: '2px dashed var(--app-border)', borderRadius: 16, background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.8rem 1rem', cursor: 'pointer', minHeight: 120 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--app-bg2)'; e.currentTarget.style.borderColor = 'var(--app-accent2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--app-border)' }}>
              <span style={{ fontSize: '1.4rem', color: 'var(--app-accent2)' }}>+</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--app-accent2)', fontFamily: "'DM Sans',sans-serif" }}>add pillar</span>
            </button>
          )}
        </div>

        {/* ── Ultimate Impact ── */}
        <div style={{ margin: '2rem 0 1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#fffbfc', borderRadius: 6, padding: '2rem 3rem', textAlign: 'center', width: '100%', maxWidth: 820, boxShadow: '0 0 0 1.5px var(--app-border),0 0 0 5px var(--app-bg2),0 0 0 6.5px var(--app-border),0 12px 40px rgba(233,100,136,0.1)' }}>
            <span style={{ display: 'block', fontSize: '1.8rem', marginBottom: '0.4rem', animation: 'vbFloat 3s ease-in-out infinite' }}>👑</span>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.1rem,3vw,1.6rem)', fontWeight: 700, background: 'linear-gradient(90deg,#ff6b9d,#ffb3c6,#ffa0bc,#ff6b9d)', backgroundSize: '300% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'vbFoil 4s linear infinite', marginBottom: '0.7rem' }}>Ultimate Impact</p>
            {editing
              ? <textarea rows={3} value={phase?.impact || ''} onChange={e => updatePhase('impact', e.target.value)} style={ta({ textAlign: 'center', fontStyle: 'italic' })} onFocus={focus} onBlur={blur} />
              : <p style={{ fontSize: '0.95rem', color: '#7a3a55', lineHeight: 1.7, fontWeight: 500 }}>{phase?.impact}</p>
            }
          </div>
        </div>

        {/* ── Quarterly Review ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--app-border)', boxShadow: 'var(--sh)', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg,#fff8e6,#fff0d6)', borderBottom: '1px solid #f5d9a0', padding: '0.9rem 1.3rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#f5b942,#e8930a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', flexShrink: 0 }}>📈</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', fontWeight: 600, color: '#7a4a00' }}>Quarterly Review — {phase?.name}</h3>
          </div>
          <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.85rem' }}>
            {[
              { k: 'reviewWorked',  bg: '#f4fbf5', bc: '#b9dfc0', c: '#3a7d4d', l: 'What Worked?',     h: 'What brought results?' },
              { k: 'reviewDrained', bg: '#fff8f8', bc: '#f9cdd3', c: '#c0445a', l: 'What Drained Me?', h: 'What to drop?' },
              { k: 'reviewPaid',    bg: '#f2f6ff', bc: '#c5d5f7', c: '#3355a0', l: 'What Paid Off?',   h: 'What to double down on?' },
            ].map(({ k, bg, bc, c, l, h }) => (
              <div key={k} style={{ background: bg, border: `1px solid ${bc}`, borderRadius: 12, padding: '0.8rem' }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c, marginBottom: '0.28rem' }}>{l}</p>
                <p style={{ fontSize: '0.7rem', color: '#8a7080', marginBottom: '0.4rem' }}>{h}</p>
                <textarea rows={4} value={phase?.[k] || ''} onChange={e => updatePhase(k, e.target.value)} placeholder="Write here..." style={ta({ minHeight: 70 })} onFocus={focus} onBlur={blur} />
              </div>
            ))}
          </div>
          <div style={{ margin: '0 1rem 1rem', borderRadius: 12, padding: '0.8rem', background: 'linear-gradient(135deg,#faf0f5,#f5ebff)', border: '1px solid #e8d0f0' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a58b0', marginBottom: '0.4rem' }}>Next Phase Strategy</p>
            <textarea rows={3} value={phase?.reviewStrategy || ''} onChange={e => updatePhase('reviewStrategy', e.target.value)} placeholder="What will you do MORE of, STOP, and START?" style={ta()} onFocus={focus} onBlur={blur} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.3rem', borderRadius: 99, border: '1.5px solid var(--app-border)', background: '#fff', color: 'var(--app-accent)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginBottom: '0.7rem' }}>⬇ Save as image</button>
          <p style={{ color: 'var(--app-muted)', fontSize: '0.78rem' }}>Track weekly · Review quarterly · Transform your life</p>
        </div>
      </div>

      <style>{`
        @keyframes vbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes vbFoil{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @media(max-width:640px){ [style*="repeat(3,1fr)"],[style*="repeat(4,1fr)"]{ grid-template-columns:1fr!important } }
      `}</style>
    </div>
  )
}

/* ── Pillar Card ── */
function PillarCard({ pl, editing, checked, phaseId, presetOpen, onCollapse, onUpdate, onUpdateArr, onAddArr, onDelArr, onCheck, onUpload, onDel, onPreset, onApplyPreset, onClosePreset }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--app-border)', boxShadow: '0 4px 24px rgba(233,100,136,0.08)', overflow: 'hidden' }}>
      {/* Header */}
      <div onClick={onCollapse} style={{ background: 'linear-gradient(135deg,var(--app-bg2),#fff)', borderBottom: pl.collapsed ? 'none' : '1px solid var(--app-border)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
        <div style={{ position: 'relative' }}>
          <div onClick={e => { e.stopPropagation(); editing && onPreset() }} style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', cursor: editing ? 'pointer' : 'default' }}>{pl.emoji}</div>
          {editing && presetOpen && (
            <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '110%', left: 0, zIndex: 50, background: '#fff', border: '1px solid var(--app-border)', borderRadius: 12, padding: '0.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.2rem', width: 200 }}>
              {PILLAR_PRESETS.map(p => (
                <button key={p.name} onClick={() => onApplyPreset(p)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.5rem', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.76rem', color: 'var(--app-text)', fontFamily: "'DM Sans',sans-serif" }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--app-bg2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span>{p.emoji}</span> {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {editing
          ? <input value={pl.name} onChange={e => onUpdate('name', e.target.value)} onClick={e => e.stopPropagation()} style={{ flex: 1, padding: '0.3rem 0.5rem', border: 'none', borderBottom: '1.5px solid var(--app-border)', fontFamily: "'Playfair Display',serif", fontSize: '0.95rem', fontWeight: 600, color: 'var(--app-text)', outline: 'none', background: 'transparent' }} />
          : <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '0.95rem', fontWeight: 600, color: 'var(--app-text)', flex: 1 }}>{pl.name}</span>
        }
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {editing && <button onClick={e => { e.stopPropagation(); onDel() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e0a0a8', fontSize: '0.85rem', padding: 2 }}>🗑</button>}
          <span style={{ color: 'var(--app-accent2)', fontSize: '0.8rem' }}>{pl.collapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {!pl.collapsed && (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Before / After */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            {[
              { slot: 'beforeImage', src: pl.beforeImage, lbl: 'Before', sk: 'beforeState', dk: 'beforeDesc', sv: pl.beforeState, dv: pl.beforeDesc, bg: '#fff8f8', bc: '#f9cdd3', lc: '#c0445a', icon: '📸' },
              { slot: 'afterImage',  src: pl.afterImage,  lbl: 'After',  sk: 'afterState',  dk: 'afterDesc',  sv: pl.afterState,  dv: pl.afterDesc,  bg: '#f4fbf5', bc: '#b9dfc0', lc: '#3a7d4d', icon: '🎯' },
            ].map(({ slot, src, lbl, sk, dk, sv, dv, bg, bc, lc, icon }) => (
              <div key={slot} style={{ background: bg, border: `1px solid ${bc}`, borderRadius: 12, padding: '0.7rem' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: lc, marginBottom: '0.4rem' }}>{icon} {lbl}</p>
                <div onClick={() => editing && onUpload(slot)} style={{ width: '100%', aspectRatio: '4/3', borderRadius: 8, background: 'var(--app-bg2)', border: '2px dashed var(--app-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem', overflow: 'hidden', cursor: editing ? 'pointer' : 'default' }}>
                  {src ? <img src={src} alt={lbl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <p style={{ fontSize: '0.66rem', color: 'var(--app-border)', textAlign: 'center', padding: '0.4rem' }}>{editing ? '📤 tap to upload' : 'add photo'}</p>}
                </div>
                {editing
                  ? <><input value={sv} onChange={e => onUpdate(sk, e.target.value)} placeholder={`${lbl} state`} style={{ width: '100%', padding: '0.35rem 0.55rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none', marginBottom: '0.25rem' }} onFocus={focus} onBlur={blur} />
                     <input value={dv} onChange={e => onUpdate(dk, e.target.value)} placeholder="Description" style={{ width: '100%', padding: '0.35rem 0.55rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.72rem', color: 'var(--app-muted)', background: '#fff', outline: 'none' }} onFocus={focus} onBlur={blur} /></>
                  : <><p style={{ fontSize: '0.78rem', color: 'var(--app-text)', lineHeight: 1.5 }}>{sv}</p><p style={{ fontSize: '0.72rem', color: 'var(--app-muted)', marginTop: 2 }}>{dv}</p></>
                }
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: 'linear-gradient(to right,transparent,var(--app-border),transparent)' }} />

          {/* List sections */}
          {[
            { lbl: 'Resources',  key: 'resources',  c: '#4a7fc1', m: '◦' },
            { lbl: 'Activities', key: 'activities', c: '#d4773a', m: '→' },
          ].map(({ lbl, key, c, m }) => (
            <div key={key}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c, marginBottom: '0.38rem' }}>{lbl}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
                {pl[key].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.22rem 0.38rem', borderRadius: 7 }}>
                    {editing
                      ? <><input value={item} onChange={e => onUpdateArr(key, i, e.target.value)} style={{ flex: 1, padding: '0.32rem 0.5rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }} onFocus={focus} onBlur={blur} />
                         <button onClick={() => onDelArr(key, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e0a0a8', fontSize: '0.82rem', padding: 2 }}>🗑</button></>
                      : <span style={{ fontSize: '0.8rem', color: '#5a3d47', lineHeight: 1.5, flex: 1 }}>{m} {item}</span>
                    }
                  </div>
                ))}
                {editing && <button onClick={() => onAddArr(key)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--app-accent2)', background: 'var(--app-bg2)', border: '1.5px dashed var(--app-border)', borderRadius: 6, padding: '0.22rem 0.58rem', cursor: 'pointer', marginTop: '0.18rem', fontFamily: "'DM Sans',sans-serif" }}>+ add item</button>}
              </div>
            </div>
          ))}

          {/* Weekly non-negotiables */}
          <div style={{ background: 'linear-gradient(135deg,var(--app-bg2),#fff5f0)', border: '1.5px solid var(--app-border)', borderRadius: 12, padding: '0.75rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-accent)', marginBottom: '0.5rem' }}>Weekly Non-Negotiables</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
              {pl.weeklyActions.map((item, i) => {
                const ck = `${phaseId}-${pl.id}-wk-${i}`
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.48rem', padding: '0.26rem 0.33rem', borderRadius: 7, cursor: 'pointer' }} onClick={() => !editing && onCheck(ck)}>
                    <input type="checkbox" checked={!!checked[ck]} onChange={() => onCheck(ck)} onClick={e => e.stopPropagation()} style={{ width: 14, height: 14, marginTop: 3, accentColor: 'var(--app-accent)', flexShrink: 0, cursor: 'pointer' }} />
                    {editing
                      ? <><input value={item} onChange={e => onUpdateArr('weeklyActions', i, e.target.value)} style={{ flex: 1, padding: '0.32rem 0.5rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }} onFocus={focus} onBlur={blur} />
                         <button onClick={() => onDelArr('weeklyActions', i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e0a0a8', fontSize: '0.82rem', padding: 2 }}>🗑</button></>
                      : <span style={{ fontSize: '0.8rem', color: checked[ck] ? '#c4a0ac' : '#5a3d47', lineHeight: 1.5, flex: 1, textDecoration: checked[ck] ? 'line-through' : 'none' }}>{item}</span>
                    }
                  </div>
                )
              })}
              {editing && <button onClick={() => onAddArr('weeklyActions')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--app-accent2)', background: 'var(--app-bg2)', border: '1.5px dashed var(--app-border)', borderRadius: 6, padding: '0.22rem 0.58rem', cursor: 'pointer', marginTop: '0.18rem', fontFamily: "'DM Sans',sans-serif" }}>+ add action</button>}
            </div>
          </div>

          {/* Outputs */}
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3d9158', marginBottom: '0.38rem' }}>Outputs</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
              {pl.outputs.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.22rem 0.38rem', borderRadius: 7 }}>
                  {editing
                    ? <><input value={item} onChange={e => onUpdateArr('outputs', i, e.target.value)} style={{ flex: 1, padding: '0.32rem 0.5rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }} onFocus={focus} onBlur={blur} />
                       <button onClick={() => onDelArr('outputs', i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e0a0a8', fontSize: '0.82rem', padding: 2 }}>🗑</button></>
                    : <span style={{ fontSize: '0.8rem', color: '#5a3d47', lineHeight: 1.5, flex: 1 }}>✓ {item}</span>
                  }
                </div>
              ))}
              {editing && <button onClick={() => onAddArr('outputs')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--app-accent2)', background: 'var(--app-bg2)', border: '1.5px dashed var(--app-border)', borderRadius: 6, padding: '0.22rem 0.58rem', cursor: 'pointer', marginTop: '0.18rem', fontFamily: "'DM Sans',sans-serif" }}>+ add item</button>}
            </div>
          </div>

          {/* Outcomes */}
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a58b0', marginBottom: '0.38rem' }}>Outcomes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
              {[['shortOutcome','Short-term'],['mediumOutcome','Medium-term'],['longOutcome','Long-term']].map(([k, lbl]) => (
                <div key={k} style={{ background: 'linear-gradient(135deg,#faf0f5,#f5ebff)', border: '1px solid #e8d0f0', borderRadius: 10, padding: '0.5rem 0.7rem' }}>
                  <p style={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#9060b0', marginBottom: '0.14rem' }}>{lbl}</p>
                  {editing
                    ? <textarea rows={2} value={pl[k]} onChange={e => onUpdate(k, e.target.value)} style={{ width: '100%', padding: '0.35rem 0.5rem', border: '1.5px solid #e8d0f0', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: '#5a3d60', background: '#fff', outline: 'none', resize: 'vertical', minHeight: 44, lineHeight: 1.5 }} onFocus={focus} onBlur={blur} />
                    : <p style={{ fontSize: '0.8rem', color: '#5a3d60', lineHeight: 1.5 }}>{pl[k]}</p>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
