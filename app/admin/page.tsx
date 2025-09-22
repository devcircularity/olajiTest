// app/admin/page.tsx - Updated with Implementation Management
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RouteProtection } from "@/components/auth/RouteProtection";
import { chatMonitoringService, RealtimeStats } from "@/services/chatMonitoring";
import { userService, UserStats } from "@/services/user";
import { suggestionsService } from "@/services/suggestions";
import { MessageSquare, Users, Clock, TrendingUp, AlertTriangle, Activity, UserCheck, UserPlus, Wrench, CheckCircle, ExternalLink, Play } from "lucide-react";

interface ImplementationStats {
  total_approved: number;
  pending_implementation: number;
  in_progress: number;
  completed_this_week: number;
  overdue_items: number;
}

export default function AdminDashboardPage() {
  return (
    <RouteProtection 
      requiredPermissions={["is_admin", "is_super_admin"]} 
      requiredRoles={["ADMIN", "SUPER_ADMIN"]}
      fallbackRoute="/dashboard"
    >
      <AdminDashboard />
    </RouteProtection>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [implementationStats, setImplementationStats] = useState<ImplementationStats | null>(null);
  const [loadingChatStats, setLoadingChatStats] = useState(true);
  const [loadingUserStats, setLoadingUserStats] = useState(true);
  const [loadingImplementationStats, setLoadingImplementationStats] = useState(true);

  useEffect(() => {
    loadChatStats();
    loadUserStats();
    loadImplementationStats();
  }, []);

  const loadChatStats = async () => {
    try {
      setLoadingChatStats(true);
      const stats = await chatMonitoringService.getRealtimeStats();
      setRealtimeStats(stats);
    } catch (error) {
      console.error('Failed to load chat stats:', error);
    } finally {
      setLoadingChatStats(false);
    }
  };

  const loadUserStats = async () => {
    try {
      setLoadingUserStats(true);
      const stats = await userService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setLoadingUserStats(false);
    }
  };

  const loadImplementationStats = async () => {
    try {
      setLoadingImplementationStats(true);
      
      // Load approved suggestions to calculate stats
      const suggestionsResponse = await suggestionsService.getSuggestions({
        status: 'approved',
        limit: 100
      });
      
      const approvedSuggestions = suggestionsResponse.suggestions;
      const totalApproved = approvedSuggestions.length;
      const pendingImplementation = approvedSuggestions.filter(s => 
        !s.action_items || s.action_items.length === 0
      ).length;
      const inProgress = approvedSuggestions.filter(s => 
        s.action_items && s.action_items.some(item => item.status === 'in_progress')
      ).length;
      
      setImplementationStats({
        total_approved: totalApproved,
        pending_implementation: pendingImplementation,
        in_progress: inProgress,
        completed_this_week: 0, // Would need backend calculation
        overdue_items: 0 // Would need backend calculation
      });
      
    } catch (error) {
      console.error('Failed to load implementation stats:', error);
    } finally {
      setLoadingImplementationStats(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 sm:p-6">
        {/* Implementation Management */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Implementation Management
            </h2>
            <button 
              onClick={() => window.location.href = '/admin/configuration?tab=implementation'}
              className="btn btn-secondary text-xs sm:text-sm"
            >
              View Implementation Queue
            </button>
          </div>
          
          {/* Implementation Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-blue-600 flex-shrink-0" />
                <h3 className="text-xs font-medium text-neutral-600 truncate">Total Approved</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold">
                {loadingImplementationStats ? '--' : implementationStats?.total_approved || 0}
              </p>
            </div>
            
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                <h3 className="text-xs font-medium text-neutral-600 truncate">Need Items</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-amber-600">
                {loadingImplementationStats ? '--' : implementationStats?.pending_implementation || 0}
              </p>
            </div>
            
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-blue-600 flex-shrink-0" />
                <h3 className="text-xs font-medium text-neutral-600 truncate">In Progress</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-blue-600">
                {loadingImplementationStats ? '--' : implementationStats?.in_progress || 0}
              </p>
            </div>
            
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                <h3 className="text-xs font-medium text-neutral-600 truncate">Completed</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-green-600">
                {loadingImplementationStats ? '--' : implementationStats?.completed_this_week || 0}
              </p>
            </div>
            
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-red-600 flex-shrink-0" />
                <h3 className="text-xs font-medium text-neutral-600 truncate">Overdue</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-red-600">
                {loadingImplementationStats ? '--' : implementationStats?.overdue_items || 0}
              </p>
            </div>
          </div>

          {/* Implementation Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button 
              onClick={() => window.location.href = '/admin/suggestions?status=approved'}
              className="btn btn-secondary flex items-center gap-2 text-xs sm:text-sm justify-center"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Review All Approved</span>
              <span className="sm:hidden">Review All</span>
            </button>
            
            <button 
              onClick={() => window.location.href = '/admin/configuration?tab=versions'}
              className="btn btn-secondary flex items-center gap-2 text-xs sm:text-sm justify-center"
            >
              <Play size={14} />
              <span className="hidden sm:inline">Manage Versions</span>
              <span className="sm:hidden">Versions</span>
            </button>
            
            <button 
              onClick={loadImplementationStats}
              className="btn btn-secondary flex items-center gap-2 text-xs sm:text-sm justify-center"
            >
              <CheckCircle size={14} />
              <span className="hidden sm:inline">Refresh Queue</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {/* User Management Highlights */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              User Management Overview
            </h2>
            <button 
              onClick={() => window.location.href = '/admin/users'}
              className="btn btn-secondary text-xs sm:text-sm"
            >
              Manage Users
            </button>
          </div>
          
          {userStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="card p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} className="text-blue-600 flex-shrink-0" />
                  <h3 className="text-xs font-medium text-neutral-600 truncate">Total Users</h3>
                </div>
                <p className="text-lg sm:text-2xl font-bold">{loadingUserStats ? '--' : userStats.total_users}</p>
              </div>
              <div className="card p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck size={14} className="text-green-600 flex-shrink-0" />
                  <h3 className="text-xs font-medium text-neutral-600 truncate">Active Users</h3>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{loadingUserStats ? '--' : userStats.active_users}</p>
              </div>
              <div className="card p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus size={14} className="text-blue-600 flex-shrink-0" />
                  <h3 className="text-xs font-medium text-neutral-600 truncate">New This Week</h3>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{loadingUserStats ? '--' : userStats.new_users_this_week}</p>
              </div>
              <div className="card p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus size={14} className="text-purple-600 flex-shrink-0" />
                  <h3 className="text-xs font-medium text-neutral-600 truncate">New This Month</h3>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{loadingUserStats ? '--' : userStats.new_users_this_month}</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Monitoring Stats */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Chat System Performance
            </h2>
            <button 
              onClick={() => window.location.href = '/admin/monitoring'}
              className="btn btn-secondary text-xs sm:text-sm"
            >
              View Details
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-blue-600 flex-shrink-0" />
                <h3 className="text-xs font-medium text-neutral-600 truncate">Active Chats</h3>
              </div>
              <p className="text-lg sm:text-2xl font-bold">
                {loadingChatStats ? '--' : realtimeStats?.active_conversations || 0}
              </p>
            </div>
            
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-green-600 flex-shrink-0" />
                <h3 className="text-xs font-medium text-neutral-600 truncate">Today</h3>
              </div>
              <p className="text-lg sm:text-2xl font-bold">
                {loadingChatStats ? '--' : realtimeStats?.messages_today || 0}
              </p>
            </div>
            
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-purple-600 flex-shrink-0" />
                <h3 className="text-xs font-medium text-neutral-600 truncate">Avg Response</h3>
              </div>
              <p className="text-lg sm:text-2xl font-bold">
                {loadingChatStats ? '--' : `${realtimeStats?.average_response_time || 0}ms`}
              </p>
            </div>
            
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-green-600 flex-shrink-0" />
                <h3 className="text-xs font-medium text-neutral-600 truncate">Satisfaction</h3>
              </div>
              <p className="text-lg sm:text-2xl font-bold">
                {loadingChatStats ? '--' : `${((realtimeStats?.satisfaction_rate || 0) * 100).toFixed(1)}%`}
              </p>
            </div>
            
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-orange-600 flex-shrink-0" />
                <h3 className="text-xs font-medium text-neutral-600 truncate">Fallback Rate</h3>
              </div>
              <p className="text-lg sm:text-2xl font-bold">
                {loadingChatStats ? '--' : `${((realtimeStats?.fallback_rate || 0) * 100).toFixed(1)}%`}
              </p>
            </div>
            
            <div className="card p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-blue-600 flex-shrink-0" />
                <h3 className="text-xs font-medium text-neutral-600 truncate">Top Intent</h3>
              </div>
              <p className="text-sm sm:text-lg font-bold truncate">
                {loadingChatStats ? '--' : realtimeStats?.top_intents_today[0]?.intent || 'N/A'}
              </p>
              <p className="text-xs text-neutral-500">
                {loadingChatStats ? '' : `${realtimeStats?.top_intents_today[0]?.count || 0} uses`}
              </p>
            </div>
          </div>
        </div>

        {/* System Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="card p-3 sm:p-6">
            <h3 className="text-sm sm:text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Schools</h3>
            <p className="text-lg sm:text-3xl font-bold text-green-600">--</p>
            <p className="text-xs sm:text-sm text-neutral-500">Total schools</p>
          </div>
          <div className="card p-3 sm:p-6">
            <h3 className="text-sm sm:text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Suggestions</h3>
            <p className="text-lg sm:text-3xl font-bold text-orange-600">--</p>
            <p className="text-xs sm:text-sm text-neutral-500">Pending review</p>
          </div>
          <div className="card p-3 sm:p-6">
            <h3 className="text-sm sm:text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">System Health</h3>
            <p className="text-lg sm:text-3xl font-bold text-green-600">Good</p>
            <p className="text-xs sm:text-sm text-neutral-500">All systems operational</p>
          </div>
          <div className="card p-3 sm:p-6">
            <h3 className="text-sm sm:text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Uptime</h3>
            <p className="text-lg sm:text-3xl font-bold text-blue-600">99.9%</p>
            <p className="text-xs sm:text-sm text-neutral-500">Last 30 days</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <div className="card p-3 sm:p-6">
            <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
              Chat Monitoring
            </h2>
            <p className="text-xs sm:text-base text-neutral-600 dark:text-neutral-400 mb-3 sm:mb-4">
              Monitor real-time chat interactions and performance.
            </p>
            <button 
              onClick={() => window.location.href = '/admin/monitoring'}
              className="btn-primary w-full sm:w-auto text-xs sm:text-sm"
            >
              View Monitoring
            </button>
          </div>

          <div className="card p-3 sm:p-6">
            <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
              User Management
            </h2>
            <p className="text-xs sm:text-base text-neutral-600 dark:text-neutral-400 mb-3 sm:mb-4">
              Manage system users and their roles.
            </p>
            {user?.permissions?.can_manage_users ? (
              <button 
                onClick={() => window.location.href = '/admin/users'}
                className="btn-primary w-full sm:w-auto text-xs sm:text-sm"
              >
                Manage Users
              </button>
            ) : (
              <p className="text-xs text-neutral-500">
                Insufficient permissions
              </p>
            )}
          </div>
          
          <div className="card p-3 sm:p-6">
            <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
              Intent Configuration
            </h2>
            <p className="text-xs sm:text-base text-neutral-600 dark:text-neutral-400 mb-3 sm:mb-4">
              Configure AI intent patterns and responses.
            </p>
            {user?.permissions?.can_manage_intent_config ? (
              <button 
                onClick={() => window.location.href = '/admin/configuration'}
                className="btn-primary w-full sm:w-auto text-xs sm:text-sm"
              >
                Configure Intents
              </button>
            ) : (
              <p className="text-xs text-neutral-500">
                Insufficient permissions
              </p>
            )}
          </div>
          
          <div className="card p-3 sm:p-6">
            <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
              Tester Queue
            </h2>
            <p className="text-xs sm:text-base text-neutral-600 dark:text-neutral-400 mb-3 sm:mb-4">
              Review and approve tester suggestions.
            </p>
            {(user?.permissions?.is_tester || user?.permissions?.is_admin || user?.permissions?.is_super_admin) ? (
              <button 
                onClick={() => window.location.href = '/admin/suggestions'}
                className="btn-primary w-full sm:w-auto text-xs sm:text-sm"
              >
                Review Suggestions
              </button>
            ) : (
              <p className="text-xs text-neutral-500">
                Insufficient permissions
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}