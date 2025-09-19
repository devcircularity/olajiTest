// app/admin/layout.tsx
"use client";
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import { HeaderTitleBus } from "@/components/layout/HeaderBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Set the header title for admin section
  useEffect(() => {
    HeaderTitleBus.send({ 
      type: 'set', 
      title: 'Admin Dashboard',
      subtitle: 'Manage AI training data, models, and system configuration' 
    });
    
    // Clean up on unmount
    return () => HeaderTitleBus.send({ type: 'clear' });
  }, []);
  
  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    // Check if user has admin permissions
    const isAdmin = user.roles?.includes("ADMIN") || 
                   user.roles?.includes("SUPER_ADMIN") ||
                   user.permissions?.is_admin ||
                   user.permissions?.is_super_admin;

    // If not admin, redirect based on their role
    if (!isAdmin) {
      console.log("User lacks admin permissions, redirecting...", {
        userRoles: user.roles,
        userPermissions: user.permissions,
      });
      
      // Route based on user's actual role
      if (user.roles?.includes("TESTER")) {
        router.replace("/tester");
      } else {
        router.replace("/dashboard");
      }
      return;
    }
  }, [user, isLoading, isAuthenticated, router]);
  
  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
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
  
  // Check if user has admin permissions
  const isAdmin = user.roles?.includes("ADMIN") || 
                 user.roles?.includes("SUPER_ADMIN") ||
                 user.permissions?.is_admin ||
                 user.permissions?.is_super_admin;
  
  // Don't render anything while redirecting non-admin users
  if (!isAdmin) {
    return null;
  }
  
  // Use the unified WorkspaceShell instead of custom admin layout
  return (
    <WorkspaceShell>
      {children}
    </WorkspaceShell>
  );
}