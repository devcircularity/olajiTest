// app/admin/configuration/components/ConfigurationTabs.tsx
import { useState, useEffect } from "react";
import { intentConfigService, IntentPattern, PromptTemplate, IntentConfigVersion } from "@/services/intentConfig";
import ConfigurationOverview from "./ConfigurationOverview";
import PatternsTab from "./PatternsTab";
import TemplatesTab from "./TemplatesTab";
import AnalyticsTab from "./AnalyticsTab";

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

// Enhanced Pattern interface with phrase support
interface EnhancedIntentPattern extends IntentPattern {
  phrases?: string[];
  regex_confidence?: number;
  regex_explanation?: string;
}

interface EditingItem {
  type: 'pattern' | 'template';
  item: EnhancedIntentPattern | PromptTemplate;
  isNew?: boolean;
}

interface ConfigurationTabsProps {
  activeTab: 'overview' | 'patterns' | 'templates' | 'analytics';
  overview: ConfigOverview | null;
  onOverviewRefresh: () => void;
}

export default function ConfigurationTabs({ 
  activeTab, 
  overview, 
  onOverviewRefresh 
}: ConfigurationTabsProps) {
  const [patterns, setPatterns] = useState<EnhancedIntentPattern[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [availableHandlers, setAvailableHandlers] = useState<string[]>([]);
  const [availableIntents, setAvailableIntents] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);

  useEffect(() => {
    if (overview?.activeVersion) {
      setSelectedVersion(overview.activeVersion.id);
    }
  }, [overview]);

  useEffect(() => {
    loadAvailableOptions();
  }, []);

  useEffect(() => {
    if (selectedVersion && (activeTab === 'patterns' || activeTab === 'templates')) {
      loadCurrentData();
    }
  }, [selectedVersion, activeTab]);

  const loadAvailableOptions = async () => {
    try {
      const [handlersRes, intentsRes] = await Promise.all([
        intentConfigService.getAvailableHandlers(),
        intentConfigService.getAvailableIntents()
      ]);
      setAvailableHandlers(handlersRes.handlers);
      setAvailableIntents(intentsRes.intents);
    } catch (error) {
      console.error('Failed to load available options:', error);
    }
  };

  const loadCurrentData = async () => {
    if (!selectedVersion) return;

    try {
      setLoading(true);
      
      if (activeTab === 'patterns') {
        const data = await intentConfigService.getPatterns(selectedVersion);
        setPatterns(data);
      } else if (activeTab === 'templates') {
        const data = await intentConfigService.getTemplates(selectedVersion);
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    try {
      if (editingItem.type === 'pattern') {
        const pattern = editingItem.item as EnhancedIntentPattern;
        if (editingItem.isNew) {
          await intentConfigService.createPattern(selectedVersion, {
            handler: pattern.handler,
            intent: pattern.intent,
            kind: pattern.kind,
            pattern: pattern.pattern,
            priority: pattern.priority,
            enabled: pattern.enabled,
            scope_school_id: pattern.scope_school_id,
            ...(pattern.phrases && { phrases: pattern.phrases })
          });
        } else {
          await intentConfigService.updatePattern(pattern.id, {
            handler: pattern.handler,
            intent: pattern.intent,
            kind: pattern.kind,
            pattern: pattern.pattern,
            priority: pattern.priority,
            enabled: pattern.enabled,
            scope_school_id: pattern.scope_school_id,
            ...(pattern.phrases && { phrases: pattern.phrases })
          });
        }
      } else {
        const template = editingItem.item as PromptTemplate;
        if (editingItem.isNew) {
          await intentConfigService.createTemplate(selectedVersion, {
            handler: template.handler,
            intent: template.intent,
            template_type: template.template_type,
            template_text: template.template_text,
            enabled: template.enabled
          });
        } else {
          await intentConfigService.updateTemplate(template.id, {
            handler: template.handler,
            intent: template.intent,
            template_type: template.template_type,
            template_text: template.template_text,
            enabled: template.enabled
          });
        }
      }

      setEditingItem(null);
      loadCurrentData();
      onOverviewRefresh();
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save changes');
    }
  };

  if (activeTab === 'overview' && overview) {
    return <ConfigurationOverview overview={overview} />;
  }

  if (activeTab === 'patterns') {
    return (
      <PatternsTab
        patterns={patterns}
        loading={loading}
        selectedVersion={selectedVersion}
        setSelectedVersion={setSelectedVersion}
        overview={overview}
        availableHandlers={availableHandlers}
        availableIntents={availableIntents}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onSaveItem={handleSaveItem}
        onDataChange={loadCurrentData}
      />
    );
  }

  if (activeTab === 'templates') {
    return (
      <TemplatesTab
        templates={templates}
        loading={loading}
        selectedVersion={selectedVersion}
        setSelectedVersion={setSelectedVersion}
        overview={overview}
        availableHandlers={availableHandlers}
        availableIntents={availableIntents}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onSaveItem={handleSaveItem}
        onDataChange={loadCurrentData}
      />
    );
  }

  if (activeTab === 'analytics') {
    return <AnalyticsTab />;
  }

  return null;
}