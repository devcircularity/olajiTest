// app/tester/layout.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";

export default function TesterLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check if mobile on mount and window resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    // Check if user has tester permissions directly instead of using canAccessTesterQueue to avoid type issues
    const hasTesterPermission = user.permissions?.is_tester || 
                               user.permissions?.is_admin || 
                               user.permissions?.is_super_admin ||
                               user.roles?.includes("TESTER") ||
                               user.roles?.includes("ADMIN") ||
                               user.roles?.includes("SUPER_ADMIN");

    if (!hasTesterPermission) {
      console.log("🔍 User lacks tester permissions, redirecting...", {
        userRoles: user.roles,
        userPermissions: user.permissions,
      });
      
      // Route based on user's actual role
      if (user.roles?.includes("ADMIN") || user.roles?.includes("SUPER_ADMIN")) {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
      return;
    }
  }, [user, isLoading, isAuthenticated, router]);
  
  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-neutral-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated || !user) {
    return null;
  }
  
  // Check permissions again for render guard
  const hasTesterPermission = user.permissions?.is_tester || 
                             user.permissions?.is_admin || 
                             user.permissions?.is_super_admin ||
                             user.roles?.includes("TESTER") ||
                             user.roles?.includes("ADMIN") ||
                             user.roles?.includes("SUPER_ADMIN");
  
  // Don't render anything while redirecting non-tester users
  if (!hasTesterPermission) {
    return null;
  }
  
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Mobile backdrop */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed top-0 left-0 h-full z-50' : 'relative'}
        ${isMobile && sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}
        transition-transform duration-300 ease-in-out
      `}>
        <WorkspaceSidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          isMobile={isMobile}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar - Shows when sidebar is collapsed on mobile */}
        {isMobile && sidebarCollapsed && (
          <div className="lg:hidden bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Open sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-hidden bg-white dark:bg-neutral-900">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}