// components/admin/configuration/ImplementationTab.tsx
import { useState, useEffect } from "react";
import { suggestionsService, Suggestion, ActionItem } from "@/services/suggestions";
import { CheckCircle, Clock, User, AlertTriangle, Wrench, Eye } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { SuggestionReviewModal } from "@/components/admin/suggestions/SuggestionReviewModal";

interface EnhancedSuggestion extends Suggestion {
  action_items?: ActionItem[];
  admin_analysis?: string;
  implementation_notes?: string;
}

export default function ImplementationTab() {
  const [approvedSuggestions, setApprovedSuggestions] = useState<EnhancedSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<EnhancedSuggestion | null>(null);
  const [showFullReview, setShowFullReview] = useState(false);

  useEffect(() => {
    loadImplementationData();
  }, []);

  const loadImplementationData = async () => {
    try {
      setLoading(true);
      
      // Load approved suggestions
      const suggestionsResponse = await suggestionsService.getSuggestions({
        status: 'approved',
        limit: 50
      });
      
      setApprovedSuggestions(suggestionsResponse.suggestions);
      
    } catch (error) {
      console.error('Failed to load implementation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickImplement = async (suggestion: EnhancedSuggestion) => {
    try {
      // Auto-implement the suggestion
      await suggestionsService.implementSuggestion(suggestion.id);
      
      // Mark as addressed
      await suggestionsService.markSuggestionAddressed(
        suggestion.id, 
        `Auto-implemented: ${suggestion.suggestion_type === 'regex_pattern' ? 'Pattern' : 'Template'} created in candidate configuration`
      );
      
      loadImplementationData();
      setSelectedSuggestion(null); // Close modal
      alert('Suggestion implemented successfully! Check the candidate configuration version.');
    } catch (error) {
      console.error('Failed to implement suggestion:', error);
      alert('Failed to implement suggestion. Please try manual implementation.');
    }
  };

  const getImplementationStatus = (suggestion: EnhancedSuggestion) => {
    if (!suggestion.action_items || suggestion.action_items.length === 0) {
      return { status: 'needs_items', label: 'Needs Action Items', color: 'bg-amber-100 text-amber-800' };
    }
    
    const completedItems = suggestion.action_items.filter(item => item.status === 'completed');
    const inProgressItems = suggestion.action_items.filter(item => item.status === 'in_progress');
    
    if (completedItems.length === suggestion.action_items.length) {
      return { status: 'ready', label: 'Ready to Complete', color: 'bg-green-100 text-green-800' };
    } else if (inProgressItems.length > 0) {
      return { status: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { status: 'pending', label: 'Pending Start', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const canQuickImplement = (suggestion: EnhancedSuggestion) => {
    return (suggestion.suggestion_type === 'regex_pattern' && suggestion.pattern) ||
           (suggestion.suggestion_type === 'prompt_template' && suggestion.template_text);
  };

  const handleManualConfig = (suggestion: EnhancedSuggestion) => {
    // Navigate to configuration with context to add new pattern/template
    const baseUrl = '/admin/configuration';
    
    // Debug the suggestion type to see what we're getting
    console.log('Suggestion type:', suggestion.suggestion_type);
    console.log('Has pattern:', !!suggestion.pattern);
    console.log('Has template_text:', !!suggestion.template_text);
    console.log('Full suggestion object:', suggestion);
    
    // For now, always go to patterns to test the workflow
    const tab = 'patterns';
    
    const params = new URLSearchParams({
      tab,
      action: 'add_new', // Indicates we want to add a new item
      from_suggestion: suggestion.id,
      // Pre-populate form data
      ...(suggestion.pattern && { suggested_pattern: suggestion.pattern }),
      ...(suggestion.template_text && { suggested_template: suggestion.template_text }),
      ...(suggestion.handler && { suggested_handler: suggestion.handler }),
      ...(suggestion.intent && { suggested_intent: suggestion.intent }),
      ...(suggestion.title && { reference_title: suggestion.title })
    });
    
    console.log('Navigating to tab:', tab);
    window.location.href = `${baseUrl}?${params.toString()}`;
  };

  const handleFullReview = (suggestion: EnhancedSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowFullReview(true);
  };

  const handleReviewModalClose = () => {
    setShowFullReview(false);
    // Don't clear selectedSuggestion here so the Implementation Modal can reopen
    loadImplementationData(); // Refresh data in case of changes
  };

  const handleImplementationModalClose = () => {
    setSelectedSuggestion(null);
    setShowFullReview(false);
  };

  // Review modal handlers
  const handleReview = async (suggestionId: string, reviewData: any) => {
    try {
      await suggestionsService.reviewSuggestion(suggestionId, reviewData);
      handleReviewModalClose();
    } catch (error) {
      console.error('Failed to review suggestion:', error);
      throw error;
    }
  };

  const handleCreateActionItem = async (suggestionId: string, actionItem: any) => {
    try {
      await suggestionsService.createActionItem(suggestionId, actionItem);
      handleReviewModalClose();
    } catch (error) {
      console.error('Failed to create action item:', error);
      throw error;
    }
  };

  const handleMarkAddressed = async (suggestionId: string, notes: string) => {
    try {
      await suggestionsService.markSuggestionAddressed(suggestionId, notes);
      handleReviewModalClose();
    } catch (error) {
      console.error('Failed to mark as addressed:', error);
      throw error;
    }
  };

  if (loading) {
    return <div className="p-3 sm:p-6 text-center text-sm">Loading implementation queue...</div>;
  }

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2"
             style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgb(163 163 163) transparent' }}>
          
          {/* Implementation Queue Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <h3 className="font-semibold text-lg sm:text-xl">Implementation Queue</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Manage approved suggestions and track implementation progress
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                {approvedSuggestions.length} approved suggestions
              </span>
              <Button
                onClick={loadImplementationData}
                className="btn-secondary text-xs sm:text-sm"
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Implementation Queue Content */}
          <div className="card p-3 sm:p-4 flex-1 min-h-0">
            {approvedSuggestions.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-neutral-500 dark:text-neutral-400">
                <CheckCircle size={48} className="sm:size-64 mx-auto mb-4 opacity-50" />
                <h4 className="text-lg sm:text-xl font-medium mb-2">No approved suggestions pending implementation</h4>
                <p className="text-sm">Great job keeping up with the queue!</p>
                <p className="text-xs mt-2">New approved suggestions will appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvedSuggestions.map((suggestion) => {
                  const implementationStatus = getImplementationStatus(suggestion);
                  
                  return (
                    <div key={suggestion.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 sm:p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <div className="flex items-start sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm sm:text-base mb-1">{suggestion.title}</h4>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                            <div className="flex items-center gap-1">
                              <User size={10} />
                              <span className="truncate max-w-32 sm:max-w-none">{suggestion.created_by_name}</span>
                            </div>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">{new Date(suggestion.created_at).toLocaleDateString()}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="capitalize">{suggestion.suggestion_type.replace('_', ' ')}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${implementationStatus.color}`}>
                            <span className="hidden sm:inline">{implementationStatus.label}</span>
                            <span className="sm:hidden">
                              {implementationStatus.status === 'needs_items' ? 'Needs Items' :
                               implementationStatus.status === 'ready' ? 'Ready' :
                               implementationStatus.status === 'in_progress' ? 'In Progress' : 'Pending'}
                            </span>
                          </span>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setSelectedSuggestion(suggestion)}
                              className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs"
                            >
                              <Eye size={12} />
                              <span className="hidden sm:inline">View Details</span>
                              <span className="sm:hidden">View</span>
                            </Button>
                            
                            {canQuickImplement(suggestion) && (
                              <Button
                                onClick={() => handleQuickImplement(suggestion)}
                                className="flex items-center gap-1 sm:gap-2 text-xs"
                              >
                                <Wrench size={12} />
                                <span className="hidden sm:inline">Quick Implement</span>
                                <span className="sm:hidden">Implement</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Implementation Details Modal */}
      <Modal
        isOpen={selectedSuggestion !== null && !showFullReview}
        onClose={handleImplementationModalClose}
        title={selectedSuggestion?.title || ''}
        size="xl"
      >
        {selectedSuggestion && (
          <div className="space-y-6">
            {/* Suggestion Header Info */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>{selectedSuggestion.created_by_name}</span>
                </div>
                <span>•</span>
                <span>{new Date(selectedSuggestion.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span className="capitalize">{selectedSuggestion.suggestion_type.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImplementationStatus(selectedSuggestion).color}`}>
                  {getImplementationStatus(selectedSuggestion).label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Analysis & Implementation */}
              <div className="space-y-4">
                <h5 className="font-semibold text-lg">Analysis & Implementation</h5>
                
                {selectedSuggestion.admin_analysis && (
                  <div>
                    <h6 className="font-medium text-sm mb-2">Admin Analysis:</h6>
                    <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg border text-sm">
                      {selectedSuggestion.admin_analysis}
                    </div>
                  </div>
                )}
                
                {selectedSuggestion.implementation_notes && (
                  <div>
                    <h6 className="font-medium text-sm mb-2">Implementation Notes:</h6>
                    <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg border text-sm">
                      {selectedSuggestion.implementation_notes}
                    </div>
                  </div>
                )}
                
                {(selectedSuggestion.pattern || selectedSuggestion.template_text) && (
                  <div>
                    <h6 className="font-medium text-sm mb-2">
                      Proposed {selectedSuggestion.suggestion_type === 'regex_pattern' ? 'Pattern' : 'Template'}:
                    </h6>
                    <code className="block bg-white dark:bg-neutral-800 p-3 rounded-lg border text-sm overflow-x-auto">
                      {selectedSuggestion.pattern || selectedSuggestion.template_text}
                    </code>
                  </div>
                )}
              </div>
              
              {/* Action Items */}
              <div className="space-y-4">
                <h5 className="font-semibold text-lg">Action Items</h5>
                
                {selectedSuggestion.action_items && selectedSuggestion.action_items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSuggestion.action_items.map((item) => (
                      <div key={item.id} className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <h6 className="font-medium text-sm">{item.title}</h6>
                          <span className={`px-2 py-1 rounded-full text-xs ml-2 ${
                            item.status === 'completed' ? 'bg-green-100 text-green-800' :
                            item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{item.description}</p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <Clock size={10} />
                          <span>Created {new Date(item.created_at).toLocaleDateString()}</span>
                          {item.due_date && (
                            <>
                              <span>•</span>
                              <span>Due {new Date(item.due_date).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 rounded-lg border">
                    <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">No action items created yet</p>
                    <p className="text-sm mb-4">Create action items to track implementation progress</p>
                    <Button
                      onClick={() => window.location.href = `/admin/suggestions?status=approved#${selectedSuggestion.id}`}
                      className="btn-secondary text-sm"
                    >
                      Add Action Items
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button
                onClick={() => handleFullReview(selectedSuggestion)}
                className="btn-secondary"
              >
                Full Review
              </Button>
              
              {canQuickImplement(selectedSuggestion) && (
                <Button
                  onClick={() => handleQuickImplement(selectedSuggestion)}
                  className=""
                >
                  Implement Now
                </Button>
              )}
              
              <Button
                onClick={() => handleManualConfig(selectedSuggestion)}
                className="btn-secondary"
              >
                Manual Config
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Full Review Modal with higher z-index */}
      {showFullReview && selectedSuggestion && (
        <Modal
          isOpen={true}
          onClose={handleReviewModalClose}
          title=""
          size="full"
          showCloseButton={false}
          zIndex={10000}
        >
          <SuggestionReviewModal
            suggestion={selectedSuggestion}
            onClose={handleReviewModalClose}
            onReview={handleReview}
            onCreateActionItem={handleCreateActionItem}
            onMarkAddressed={handleMarkAddressed}
          />
        </Modal>
      )}
    </>
  );
}