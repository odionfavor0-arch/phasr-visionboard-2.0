// Generates a faint, soft "chime/whoosh" transition sound as a 16-bit PCM WAV.
// Run: node scripts/make-transition-sound.mjs
// Output: public/audio/transition.wav
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = resolve(__dirname, '../public/audio/transition.wav')
mkdirSync(dirname(out), { recursive: true })

const sampleRate = 44100
const seconds = 0.5
const n = Math.floor(sampleRate * seconds)
const data = new Float32Array(n)

// A gentle two-note shimmer (a soft major-ish interval) with a quick attack
// and a long exponential decay so it reads as "airy" rather than a hard ding.
const partials = [
  { freq: 880, gain: 0.55 }, // A5
  { freq: 1320, gain: 0.32 }, // E6
  { freq: 1760, gain: 0.16 }, // A6 sparkle
]

for (let i = 0; i < n; i++) {
  const t = i / sampleRate
  // Fast attack (~8ms), smooth exponential decay.
  const attack = Math.min(1, t / 0.008)
  const decay = Math.exp(-t * 7.5)
  const env = attack * decay

  let s = 0
  for (const p of partials) {
    // Tiny upward pitch glide for a "lift" feel.
    const f = p.freq * (1 + 0.04 * (1 - decay))
    s += Math.sin(2 * Math.PI * f * t) * p.gain
  }
  // Keep it faint overall.
  data[i] = s * env * 0.22
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
