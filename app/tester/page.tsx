// app/tester/page.tsx (Updated)
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { canAccessTesterQueue } from "@/utils/permissions";
import { RouteProtection } from "@/components/auth/RouteProtection";

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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="chat-surface">
        {/* Header */}
        <header className="flex items-center justify-between py-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Tester Dashboard
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Welcome back, {user?.full_name || user?.email}. Monitor and improve AI responses.
            </p>
          </div>
          <button
            onClick={() => useAuth().logout()}
            className="btn btn-outline"
          >
            Logout
          </button>
        </header>

        {/* Main Content */}
        <main className="py-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                Problem Queue
              </h2>
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
              <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                My Suggestions
              </h2>
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
              <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                Analytics
              </h2>
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

          {/* Tester Info */}
          <div className="card p-6 mt-8">
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
        </main>
      </div>
    </div>
  );
}