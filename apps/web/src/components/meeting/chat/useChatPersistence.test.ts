import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ChatMessage } from '../MeetingContext'
import { useChatPersistence } from './useChatPersistence'

function makeMsg(id: string): ChatMessage {
  return {
    id,
    timestamp: Date.now(),
    senderName: 'Alice',
    senderIdentity: 'alice',
    message: 'hello',
    attachments: [],
    isLocal: false,
  }
}

beforeEach(() => sessionStorage.clear())
afterEach(() => sessionStorage.clear())

describe('useChatPersistence', () => {
  it('returns empty array when sessionStorage has no entry', () => {
    const { result } = renderHook(() => useChatPersistence('room-1'))
    const [initial] = result.current
    expect(initial).toEqual([])
  })

  it('returns stored messages on mount', () => {
    const msgs = [makeMsg('a'), makeMsg('b')]
    sessionStorage.setItem('chat:room-1', JSON.stringify(msgs))
    const { result } = renderHook(() => useChatPersistence('room-1'))
    const [initial] = result.current
    expect(initial).toHaveLength(2)
    expect(initial[0].id).toBe('a')
  })

  it('persist() writes messages to sessionStorage', () => {
    const { result } = renderHook(() => useChatPersistence('room-2'))
    const [, persist] = result.current
    const msgs = [makeMsg('x')]
    act(() => persist(msgs))
    const stored = JSON.parse(sessionStorage.getItem('chat:room-2') ?? '[]') as ChatMessage[]
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe('x')
  })

  it('scopes storage to roomId', () => {
    const { result: r1 } = renderHook(() => useChatPersistence('room-A'))
    const { result: r2 } = renderHook(() => useChatPersistence('room-B'))
    act(() => r1.current[1]([makeMsg('from-A')]))
    act(() => r2.current[1]([makeMsg('from-B')]))
    const a = JSON.parse(sessionStorage.getItem('chat:room-A') ?? '[]') as ChatMessage[]
    const b = JSON.parse(sessionStorage.getItem('chat:room-B') ?? '[]') as ChatMessage[]
    expect(a[0].id).toBe('from-A')
    expect(b[0].id).toBe('from-B')
  })

  it('returns empty array when stored JSON is malformed', () => {
    sessionStorage.setItem('chat:room-bad', 'not-json{{{')
    const { result } = renderHook(() => useChatPersistence('room-bad'))
    const [initial] = result.current
    expect(initial).toEqual([])
  })
})
