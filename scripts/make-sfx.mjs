// Simple procedural percussive SFX (pop, stamp thump, click) as short WAVs —
// no foley/paper-rustle/pencil (not realistically synthesizable this way).
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../public/audio/sfx')
mkdirSync(outDir, { recursive: true })
const sampleRate = 44100

function writeWav(name, samples) {
  const n = samples.length
  const buffer = Buffer.alloc(44 + n * 2)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + n * 2, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
  }
  const out = resolve(outDir, name)
  writeFileSync(out, buffer)
  console.log('Wrote', out)
}

// pop: quick high sine blip, fast decay
{
  const dur = 0.12
  const n = Math.floor(sampleRate * dur)
  const s = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    const env = Math.exp(-t * 40)
    s[i] = Math.sin(2 * Math.PI * (900 + t * 400) * t) * env * 0.5
  }
  writeWav('pop.wav', s)
}

// stamp: low thump, very fast decay, slight noise
{
  const dur = 0.15
  const n = Math.floor(sampleRate * dur)
  const s = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    const env = Math.exp(-t * 30)
    const tone = Math.sin(2 * Math.PI * 110 * t)
    const noise = (Math.random() * 2 - 1) * 0.3
    s[i] = (tone * 0.7 + noise) * env * 0.55
  }
  writeWav('stamp.wav', s)
}

// click: very short tick
{
  const dur = 0.05
  const n = Math.floor(sampleRate * dur)
  const s = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    const env = Math.exp(-t * 90)
    s[i] = Math.sin(2 * Math.PI * 1800 * t) * env * 0.4
  }
  writeWav('click.wav', s)
}

// type-tick: very short soft click for a typewriter/typing loop
{
  const dur = 0.07
  const n = Math.floor(sampleRate * dur)
  const s = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    const env = Math.exp(-t * 120)
    s[i] = Math.sin(2 * Math.PI * 2400 * t) * env * 0.3
  }
  writeWav('type-tick.wav', s)
}

// whoosh: soft airy sweep for camera pushes / transitions
{
  const dur = 0.35
  const n = Math.floor(sampleRate * dur)
  const s = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    const env = Math.sin(Math.PI * (t / dur)) // rise then fall
    const noise = (Math.random() * 2 - 1)
    // band-limited-ish noise: light smoothing via a short moving average feel
    s[i] = noise * env * 0.22
  }
  // simple smoothing pass to soften the noise into an airy whoosh
  for (let i = 1; i < n - 1; i++) {
    s[i] = (s[i - 1] + s[i] * 2 + s[i + 1]) / 4
  }
  writeWav('whoosh.wav', s)
}

// chime: warmer two-note landing sound for the brand reveal
{
  const dur = 0.5
  const n = Math.floor(sampleRate * dur)
  const s = new Float32Array(n)
  const notes = [
    { freq: 660, gain: 0.4 },
    { freq: 990, gain: 0.25 },
  ]
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    const attack = Math.min(1, t / 0.01)
    const decay = Math.exp(-t * 5)
    const env = attack * decay
    let v = 0
    for (const nt of notes) v += Math.sin(2 * Math.PI * nt.freq * t) * nt.gain
    s[i] = v * env * 0.5
  }
  writeWav('chime.wav', s)
}
