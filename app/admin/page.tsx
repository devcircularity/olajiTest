// app/admin/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { canAccessTesterQueue } from "@/utils/permissions";
import { RouteProtection } from "@/components/auth/RouteProtection";

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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="chat-surface">
        {/* Header - Responsive text sizes and spacing */}
        <header className="py-4 sm:py-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              AI Training Dashboard
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1 text-sm sm:text-base">
              Manage AI training data, models, and system configuration.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-6 sm:py-8">
          {/* Quick Stats - Responsive grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="card p-4 sm:p-6">
              <h3 className="text-sm sm:text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Users</h3>
              <p className="text-xl sm:text-3xl font-bold text-blue-600">--</p>
              <p className="text-xs sm:text-sm text-neutral-500">Active users</p>
            </div>
            <div className="card p-4 sm:p-6">
              <h3 className="text-sm sm:text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Schools</h3>
              <p className="text-xl sm:text-3xl font-bold text-green-600">--</p>
              <p className="text-xs sm:text-sm text-neutral-500">Total schools</p>
            </div>
            <div className="card p-4 sm:p-6">
              <h3 className="text-sm sm:text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Suggestions</h3>
              <p className="text-xl sm:text-3xl font-bold text-orange-600">--</p>
              <p className="text-xs sm:text-sm text-neutral-500">Pending review</p>
            </div>
            <div className="card p-4 sm:p-6">
              <h3 className="text-sm sm:text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">System Health</h3>
              <p className="text-xl sm:text-3xl font-bold text-green-600">Good</p>
              <p className="text-xs sm:text-sm text-neutral-500">All systems operational</p>
            </div>
          </div>

          {/* Quick Actions - Single column on mobile, 3 columns on tablet+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
                User Management
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-3 sm:mb-4">
                Manage system users and their roles.
              </p>
              {user?.permissions?.can_manage_users ? (
                <button className="btn-primary w-full sm:w-auto">
                  Manage Users
                </button>
              ) : (
                <p className="text-xs sm:text-sm text-neutral-500">
                  Insufficient permissions
                </p>
              )}
            </div>
            
            <div className="card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
                Intent Configuration
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-3 sm:mb-4">
                Configure AI intent patterns and responses.
              </p>
              {user?.permissions?.can_manage_intent_config ? (
                <button className="btn-primary w-full sm:w-auto">
                  Configure Intents
                </button>
              ) : (
                <p className="text-xs sm:text-sm text-neutral-500">
                  Insufficient permissions
                </p>
              )}
            </div>
            
            <div className="card p-4 sm:p-6 md:col-span-2 lg:col-span-1">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
                Tester Queue
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-3 sm:mb-4">
                Review and approve tester suggestions.
              </p>
              {(user?.permissions?.is_tester || user?.permissions?.is_admin || user?.permissions?.is_super_admin) ? (
                <button className="btn-primary w-full sm:w-auto">
                  Review Suggestions
                </button>
              ) : (
                <p className="text-xs sm:text-sm text-neutral-500">
                  Insufficient permissions
                </p>
              )}
            </div>
          </div>

          {/* Admin Info - Responsive layout and spacing */}
          <div className="card p-4 sm:p-6 mt-6 sm:mt-8">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-neutral-900 dark:text-neutral-100">
              Your Admin Permissions
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Admin:</span>
                  <span className={user?.permissions?.is_admin ? "text-green-600 font-medium" : "text-red-600"}>
                    {user?.permissions?.is_admin ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Super Admin:</span>
                  <span className={user?.permissions?.is_super_admin ? "text-green-600 font-medium" : "text-red-600"}>
                    {user?.permissions?.is_super_admin ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Manage Users:</span>
                  <span className={user?.permissions?.can_manage_users ? "text-green-600 font-medium" : "text-red-600"}>
                    {user?.permissions?.can_manage_users ? "Yes" : "No"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Tester:</span>
                  <span className={user?.permissions?.is_tester ? "text-green-600 font-medium" : "text-red-600"}>
                    {user?.permissions?.is_tester ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 dark:text-neutral-400">Intent Config:</span>
                  <span className={user?.permissions?.can_manage_intent_config ? "text-green-600 font-medium" : "text-red-600"}>
                    {user?.permissions?.can_manage_intent_config ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <span className="text-neutral-600 dark:text-neutral-400 mb-1 sm:mb-0">Roles:</span>
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium">
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