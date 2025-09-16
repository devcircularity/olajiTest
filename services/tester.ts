// services/tester.ts
import { apiClient } from './api';

export interface ProblematicMessage {
  message_id: string;
  conversation_id: string;
  user_message: string;
  assistant_response: string;
  intent?: string;
  rating?: number;
  rated_at?: string;
  created_at: string;
  processing_time_ms?: number;
  
  // Routing information
  routing_log_id?: string;
  llm_intent?: string;
  llm_confidence?: number;
  router_intent?: string;
  final_intent?: string;
  fallback_used?: boolean;
  
  // Context for understanding the issue
  issue_type: string;
  priority: number;
  
  // Additional context
  school_id?: string;
  user_id: string;
}

export interface TesterSuggestionCreate {
  message_id?: string;
  routing_log_id?: string;
  suggestion_type: 'regex_pattern' | 'prompt_template' | 'intent_mapping' | 'handler_improvement';
  title: string;
  description: string;
  handler: string;
  intent: string;
  pattern?: string;
  template_text?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tester_note?: string;
}

export interface TesterSuggestion {
  id: string;
  title: string;
  suggestion_type: string;
  handler: string;
  intent: string;
  status: string;
  priority: string;
  created_at: string;
  reviewed_at?: string;
  admin_note?: string;
}

export interface TesterStats {
  total_messages: number;
  negative_ratings: number;
  fallback_used: number;
  low_confidence: number;
  unhandled: number;
  needs_attention: number;
  by_priority: {
    high: number;
    medium: number;
    low: number;
  };
  by_issue_type: {
    negative_rating: number;
    fallback: number;
    low_confidence: number;
    unhandled: number;
  };
}

export interface QueueFilters {
  priorities: number[];
  issue_types: string[];
  date_ranges: string[];
}

export interface GetQueueParams {
  priority?: number;
  issue_type?: string;
  limit?: number;
  days_back?: number;
  school_id?: string;
}

export interface GetSuggestionsParams {
  limit?: number;
  status?: string;
  suggestion_type?: string;
}

export interface GetStatsParams {
  days_back?: number;
  school_id?: string;
}

class TesterService {
  async getQueue(params: GetQueueParams = {}): Promise<ProblematicMessage[]> {
    const searchParams = new URLSearchParams();
    
    if (params.priority) searchParams.append('priority', params.priority.toString());
    if (params.issue_type) searchParams.append('issue_type', params.issue_type);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.days_back) searchParams.append('days_back', params.days_back.toString());
    if (params.school_id) searchParams.append('school_id', params.school_id);
    
    const response = await apiClient.get(`/api/tester/queue?${searchParams.toString()}`);
    return response.data;
  }

  async submitSuggestion(suggestion: TesterSuggestionCreate): Promise<{
    message: string;
    suggestion_id: string;
    status: string;
    title: string;
    suggestion_type: string;
    priority: string;
    created_at: string;
  }> {
    const response = await apiClient.post('/api/tester/suggestions', suggestion);
    return response.data;
  }

  async getMySuggestions(params: GetSuggestionsParams = {}): Promise<TesterSuggestion[]> {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.suggestion_type) searchParams.append('suggestion_type', params.suggestion_type);
    
    const response = await apiClient.get(`/api/tester/suggestions?${searchParams.toString()}`);
    return response.data;
  }

  async getStats(params: GetStatsParams = {}): Promise<TesterStats> {
    const searchParams = new URLSearchParams();
    
    if (params.days_back) searchParams.append('days_back', params.days_back.toString());
    if (params.school_id) searchParams.append('school_id', params.school_id);
    
    const response = await apiClient.get(`/api/tester/stats?${searchParams.toString()}`);
    return response.data;
  }

  async getFilters(): Promise<QueueFilters> {
    const response = await apiClient.get('/api/tester/filters');
    return response.data;
  }

  // Utility methods for suggestion types
  getSuggestionTypes() {
    return [
      { value: 'regex_pattern', label: 'Regex Pattern', description: 'Add or improve message classification patterns' },
      { value: 'prompt_template', label: 'Prompt Template', description: 'Improve response templates for better answers' },
      { value: 'intent_mapping', label: 'Intent Mapping', description: 'Better intent classification for specific handlers' },
      { value: 'handler_improvement', label: 'Handler Improvement', description: 'General handler behavior improvements' }
    ];
  }

  getPriorityLevels() {
    return [
      { value: 'critical', label: 'Critical', description: 'Urgent fixes for broken responses' },
      { value: 'high', label: 'High', description: 'Important improvements for common issues' },
      { value: 'medium', label: 'Medium', description: 'General improvements and optimizations' },
      { value: 'low', label: 'Low', description: 'Minor enhancements and edge cases' }
    ];
  }

  getIssueTypeLabels() {
    return {
      negative_rating: 'User gave thumbs down',
      fallback: 'Fallback response used',
      low_confidence: 'Low classification confidence',
      unhandled: 'Unhandled intent'
    };
  }

  getPriorityLabels() {
    return {
      1: 'High',
      2: 'Medium', 
      3: 'Low'
    };
  }

  getPriorityColor(priority: number) {
    switch (priority) {
      case 1: return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 2: return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 3: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
    }
  }

  getIssueTypeColor(issueType: string) {
    switch (issueType) {
      case 'negative_rating': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'fallback': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
      case 'low_confidence': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'unhandled': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
    }
  }

  getSuggestionStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
      case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'implemented': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
    }
  }
}

export const testerService = new TesterService();