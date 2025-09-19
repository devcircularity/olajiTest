// app/tester/page.tsx (Updated with Stats Cards)
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { testerService, TesterStats } from "@/services/tester";
import { Clock, CheckCircle, XCircle, AlertTriangle, Zap, TrendingUp, Activity, Users } from "lucide-react";

export default function TesterPage() {
  return (
    <RouteProtection 
      requiredPermissions={["is_tester"]} 
      requiredRoles={["TESTER"]}
      fallbackRoute="/dashboard"
    >
      <TesterDashboard />
    </RouteProtection>
  );
}

function TesterDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TesterStats | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    loadStats();
    loadSuggestions();
  }, []);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await testerService.getStats({ days_back: 30 });
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const data = await testerService.getMySuggestions({ limit: 50 });
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getSuggestionStatusCounts = () => {
    return {
      total: suggestions.length,
      pending: suggestions.filter(s => s.status === 'pending').length,
      approved: suggestions.filter(s => s.status === 'approved').length,
      rejected: suggestions.filter(s => s.status === 'rejected').length,
      implemented: suggestions.filter(s => s.status === 'implemented').length,
    };
  };

  const suggestionCounts = getSuggestionStatusCounts();

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Tester Dashboard</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Monitor system performance and track your contributions
          </p>
        </div>

        {/* System Performance Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
            System Performance (Last 30 Days)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="text-blue-600 flex-shrink-0" size={16} />
                <h3 className="text-xs sm:text-sm font-medium text-neutral-600">Total Messages</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                {loadingStats ? '...' : (stats?.total_messages?.toLocaleString() || '0')}
              </p>
              <p className="text-xs text-neutral-500">Processed</p>
            </div>

            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="text-red-600 flex-shrink-0" size={16} />
                <h3 className="text-xs sm:text-sm font-medium text-neutral-600">Issues</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-600">
                {loadingStats ? '...' : (stats?.needs_attention || 0)}
              </p>
              <p className="text-xs text-neutral-500">
                {stats?.total_messages ? 
                  `${((stats.needs_attention / stats.total_messages) * 100).toFixed(1)}%` : 
                  '0%'
                } of total
              </p>
            </div>

            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-orange-600 flex-shrink-0" size={16} />
                <h3 className="text-xs sm:text-sm font-medium text-neutral-600">Fallbacks</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">
                {loadingStats ? '...' : (stats?.fallback_used || 0)}
              </p>
              <p className="text-xs text-neutral-500">Used</p>
            </div>

            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-600 flex-shrink-0" size={16} />
                <h3 className="text-xs sm:text-sm font-medium text-neutral-600">Success Rate</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {loadingStats ? '...' : 
                  stats?.total_messages ? 
                    `${(((stats.total_messages - stats.needs_attention) / stats.total_messages) * 100).toFixed(1)}%` : 
                    '0%'
                }
              </p>
              <p className="text-xs text-neutral-500">Handled well</p>
            </div>
          </div>
        </div>

        {/* Your Suggestions Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
            Your Suggestions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-gray-600 flex-shrink-0" size={16} />
                <h3 className="text-xs sm:text-sm font-medium text-neutral-600">Pending</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-600">
                {loadingSuggestions ? '...' : suggestionCounts.pending}
              </p>
              <p className="text-xs text-neutral-500">Under Review</p>
            </div>

            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                <h3 className="text-xs sm:text-sm font-medium text-neutral-600">Approved</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {loadingSuggestions ? '...' : suggestionCounts.approved}
              </p>
              <p className="text-xs text-neutral-500">Ready to Deploy</p>
            </div>

            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-purple-600 flex-shrink-0" size={16} />
                <h3 className="text-xs sm:text-sm font-medium text-neutral-600">Implemented</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">
                {loadingSuggestions ? '...' : suggestionCounts.implemented}
              </p>
              <p className="text-xs text-neutral-500">Live in System</p>
            </div>

            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-blue-600 flex-shrink-0" size={16} />
                <h3 className="text-xs sm:text-sm font-medium text-neutral-600">Success Rate</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                {loadingSuggestions ? '...' : 
                  suggestionCounts.total > 0 ? 
                    `${Math.round(((suggestionCounts.approved + suggestionCounts.implemented) / suggestionCounts.total) * 100)}%` : 
                    '0%'
                }
              </p>
              <p className="text-xs text-neutral-500">Acceptance</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                Problem Queue
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Review problematic messages that need tester attention.
              </p>
              <button 
                onClick={() => window.location.href = '/tester/queue'}
                className="btn-primary w-full"
              >
                View Queue
              </button>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                My Suggestions
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Track suggestions you've submitted for improving AI responses.
              </p>
              <button 
                onClick={() => window.location.href = '/tester/suggestions'}
                className="btn btn-secondary w-full"
              >
                View Suggestions
              </button>
            </div>
            
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                Analytics
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                View detailed analytics and trends for system performance.
              </p>
              <button 
                onClick={() => window.location.href = '/tester/stats'}
                className="btn btn-secondary w-full"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Tester Permissions Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
            Your Tester Permissions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Tester:</span>
                <span className={user?.permissions?.is_tester ? "text-green-600" : "text-red-600"}>
                  {user?.permissions?.is_tester ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Admin:</span>
                <span className={user?.permissions?.is_admin ? "text-green-600" : "text-red-600"}>
                  {user?.permissions?.is_admin ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Super Admin:</span>
                <span className={user?.permissions?.is_super_admin ? "text-green-600" : "text-red-600"}>
                  {user?.permissions?.is_super_admin ? "Yes" : "No"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Submit Suggestions:</span>
                <span className="text-green-600">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">View Problem Queue:</span>
                <span className="text-green-600">Yes</span>
              </div>
              <div>
                <span className="text-neutral-600 dark:text-neutral-400">Roles: </span>
                <span className="text-neutral-900 dark:text-neutral-100">
                  {user?.roles?.join(", ") || "None"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}