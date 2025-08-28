'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './WorkspaceSidebar'
import CanvasPanel from './WorkspaceCanvas'

// Simple event bus so any page/component can open the canvas
type CanvasCommand = { type: 'open' | 'close' | 'toggle', width?: number }
type Listener = (cmd: CanvasCommand) => void

const listeners = new Set<Listener>()
export const CanvasBus = {
  send(cmd: CanvasCommand) { listeners.forEach(l => l(cmd)) },
  on(l: Listener) { 
    listeners.add(l); 
    return () => { 
      listeners.delete(l) 
    } 
  }
}

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  // Sidebar collapsed state (persist); prefers collapsed by default
  const [collapsed, setCollapsed] = useState<boolean>(true)
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === null) {
      localStorage.setItem('sidebar_collapsed', '1') // default collapsed
    } else {
      setCollapsed(saved === '1')
    }
  }, [])
  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar_collapsed', next ? '1' : '0')
      return next
    })
  }

  // Canvas open/width state (persist). Closed by default
  const [canvasOpen, setCanvasOpen] = useState<boolean>(false)
  const [canvasWidth, setCanvasWidth] = useState<number>(420)
  useEffect(() => {
    const open = localStorage.getItem('canvas_open')
    const w = localStorage.getItem('canvas_width')
    if (open) setCanvasOpen(open === '1')
    if (w) setCanvasWidth(Math.max(320, Math.min(800, parseInt(w, 10) || 420)))
    
    const unsubscribe = CanvasBus.on((cmd) => {
      if (cmd.type === 'open') setCanvasOpen(true)
      if (cmd.type === 'close') setCanvasOpen(false)
      if (cmd.type === 'toggle') setCanvasOpen(o => !o)
      if (cmd.width) setCanvasWidth(Math.max(320, Math.min(800, cmd.width)))
    })
    
    return unsubscribe
  }, [])
  useEffect(() => { localStorage.setItem('canvas_open', canvasOpen ? '1' : '0') }, [canvasOpen])
  useEffect(() => { localStorage.setItem('canvas_width', String(canvasWidth)) }, [canvasWidth])

  return (
    <div className="h-svh w-full overflow-hidden">
      {/* Content row: sidebar | main | canvas */}
      <div className="relative flex overflow-hidden h-full">
        {/* Sidebar (collapsible) */}
        <div className="relative z-10">
          <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {children}
        </div>

        {/* Canvas (retractable, resizable) */}
        <CanvasPanel
          open={canvasOpen}
          width={canvasWidth}
          onResize={setCanvasWidth}
          onRequestClose={() => setCanvasOpen(false)}
        />
      </div>
    </div>
  )
}