// app/admin/monitoring/page.tsx - Simplified Table-Only Version
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { chatMonitoringService, ChatMessage } from "@/services/chatMonitoring";
import DataTable, { TableColumn, TableAction } from "@/components/ui/DataTable";
import { Eye, X, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

// Extended interface to include school_name and conversation details
interface ExtendedChatMessage extends ChatMessage {
  school_name?: string;
  userFullName?: string;
  conversationTitle?: string;
}

export default function ChatMonitoringPage() {
  const { user } = useAuth();
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [timeRange, setTimeRange] = useState<number>(720); // 1 month default

  useEffect(() => {
    loadData();
  }, [timeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const messages = await chatMonitoringService.getRecentMessages({
        limit: 50,
        hours_back: timeRange
      });
      
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
      console.log('Conversation details:', conversation);
      setSelectedMessage(message);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const getTimeRangeLabel = (hours: number) => {
    if (hours <= 24) return 'Last 24 hours';
    if (hours <= 168) return 'Last week';
    if (hours <= 720) return 'Last month';
    if (hours <= 2160) return 'Last 3 months';
    return 'Last year';
  };

  const columns: TableColumn<ExtendedChatMessage>[] = [
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
        if (diffMinutes < 10080) return <span className="text-xs sm:text-sm">{Math.floor(diffMinutes / 1440)}d ago</span>;
        return <span className="text-xs sm:text-sm">{messageTime.toLocaleDateString()}</span>;
      },
      width: '100px',
      sortable: true,
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
        if (rating === 1) return <span className="text-green-600 text-sm">👍</span>;
        if (rating === -1) return <span className="text-red-600 text-sm">👎</span>;
        return <span className="text-gray-400 text-xs">-</span>;
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
    {
      key: 'school_name',
      label: 'School',
      render: (schoolName: string, message: ChatMessage) => {
        if (schoolName) {
          return (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              {schoolName}
            </span>
          );
        }
        if (message.school_id) {
          return (
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
              {message.school_id.substring(0, 8)}...
            </code>
          );
        }
        return <span className="text-xs text-gray-400">No School</span>;
      },
      width: '120px',
    },
  ];

  const actions: TableAction<ExtendedChatMessage>[] = [
    {
      label: 'View Conversation',
      icon: <Eye size={14} />,
      onClick: handleViewConversation,
      variant: 'secondary',
    },
  ];

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
      {/* Header with Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Chat Messages</h1>
          <p className="text-sm sm:text-base text-neutral-600">
            Detailed view of all chat interactions ({getTimeRangeLabel(timeRange)})
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="input text-sm"
          >
            <option value={24}>Last 24 hours</option>
            <option value={168}>Last week</option>
            <option value={720}>Last month</option>
            <option value={2160}>Last 3 months</option>
            <option value={8760}>Last year</option>
          </select>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs sm:text-sm">Auto-refresh</span>
          </label>
          
          <Button onClick={loadData} className="btn-secondary text-sm flex items-center gap-2">
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Messages Table - Increased height */}
      <div className="h-[800px]">
        <DataTable
          data={recentMessages}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable
          searchPlaceholder="Search messages..."
          emptyMessage="No messages found for the selected time period"
          className="text-xs sm:text-sm"
        />
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
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors flex-shrink-0"
                >
                  <X size={16} />
                </Button>
              </div>

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
                    <strong className="text-sm">School:</strong> 
                    <span className="ml-2 text-sm">
                      {selectedMessage.school_name || selectedMessage.school_id || 'No School'}
                    </span>
                  </div>
                  <div>
                    <strong className="text-sm">User:</strong> 
                    <span className="ml-2 text-sm">
                      {selectedMessage.userFullName || selectedMessage.user_id}
                    </span>
                  </div>
                  <div>
                    <strong className="text-sm">Created:</strong> 
                    <span className="ml-2 text-sm">{new Date(selectedMessage.created_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <strong className="text-sm">Conversation:</strong> 
                    <span className="ml-2 text-sm">
                      {selectedMessage.conversationTitle || `${selectedMessage.conversation_id.substring(0, 8)}...`}
                    </span>
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