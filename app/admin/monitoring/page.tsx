// app/admin/monitoring/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canViewLogs } from "@/utils/permissions";
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
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
        return messageTime.toLocaleDateString();
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
        <div className="max-w-md truncate text-sm" title={content}>
          {content}
        </div>
      ),
    },
    {
      key: 'intent',
      label: 'Intent',
      render: (intent: string) => intent ? (
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          {intent}
        </code>
      ) : '-',
      width: '120px',
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (rating: number, message: ChatMessage) => {
        if (message.message_type === 'user') return '-';
        if (rating === 1) return <span className="text-green-600">👍</span>;
        if (rating === -1) return <span className="text-red-600">👎</span>;
        return <span className="text-gray-400">-</span>;
      },
      width: '60px',
    },
    {
      key: 'processing_time_ms',
      label: 'Response Time',
      render: (time: number) => time ? `${time}ms` : '-',
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

  if (!canViewLogs(user)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-600">You don't have permission to view chat monitoring.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Chat Monitoring</h1>
          <p className="text-neutral-600">
            Real-time monitoring of chat interactions and system performance
          </p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
          <Button onClick={loadData} variant="secondary">
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      {realtimeStats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-blue-600" />
              <h3 className="text-sm font-medium text-neutral-600">Active Chats</h3>
            </div>
            <p className="text-2xl font-bold">{realtimeStats.active_conversations}</p>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-green-600" />
              <h3 className="text-sm font-medium text-neutral-600">Messages Today</h3>
            </div>
            <p className="text-2xl font-bold">{realtimeStats.messages_today}</p>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-purple-600" />
              <h3 className="text-sm font-medium text-neutral-600">Avg Response</h3>
            </div>
            <p className="text-2xl font-bold">{realtimeStats.average_response_time}ms</p>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-600" />
              <h3 className="text-sm font-medium text-neutral-600">Satisfaction</h3>
            </div>
            <p className="text-2xl font-bold">{(realtimeStats.satisfaction_rate * 100).toFixed(1)}%</p>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-orange-600" />
              <h3 className="text-sm font-medium text-neutral-600">Fallback Rate</h3>
            </div>
            <p className="text-2xl font-bold">{(realtimeStats.fallback_rate * 100).toFixed(1)}%</p>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-blue-600" />
              <h3 className="text-sm font-medium text-neutral-600">Top Intent</h3>
            </div>
            <p className="text-lg font-bold truncate">
              {realtimeStats.top_intents_today[0]?.intent || 'N/A'}
            </p>
            <p className="text-xs text-neutral-500">
              {realtimeStats.top_intents_today[0]?.count || 0} uses
            </p>
          </div>
        </div>
      )}

      {/* Recent Messages */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Recent Messages (Last 24 Hours)</h2>
        <DataTable
          data={recentMessages}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable
          searchPlaceholder="Search messages..."
          emptyMessage="No recent messages found"
        />
      </div>

      {/* Conversation Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedMessage(null)} />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Conversation Details</h2>
                <Button 
                  onClick={() => setSelectedMessage(null)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>

              {/* Message Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Message Type:</strong> {selectedMessage.message_type}
                  </div>
                  <div>
                    <strong>Intent:</strong> {selectedMessage.intent || 'N/A'}
                  </div>
                  <div>
                    <strong>User ID:</strong> {selectedMessage.user_id}
                  </div>
                  <div>
                    <strong>Conversation ID:</strong> {selectedMessage.conversation_id}
                  </div>
                </div>
                
                <div>
                  <strong>Message Content:</strong>
                  <div className="mt-2 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    {selectedMessage.content}
                  </div>
                </div>
                
                {selectedMessage.processing_time_ms && (
                  <div>
                    <strong>Processing Time:</strong> {selectedMessage.processing_time_ms}ms
                  </div>
                )}
                
                {selectedMessage.rating && (
                  <div>
                    <strong>User Rating:</strong>
                    <span className={selectedMessage.rating === 1 ? 'text-green-600' : 'text-red-600'}>
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