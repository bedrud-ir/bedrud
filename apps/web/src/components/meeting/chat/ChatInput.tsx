import { Image, Maximize2, Minimize2, Send } from 'lucide-react'
import {
  type ChangeEvent,
  type ClipboardEvent,
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import type { ChatAttachment } from '../MeetingContext'

const LINE_HEIGHT = 20
const MIN_ROWS = 1
const NORMAL_MAX_ROWS = 4
const EXPANDED_MAX_ROWS = 10

interface Props {
  onSend: (text: string, attachments?: ChatAttachment[]) => void
  onUpload: (file: File) => Promise<ChatAttachment>
  disabled?: boolean
}

export interface ChatInputHandle {
  focus: () => void
}

export const ChatInput = forwardRef<ChatInputHandle, Props>(function ChatInput({ onSend, onUpload, disabled }, ref) {
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({ focus: () => textareaRef.current?.focus() }))

  const maxRows = expanded ? EXPANDED_MAX_ROWS : NORMAL_MAX_ROWS
  const minHeight = MIN_ROWS * LINE_HEIGHT + 16
  const maxHeight = maxRows * LINE_HEIGHT + 16

  // Auto-resize textarea on draft change
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [maxHeight])

  const send = useCallback(() => {
    const text = draft.trim()
    if (!text || disabled || uploading) return
    onSend(text)
    setDraft('')
    setExpanded(false)
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`
  }, [draft, disabled, uploading, onSend, minHeight])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && e.ctrlKey)) {
        e.preventDefault()
        send()
      }
    },
    [send],
  )

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null)
      setUploading(true)
      try {
        const attachment = await onUpload(file)
        onSend(draft.trim(), [attachment])
        setDraft('')
        setExpanded(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [draft, onSend, onUpload],
  )

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData.items)
      const imageItem = items.find((item) => item.kind === 'file' && item.type.startsWith('image/'))
      if (!imageItem) return
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (file) void uploadFile(file)
    },
    [uploadFile],
  )

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void uploadFile(file)
      e.target.value = ''
    },
    [uploadFile],
  )

  const canSend = Boolean(draft.trim()) && !uploading && !disabled

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px' }}>
      {error && <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(248,113,113,0.9)' }}>{error}</p>}
      {uploading && (
        <p style={{ margin: '0 0 6px', fontSize: 11, color: 'color-mix(in oklab, var(--sky-300) 70%, transparent)' }}>
          Uploading image…
        </p>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        {/* Attach image */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          title="Attach image"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.04)',
            color:
              uploading || disabled ? 'rgba(255,255,255,0.15)' : 'color-mix(in oklab, var(--sky-300) 70%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: uploading || disabled ? 'default' : 'pointer',
          }}
          aria-label="Attach image"
        >
          <Image size={14} />
        </button>

        {/* Textarea wrapper */}
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              resizeTextarea()
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a message…"
            disabled={uploading || disabled}
            rows={1}
            style={{
              width: '100%',
              minHeight,
              maxHeight,
              resize: 'none',
              overflowY: 'auto',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10,
              padding: '8px 32px 8px 12px',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 13,
              lineHeight: `${LINE_HEIGHT}px`,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {/* Expand / collapse button */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Collapse' : 'Expand'}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 18,
              height: 18,
              padding: 0,
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.25)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={expanded ? 'Collapse input' : 'Expand input'}
          >
            {expanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
        </div>

        {/* Send */}
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            flexShrink: 0,
            border: 'none',
            background: canSend ? 'color-mix(in oklab, var(--primary) 80%, transparent)' : 'rgba(255,255,255,0.06)',
            color: canSend ? 'white' : 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'default',
            transition: 'background 0.15s, color 0.15s',
          }}
          aria-label="Send message"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
})
