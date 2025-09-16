// app/admin/configuration/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canManageIntentConfig } from "@/utils/permissions";
import { intentConfigService, IntentConfigVersion } from "@/services/intentConfig";
import { RefreshCw, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfigurationOverview from "@/components/admin/configuration/ConfigurationOverview";
import ConfigurationTabs from "@/components/admin/configuration/ConfigurationTabs";
import SystemHealthAlert from "@/components/admin/configuration/SystemHealthAlert";

interface ConfigOverview {
  activeVersion: IntentConfigVersion | null;
  candidateVersion: IntentConfigVersion | null;
  totalPatterns: number;
  totalTemplates: number;
  enabledPatterns: number;
  enabledTemplates: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  cacheStatus: 'loaded' | 'loading' | 'error';
}

export default function ConfigurationPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<ConfigOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'templates' | 'analytics'>('overview');

  useEffect(() => {
    loadConfigurationOverview();
  }, []);

  const loadConfigurationOverview = async () => {
    try {
      setLoading(true);
      const [versions, stats, health] = await Promise.all([
        intentConfigService.getVersions(),
        intentConfigService.getStats(),
        intentConfigService.getCacheStats().catch(() => ({ status: 'error' }))
      ]);

      const activeVersion = versions.find(v => v.status === 'active') || null;
      const candidateVersion = versions.find(v => v.status === 'candidate') || null;

      setOverview({
        activeVersion,
        candidateVersion,
        totalPatterns: stats.patterns?.total || 0,
        totalTemplates: stats.templates?.total || 0,
        enabledPatterns: stats.patterns?.enabled || 0,
        enabledTemplates: stats.templates?.enabled || 0,
        systemHealth: health.status === 'loaded' ? 'healthy' : 'warning',
        cacheStatus: health.status || 'error'
      });
    } catch (error) {
      console.error('Failed to load configuration overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReloadCache = async () => {
    try {
      await intentConfigService.reloadConfig();
      alert('Configuration cache reloaded successfully');
      loadConfigurationOverview();
    } catch (error) {
      console.error('Failed to reload cache:', error);
      alert('Failed to reload configuration');
    }
  };

  // Check permissions directly instead of using canManageIntentConfig to avoid type issues
  const hasIntentConfigPermission = user?.permissions?.can_manage_intent_config || 
                                   user?.permissions?.is_admin || 
                                   user?.permissions?.is_super_admin;

  if (!hasIntentConfigPermission) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-neutral-600">You don't have permission to manage intent configuration.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading configuration..." />;
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Configuration Management</h1>
          <p className="text-sm sm:text-base text-neutral-600">
            View and manage all intent patterns, templates, and system configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleReloadCache}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Reload Cache</span>
            <span className="sm:hidden">Reload</span>
          </Button>
        </div>
      </div>

      {/* System Health Alert */}
      {overview && overview.systemHealth !== 'healthy' && (
        <SystemHealthAlert cacheStatus={overview.cacheStatus} />
      )}

      {/* Navigation Tabs - Mobile responsive */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 mb-4 sm:mb-6">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          {['overview', 'patterns', 'templates', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === tab
                  ? 'border-[--color-brand] text-[--color-brand]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <ConfigurationTabs 
        activeTab={activeTab}
        overview={overview}
        onOverviewRefresh={loadConfigurationOverview}
      />
    </div>
  );
}