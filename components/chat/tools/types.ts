// components/chat/tools/types.ts - Updated with button block types

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface KPIItem {
  label: string;
  value: number | string;
  icon?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  format?: string;
  action?: Action;
}

export interface KPIsBlock {
  type: 'kpis';
  items: KPIItem[];
}

export interface ChartSeries {
  name: string;
  data: Record<string, any>[];
}

export interface ChartConfigXY {
  title?: string;
  chartType: 'bar' | 'line' | 'area';
  xField: string;
  yField: string;
  series: ChartSeries[];
  options?: Record<string, any>;
}

export interface ChartConfigPie {
  title?: string;
  chartType: 'pie' | 'donut';
  labelField: string;
  valueField: string;
  data: Record<string, any>[];
  options?: Record<string, any>;
}

export interface ChartBlock {
  type: 'chart';
  config: ChartConfigXY | ChartConfigPie;
}

export interface TableColumn {
  key: string;
  label: string;
  width?: number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: string;
  badge?: Record<string, any>;
}

export interface TablePagination {
  mode: 'client' | 'server';
  page: number;
  pageSize: number;
  total?: number;
  nextCursor?: string;
}

export interface TableAction {
  label: string;
  type: 'export' | 'mutation' | 'route' | 'query';
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  format?: string;
  selectionRequired?: boolean;
  payload?: Record<string, any>;
  target?: string;
}

export interface TableFilter {
  type: 'select' | 'text' | 'daterange' | 'number';
  key: string;
  label: string;
  options?: (string | Record<string, any>)[];
}

export interface TableConfig {
  title?: string;
  columns: TableColumn[];
  rows: Record<string, any>[];
  pagination?: TablePagination;
  actions?: TableAction[];
  filters?: TableFilter[];
}

export interface TableBlock {
  type: 'table';
  config: TableConfig;
}

export interface TimelineItem {
  time: string;
  icon?: string;
  title: string;
  subtitle?: string;
  meta?: Record<string, any>;
}

export interface TimelineBlock {
  type: 'timeline';
  items: TimelineItem[];
}

export interface EmptyBlock {
  type: 'empty';
  title: string;
  hint?: string;
}

export interface ErrorBlock {
  type: 'error';
  title: string;
  detail?: string;
}

export interface FileDownloadBlock {
  type: 'file_download';
  fileName: string;
  endpoint: string;
  expiresAt?: string;
}

export interface StatusItem {
  label: string;
  state: 'ok' | 'warning' | 'error' | 'unknown';
  detail?: string;
}

export interface StatusBlock {
  type: 'status';
  items: StatusItem[];
}

// NEW: Button block types

export interface Action {
  type: 'query' | 'mutation' | 'route' | 'confirm' | 'download';
  payload?: Record<string, any>;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  target?: string;
}

export interface ButtonItem {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  action: Action;
}

export interface ButtonBlock {
  type: 'button';
  button: ButtonItem;
}

export interface ButtonGroupBlock {
  type: 'button_group';
  buttons: ButtonItem[];
  layout?: 'horizontal' | 'vertical';
  align?: 'left' | 'center' | 'right';
}

export interface ConfirmationDialog {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning';
}

export interface ConfirmationButton extends Omit<ButtonItem, 'action'> {
  dialog: ConfirmationDialog;
  action: Action;
}

export interface ConfirmationBlock {
  type: 'confirmation';
  button: ConfirmationButton;
}

export interface ActionPanelItem {
  title: string;
  description?: string;
  icon?: string;
  button: ButtonItem;
}

export interface ActionPanelBlock {
  type: 'action_panel';
  title?: string;
  items: ActionPanelItem[];
  columns?: 1 | 2 | 3;
}

// Main Block union type (updated)
export type Block = 
  | TextBlock 
  | KPIsBlock 
  | ChartBlock 
  | TableBlock 
  | TimelineBlock
  | EmptyBlock 
  | ErrorBlock 
  | FileDownloadBlock 
  | StatusBlock
  | ButtonBlock
  | ButtonGroupBlock
  | ConfirmationBlock
  | ActionPanelBlock;

// Type guards for chart configs (MISSING - ADDED HERE)
export const isSeriesChartConfig = (config: ChartConfigXY | ChartConfigPie): config is ChartConfigXY => {
  return config.chartType === 'bar' || config.chartType === 'line' || config.chartType === 'area';
};

export const isPieChartConfig = (config: ChartConfigXY | ChartConfigPie): config is ChartConfigPie => {
  return config.chartType === 'pie' || config.chartType === 'donut';
};

// Type guards for new blocks
export const isButtonBlock = (block: Block): block is ButtonBlock => 
  block.type === 'button';

export const isButtonGroupBlock = (block: Block): block is ButtonGroupBlock => 
  block.type === 'button_group';

export const isConfirmationBlock = (block: Block): block is ConfirmationBlock => 
  block.type === 'confirmation';

export const isActionPanelBlock = (block: Block): block is ActionPanelBlock => 
  block.type === 'action_panel';

// Existing type guards (for reference)
export const isTextBlock = (block: Block): block is TextBlock => 
  block.type === 'text';

export const isKPIsBlock = (block: Block): block is KPIsBlock => 
  block.type === 'kpis';

export const isChartBlock = (block: Block): block is ChartBlock => 
  block.type === 'chart';

export const isTableBlock = (block: Block): block is TableBlock => 
  block.type === 'table';

export const isTimelineBlock = (block: Block): block is TimelineBlock => 
  block.type === 'timeline';

export const isEmptyBlock = (block: Block): block is EmptyBlock => 
  block.type === 'empty';

export const isErrorBlock = (block: Block): block is ErrorBlock => 
  block.type === 'error';

export const isFileDownloadBlock = (block: Block): block is FileDownloadBlock => 
  block.type === 'file_download';

export const isStatusBlock = (block: Block): block is StatusBlock => 
  block.type === 'status';