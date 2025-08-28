// app/(workspace)/chat/[chatId]/page.tsx - Updated with block support
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { chatService, type ConversationDetail, type DisplayMessage } from '@/services/chats'
import ChatMessages from '@/components/chat/ChatMessages'
import ChatInput from '@/components/chat/ChatInput'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { Action } from '@/components/chat/tools/types'

export default function ChatDetail() {
  const { isAuthenticated } = useAuthGuard()
  const params = useParams<{ chatId: string }>()
  const router = useRouter()
  const chatId = params.chatId
  
  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if chatId is a valid UUID
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Handle actions from blocks
  const handleBlockAction = useCallback(async (action: Action) => {
    switch (action.type) {
      case 'query':
        // Re-query the chat with the action payload
        if (action.payload && 'message' in action.payload) {
          await onSend(action.payload.message)
        }
        break
      
      case 'route':
        // Navigate to a different page
        if (action.target) {
          // Parse route target and navigate
          const [section, view] = action.target.split(':')
          router.push(`/${section}${view ? `/${view}` : ''}`)
        }
        break
      
      case 'download':
        // Trigger file download
        if (action.endpoint) {
          window.open(action.endpoint, '_blank')
        }
        break
      
      case 'mutation':
        // Handle API mutations (for form submissions, etc.)
        if (action.endpoint) {
          // In a real app, you'd make the API call here
          console.log('Mutation action:', action)
          // You could also show a toast notification, etc.
        }
        break
      
      case 'confirm':
        // Handle confirmation dialogs - this would typically show a modal
        console.log('Confirm action:', action)
        break
      
      default:
        console.warn('Unhandled action type:', action)
    }
  }, [router])

  // Load conversation data from backend
  const loadConversation = useCallback(async () => {
    if (!chatId || chatId === 'new') {
      // New conversation - start empty
      setLoading(false)
      setConversation(null)
      setMessages([])
      
      // Check for initial message from landing page
      const initialMessage = sessionStorage.getItem(`chat-new-initial`) || sessionStorage.getItem(`chat-${chatId}-initial`)
      if (initialMessage) {
        sessionStorage.removeItem(`chat-new-initial`)
        sessionStorage.removeItem(`chat-${chatId}-initial`)
        // Send the initial message automatically
        await onSend(initialMessage)
      }
      return
    }

    // If chatId is not a valid UUID, treat as new conversation
    if (!isValidUUID(chatId)) {
      setLoading(false)
      setConversation(null)
      setMessages([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const conversationData = await chatService.getConversation(chatId)
      
      setConversation(conversationData)
      
      // Use the pre-transformed display messages from the service (now includes blocks)
      setMessages(conversationData.displayMessages)
      
    } catch (err: any) {
      console.error('Failed to load conversation:', err)
      
      if (err?.response?.status === 404) {
        // Conversation not found - redirect to new chat
        router.replace('/chat/new')
        return
      } else if (err?.response?.status === 401 || err?.response?.status === 403) {
        const currentPath = window.location.pathname + window.location.search
        router.replace(`/login?next=${encodeURIComponent(currentPath)}`)
        return
      } else {
        setError('Failed to load conversation')
      }
    } finally {
      setLoading(false)
    }
  }, [chatId, router])

  useEffect(() => {
    if (isAuthenticated) {
      loadConversation()
    }
  }, [isAuthenticated, loadConversation])

  // Broadcast conversation updates to other tabs/windows
  const broadcastConversationUpdate = useCallback((conversationId: string) => {
    // Use localStorage to communicate with other tabs
    const updateEvent = {
      type: 'conversation_updated',
      conversationId,
      timestamp: Date.now()
    }
    localStorage.setItem('chat_update_event', JSON.stringify(updateEvent))
    
    // Remove after a short delay to trigger storage event in other tabs
    setTimeout(() => {
      localStorage.removeItem('chat_update_event')
    }, 100)
  }, [])

  const onSend = async (text: string) => {
    if (busy) return
    setBusy(true)
    
    // Add user message optimistically with explicit role (no blocks for user messages)
    const userMessage: DisplayMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])

    try {
      // Send to backend with conversation ID if we have one and it's valid
      const currentConversationId = conversation?.id || (chatId !== 'new' && isValidUUID(chatId) ? chatId : undefined)
      
      const response = await chatService.sendMessage(text, currentConversationId)
      
      // Add assistant response with explicit role and blocks
      const assistantMessage: DisplayMessage = {
        role: 'assistant',
        content: response.response,
        blocks: response.blocks  // Include structured blocks from backend
      }
      setMessages(prev => [...prev, assistantMessage])

      // If this was a new conversation and we got a conversation_id back, redirect
      if (!conversation && response.conversation_id && (chatId === 'new' || !isValidUUID(chatId))) {
        
        // Broadcast the update before redirecting
        broadcastConversationUpdate(response.conversation_id)
        
        router.replace(`/chat/${response.conversation_id}`)
        return
      }

      // Update conversation if we got new data
      if (response.conversation_id && !conversation) {
        try {
          const newConversation = await chatService.getConversation(response.conversation_id)
          setConversation(newConversation)
          
          // Broadcast the update
          broadcastConversationUpdate(response.conversation_id)
        } catch (err) {
          console.error('Failed to load new conversation:', err)
        }
      } else if (conversation?.id) {
        // Broadcast update for existing conversation
        broadcastConversationUpdate(conversation.id)
      }

    } catch (error: any) {
      console.error('Failed to send message:', error)
      
      // If error is 401/403, redirect to login
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        const currentPath = window.location.pathname + window.location.search
        router.replace(`/login?next=${encodeURIComponent(currentPath)}`)
        return
      }

      // Remove the optimistic user message on error
      setMessages(prev => prev.slice(0, -1))
      
      // Add error message
      const errorMessage: DisplayMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setBusy(false)
    }
  }

  // Listen for storage events from other tabs to refresh when conversations are updated
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chat_update_event' && e.newValue) {
        try {
          const updateEvent = JSON.parse(e.newValue)
          if (updateEvent.type === 'conversation_updated') {
            // If this is our current conversation, reload it
            if (updateEvent.conversationId === chatId) {
              loadConversation()
            }
          }
        } catch (error) {
          console.error('Error parsing storage event:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [chatId, loadConversation])

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Loading conversation...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <div className="space-x-2">
            <button
              onClick={() => loadConversation()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/chat/new')}
              className="px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700"
            >
              New Chat
            </button>
            </div>
        </div>
      </div>
    )
  }

  const title = conversation?.title || 'New Chat'

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Ask me anything about your school management
            </p>
          </div>
          <div className="flex items-center gap-4">
          </div>
        </div>
      </div>

      {/* Messages area - scrollable */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-10">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Welcome to School Chat
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  I can help you manage students, classes, fees, and more. Try asking:
                </p>
                <div className="space-y-2 text-sm">
                  <button
                    onClick={() => onSend("Show me school overview")}
                    disabled={busy}
                    className="block w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    "Show me school overview"
                  </button>
                  <button
                    onClick={() => onSend("List all students")}
                    disabled={busy}
                    className="block w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    "List all students"
                  </button>
                  <button
                    onClick={() => onSend("Create class P4 East")}
                    disabled={busy}
                    className="block w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    "Create class P4 East"
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* UPDATED: Pass messages with block support and action handler */}
              <ChatMessages messages={messages} onAction={handleBlockAction} />
              {/* Add some bottom padding so last message isn't hidden behind input */}
              <div className="h-32" />
            </>
          )}
        </div>
      </div>

      {/* Input - fixed at bottom */}
      <div className="flex-none">
        <ChatInput onSend={onSend} busy={busy} />
      </div>
    </div>
  )
}