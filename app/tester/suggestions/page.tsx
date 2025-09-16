// app/tester/suggestions/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessTesterQueue } from "@/utils/permissions";
import { testerService, TesterSuggestion } from "@/services/tester";
import DataTable, { TableColumn, TableAction } from "@/components/ui/DataTable";
import { Eye, Plus, Filter, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Zap } from "lucide-react";
import Button from "@/components/ui/Button";

interface SuggestionWithDetails extends TesterSuggestion {
  description?: string;
  pattern?: string;
  template_text?: string;
  tester_note?: string;
  original_message?: string;
  assistant_response?: string;
}

export default function TesterSuggestionsPage() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<TesterSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionWithDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [selectedStatus, selectedType]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 50,
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedType && { suggestion_type: selectedType })
      };
      
      const data = await testerService.getMySuggestions(params);
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSuggestion = async (suggestion: TesterSuggestion) => {
    try {
      setLoadingDetails(true);
      setSelectedSuggestion(suggestion as SuggestionWithDetails);
      
      // In a real implementation, you would fetch additional details here
      // For now, we'll simulate the extended data
      const extendedSuggestion: SuggestionWithDetails = {
        ...suggestion,
        description: "Sample description for this suggestion...",
        pattern: suggestion.suggestion_type === 'regex_pattern' ? "(?i)\\b(homework|assignment)\\b.*\\b(help|assist)" : undefined,
        template_text: suggestion.suggestion_type === 'prompt_template' ? "Improved template text..." : undefined,
        tester_note: "Additional context from tester...",
        original_message: "Sample user message that triggered this suggestion",
        assistant_response: "Sample AI response that had issues"
      };
      
      setSelectedSuggestion(extendedSuggestion);
    } catch (error) {
      console.error('Failed to load suggestion details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="text-gray-500" size={16} />;
      case 'approved': return <CheckCircle className="text-green-600" size={16} />;
      case 'rejected': return <XCircle className="text-red-600" size={16} />;
      case 'implemented': return <Zap className="text-purple-600" size={16} />;
      default: return <AlertTriangle className="text-yellow-600" size={16} />;
    }
  };

  const columns: TableColumn<TesterSuggestion>[] = [
    {
      key: 'created_at',
      label: 'Submitted',
      render: (date: string) => {
        const submitDate = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - submitDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return submitDate.toLocaleDateString();
      },
      width: '100px',
      sortable: true,
    },
    {
      key: 'title',
      label: 'Title',
      render: (title: string) => (
        <div className="max-w-sm">
          <div className="font-medium truncate" title={title}>
            {title}
          </div>
        </div>
      ),
    },
    {
      key: 'suggestion_type',
      label: 'Type',
      render: (type: string) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            type === 'regex_pattern' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
            type === 'prompt_template' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
            type === 'intent_mapping' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200' :
            'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
          }`}
        >
          {type.replace('_', ' ')}
        </span>
      ),
      width: '140px',
    },
    {
      key: 'handler',
      label: 'Handler',
      render: (handler: string) => (
        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          {handler}
        </code>
      ),
      width: '120px',
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (priority: string) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
            priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' :
            priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
            'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200'
          }`}
        >
          {priority}
        </span>
      ),
      width: '100px',
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: string, suggestion: TesterSuggestion) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              testerService.getSuggestionStatusColor(status)
            }`}
          >
            {status}
          </span>
        </div>
      ),
      width: '120px',
    },
    {
      key: 'reviewed_at',
      label: 'Reviewed',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : (
        <span className="text-gray-400 text-sm">Pending</span>
      ),
      width: '100px',
    },
  ];

  const actions: TableAction<TesterSuggestion>[] = [
    {
      label: 'View Details',
      icon: <Eye size={14} />,
      onClick: handleViewSuggestion,
      variant: 'secondary',
    },
  ];

  const getStatusCounts = () => {
    return {
      total: suggestions.length,
      pending: suggestions.filter(s => s.status === 'pending').length,
      approved: suggestions.filter(s => s.status === 'approved').length,
      rejected: suggestions.filter(s => s.status === 'rejected').length,
      implemented: suggestions.filter(s => s.status === 'implemented').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (!canAccessTesterQueue(user)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-600">You don't have permission to access tester suggestions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">My Suggestions</h1>
          <p className="text-neutral-600">
            Track your submitted suggestions and their review status ({statusCounts.total} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadSuggestions}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Button 
            onClick={() => window.location.href = '/tester/queue'}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Create New
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-blue-600" size={16} />
            <h3 className="text-sm font-medium text-neutral-600">Total</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{statusCounts.total}</p>
          <p className="text-xs text-neutral-500">All suggestions</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-gray-600" size={16} />
            <h3 className="text-sm font-medium text-neutral-600">Pending</h3>
          </div>
          <p className="text-2xl font-bold text-gray-600">{statusCounts.pending}</p>
          <p className="text-xs text-neutral-500">Awaiting review</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-600" size={16} />
            <h3 className="text-sm font-medium text-neutral-600">Approved</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
          <p className="text-xs text-neutral-500">Ready for implementation</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="text-red-600" size={16} />
            <h3 className="text-sm font-medium text-neutral-600">Rejected</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
          <p className="text-xs text-neutral-500">Not approved</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-purple-600" size={16} />
            <h3 className="text-sm font-medium text-neutral-600">Implemented</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">{statusCounts.implemented}</p>
          <p className="text-xs text-neutral-500">Live in system</p>
        </div>
      </div>

      {/* Success Rate Indicator */}
      {statusCounts.total > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Success Rate</h3>
              <p className="text-sm text-neutral-600">
                Percentage of suggestions that were approved or implemented
              </p>
            </div>
            <div className="text-right">
              {(() => {
                const successRate = ((statusCounts.approved + statusCounts.implemented) / statusCounts.total) * 100;
                const color = successRate >= 70 ? 'text-green-600' : successRate >= 50 ? 'text-yellow-600' : 'text-red-600';
                return (
                  <div className={`text-2xl font-bold ${color}`}>
                    {successRate.toFixed(0)}%
                  </div>
                );
              })()}
              <div className="text-xs text-neutral-500">
                {statusCounts.approved + statusCounts.implemented} of {statusCounts.total}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input w-40"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="implemented">Implemented</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input w-48"
            >
              <option value="">All Types</option>
              <option value="regex_pattern">Regex Pattern</option>
              <option value="prompt_template">Prompt Template</option>
              <option value="intent_mapping">Intent Mapping</option>
              <option value="handler_improvement">Handler Improvement</option>
            </select>
          </div>
          
          <Button 
            onClick={() => {
              setSelectedStatus('');
              setSelectedType('');
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
        data={suggestions}
        columns={columns}
        actions={actions}
        loading={loading}
        searchable
        searchPlaceholder="Search suggestions..."
        emptyMessage="No suggestions found"
      />

      {/* Suggestion Detail Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedSuggestion(null)} />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedSuggestion.title}</h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    Submitted on {new Date(selectedSuggestion.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button 
                  onClick={() => setSelectedSuggestion(null)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Type</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {selectedSuggestion.suggestion_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Priority</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedSuggestion.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        selectedSuggestion.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        selectedSuggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedSuggestion.priority}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Status</h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedSuggestion.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          testerService.getSuggestionStatusColor(selectedSuggestion.status)
                        }`}>
                          {selectedSuggestion.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Handler</h3>
                      <code className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                        {selectedSuggestion.handler}
                      </code>
                    </div>
                  </div>

                  {/* Intent */}
                  <div>
                    <h3 className="font-semibold mb-2">Intent</h3>
                    <code className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                      {selectedSuggestion.intent}
                    </code>
                  </div>

                  {/* Description */}
                  {selectedSuggestion.description && (
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        {selectedSuggestion.description}
                      </div>
                    </div>
                  )}

                  {/* Pattern or Template */}
                  {selectedSuggestion.pattern && (
                    <div>
                      <h3 className="font-semibold mb-2">Proposed Pattern</h3>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <code className="text-sm font-mono">{selectedSuggestion.pattern}</code>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                          Regular expression pattern for message classification
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedSuggestion.template_text && (
                    <div>
                      <h3 className="font-semibold mb-2">Proposed Template</h3>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="whitespace-pre-wrap text-sm">{selectedSuggestion.template_text}</div>
                        <p className="text-xs text-green-600 dark:text-green-300 mt-2">
                          Improved response template
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Original Context */}
                  {selectedSuggestion.original_message && (
                    <div>
                      <h3 className="font-semibold mb-2">Original Message Context</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">User Message:</p>
                          <p className="text-sm">{selectedSuggestion.original_message}</p>
                        </div>
                        {selectedSuggestion.assistant_response && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">AI Response (Had Issues):</p>
                            <p className="text-sm">{selectedSuggestion.assistant_response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tester Note */}
                  {selectedSuggestion.tester_note && (
                    <div>
                      <h3 className="font-semibold mb-2">Tester Note</h3>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        {selectedSuggestion.tester_note}
                      </div>
                    </div>
                  )}

                  {/* Review Information */}
                  {selectedSuggestion.reviewed_at && (
                    <div>
                      <h3 className="font-semibold mb-2">Review Information</h3>
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <div className="text-sm mb-2">
                          <strong>Reviewed on:</strong> {new Date(selectedSuggestion.reviewed_at).toLocaleDateString()}
                        </div>
                        {selectedSuggestion.admin_note && (
                          <div>
                            <strong>Admin Note:</strong>
                            <div className="mt-1 text-sm">{selectedSuggestion.admin_note}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status-specific guidance */}
                  {selectedSuggestion.status === 'pending' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Clock className="text-blue-600 mt-0.5" size={16} />
                        <div>
                          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Pending Review</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Your suggestion is awaiting admin review. Admins typically review suggestions within 2-3 business days. 
                            You'll be notified when it's been reviewed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSuggestion.status === 'approved' && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="text-green-600 mt-0.5" size={16} />
                        <div>
                          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Approved</h4>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Great work! Your suggestion has been approved and is ready for implementation. 
                            It will be included in the next configuration update.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSuggestion.status === 'implemented' && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-start gap-2">
                        <Zap className="text-purple-600 mt-0.5" size={16} />
                        <div>
                          <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Implemented</h4>
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            Excellent! Your suggestion has been implemented and is now active in the system. 
                            The AI should now handle similar cases better thanks to your contribution.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSuggestion.status === 'rejected' && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-2">
                        <XCircle className="text-red-600 mt-0.5" size={16} />
                        <div>
                          <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Not Approved</h4>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            This suggestion was not approved. Please check the admin note above for specific feedback. 
                            You can use this feedback to improve future suggestions.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 pt-4 border-t">
                    <Button 
                      onClick={() => window.location.href = '/tester/queue'}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Create New Suggestion
                    </Button>
                    {selectedSuggestion.status === 'rejected' && (
                      <Button 
                        onClick={() => {
                          // In a real implementation, you might want to allow creating a revised suggestion
                          alert('Feature coming soon: Create revised suggestion based on feedback');
                        }}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw size={16} />
                        Create Revised Version
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}