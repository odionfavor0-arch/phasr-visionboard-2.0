// Ambient pad for the longer pillar-video format (~45-50s) — three slow
// chords instead of two so a 45s bed doesn't feel static, still meant to
// sit quietly under a voiceover.
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = resolve(__dirname, '../public/audio/ambient-bed-pillar.wav')
mkdirSync(dirname(out), { recursive: true })

const sampleRate = 44100
const seconds = 48
const n = Math.floor(sampleRate * seconds)
const data = new Float32Array(n)

const chords = [
  [110, 164.81, 220, 277.18],   // A2 E3 A3 C#4 (A major, open)
  [87.31, 130.81, 174.61, 220], // F2 C3 F3 A3 (F major, open)
  [98, 146.83, 196, 246.94],    // G2 D3 G3 B3 (G major, open)
]
const chordSec = seconds / chords.length
const crossfadeSec = 1.6

for (let i = 0; i < n; i++) {
  const t = i / sampleRate
  const fadeIn = Math.min(1, t / 2)
  const fadeOut = Math.min(1, (seconds - t) / 2.5)
  const envelope = Math.min(fadeIn, fadeOut)
  const swell = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.1 * t)

  const chordIdx = Math.min(chords.length - 1, Math.floor(t / chordSec))
  const nextIdx = Math.min(chords.length - 1, chordIdx + 1)
  const intoNext = Math.max(0, Math.min(1, (t - (chordIdx * chordSec + (chordSec - crossfadeSec))) / crossfadeSec))

  let s = 0
  for (const f of chords[chordIdx]) s += Math.sin(2 * Math.PI * f * t) * (0.17 / chords[chordIdx].length) * (1 - intoNext)
  for (const f of chords[nextIdx]) s += Math.sin(2 * Math.PI * f * t) * (0.17 / chords[nextIdx].length) * intoNext

  data[i] = s * envelope * swell
}

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
buffer.writeUInt16LE(1, 20)
buffer.writeUInt16LE(1, 22)
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
