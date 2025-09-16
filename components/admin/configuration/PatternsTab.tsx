// app/admin/configuration/components/PatternsTab.tsx
import { useState } from "react";
import { Plus, Search, Info, Edit, Trash2, Eye } from "lucide-react";
import { intentConfigService, IntentPattern, IntentConfigVersion } from "@/services/intentConfig";
import Button from "@/components/ui/Button";
import DataTable, { TableColumn, TableAction } from "@/components/ui/DataTable";
import PatternEditModal from "./PatternEditModal";

// Enhanced Pattern interface with phrase support
interface EnhancedIntentPattern extends IntentPattern {
  phrases?: string[];
  regex_confidence?: number;
  regex_explanation?: string;
}

interface EditingItem {
  type: 'pattern' | 'template';
  item: EnhancedIntentPattern | any;
  isNew?: boolean;
}

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

interface PatternsTabProps {
  patterns: EnhancedIntentPattern[];
  loading: boolean;
  selectedVersion: string;
  setSelectedVersion: (version: string) => void;
  overview: ConfigOverview | null;
  availableHandlers: string[];
  availableIntents: string[];
  editingItem: EditingItem | null;
  setEditingItem: (item: EditingItem | null) => void;
  onSaveItem: () => void;
  onDataChange: () => void;
}

export default function PatternsTab({
  patterns,
  loading,
  selectedVersion,
  setSelectedVersion,
  overview,
  availableHandlers,
  availableIntents,
  editingItem,
  setEditingItem,
  onSaveItem,
  onDataChange
}: PatternsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHandler, setFilterHandler] = useState<string>('');
  const [filterIntent, setFilterIntent] = useState<string>('');

  const filteredPatterns = patterns.filter(pattern => {
    const matchesSearch = !searchTerm || 
      pattern.pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.handler.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.intent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pattern.phrases && pattern.phrases.some(phrase => 
        phrase.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesHandler = !filterHandler || pattern.handler === filterHandler;
    const matchesIntent = !filterIntent || pattern.intent === filterIntent;
    
    return matchesSearch && matchesHandler && matchesIntent;
  });

  const handleAddPattern = () => {
    setEditingItem({
      type: 'pattern',
      item: {
        id: '',
        handler: '',
        intent: '',
        kind: 'positive',
        pattern: '',
        priority: 100,
        enabled: true,
        scope_school_id: undefined,
        created_at: '',
        updated_at: '',
        phrases: ['']
      } as EnhancedIntentPattern,
      isNew: true
    });
  };

  const handleDeletePattern = async (pattern: EnhancedIntentPattern) => {
    if (confirm('Are you sure you want to delete this pattern?')) {
      try {
        await intentConfigService.deletePattern(pattern.id);
        onDataChange();
      } catch (error) {
        console.error('Failed to delete pattern:', error);
        alert('Failed to delete pattern');
      }
    }
  };

  // Enhanced pattern columns with phrase support
  const patternColumns: TableColumn<EnhancedIntentPattern>[] = [
    {
      key: 'handler',
      label: 'Handler',
      render: (handler: string) => (
        <code className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          {handler}
        </code>
      ),
      width: '120px',
    },
    {
      key: 'intent',
      label: 'Intent',
      render: (intent: string) => (
        <span className="text-xs sm:text-sm font-medium">{intent}</span>
      ),
      width: '100px',
    },
    {
      key: 'kind',
      label: 'Kind',
      render: (kind: string) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
            kind === 'positive' ? 'bg-green-100 text-green-800' :
            kind === 'negative' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}
        >
          {kind}
        </span>
      ),
      width: '80px',
    },
    {
      key: 'phrases',
      label: 'Phrases',
      render: (phrases: string[], pattern: EnhancedIntentPattern) => {
        if (phrases && phrases.length > 0) {
          return (
            <div className="max-w-xs sm:max-w-md">
              <div className="flex flex-wrap gap-1 mb-1">
                {phrases.slice(0, 2).map((phrase, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                    "{phrase}"
                  </span>
                ))}
                {phrases.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{phrases.length - 2} more
                  </span>
                )}
              </div>
              {pattern.regex_confidence && (
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-xs px-1 py-0.5 rounded ${
                    pattern.regex_confidence >= 0.8 ? 'bg-green-100 text-green-700' :
                    pattern.regex_confidence >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {Math.round(pattern.regex_confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          );
        }
        
        // Fallback to showing regex pattern
        return (
          <div className="max-w-xs sm:max-w-md">
            <code className="text-xs bg-neutral-50 dark:bg-neutral-800 p-1 rounded block truncate" title={pattern.pattern}>
              {pattern.pattern}
            </code>
            <span className="text-xs text-gray-500">Raw regex</span>
          </div>
        );
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      width: '80px',
      render: (priority: number) => (
        <span className="text-xs sm:text-sm">{priority}</span>
      ),
    },
    {
      key: 'enabled',
      label: 'Status',
      render: (enabled: boolean) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      ),
      width: '80px',
    },
  ];

  const patternActions: TableAction<EnhancedIntentPattern>[] = [
    {
      label: 'View',
      icon: <Eye size={14} />,
      onClick: (item) => setEditingItem({ type: 'pattern', item, isNew: false }),
      variant: 'secondary',
    },
    {
      label: 'Edit',
      icon: <Edit size={14} />,
      onClick: (item) => setEditingItem({ type: 'pattern', item, isNew: false }),
      variant: 'primary',
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      onClick: handleDeletePattern,
      variant: 'danger',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Version Selector and Filters - Mobile responsive */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 lg:gap-4 lg:items-center">
          <div className="min-w-0">
            <label className="block text-xs sm:text-sm font-medium mb-1">Configuration Version</label>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="input w-full sm:w-48 text-sm"
            >
              {overview?.activeVersion && (
                <option value={overview.activeVersion.id}>
                  {overview.activeVersion.name} (Active)
                </option>
              )}
              {overview?.candidateVersion && (
                <option value={overview.candidateVersion.id}>
                  {overview.candidateVersion.name} (Candidate)
                </option>
              )}
            </select>
          </div>
          
          <div className="min-w-0">
            <label className="block text-xs sm:text-sm font-medium mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patterns..."
                className="input pl-10 w-full sm:w-64 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 lg:flex lg:gap-4">
            <div className="min-w-0">
              <label className="block text-xs sm:text-sm font-medium mb-1">Handler</label>
              <select
                value={filterHandler}
                onChange={(e) => setFilterHandler(e.target.value)}
                className="input w-full sm:w-40 text-sm"
              >
                <option value="">All Handlers</option>
                {availableHandlers.map(handler => (
                  <option key={handler} value={handler}>{handler}</option>
                ))}
              </select>
            </div>
            
            <div className="min-w-0">
              <label className="block text-xs sm:text-sm font-medium mb-1">Intent</label>
              <select
                value={filterIntent}
                onChange={(e) => setFilterIntent(e.target.value)}
                className="input w-full sm:w-40 text-sm"
              >
                <option value="">All Intents</option>
                {availableIntents.map(intent => (
                  <option key={intent} value={intent}>{intent}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="lg:ml-auto">
            <Button 
              onClick={handleAddPattern}
              className="flex items-center gap-2 w-full sm:w-auto text-sm"
            >
              <Plus size={16} />
              Add Pattern
            </Button>
          </div>
        </div>
      </div>

      {/* Info card for patterns showing phrase support */}
      <div className="card p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-200">
              Phrase-Friendly Patterns
            </h4>
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
              Patterns now support friendly phrases like "show student details" that are automatically converted to regex. 
              You can create patterns using natural language instead of complex regex expressions.
            </p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredPatterns}
        columns={patternColumns}
        actions={patternActions}
        loading={loading}
        emptyMessage="No patterns found"
        className="overflow-x-auto"
      />

      {/* Edit Modal */}
      {editingItem && editingItem.type === 'pattern' && (
        <PatternEditModal
          item={editingItem}
          availableHandlers={availableHandlers}
          availableIntents={availableIntents}
          onSave={onSaveItem}
          onClose={() => setEditingItem(null)}
          onChange={setEditingItem}
        />
      )}
    </div>
  );
}