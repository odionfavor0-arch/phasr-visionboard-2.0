// Generates a soft, low ambient pad loop as a 16-bit PCM WAV — meant to sit
// quietly under a voiceover (mixed at low volume in Remotion), not as a
// standalone track. Two slow-moving warm chords with a gentle swell.
// Run: node scripts/make-ambient-bed.mjs
// Output: public/audio/ambient-bed.wav
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = resolve(__dirname, '../public/audio/ambient-bed.wav')
mkdirSync(dirname(out), { recursive: true })

const sampleRate = 44100
const seconds = 17
const n = Math.floor(sampleRate * seconds)
const data = new Float32Array(n)

// Two warm chords, each held ~8s with a 1s crossfade between them so there's
// no click at the handoff. Root + fifth + third-ish tones only — kept sparse
// so it never competes with the voiceover for attention.
const chordA = [110, 164.81, 220, 277.18] // A2 E3 A3 C#4 (A major, open)
const chordB = [87.31, 130.81, 174.61, 220] // F2 C3 F3 A3 (F major, open)
const crossfadeSec = 1.5
const chordSec = 8.5

for (let i = 0; i < n; i++) {
  const t = i / sampleRate

  // Overall envelope: 2s fade in, hold, 2s fade out at the tail.
  const fadeIn = Math.min(1, t / 2)
  const fadeOut = Math.min(1, (seconds - t) / 2)
  const envelope = Math.min(fadeIn, fadeOut)

  // Slow amplitude swell (~0.12Hz) so it breathes instead of sitting static.
  const swell = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.12 * t)

  // Crossfade between chordA and chordB across the duration.
  const intoB = Math.max(0, Math.min(1, (t - (chordSec - crossfadeSec)) / crossfadeSec))
  const gainA = 1 - intoB
  const gainB = intoB

  let s = 0
  for (const f of chordA) {
    s += Math.sin(2 * Math.PI * f * t) * (0.18 / chordA.length) * gainA
  }
  for (const f of chordB) {
    s += Math.sin(2 * Math.PI * f * t) * (0.18 / chordB.length) * gainB
  }

  data[i] = s * envelope * swell
}

// Encode to 16-bit PCM mono WAV.
const bytesPerSample = 2
const blockAlign = bytesPerSample
const byteRate = sampleRate * blockAlign
const dataSize = n * bytesPerSample
const buffer = Buffer.alloc(44 + dataSize)

buffer.write('RIFF', 0)
buffer.writeUInt32LE(36 + dataSize, 4)
buffer.write('WAVE', 8)
buffer.write('fmt ', 12)
buffer.writeUInt32LE(16, 16)
buffer.writeUInt16LE(1, 20) // PCM
buffer.writeUInt16LE(1, 22) // mono
buffer.writeUInt32LE(sampleRate, 24)
buffer.writeUInt32LE(byteRate, 28)
buffer.writeUInt16LE(blockAlign, 32)
buffer.writeUInt16LE(16, 34)
buffer.write('data', 36)
buffer.writeUInt32LE(dataSize, 40)

for (let i = 0; i < n; i++) {
  let v = Math.max(-1, Math.min(1, data[i]))
  buffer.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
}

writeFileSync(out, buffer)
console.log('Wrote', out, '(' + (buffer.length / 1024).toFixed(1) + ' KB)')
