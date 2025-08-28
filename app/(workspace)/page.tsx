// app/(workspace)/page.tsx - Fixed to use 'new' route
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import HeaderBar from '@/components/HeaderBar'
import { useAuthGuard } from '@/hooks/useAuthGuard'

export default function Landing() {
  const { isAuthenticated } = useAuthGuard()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = async (text?: string) => {
    const message = (text ?? q).trim()
    if (!message || busy) return
    setBusy(true)
    try {
      // Store the initial message to send when the new chat page loads
      sessionStorage.setItem(`chat-new-initial`, message)
      // Navigate to the new chat route
      router.push(`/chat/new`)
    } catch (error) {
      console.error('Failed to create chat:', error)
    } finally {
      setBusy(false)
    }
  }

  const populateInput = (text: string) => {
    setQ(text)
    inputRef.current?.focus()
  }

  const QuickBtn = ({ label, prompt }: { label: string; prompt: string }) => (
    <button
      onClick={() => populateInput(prompt)}
      className="rounded-xl bg-neutral-200/70 px-4 py-2 text-sm dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition disabled:opacity-60"
      disabled={busy}
    >
      {label}
    </button>
  )

  // Don't render the page content if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-0px)] grid grid-rows-[auto_1fr_auto]">
      <HeaderBar />

      {/* Center stage */}
      <main className="grid place-items-center">
        <div className="w-full max-w-3xl px-4">
          {/* Logo */}
          <div className="text-center select-none mb-6">
            <div className="text-[52px] sm:text-[64px] font-semibold tracking-tight">
              <span className="text-neutral-900 dark:text-neutral-100">School</span>{' '}
              <span style={{ color: 'var(--color-brand)' }}>Chat</span>
            </div>
          </div>

          {/* Search / chat bar */}
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-3 rounded-full border border-neutral-300/70 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 px-4 py-3 shadow-[var(--shadow-soft)]">
              <span className="text-neutral-500">⌕</span>
              <input
                ref={inputRef}
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit() }}
                placeholder="Ask your school… e.g., create class P4 East"
                className="w-full bg-transparent outline-none text-sm sm:text-base"
                disabled={busy}
                aria-label="Search or chat"
              />
              <button
                onClick={() => submit()}
                className="rounded-full px-4 py-2 text-sm text-white bg-[--color-brand] hover:bg-[--color-brand-dark] transition disabled:opacity-60"
                disabled={busy || !q.trim()}
              >
                {busy ? '…' : 'Search'}
              </button>
            </div>

            {/* Primary buttons like Google */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => populateInput('help me get started with school management')}
                className="rounded-xl bg-neutral-200/70 px-4 py-2 text-sm dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition disabled:opacity-60"
                disabled={busy}
              >
                School Chat Search
              </button>
              <button
                onClick={() => populateInput('help')}
                className="rounded-xl bg-neutral-200/70 px-4 py-2 text-sm dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition disabled:opacity-60"
                disabled={busy}
              >
                I'm Feeling Curious
              </button>
            </div>

            {/* Shortcut "chips" */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <QuickBtn label="Create Class" prompt="create class P4 East" />
              <QuickBtn label="List Students" prompt="list students" />
              <QuickBtn label="Enroll Student" prompt="enroll student John Doe admission 123 into P4 East" />
              <QuickBtn label="Create Invoice" prompt="create invoice for student 123 amount 15000" />
              <QuickBtn label="Record Payment" prompt="record payment invoice 1 amount 15000" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer (thin bar) */}
      <footer className="text-xs text-neutral-600 dark:text-neutral-400 border-t border-neutral-200/70 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:justify-between">
          <div>Kenya</div>
          <div className="flex gap-4">
            <a className="link-subtle" href="#">Privacy</a>
            <a className="link-subtle" href="#">Terms</a>
            <a className="link-subtle" href="#">About</a>
          </div>
        </div>
      </footer>
    </div>
  )
}