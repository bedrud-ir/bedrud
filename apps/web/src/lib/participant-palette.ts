/** Unique gradient palette per participant — determined by name hash */

export const PALETTES = [
  { tile: 'rgba(99,102,241,0.13)', avatar: 'linear-gradient(135deg,#6366f1,#8b5cf6)', glow: 'rgba(99,102,241,0.4)' },
  { tile: 'rgba(6,182,212,0.13)', avatar: 'linear-gradient(135deg,#06b6d4,#3b82f6)', glow: 'rgba(6,182,212,0.4)' },
  { tile: 'rgba(236,72,153,0.12)', avatar: 'linear-gradient(135deg,#ec4899,#f43f5e)', glow: 'rgba(236,72,153,0.4)' },
  { tile: 'rgba(245,158,11,0.12)', avatar: 'linear-gradient(135deg,#f59e0b,#ef4444)', glow: 'rgba(245,158,11,0.4)' },
  { tile: 'rgba(16,185,129,0.12)', avatar: 'linear-gradient(135deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,0.4)' },
  { tile: 'rgba(168,85,247,0.12)', avatar: 'linear-gradient(135deg,#a855f7,#ec4899)', glow: 'rgba(168,85,247,0.4)' },
  { tile: 'rgba(14,165,233,0.12)', avatar: 'linear-gradient(135deg,#0ea5e9,#6366f1)', glow: 'rgba(14,165,233,0.4)' },
  { tile: 'rgba(244,63,94,0.12)', avatar: 'linear-gradient(135deg,#f43f5e,#fb923c)', glow: 'rgba(244,63,94,0.4)' },
]

export function getPalette(name: string) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return PALETTES[Math.abs(hash) % PALETTES.length]
}
