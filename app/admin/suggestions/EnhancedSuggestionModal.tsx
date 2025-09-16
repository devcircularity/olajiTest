// Enhanced Suggestion Detail Modal Component
import { useState, useEffect } from 'react';
import { Check, X, Plus, Calendar, User, AlertCircle, CheckCircle, Clock, Lightbulb } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  implementation_type: 'pattern' | 'template' | 'code_fix' | 'documentation' | 'other';
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  completion_notes?: string;
}

interface EnhancedSuggestion extends Suggestion {
  action_items?: ActionItem[];
  admin_analysis?: string;
  implementation_notes?: string;
}

interface EnhancedSuggestionModalProps {
  suggestion: EnhancedSuggestion;
  onClose: () => void;
  onReview: (suggestionId: string, reviewData: any) => Promise<void>;
  onCreateActionItem: (suggestionId: string, actionItem: any) => Promise<void>;
  onMarkAddressed: (suggestionId: string, notes: string) => Promise<void>;
}

export function EnhancedSuggestionModal({
  suggestion,
  onClose,
  onReview,
  onCreateActionItem,
  onMarkAddressed
}: EnhancedSuggestionModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'analysis' | 'actions'>('details');
  const [reviewMode, setReviewMode] = useState(false);
  const [adminAnalysis, setAdminAnalysis] = useState(suggestion.admin_analysis || '');
  const [implementationNotes, setImplementationNotes] = useState(suggestion.implementation_notes || '');
  const [actionItems, setActionItems] = useState<ActionItem[]>(suggestion.action_items || []);
  const [newActionItem, setNewActionItem] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    implementation_type: 'other' as const,
    due_date: ''
  });
  const [showAddAction, setShowAddAction] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  const handleEnhancedReview = async (status: 'approved' | 'rejected' | 'needs_analysis') => {
    try {
      await onReview(suggestion.id, {
        status,
        admin_note: `Status: ${status}`,
        admin_analysis: adminAnalysis,
        implementation_notes: implementationNotes,
        create_action_items: actionItems.length > 0,
        action_items: actionItems.filter(item => !item.id) // Only new items
      });
      onClose();
    } catch (error) {
      console.error('Failed to review suggestion:', error);
    }
  };

  const handleAddActionItem = async () => {
    if (!newActionItem.title.trim()) return;

    try {
      await onCreateActionItem(suggestion.id, {
        ...newActionItem,
        suggestion_id: suggestion.id,
        due_date: newActionItem.due_date ? new Date(newActionItem.due_date).toISOString() : undefined
      });
      
      // Reset form
      setNewActionItem({
        title: '',
        description: '',
        priority: 'medium',
        implementation_type: 'other',
        due_date: ''
      });
      setShowAddAction(false);
      
      // Refresh action items (in a real app, you'd refetch)
      // For now, just close the modal and let parent refresh
      onClose();
    } catch (error) {
      console.error('Failed to create action item:', error);
    }
  };

  const handleMarkAddressed = async () => {
    if (completionNotes.trim()) {
      try {
        await onMarkAddressed(suggestion.id, completionNotes);
        onClose();
      } catch (error) {
        console.error('Failed to mark as addressed:', error);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pattern': return 'bg-blue-100 text-blue-800';
      case 'template': return 'bg-green-100 text-green-800';
      case 'code_fix': return 'bg-red-100 text-red-800';
      case 'documentation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold">{suggestion.title}</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Submitted by {suggestion.created_by_name} on {new Date(suggestion.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                  {suggestion.priority}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {suggestion.suggestion_type.replace('_', ' ')}
                </span>
              </div>
            </div>
            <Button onClick={onClose} variant="secondary" className="text-neutral-500">
              <X size={16} />
            </Button>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200 dark:border-neutral-700 mb-6">
            <nav className="flex space-x-8">
              {['details', 'analysis', 'actions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <>
                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    {suggestion.description}
                  </div>
                </div>

                {/* Handler and Intent */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Handler</h3>
                    <code className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                      {suggestion.handler}
                    </code>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Intent</h3>
                    <code className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                      {suggestion.intent}
                    </code>
                  </div>
                </div>

                {/* Proposed Solution */}
                {suggestion.pattern && (
                  <div>
                    <h3 className="font-semibold mb-2">Proposed Pattern</h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                      <code className="text-sm">{suggestion.pattern}</code>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Note: This is a suggested pattern that may need refinement
                    </p>
                  </div>
                )}

                {suggestion.template_text && (
                  <div>
                    <h3 className="font-semibold mb-2">Proposed Template</h3>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                      {suggestion.template_text}
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Note: This is a suggested template that may need refinement
                    </p>
                  </div>
                )}

                {/* Tester's Note */}
                {suggestion.tester_note && (
                  <div>
                    <h3 className="font-semibold mb-2">Tester's Note</h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                      {suggestion.tester_note}
                    </div>
                  </div>
                )}

                {/* Context */}
                {suggestion.original_message && (
                  <div>
                    <h3 className="font-semibold mb-2">Original User Message</h3>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      "{suggestion.original_message}"
                    </div>
                  </div>
                )}

                {suggestion.assistant_response && (
                  <div>
                    <h3 className="font-semibold mb-2">Current AI Response</h3>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                      {suggestion.assistant_response}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="text-yellow-600 mt-0.5" size={16} />
                    <div>
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Admin Analysis Required
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Please analyze this suggestion and determine the appropriate action items needed for implementation.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Admin Analysis</h3>
                  <textarea
                    value={adminAnalysis}
                    onChange={(e) => setAdminAnalysis(e.target.value)}
                    placeholder="Analyze what this suggestion is asking for and what needs to be done to address it..."
                    className="w-full p-4 border border-neutral-200 rounded-lg min-h-[120px]"
                    disabled={!reviewMode && suggestion.status !== 'pending'}
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Implementation Notes</h3>
                  <textarea
                    value={implementationNotes}
                    onChange={(e) => setImplementationNotes(e.target.value)}
                    placeholder="Specific notes on how to implement this suggestion (e.g., 'Create a pattern for class count queries', 'Update error handling template')..."
                    className="w-full p-4 border border-neutral-200 rounded-lg min-h-[100px]"
                    disabled={!reviewMode && suggestion.status !== 'pending'}
                  />
                </div>

                {suggestion.tester_note && (
                  <div>
                    <h3 className="font-semibold mb-2">Tester Note</h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      {suggestion.tester_note}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Action Items</h3>
                  {suggestion.status === 'approved' && (
                    <Button
                      onClick={() => setShowAddAction(true)}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Add Action Item
                    </Button>
                  )}
                </div>

                {/* Action Items List */}
                {actionItems.length > 0 ? (
                  <div className="space-y-3">
                    {actionItems.map((item) => (
                      <div key={item.id} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{item.title}</h4>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.implementation_type)}`}>
                              {item.implementation_type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600 mb-2">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Created {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          {item.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              Due {new Date(item.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full ${
                            item.status === 'completed' ? 'bg-green-100 text-green-800' :
                            item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                    <p>No action items created yet</p>
                    {suggestion.status === 'approved' && (
                      <p className="text-sm">Create action items to track implementation progress</p>
                    )}
                  </div>
                )}

                {/* Add Action Item Form */}
                {showAddAction && (
                  <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                    <h4 className="font-medium mb-4">Create Action Item</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                          type="text"
                          value={newActionItem.title}
                          onChange={(e) => setNewActionItem({...newActionItem, title: e.target.value})}
                          placeholder="e.g., Create pattern for class count queries"
                          className="w-full p-2 border border-neutral-200 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          value={newActionItem.description}
                          onChange={(e) => setNewActionItem({...newActionItem, description: e.target.value})}
                          placeholder="Detailed description of what needs to be done..."
                          className="w-full p-2 border border-neutral-200 rounded"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Priority</label>
                          <select
                            value={newActionItem.priority}
                            onChange={(e) => setNewActionItem({...newActionItem, priority: e.target.value as any})}
                            className="w-full p-2 border border-neutral-200 rounded"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Type</label>
                          <select
                            value={newActionItem.implementation_type}
                            onChange={(e) => setNewActionItem({...newActionItem, implementation_type: e.target.value as any})}
                            className="w-full p-2 border border-neutral-200 rounded"
                          >
                            <option value="pattern">Create Pattern</option>
                            <option value="template">Create Template</option>
                            <option value="code_fix">Code Fix</option>
                            <option value="documentation">Documentation</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Due Date (Optional)</label>
                        <input
                          type="date"
                          value={newActionItem.due_date}
                          onChange={(e) => setNewActionItem({...newActionItem, due_date: e.target.value})}
                          className="w-full p-2 border border-neutral-200 rounded"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddActionItem} className="flex-1">
                          Create Action Item
                        </Button>
                        <Button onClick={() => setShowAddAction(false)} variant="secondary" className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mark as Addressed */}
                {suggestion.status === 'approved' && actionItems.some(item => item.status === 'completed') && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Mark Suggestion as Addressed</h4>
                    <div className="space-y-3">
                      <textarea
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        placeholder="Describe how this suggestion was addressed (e.g., 'Created pattern for class count queries in candidate configuration')..."
                        className="w-full p-3 border border-neutral-200 rounded-lg"
                        rows={3}
                      />
                      <Button
                        onClick={handleMarkAddressed}
                        disabled={!completionNotes.trim()}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Mark as Addressed
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            {suggestion.status === 'pending' && (
              <>
                {!reviewMode ? (
                  <Button onClick={() => setReviewMode(true)} className="flex-1">
                    Start Review
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={() => handleEnhancedReview('approved')}
                      className="flex items-center gap-2"
                    >
                      <Check size={16} />
                      Approve for Action Items
                    </Button>
                    <Button 
                      onClick={() => handleEnhancedReview('needs_analysis')}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <AlertCircle size={16} />
                      Needs More Analysis
                    </Button>
                    <Button 
                      onClick={() => handleEnhancedReview('rejected')}
                      variant="danger"
                      className="flex items-center gap-2"
                    >
                      <X size={16} />
                      Reject
                    </Button>
                  </>
                )}
              </>
            )}

            {suggestion.status === 'approved' && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle size={16} />
                Approved - Create action items to track implementation
              </div>
            )}

            {suggestion.status === 'implemented' && (
              <div className="text-sm text-purple-600 flex items-center gap-2">
                <CheckCircle size={16} />
                Suggestion has been addressed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}