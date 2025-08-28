// components/chat/ChatMessages.tsx - Fixed with initial scroll to bottom only

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import ChatBlockRenderer from './tools/ChatBlockRenderer';
import { Block, Action } from './tools/types';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  blocks?: Block[];
  intent?: string;
  response_data?: {
    blocks?: Block[];
    [key: string]: any;
  };
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onAction?: (action: Action) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  isLoading = false, 
  onAction 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom only on initial load of messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages.length === 0 ? null : messages.length]); // Only trigger when going from 0 to some messages

  const handleBlockAction = async (action: Action) => {
    console.log('Block action triggered:', action);
    
    if (onAction) {
      await onAction(action);
      return;
    }

    // Default action handling if no onAction prop provided
    switch (action.type) {
      case 'query':
        // This would typically send a new message to the chat
        console.log('Query action:', action.payload);
        break;
        
      case 'route':
        // Navigate to a different page
        if (action.target) {
          window.location.href = action.target;
        }
        break;
        
      case 'download':
        // Handle downloads
        if (action.endpoint) {
          const link = document.createElement('a');
          link.href = action.endpoint;
          if (action.payload?.filename) {
            link.download = action.payload.filename;
          }
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        break;
        
      case 'mutation':
        // Handle API mutations
        if (action.endpoint) {
          try {
            const response = await fetch(action.endpoint, {
              method: action.method || 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'X-School-ID': localStorage.getItem('schoolId') || ''
              },
              body: action.payload ? JSON.stringify(action.payload) : undefined
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            console.log('Mutation successful');
          } catch (error) {
            console.error('Mutation failed:', error);
          }
        }
        break;
        
      default:
        console.warn('Unhandled action type:', action.type);
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) {
      return new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }

    try {
      const date = new Date(timestamp);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isLastMessage = index === messages.length - 1;

    // Determine which blocks to render
    let blocksToRender: Block[] = [];
    
    // For new messages, use blocks field
    if (message.blocks && message.blocks.length > 0) {
      blocksToRender = message.blocks;
    }
    // For historical messages, use response_data.blocks
    else if (message.response_data?.blocks && message.response_data.blocks.length > 0) {
      blocksToRender = message.response_data.blocks;
    }

    // Generate a unique key for each message
    const messageKey = message.id || `${message.role}-${index}`;

    return (
      <div key={messageKey} className={`mb-6 ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`max-w-4xl ${isUser ? 'w-fit max-w-2xl' : 'w-full'}`}>
          
          {isUser ? (
            // User message - brand colored bubble
            <div className="inline-block rounded-2xl px-4 py-2 text-white" style={{ backgroundColor: 'var(--color-brand)' }}>
              <div className="text-sm leading-relaxed">
                {message.content}
              </div>
            </div>
          ) : (
            // Assistant message - no bubble, full width for blocks
            <div className="space-y-4">
              
              {/* Text content */}
              {message.content && (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      // Customize markdown rendering
                      h1: ({children}) => <h1 className="text-xl font-semibold mb-3">{children}</h1>,
                      h2: ({children}) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                      h3: ({children}) => <h3 className="text-base font-semibold mb-2">{children}</h3>,
                      p: ({children}) => <p className="mb-2 leading-relaxed">{children}</p>,
                      strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                      em: ({children}) => <em className="italic">{children}</em>,
                      code: ({children}) => (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      ),
                      ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                      li: ({children}) => <li className="leading-relaxed">{children}</li>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              
              {/* Rich blocks */}
              {blocksToRender.length > 0 && (
                <div className="space-y-4">
                  <ChatBlockRenderer 
                    blocks={blocksToRender} 
                    onAction={handleBlockAction}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Intent only (no timestamp) */}
          {message.intent && !isUser && (
            <div className="text-xs text-gray-400 mt-1 text-left">
              • {message.intent}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="max-w-4xl mx-auto">
        {messages.map(renderMessage)}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="mb-6">
            <div className="max-w-4xl w-full">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;