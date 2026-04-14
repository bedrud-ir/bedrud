import { describe, it, expect } from 'vitest'
import {
  groupMessages,
  avatarColor,
  avatarInitials,
  relativeTime,
  absoluteTime,
  AVATAR_COLORS,
} from './chatGrouping'
import type { ChatMessage, SystemMessage } from '#/components/meeting/MeetingContext'

function makeMsg(overrides: Partial<ChatMessage> & { timestamp: number }): ChatMessage {
  return {
    id: crypto.randomUUID(),
    senderName: 'Alice',
    senderIdentity: 'alice',
    message: 'hello',
    attachments: [],
    isLocal: false,
    ...overrides,
  }
}

const NOW = new Date('2026-04-14T14:00:00Z').getTime()

describe('groupMessages', () => {
  it('returns empty array for no messages', () => {
    expect(groupMessages([], [])).toEqual([])
  })

  it('wraps a single chat message in a date-separator + cluster', () => {
    const msg = makeMsg({ timestamp: NOW })
    const items = groupMessages([msg], [])
    expect(items[0].kind).toBe('date-separator')
    expect(items[1].kind).toBe('cluster')
    if (items[1].kind === 'cluster') {
      expect(items[1].messages).toHaveLength(1)
      expect(items[1].messages[0].id).toBe(msg.id)
    }
  })

  it('groups consecutive messages from same sender within 5 minutes into one cluster', () => {
    const m1 = makeMsg({ timestamp: NOW })
    const m2 = makeMsg({ timestamp: NOW + 60_000 })
    const items = groupMessages([m1, m2], [])
    const clusters = items.filter((i) => i.kind === 'cluster')
    expect(clusters).toHaveLength(1)
    if (clusters[0].kind === 'cluster') {
      expect(clusters[0].messages).toHaveLength(2)
    }
  })

  it('starts a new cluster when gap exceeds 5 minutes', () => {
    const m1 = makeMsg({ timestamp: NOW })
    const m2 = makeMsg({ timestamp: NOW + 6 * 60_000 })
    const items = groupMessages([m1, m2], [])
    const clusters = items.filter((i) => i.kind === 'cluster')
    expect(clusters).toHaveLength(2)
  })

  it('starts a new cluster when sender changes', () => {
    const m1 = makeMsg({ timestamp: NOW, senderIdentity: 'alice' })
    const m2 = makeMsg({ timestamp: NOW + 30_000, senderIdentity: 'bob', senderName: 'Bob' })
    const items = groupMessages([m1, m2], [])
    const clusters = items.filter((i) => i.kind === 'cluster')
    expect(clusters).toHaveLength(2)
    if (clusters[0].kind === 'cluster') expect(clusters[0].identity).toBe('alice')
    if (clusters[1].kind === 'cluster') expect(clusters[1].identity).toBe('bob')
  })

  it('inserts system messages as standalone items (not in clusters)', () => {
    const msg = makeMsg({ timestamp: NOW })
    const sys: SystemMessage = { type: 'system', event: 'kick', actor: 'mod', target: 'user', ts: NOW + 10_000 }
    const items = groupMessages([msg], [sys])
    expect(items.some((i) => i.kind === 'system')).toBe(true)
    const cluster = items.find((i) => i.kind === 'cluster')
    expect(cluster?.kind === 'cluster' && cluster.messages).toHaveLength(1)
  })

  it('interleaves chat and system messages by timestamp', () => {
    const m1 = makeMsg({ timestamp: NOW })
    const sys: SystemMessage = { type: 'system', event: 'ban', actor: 'mod', target: 'user', ts: NOW + 5_000 }
    const m2 = makeMsg({ timestamp: NOW + 10_000 })
    const items = groupMessages([m1, m2], [sys])
    const kinds = items.map((i) => i.kind)
    expect(kinds).toEqual(['date-separator', 'cluster', 'system', 'cluster'])
  })
})

describe('avatarColor', () => {
  it('returns a string from AVATAR_COLORS', () => {
    const color = avatarColor('alice')
    expect(AVATAR_COLORS).toContain(color)
  })

  it('is deterministic for the same identity', () => {
    expect(avatarColor('alice')).toBe(avatarColor('alice'))
  })

  it('differs for different identities (at least sometimes)', () => {
    const colors = ['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'heidi'].map(avatarColor)
    const unique = new Set(colors)
    expect(unique.size).toBeGreaterThan(1)
  })
})

describe('avatarInitials', () => {
  it('returns first two chars uppercased for single-word names', () => {
    expect(avatarInitials('alice')).toBe('AL')
  })

  it('returns initials for two-word names', () => {
    expect(avatarInitials('Alice Smith')).toBe('AS')
  })

  it('handles extra spaces', () => {
    expect(avatarInitials('  Bob   Jones  ')).toBe('BJ')
  })
})

describe('relativeTime', () => {
  it('returns "just now" for < 1 minute ago', () => {
    expect(relativeTime(Date.now() - 30_000)).toBe('just now')
  })

  it('returns "Xm ago" for < 1 hour ago', () => {
    expect(relativeTime(Date.now() - 5 * 60_000)).toBe('5m ago')
  })

  it('returns "Xh ago" for < 1 day ago', () => {
    expect(relativeTime(Date.now() - 3 * 3_600_000)).toBe('3h ago')
  })
})

describe('absoluteTime', () => {
  it('returns a non-empty string', () => {
    expect(absoluteTime(Date.now()).length).toBeGreaterThan(0)
  })
})
