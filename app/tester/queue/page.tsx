// app/tester/queue/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessTesterQueue } from "@/utils/permissions";
import { testerService, ProblematicMessage, TesterSuggestionCreate } from "@/services/tester";
import DataTable, { TableColumn, TableAction } from "@/components/ui/DataTable";
import { Eye, MessageSquare, Plus, Filter, RefreshCw, Clock, User, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function TesterQueuePage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ProblematicMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedIssueType, setSelectedIssueType] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(7);
  const [selectedMessage, setSelectedMessage] = useState<ProblematicMessage | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  useEffect(() => {
    loadQueue();
  }, [selectedPriority, selectedIssueType, selectedTimeframe]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const params = {
        days_back: selectedTimeframe,
        limit: 100,
        ...(selectedPriority && { priority: parseInt(selectedPriority) }),
        ...(selectedIssueType && { issue_type: selectedIssueType })
      };
      
      const data = await testerService.getQueue(params);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = (message: ProblematicMessage) => {
    setSelectedMessage(message);
  };

  const handleCreateSuggestion = (message: ProblematicMessage) => {
    setSelectedMessage(message);
    setShowSuggestionModal(true);
  };

  const columns: TableColumn<ProblematicMessage>[] = [
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
      sortable: true,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (priority: number) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            testerService.getPriorityColor(priority)
          }`}
        >
          {testerService.getPriorityLabels()[priority]}
        </span>
      ),
      width: '100px',
      sortable: true,
    },
    {
      key: 'issue_type',
      label: 'Issue Type',
      render: (issueType: string) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            testerService.getIssueTypeColor(issueType)
          }`}
        >
          {testerService.getIssueTypeLabels()[issueType] || issueType}
        </span>
      ),
      width: '140px',
    },
    {
      key: 'user_message',
      label: 'User Message',
      render: (message: string) => (
        <div className="max-w-xs truncate text-sm" title={message}>
          {message}
        </div>
      ),
    },
    {
      key: 'assistant_response',
      label: 'AI Response',
      render: (response: string) => (
        <div className="max-w-xs truncate text-sm" title={response}>
          {response}
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
      render: (rating: number) => {
        if (rating === 1) return <span className="text-green-600">👍</span>;
        if (rating === -1) return <span className="text-red-600">👎</span>;
        return <span className="text-gray-400">-</span>;
      },
      width: '60px',
    },
    {
      key: 'llm_confidence',
      label: 'Confidence',
      render: (confidence: number) => confidence ? (
        <span className={`text-xs ${
          confidence >= 0.8 ? 'text-green-600' :
          confidence >= 0.6 ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {(confidence * 100).toFixed(0)}%
        </span>
      ) : '-',
      width: '80px',
    },
  ];

  const actions: TableAction<ProblematicMessage>[] = [
    {
      label: 'View Details',
      icon: <Eye size={14} />,
      onClick: handleViewMessage,
      variant: 'secondary',
    },
    {
      label: 'Create Suggestion',
      icon: <Plus size={14} />,
      onClick: handleCreateSuggestion,
      variant: 'primary',
    },
  ];

  if (!canAccessTesterQueue(user)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-600">You don't have permission to access the tester queue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Problem Queue</h1>
          <p className="text-neutral-600">
            Messages that need tester attention ({messages.length} items)
          </p>
        </div>
        <Button 
          onClick={loadQueue}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-600" size={16} />
            <h3 className="text-sm font-medium text-neutral-600">High Priority</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {messages.filter(m => m.priority === 1).length}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="text-orange-600" size={16} />
            <h3 className="text-sm font-medium text-neutral-600">Negative Ratings</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {messages.filter(m => m.rating === -1).length}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-yellow-600" size={16} />
            <h3 className="text-sm font-medium text-neutral-600">Fallback Used</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {messages.filter(m => m.fallback_used).length}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="text-purple-600" size={16} />
            <h3 className="text-sm font-medium text-neutral-600">Low Confidence</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {messages.filter(m => m.llm_confidence && m.llm_confidence < 0.6).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Time Range</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(Number(e.target.value))}
              className="input w-32"
            >
              <option value={1}>Last 24h</option>
              <option value={3}>Last 3 days</option>
              <option value={7}>Last week</option>
              <option value={14}>Last 2 weeks</option>
              <option value={30}>Last month</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="input w-32"
            >
              <option value="">All</option>
              <option value="1">High</option>
              <option value="2">Medium</option>
              <option value="3">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Issue Type</label>
            <select
              value={selectedIssueType}
              onChange={(e) => setSelectedIssueType(e.target.value)}
              className="input w-48"
            >
              <option value="">All Issues</option>
              <option value="negative_rating">Negative Rating</option>
              <option value="fallback">Fallback Used</option>
              <option value="low_confidence">Low Confidence</option>
              <option value="unhandled">Unhandled</option>
            </select>
          </div>
          
          <Button 
            onClick={() => {
              setSelectedPriority('');
              setSelectedIssueType('');
              setSelectedTimeframe(7);
            }}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            Clear Filters
          </Button>
        </div>
      </div>

      <DataTable
        data={messages}
        columns={columns}
        actions={actions}
        loading={loading}
        searchable
        searchPlaceholder="Search messages..."
        emptyMessage="No problematic messages found"
      />

      {/* Message Detail Modal */}
      {selectedMessage && !showSuggestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedMessage(null)} />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Message Details</h2>
                <Button 
                  onClick={() => setSelectedMessage(null)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Message Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Issue Type:</strong>
                    <span
                      className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        testerService.getIssueTypeColor(selectedMessage.issue_type)
                      }`}
                    >
                      {testerService.getIssueTypeLabels()[selectedMessage.issue_type]}
                    </span>
                  </div>
                  <div>
                    <strong>Priority:</strong>
                    <span
                      className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        testerService.getPriorityColor(selectedMessage.priority)
                      }`}
                    >
                      {testerService.getPriorityLabels()[selectedMessage.priority]}
                    </span>
                  </div>
                  <div>
                    <strong>Intent:</strong> {selectedMessage.intent || 'None'}
                  </div>
                  <div>
                    <strong>Rating:</strong>
                    {selectedMessage.rating === 1 && <span className="text-green-600 ml-2">👍 Positive</span>}
                    {selectedMessage.rating === -1 && <span className="text-red-600 ml-2">👎 Negative</span>}
                    {!selectedMessage.rating && <span className="text-gray-500 ml-2">No rating</span>}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(selectedMessage.created_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Processing Time:</strong> 
                    {selectedMessage.processing_time_ms ? `${selectedMessage.processing_time_ms}ms` : 'N/A'}
                  </div>
                </div>

                {/* Messages */}
                <div>
                  <strong>User Message:</strong>
                  <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <MessageSquare className="inline mr-2" size={16} />
                    {selectedMessage.user_message}
                  </div>
                </div>

                <div>
                  <strong>AI Response:</strong>
                  <div className="mt-2 p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    {selectedMessage.assistant_response}
                  </div>
                </div>

                {/* Routing Information */}
                {selectedMessage.routing_log_id && (
                  <div>
                    <strong>Routing Information:</strong>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-neutral-600 dark:text-neutral-400">LLM Intent:</span>
                        <span className="ml-2">{selectedMessage.llm_intent || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600 dark:text-neutral-400">LLM Confidence:</span>
                        <span className="ml-2">
                          {selectedMessage.llm_confidence ? 
                            (selectedMessage.llm_confidence * 100).toFixed(1) + '%' : 
                            'N/A'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-600 dark:text-neutral-400">Router Intent:</span>
                        <span className="ml-2">{selectedMessage.router_intent || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600 dark:text-neutral-400">Final Intent:</span>
                        <span className="ml-2">{selectedMessage.final_intent || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-600 dark:text-neutral-400">Fallback Used:</span>
                        <span className={`ml-2 ${selectedMessage.fallback_used ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedMessage.fallback_used ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-600 dark:text-neutral-400">User ID:</span>
                        <span className="ml-2 font-mono text-xs">{selectedMessage.user_id}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Context Information */}
                <div>
                  <strong>Context Information:</strong>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">Conversation ID:</span>
                      <span className="ml-2 font-mono text-xs">{selectedMessage.conversation_id}</span>
                    </div>
                    <div>
                      <span className="text-neutral-600 dark:text-neutral-400">School ID:</span>
                      <span className="ml-2 font-mono text-xs">{selectedMessage.school_id || 'N/A'}</span>
                    </div>
                    {selectedMessage.rated_at && (
                      <div>
                        <span className="text-neutral-600 dark:text-neutral-400">Rated At:</span>
                        <span className="ml-2">{new Date(selectedMessage.rated_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t">
                  <Button 
                    onClick={() => setShowSuggestionModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Create Suggestion
                  </Button>
                  <Button 
                    onClick={() => window.open(`/admin/monitoring?conversation=${selectedMessage.conversation_id}`, '_blank')}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Eye size={16} />
                    View Full Conversation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Modal */}
      {showSuggestionModal && selectedMessage && (
        <SuggestionModal
          message={selectedMessage}
          onClose={() => {
            setShowSuggestionModal(false);
            setSelectedMessage(null);
          }}
          onSubmit={() => {
            setShowSuggestionModal(false);
            setSelectedMessage(null);
            // Optionally refresh the queue
          }}
        />
      )}
    </div>
  );
}

// Suggestion Modal Component
function SuggestionModal({ 
  message, 
  onClose, 
  onSubmit 
}: { 
  message: ProblematicMessage; 
  onClose: () => void; 
  onSubmit: () => void; 
}) {
  const [formData, setFormData] = useState<TesterSuggestionCreate>({
    suggestion_type: 'prompt_template',
    title: '',
    description: '',
    handler: message.intent || '',
    intent: message.intent || '',
    pattern: '',
    template_text: '',
    priority: 'medium',
    tester_note: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Pre-populate fields based on issue type
  useEffect(() => {
    const issueTypeMapping = {
      'negative_rating': {
        suggestion_type: 'prompt_template' as const,
        title: 'Improve response for negative feedback',
        description: 'User gave thumbs down to this response. Consider improving the prompt template to provide more helpful answers.'
      },
      'fallback': {
        suggestion_type: 'regex_pattern' as const,
        title: 'Add pattern to prevent fallback',
        description: 'Fallback response was triggered. Add regex pattern to better classify this type of message.'
      },
      'low_confidence': {
        suggestion_type: 'intent_mapping' as const,
        title: 'Improve intent classification',
        description: 'LLM had low confidence in intent classification. Consider adding training examples or refining patterns.'
      },
      'unhandled': {
        suggestion_type: 'intent_mapping' as const,
        title: 'Handle unhandled intent',
        description: 'No appropriate handler was found for this message. Consider creating new intent mapping or handler.'
      }
    };

    const mapping = issueTypeMapping[message.issue_type as keyof typeof issueTypeMapping];
    if (mapping) {
      setFormData(prev => ({
        ...prev,
        ...mapping
      }));
    }
  }, [message.issue_type]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in title and description');
      return;
    }

    // Validate suggestion-specific fields
    if (formData.suggestion_type === 'regex_pattern' && !formData.pattern) {
      alert('Please provide a regex pattern');
      return;
    }

    if (formData.suggestion_type === 'prompt_template' && !formData.template_text) {
      alert('Please provide template text');
      return;
    }

    try {
      setSubmitting(true);
      await testerService.submitSuggestion({
        message_id: message.message_id,
        routing_log_id: message.routing_log_id,
        suggestion_type: formData.suggestion_type,
        title: formData.title,
        description: formData.description,
        handler: formData.handler,
        intent: formData.intent,
        pattern: formData.pattern || undefined,
        template_text: formData.template_text || undefined,
        priority: formData.priority,
        tester_note: formData.tester_note || undefined
      });
      
      alert('Suggestion submitted successfully!');
      onSubmit();
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
      alert('Failed to submit suggestion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Create Suggestion</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Suggestion Type</label>
              <select
                value={formData.suggestion_type}
                onChange={(e) => setFormData(prev => ({ ...prev, suggestion_type: e.target.value as any }))}
                className="input"
              >
                {testerService.getSuggestionTypes().map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                {testerService.getSuggestionTypes().find(t => t.value === formData.suggestion_type)?.description}
              </p>
            </div>
            
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input"
                placeholder="Brief description of the suggestion"
                required
              />
            </div>
            
            <div>
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input min-h-24"
                placeholder="Detailed explanation of the issue and proposed solution"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Handler</label>
                <input
                  type="text"
                  value={formData.handler}
                  onChange={(e) => setFormData(prev => ({ ...prev, handler: e.target.value }))}
                  className="input"
                  placeholder="e.g., homework_help"
                />
              </div>
              <div>
                <label className="label">Intent</label>
                <input
                  type="text"
                  value={formData.intent}
                  onChange={(e) => setFormData(prev => ({ ...prev, intent: e.target.value }))}
                  className="input"
                  placeholder="e.g., get_assignment"
                />
              </div>
            </div>

            {formData.suggestion_type === 'regex_pattern' && (
              <div>
                <label className="label">Regex Pattern</label>
                <input
                  type="text"
                  value={formData.pattern}
                  onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
                  className="input font-mono"
                  placeholder="(?i)\\b(homework|assignment)\\b.*\\b(help|assist)"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Regular expression pattern for matching user messages. Use (?i) for case-insensitive matching.
                </p>
              </div>
            )}

            {formData.suggestion_type === 'prompt_template' && (
              <div>
                <label className="label">Template Text</label>
                <textarea
                  value={formData.template_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_text: e.target.value }))}
                  className="input min-h-32 font-mono"
                  placeholder="Improved response template with clear, helpful guidance..."
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Provide a better template that would improve the AI's response to this type of query.
                </p>
              </div>
            )}
            
            <div>
              <label className="label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="input"
              >
                {testerService.getPriorityLevels().map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                {testerService.getPriorityLevels().find(l => l.value === formData.priority)?.description}
              </p>
            </div>
            
            <div>
              <label className="label">Tester Note (Optional)</label>
              <textarea
                value={formData.tester_note}
                onChange={(e) => setFormData(prev => ({ ...prev, tester_note: e.target.value }))}
                className="input min-h-20"
                placeholder="Additional context, testing notes, or implementation guidance for admins..."
              />
            </div>

            {/* Preview of related message */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Related Message Context:</h4>
              <div className="text-sm space-y-2">
                <div><strong>User:</strong> {message.user_message}</div>
                <div><strong>AI:</strong> {message.assistant_response}</div>
                <div><strong>Issue:</strong> {testerService.getIssueTypeLabels()[message.issue_type]}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button 
              onClick={handleSubmit}
              disabled={submitting || !formData.title || !formData.description}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Suggestion'}
            </Button>
            <Button 
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}