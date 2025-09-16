// app/admin/suggestions/page.tsx - Updated with enhanced workflow
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessTesterQueue } from "@/utils/permissions";
import { suggestionsService, Suggestion, SuggestionStats } from "@/services/suggestions";
import DataTable, { TableColumn, TableAction } from "@/components/ui/DataTable";
import { Check, X, Eye, MessageSquare, TrendingUp, AlertCircle, CheckCircle, Clock, Lightbulb, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { EnhancedSuggestionModal } from "./EnhancedSuggestionModal";

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
}

interface EnhancedSuggestion extends Suggestion {
  action_items?: ActionItem[];
  admin_analysis?: string;
  implementation_notes?: string;
}

export default function SuggestionsPage() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<EnhancedSuggestion[]>([]);
  const [stats, setStats] = useState<SuggestionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedSuggestion, setSelectedSuggestion] = useState<EnhancedSuggestion | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNext: false
  });

  useEffect(() => {
    loadSuggestions();
    loadStats();
  }, [selectedStatus]);

  const loadSuggestions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await suggestionsService.getSuggestions({
        page,
        limit: 20,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        pending_only: selectedStatus === 'pending'
      });
      
      setSuggestions(response.suggestions);
      setPagination({
        currentPage: response.page,
        totalPages: Math.ceil(response.total / 20),
        total: response.total,
        hasNext: response.has_next
      });
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await suggestionsService.getSuggestionStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Enhanced review function
  const handleEnhancedReview = async (suggestionId: string, reviewData: any) => {
    try {
      await suggestionsService.reviewSuggestionEnhanced(suggestionId, reviewData);
      loadSuggestions(pagination.currentPage);
      loadStats();
    } catch (error) {
      console.error('Failed to review suggestion:', error);
      throw error;
    }
  };

  // Create action item
  const handleCreateActionItem = async (suggestionId: string, actionItemData: any) => {
    try {
      await suggestionsService.createActionItem(suggestionId, actionItemData);
      loadSuggestions(pagination.currentPage);
      loadStats();
    } catch (error) {
      console.error('Failed to create action item:', error);
      throw error;
    }
  };

  // Mark as addressed
  const handleMarkAddressed = async (suggestionId: string, completionNotes: string) => {
    try {
      await suggestionsService.markSuggestionAddressed(suggestionId, completionNotes);
      loadSuggestions(pagination.currentPage);
      loadStats();
    } catch (error) {
      console.error('Failed to mark as addressed:', error);
      throw error;
    }
  };

  const columns: TableColumn<EnhancedSuggestion>[] = [
    {
      key: 'created_at',
      label: 'Submitted',
      render: (date: string) => new Date(date).toLocaleDateString(),
      width: '100px',
    },
    {
      key: 'created_by_name',
      label: 'Submitted By',
      width: '150px',
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
      key: 'title',
      label: 'Title',
      render: (title: string, suggestion: EnhancedSuggestion) => (
        <div className="max-w-xs">
          <div className="truncate font-medium" title={title}>
            {title}
          </div>
          {suggestion.action_items && suggestion.action_items.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Clock size={12} className="text-blue-500" />
              <span className="text-xs text-blue-600">
                {suggestion.action_items.length} action item{suggestion.action_items.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      ),
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
      render: (status: string, suggestion: EnhancedSuggestion) => {
        let statusIcon = null;
        let statusClass = '';
        
        switch (status) {
          case 'approved':
            statusIcon = <CheckCircle size={12} />;
            statusClass = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
            break;
          case 'rejected':
            statusIcon = <X size={12} />;
            statusClass = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
            break;
          case 'implemented':
            statusIcon = <CheckCircle size={12} />;
            statusClass = 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
            break;
          case 'needs_analysis':
            statusIcon = <Lightbulb size={12} />;
            statusClass = 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
            break;
          default:
            statusIcon = <Clock size={12} />;
            statusClass = 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
        }
        
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {statusIcon}
            {status.replace('_', ' ')}
          </span>
        );
      },
      width: '120px',
    },
  ];

  const actions: TableAction<EnhancedSuggestion>[] = [
    {
      label: 'View Details',
      icon: <Eye size={14} />,
      onClick: (suggestion) => setSelectedSuggestion(suggestion),
      variant: 'secondary',
    },
    {
      label: 'Create Action Item',
      icon: <Plus size={14} />,
      onClick: (suggestion) => {
        setSelectedSuggestion(suggestion);
        // Will open modal in actions tab
      },
      variant: 'primary',
      disabled: (suggestion) => suggestion.status !== 'approved',
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
          <h1 className="text-2xl font-bold mb-2">Tester Suggestions</h1>
          <p className="text-neutral-600">
            Review suggestions and create action items for implementation
          </p>
        </div>
      </div>

      {/* Enhanced Info Card */}
      <div className="card p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Lightbulb className="text-blue-600 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Enhanced Suggestion Workflow
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• <strong>Review:</strong> Analyze suggestions and determine what needs to be done</p>
              <p>• <strong>Create Action Items:</strong> Break down implementation into specific tasks</p>
              <p>• <strong>Track Progress:</strong> Monitor completion of action items</p>
              <p>• <strong>Manual Implementation:</strong> Admin creates patterns/templates as needed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="card p-4">
            <h3 className="text-sm font-medium text-neutral-600">Total</h3>
            <p className="text-2xl font-bold">{stats.total_suggestions}</p>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-medium text-neutral-600">Pending</h3>
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-medium text-neutral-600">Approved</h3>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-medium text-neutral-600">Need Analysis</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.needs_analysis || 0}
            </p>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-medium text-neutral-600">Rejected</h3>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-medium text-neutral-600">Addressed</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.implemented}</p>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="card p-4 mb-6">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Filter by Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input w-48"
          >
            <option value="pending">Pending Review</option>
            <option value="needs_analysis">Needs Analysis</option>
            <option value="approved">Approved (Ready for Action Items)</option>
            <option value="rejected">Rejected</option>
            <option value="implemented">Addressed</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <DataTable
        data={suggestions}
        columns={columns}
        actions={actions}
        loading={loading}
        searchable
        searchPlaceholder="Search suggestions..."
        pagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          onPageChange: loadSuggestions,
        }}
        emptyMessage="No suggestions found"
      />

      {/* Enhanced Suggestion Detail Modal */}
      {selectedSuggestion && (
        <EnhancedSuggestionModal
          suggestion={selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
          onReview={handleEnhancedReview}
          onCreateActionItem={handleCreateActionItem}
          onMarkAddressed={handleMarkAddressed}
        />
      )}
    </div>
  );
}