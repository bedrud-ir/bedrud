import { useEffect, useRef, useState } from 'react'
import { useChat, useLocalParticipant } from '@livekit/components-react'
import { X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '#/lib/utils'

interface Props {
  onClose: () => void
}

export function ChatPanel({ onClose }: Props) {
  const { chatMessages, send, isSending } = useChat()
  const { localParticipant } = useLocalParticipant()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function handleSend(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || isSending) return
    await send(text)
    setDraft('')
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l bg-background">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <span className="font-semibold text-sm">Chat</span>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Separator />

      <ScrollArea className="flex-1 p-4">
        {chatMessages.length === 0 ? (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            No messages yet. Say hello!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {chatMessages.map((msg, i) => {
              const isLocal = msg.from?.identity === localParticipant?.identity
              return (
                <div
                  key={i}
                  className={cn('flex flex-col gap-0.5', isLocal ? 'items-end' : 'items-start')}
                >
                  {!isLocal && (
                    <span className="px-1 text-xs text-muted-foreground">
                      {msg.from?.name ?? msg.from?.identity}
                    </span>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                      isLocal
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm bg-muted'
                    )}
                  >
                    {msg.message}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <Separator />
      <form onSubmit={handleSend} className="flex items-center gap-2 p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1"
          disabled={isSending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!draft.trim() || isSending}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </aside>
  )
}
