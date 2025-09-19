// app/tester/queue/page.tsx - Updated with suggestion filtering
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { testerService, ProblematicMessage } from "@/services/tester";
import { HeaderTitleBus } from "@/components/layout/HeaderBar";

// Import components
import { QueueStatsCards } from "@/components/tester/queue/QueueStatsCards";
import { QueueFilters } from "@/components/tester/queue/QueueFilters";
import { QueueDataTable } from "@/components/tester/queue/QueueDataTable";
import { ConversationModal } from "@/components/tester/queue/ConversationModal";
import { SuggestionModal } from "@/components/tester/queue/SuggestionModal";

export default function TesterQueuePage() {
  const { user } = useAuth();
  
  // Data state
  const [messages, setMessages] = useState<ProblematicMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedIssueType, setSelectedIssueType] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(30);
  const [showSuggested, setShowSuggested] = useState<boolean>(false); // NEW: Default to hide handled messages
  
  // Modal state
  const [selectedMessage, setSelectedMessage] = useState<ProblematicMessage | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  // Set header title on mount
  useEffect(() => {
    HeaderTitleBus.send({ 
      type: 'set', 
      title: 'Problem Queue', 
      subtitle: 'Messages that need tester attention' 
    });
    
    return () => {
      HeaderTitleBus.send({ type: 'clear' });
    };
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadQueue();
  }, [selectedPriority, selectedIssueType, selectedTimeframe, showSuggested]); // Added showSuggested

  // Update subtitle with message count
  useEffect(() => {
    const subtitle = showSuggested 
      ? `All messages (${messages.length} items)` 
      : `Unhandled messages (${messages.length} items)`;
    
    HeaderTitleBus.send({ 
      type: 'set', 
      title: 'Problem Queue', 
      subtitle: subtitle
    });
  }, [messages.length, showSuggested]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      
      const params = {
        days_back: selectedTimeframe,
        limit: 100,
        show_suggested: showSuggested, // NEW: Pass the filter
        ...(selectedPriority && { priority: parseInt(selectedPriority) }),
        ...(selectedIssueType && { issue_type: selectedIssueType })
      };
      
      const data = await testerService.getQueue(params);
      
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = (message: ProblematicMessage) => {
    setSelectedMessage(message);
  };

  const handleCreateSuggestion = () => {
    setShowSuggestionModal(true);
  };

  const handleSuggestionSubmitted = () => {
    // Don't close modal immediately - let the SuggestionModal handle the success state
    // The modal will close itself after showing success message
    loadQueue();
  };

  const handleSuggestionModalClose = () => {
    setShowSuggestionModal(false);
    setSelectedMessage(null);
  };

  const handleRefresh = () => {
    loadQueue();
  };

  const handleClearFilters = () => {
    setSelectedPriority('');
    setSelectedIssueType('');
    setSelectedTimeframe(30);
    setShowSuggested(false); // Reset to hide handled messages
  };

  // Check permissions
  const hasTesterQueuePermission = user?.permissions?.is_tester || 
                                   user?.permissions?.is_admin || 
                                   user?.permissions?.is_super_admin;

  if (!hasTesterQueuePermission) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-600">You don't have permission to access the tester queue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Stats Summary */}
      <QueueStatsCards messages={messages} />

      {/* Filters and Actions */}
      <QueueFilters
        selectedPriority={selectedPriority}
        selectedIssueType={selectedIssueType}
        selectedTimeframe={selectedTimeframe}
        showSuggested={showSuggested}
        onPriorityChange={setSelectedPriority}
        onIssueTypeChange={setSelectedIssueType}
        onTimeframeChange={setSelectedTimeframe}
        onShowSuggestedChange={setShowSuggested}
        onClearFilters={handleClearFilters}
        onRefresh={handleRefresh}
      />

      {/* Data Table */}
      <div className="h-[600px]">
        <QueueDataTable
          messages={messages}
          loading={loading}
          onViewMessage={handleViewMessage}
        />
      </div>

      {/* Conversation Modal */}
      {selectedMessage && !showSuggestionModal && (
        <ConversationModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onCreateSuggestion={handleCreateSuggestion}
        />
      )}

      {/* Suggestion Modal */}
      {showSuggestionModal && selectedMessage && (
        <SuggestionModal
          message={selectedMessage}
          suggestionType="ai_response"
          onClose={handleSuggestionModalClose}
          onSubmit={handleSuggestionSubmitted}
        />
      )}
    </div>
  );
}