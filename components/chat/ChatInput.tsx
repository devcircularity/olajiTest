// components/chat/ChatInput.tsx - Updated for async onSend
'use client'
import { useState, useRef } from 'react'

export default function ChatInput({
  onSend,
  busy,
}: {
  onSend: (text: string) => Promise<void>,
  busy?: boolean
}) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const send = async () => {
    const t = text.trim()
    if (!t || busy) return
    setText('')
    try {
      await onSend(t)
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error in ChatInput:', error)
    }
    inputRef.current?.focus()
  }

  const onKey = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      await send()
    }
  }

  return (
    <div className="pt-4 pb-6 bg-gradient-to-t from-neutral-100/60 via-neutral-50/20 to-transparent
                    dark:from-neutral-950/60 dark:via-neutral-950/20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex items-center gap-2 rounded-full border border-neutral-300/60 bg-white/70
                        dark:border-neutral-700/60 dark:bg-neutral-900/70
                        px-4 py-3 shadow-[var(--shadow-soft)]">
          <span className="text-neutral-400 dark:text-neutral-500">⌕</span>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="ask anything… e.g., create class P4 East"
            aria-label="Chat message"
            className="w-full bg-transparent outline-none text-[15px] 
                       text-neutral-900 dark:text-neutral-100
                       placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            disabled={busy}
            maxLength={2000}
          />
          <button
            className="rounded-full px-4 py-2 text-sm text-white bg-[--color-brand]
                       hover:bg-[--color-brand-dark] transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-brand)' }}
            onMouseEnter={(e) => {
              if (!busy) {
                e.currentTarget.style.backgroundColor = 'var(--color-brand-dark)'
              }
            }}
            onMouseLeave={(e) => {
              if (!busy) {
                e.currentTarget.style.backgroundColor = 'var(--color-brand)'
              }
            }}
            onClick={send}
            disabled={busy || !text.trim()}
          >
            {busy ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            ) : (
              'Send'
            )}
          </button>
        </div>
        
        {/* Character count */}
        {text.length > 1500 && (
          <div className="text-xs text-neutral-500 text-right mt-1">
            {text.length}/2000
          </div>
        )}
      </div>
    </div>
  )
}