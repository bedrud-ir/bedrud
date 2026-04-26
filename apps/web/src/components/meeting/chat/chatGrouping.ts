import type { ChatMessage, SystemMessage } from '../MeetingContext'

// ─── Display item types ───────────────────────────────────────────────────────

export interface ClusterGroup {
  kind: 'cluster'
  sender: string
  identity: string
  isLocal: boolean
  messages: ChatMessage[]
}

export interface DateSeparatorItem {
  kind: 'date-separator'
  label: string
}

export interface SystemItem {
  kind: 'system'
  msg: SystemMessage
}

export type DisplayItem = ClusterGroup | DateSeparatorItem | SystemItem

// ─── Constants ────────────────────────────────────────────────────────────────

const CLUSTER_GAP_MS = 5 * 60_000

export const AVATAR_COLORS = [
  'rgba(79,70,229,0.85)', // indigo
  'rgba(139,92,246,0.85)', // violet
  'rgba(20,184,166,0.85)', // teal
  'rgba(244,63,94,0.85)', // rose
  'rgba(245,158,11,0.85)', // amber
  'rgba(14,165,233,0.85)', // sky
  'rgba(16,185,129,0.85)', // emerald
  'rgba(217,70,239,0.85)', // fuchsia
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDateLabel(ts: number): string {
  const date = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

export function avatarColor(identity: string): string {
  let hash = 0
  for (let i = 0; i < identity.length; i++) {
    hash = (hash * 31 + identity.charCodeAt(i)) & 0xffffffff
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function absoluteTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

// ─── Core grouping function ───────────────────────────────────────────────────

export function groupMessages(chatMessages: ChatMessage[], systemMessages: SystemMessage[]): DisplayItem[] {
  type RawItem = { ts: number; kind: 'chat'; msg: ChatMessage } | { ts: number; kind: 'system'; msg: SystemMessage }

  const raw: RawItem[] = [
    ...chatMessages.map((m) => ({ ts: m.timestamp, kind: 'chat' as const, msg: m })),
    ...systemMessages.map((m) => ({ ts: m.ts, kind: 'system' as const, msg: m })),
  ].sort((a, b) => a.ts - b.ts)

  const result: DisplayItem[] = []
  let currentCluster: ClusterGroup | null = null
  let lastDateLabel: string | null = null

  for (const item of raw) {
    const dateLabel = formatDateLabel(item.ts)

    if (dateLabel !== lastDateLabel) {
      lastDateLabel = dateLabel
      currentCluster = null
      result.push({ kind: 'date-separator', label: dateLabel })
    }

    if (item.kind === 'system') {
      currentCluster = null
      result.push({ kind: 'system', msg: item.msg })
      continue
    }

    const msg = item.msg
    const last = currentCluster?.messages[currentCluster.messages.length - 1]
    const gapExceeded = last ? msg.timestamp - last.timestamp > CLUSTER_GAP_MS : false
    const senderChanged = currentCluster ? currentCluster.identity !== msg.senderIdentity : false

    if (!currentCluster || gapExceeded || senderChanged) {
      currentCluster = {
        kind: 'cluster',
        sender: msg.senderName,
        identity: msg.senderIdentity,
        isLocal: msg.isLocal,
        messages: [msg],
      }
      result.push(currentCluster)
    } else {
      currentCluster.messages.push(msg)
    }
  }

  return result
}
