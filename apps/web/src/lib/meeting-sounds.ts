/**
 * Synthesised notification sounds for meetings using Web Audio API.
 * No external audio files needed — tones are generated on the fly.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') ctx = new AudioContext()
  // Resume on first interaction (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.12, rampDown = 0.06) {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const vol = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  vol.gain.value = gain
  // Fade out to avoid click
  vol.gain.setValueAtTime(gain, ac.currentTime + duration - rampDown)
  vol.gain.linearRampToValueAtTime(0, ac.currentTime + duration)
  osc.connect(vol).connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + duration)
}

/** Two-note rising chime — someone joined */
export function playJoin() {
  tone(660, 0.12, 'sine', 0.09)
  setTimeout(() => tone(880, 0.15, 'sine', 0.09), 100)
}

/** Single descending note — someone left */
export function playLeave() {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const vol = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(660, ac.currentTime)
  osc.frequency.linearRampToValueAtTime(440, ac.currentTime + 0.18)
  vol.gain.value = 0.09
  vol.gain.setValueAtTime(0.09, ac.currentTime + 0.12)
  vol.gain.linearRampToValueAtTime(0, ac.currentTime + 0.2)
  osc.connect(vol).connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + 0.22)
}

/** Soft pop — new chat message */
export function playChat() {
  tone(1200, 0.07, 'sine', 0.07)
  setTimeout(() => tone(1500, 0.06, 'sine', 0.05), 55)
}

/** Short buzz — you tried to speak while muted */
export function playMutedBeep() {
  tone(340, 0.09, 'square', 0.06)
  setTimeout(() => tone(340, 0.09, 'square', 0.06), 130)
}
