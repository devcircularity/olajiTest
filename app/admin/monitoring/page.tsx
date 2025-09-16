// app/admin/monitoring/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { chatMonitoringService, ChatMessage, RealtimeStats } from "@/services/chatMonitoring";
import DataTable, { TableColumn, TableAction } from "@/components/ui/DataTable";
import { Eye, MessageSquare, TrendingUp, TrendingDown, Clock, Users, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ChatMonitoringPage() {
  const { user } = useAuth();
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    loadData();
    
    if (autoRefresh) {
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load real-time stats and recent messages in parallel
      const [stats, messages] = await Promise.all([
        chatMonitoringService.getRealtimeStats(),
        chatMonitoringService.getRecentMessages({
          limit: 50,
          hours_back: 24
        })
      ]);
      
      setRealtimeStats(stats);
      setRecentMessages(messages);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewConversation = async (message: ChatMessage) => {
    try {
      const conversation = await chatMonitoringService.getConversationDetails(message.conversation_id);
      // Could open a modal or navigate to detailed view
      console.log('Conversation details:', conversation);
      setSelectedMessage(message);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const columns: TableColumn<ChatMessage>[] = [
    {
      key: 'created_at',
      label: 'Time',
      render: (date: string) => {
        const messageTime = new Date(date);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
        
        if (diffMinutes < 1) return <span className="text-xs sm:text-sm">Just now</span>;
        if (diffMinutes < 60) return <span className="text-xs sm:text-sm">{diffMinutes}m ago</span>;
        if (diffMinutes < 1440) return <span className="text-xs sm:text-sm">{Math.floor(diffMinutes / 60)}h ago</span>;
        return <span className="text-xs sm:text-sm">{messageTime.toLocaleDateString()}</span>;
      },
      width: '100px',
    },
    {
      key: 'message_type',
      label: 'Type',
      render: (type: string) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            type === 'user' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
            'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
          }`}
        >
          {type === 'user' ? 'User' : 'Assistant'}
        </span>
      ),
      width: '80px',
    },
    {
      key: 'content',
      label: 'Message',
      render: (content: string) => (
        <div className="max-w-xs sm:max-w-md truncate text-xs sm:text-sm break-words" title={content}>
          {content}
        </div>
      ),
    },
    {
      key: 'intent',
      label: 'Intent',
      render: (intent: string) => intent ? (
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all">
          {intent}
        </code>
      ) : '-',
      width: '120px',
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (rating: number, message: ChatMessage) => {
        if (message.message_type === 'user') return <span className="text-xs sm:text-sm">-</span>;
        if (rating === 1) return <span className="text-green-600">👍</span>;
        if (rating === -1) return <span className="text-red-600">👎</span>;
        return <span className="text-gray-400">-</span>;
      },
      width: '60px',
    },
    {
      key: 'processing_time_ms',
      label: 'Response Time',
      render: (time: number) => (
        <span className="text-xs sm:text-sm">
          {time ? `${time}ms` : '-'}
        </span>
      ),
      width: '100px',
    },
  ];

  const actions: TableAction<ChatMessage>[] = [
    {
      label: 'View Conversation',
      icon: <Eye size={14} />,
      onClick: handleViewConversation,
      variant: 'secondary',
    },
  ];

  // Check permissions directly instead of using canViewLogs to avoid type issues
  const hasMonitoringPermission = user?.permissions?.is_admin || 
                                  user?.permissions?.is_super_admin;

  if (!hasMonitoringPermission) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-600">You don't have permission to view chat monitoring.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Chat Monitoring</h1>
          <p className="text-sm sm:text-base text-neutral-600">
            Real-time monitoring of chat interactions and system performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs sm:text-sm">Auto-refresh</span>
          </label>
          <Button 
            onClick={loadData} 
            className="btn-secondary text-sm"
          >
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Real-time Stats - Mobile responsive grid */}
      {realtimeStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-blue-600 flex-shrink-0" />
              <h3 className="text-xs sm:text-sm font-medium text-neutral-600 truncate">Active Chats</h3>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{realtimeStats.active_conversations}</p>
          </div>
          
          <div className="card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-green-600 flex-shrink-0" />
              <h3 className="text-xs sm:text-sm font-medium text-neutral-600 truncate">Messages Today</h3>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{realtimeStats.messages_today}</p>
          </div>
          
          <div className="card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-purple-600 flex-shrink-0" />
              <h3 className="text-xs sm:text-sm font-medium text-neutral-600 truncate">Avg Response</h3>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{realtimeStats.average_response_time}ms</p>
          </div>
          
          <div className="card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-green-600 flex-shrink-0" />
              <h3 className="text-xs sm:text-sm font-medium text-neutral-600 truncate">Satisfaction</h3>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{(realtimeStats.satisfaction_rate * 100).toFixed(1)}%</p>
          </div>
          
          <div className="card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-orange-600 flex-shrink-0" />
              <h3 className="text-xs sm:text-sm font-medium text-neutral-600 truncate">Fallback Rate</h3>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{(realtimeStats.fallback_rate * 100).toFixed(1)}%</p>
          </div>
          
          <div className="card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-blue-600 flex-shrink-0" />
              <h3 className="text-xs sm:text-sm font-medium text-neutral-600 truncate">Top Intent</h3>
            </div>
            <p className="text-sm sm:text-lg font-bold truncate">
              {realtimeStats.top_intents_today[0]?.intent || 'N/A'}
            </p>
            <p className="text-xs text-neutral-500">
              {realtimeStats.top_intents_today[0]?.count || 0} uses
            </p>
          </div>
        </div>
      )}

      {/* Recent Messages */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Messages (Last 24 Hours)</h2>
        <div className="overflow-x-auto">
          <DataTable
            data={recentMessages}
            columns={columns}
            actions={actions}
            loading={loading}
            searchable
            searchPlaceholder="Search messages..."
            emptyMessage="No recent messages found"
            className="text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Conversation Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedMessage(null)} />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 gap-3">
                <h2 className="text-lg sm:text-xl font-bold">Conversation Details</h2>
                <Button 
                  onClick={() => setSelectedMessage(null)}
                  className="btn-secondary text-sm"
                >
                  Close
                </Button>
              </div>

              {/* Message Details - Mobile responsive */}
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <strong className="text-sm">Message Type:</strong> 
                    <span className="ml-2 text-sm">{selectedMessage.message_type}</span>
                  </div>
                  <div>
                    <strong className="text-sm">Intent:</strong> 
                    <span className="ml-2 text-sm">{selectedMessage.intent || 'N/A'}</span>
                  </div>
                  <div>
                    <strong className="text-sm">User ID:</strong> 
                    <span className="ml-2 text-sm font-mono break-all">{selectedMessage.user_id}</span>
                  </div>
                  <div>
                    <strong className="text-sm">Conversation ID:</strong> 
                    <span className="ml-2 text-sm font-mono break-all">{selectedMessage.conversation_id}</span>
                  </div>
                </div>
                
                <div>
                  <strong className="text-sm">Message Content:</strong>
                  <div className="mt-2 p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {selectedMessage.content}
                    </p>
                  </div>
                </div>
                
                {selectedMessage.processing_time_ms && (
                  <div>
                    <strong className="text-sm">Processing Time:</strong> 
                    <span className="ml-2 text-sm">{selectedMessage.processing_time_ms}ms</span>
                  </div>
                )}
                
                {selectedMessage.rating && (
                  <div>
                    <strong className="text-sm">User Rating:</strong>
                    <span className={`ml-2 text-sm ${selectedMessage.rating === 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedMessage.rating === 1 ? ' 👍 Positive' : ' 👎 Negative'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}