// services/chats.ts - Updated with block support
import { api } from './api'
import { chatEventBus, getCurrentUserId } from '@/utils/chatEventBus'
import { Block } from '@/components/chat/tools/types'

// Updated types to match backend EXACTLY
export type ChatMessage = {
  message: string
  context?: Record<string, any>
  conversation_id?: string
}

export type ChatResponse = {
  response: string
  intent?: string
  data?: Record<string, any>
  action_taken?: string
  suggestions?: string[]
  conversation_id?: string
  blocks?: Block[]  // Support for structured blocks
}

export type Conversation = {
  id: string
  title: string
  first_message: string
  last_activity: string
  message_count: number
  is_archived: boolean
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  message_type: 'USER' | 'ASSISTANT'  // This is what backend sends
  content: string
  intent?: string
  context_data?: Record<string, any>
  response_data?: Record<string, any>
  processing_time_ms?: number
  created_at: string
}

export type ConversationDetail = {
  id: string
  title: string
  first_message: string
  last_activity: string
  message_count: number
  is_archived: boolean
  created_at: string
  messages: Message[]
}

// UPDATED: Enhanced display message type with blocks
export type DisplayMessage = {
  role: 'user' | 'assistant'
  content: string
  blocks?: Block[]  // Include blocks in display messages
}

// UPDATED: Message transformation utility with blocks support
export const transformMessagesToDisplay = (messages: Message[]): DisplayMessage[] => {
  return messages.map((msg) => {
    const role: 'user' | 'assistant' = msg.message_type === 'USER' ? 'user' : 'assistant'
    
    return {
      role,
      content: msg.content,
      // Extract blocks from response_data if available
      blocks: role === 'assistant' && msg.response_data?.blocks ? msg.response_data.blocks : undefined
    }
  })
}

export type ConversationList = {
  conversations: Conversation[]
  total: number
  page: number
  limit: number
  has_next: boolean
}

export const chatService = {
  // Send a message to the chat API (now with conversation support and event broadcasting)
  async sendMessage(message: string, conversationId?: string, context?: Record<string, any>): Promise<ChatResponse> {
    const userId = getCurrentUserId() ?? undefined
    
    try {
      const { data } = await api.post('/api/chat/message', {
        message,
        conversation_id: conversationId,
        context
      } as ChatMessage)
      
      // Broadcast event for real-time sync
      if (data.conversation_id) {
        if (!conversationId) {
          // New conversation created
          chatEventBus.conversationCreated(data.conversation_id, { title: message.slice(0, 50) }, userId)
        } else {
          // Message added to existing conversation
          chatEventBus.messageSent(data.conversation_id, { message, response: data.response }, userId)
        }
      }
      
      return data
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  },

  // Get contextual suggestions
  async getSuggestions(): Promise<{ suggestions: string[] }> {
    const { data } = await api.get('/api/chat/suggestions')
    return data
  },

  // Get list of conversations with pagination
  async getConversations(page = 1, limit = 20, includeArchived = false): Promise<ConversationList> {
    try {
      const { data } = await api.get('/api/chat/conversations', {
        params: { page, limit, include_archived: includeArchived }
      })
      return data
    } catch (error) {
      console.error('Failed to get conversations:', error)
      throw error
    }
  },

  // UPDATED: Get conversation with all messages and proper transformation including blocks
  async getConversation(conversationId: string): Promise<ConversationDetail & { displayMessages: DisplayMessage[] }> {
    try {
      const { data } = await api.get(`/api/chat/conversations/${conversationId}`)
      
      // Transform the messages to the display format with blocks
      const displayMessages = transformMessagesToDisplay(data.messages || [])
      
      return {
        ...data,
        displayMessages
      }
    } catch (error) {
      console.error('Failed to get conversation:', error)
      throw error
    }
  },

  // Update conversation (rename, archive) with event broadcasting
  async updateConversation(conversationId: string, updates: { title?: string; is_archived?: boolean }): Promise<Conversation> {
    const userId = getCurrentUserId() ?? undefined
    
    try {
      const { data } = await api.patch(`/api/chat/conversations/${conversationId}`, updates)
      
      // Broadcast update event
      chatEventBus.conversationUpdated(conversationId, updates, userId)
      
      return data
    } catch (error) {
      console.error('Failed to update conversation:', error)
      throw error
    }
  },

  // Delete conversation with event broadcasting
  async deleteConversation(conversationId: string): Promise<void> {
    const userId = getCurrentUserId() ?? undefined
    
    try {
      await api.delete(`/api/chat/conversations/${conversationId}`)
      
      // Broadcast delete event
      chatEventBus.conversationDeleted(conversationId, userId)
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      throw error
    }
  },

  // Get recent conversations
  async getRecentConversations(days = 7, limit = 10): Promise<Conversation[]> {
    try {
      const { data } = await api.get('/api/chat/conversations/recent', {
        params: { days, limit }
      })
      return data
    } catch (error) {
      console.error('Failed to get recent conversations:', error)
      throw error
    }
  },

  // Search conversations
  async searchConversations(query: string, limit = 20): Promise<Conversation[]> {
    try {
      const { data } = await api.get('/api/chat/conversations/search', {
        params: { q: query, limit }
      })
      return data
    } catch (error) {
      console.error('Failed to search conversations:', error)
      throw error
    }
  },

  // Force refresh of chat data (useful for manual syncing)
  forceRefresh(): void {
    const userId = getCurrentUserId() ?? undefined
    chatEventBus.forceRefresh(userId)
  },

  // Legacy compatibility methods (updated to use backend)
  async list() {
    const result = await this.getConversations(1, 50) // Get more for legacy compatibility
    return result.conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      is_starred: false, // Backend doesn't have starring yet
      created_at: conv.created_at,
      updated_at: conv.last_activity
    }))
  },

  async get(id: string) {
    const conversation = await this.getConversation(id)
    return {
      chat: {
        id: conversation.id,
        title: conversation.title,
        is_starred: false
      },
      // Use the properly transformed messages with blocks
      messages: conversation.displayMessages
    }
  },

  async create() {
    // Backend creates conversations automatically when first message is sent
    // Return a placeholder that will be replaced when first message is sent
    return { 
      id: 'new', 
      title: 'New Chat', 
      messages: [] 
    }
  },

  async update(id: string, updates: { title?: string; is_starred?: boolean }) {
    // Backend doesn't support starring yet, only title updates
    if (updates.title) {
      await this.updateConversation(id, { title: updates.title })
    }
    return { id, ...updates }
  },

  async delete(id: string) {
    await this.deleteConversation(id)
  },

  // Placeholder methods for starring (not implemented on backend yet)
  async star(id: string) {
    console.warn('Starring not implemented on backend yet')
    return { id, is_starred: true }
  },

  async unstar(id: string) {
    console.warn('Unstarring not implemented on backend yet')
    return { id, is_starred: false }
  },

  async rename(id: string, title: string) {
    return await this.updateConversation(id, { title })
  }
}