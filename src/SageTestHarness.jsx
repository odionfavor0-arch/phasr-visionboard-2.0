import { useState } from 'react'
import SageCharacter from './components/SageCharacter'

const EMOTIONS = ['idle', 'wave', 'thinking', 'happy', 'celebrating', 'concerned', 'peace']

export default function SageTestHarness() {
  const [emotion, setEmotion] = useState('idle')
  return (
    <div style={{ minHeight: '100vh', background: '#fff0f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, fontFamily: 'sans-serif' }}>
      <SageCharacter emotion={emotion} size={260} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 500 }}>
        {EMOTIONS.map(e => (
          <button key={e} onClick={() => setEmotion(e)} style={{ padding: '8px 14px', borderRadius: 8, border: e === emotion ? '2px solid #c2185b' : '1px solid #ccc', background: '#fff', cursor: 'pointer', fontWeight: e === emotion ? 700 : 400 }}>
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
