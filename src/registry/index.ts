import { ComponentContract } from './contracts';

export const COMPONENT_REGISTRY: Record<string, ComponentContract> = {
  SECTION: {
    type: 'SECTION',
    displayName: 'Section',
    category: 'layout',
    icon: 'Layout',
    allowedParents: [], // Root or nested under Container
    allowedChildren: ['CONTAINER', 'GRID', 'STACK', 'STAT_CARD', 'STATUS_CARD', 'DATA_TABLE', 'CHART_PLACEHOLDER', 'BUTTON', 'TABS', 'FORM_SECTION'],
    properties: {
      padding: {
        type: 'enum',
        label: 'Padding Size',
        defaultValue: 'medium',
        options: [
          { label: 'None', value: 'none' },
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
      background: {
        type: 'enum',
        label: 'Background Variant',
        defaultValue: 'default',
        options: [
          { label: 'Default (Light)', value: 'default' },
          { label: 'Accent Muted', value: 'accent' },
        ],
      },
    },
  },
  CONTAINER: {
    type: 'CONTAINER',
    displayName: 'Container',
    category: 'layout',
    icon: 'Box',
    allowedParents: ['SECTION'],
    allowedChildren: ['GRID', 'STACK', 'STAT_CARD', 'STATUS_CARD', 'DATA_TABLE', 'CHART_PLACEHOLDER', 'BUTTON', 'TABS', 'FORM_SECTION'],
    properties: {
      maxWidth: {
        type: 'enum',
        label: 'Max Width',
        defaultValue: 'lg',
        options: [
          { label: 'Medium (md)', value: 'md' },
          { label: 'Large (lg)', value: 'lg' },
          { label: 'Extra Large (xl)', value: 'xl' },
          { label: 'Full Width', value: 'full' },
        ],
      },
    },
  },
  GRID: {
    type: 'GRID',
    displayName: 'Grid Layout',
    category: 'layout',
    icon: 'Grid',
    allowedParents: ['SECTION', 'CONTAINER'],
    allowedChildren: ['STAT_CARD', 'STATUS_CARD', 'DATA_TABLE', 'CHART_PLACEHOLDER', 'BUTTON', 'STACK'],
    properties: {
      columns: {
        type: 'enum',
        label: 'Columns Count',
        defaultValue: 4,
        options: [
          { label: '1 Column', value: 1 },
          { label: '2 Columns', value: 2 },
          { label: '3 Columns', value: 3 },
          { label: '4 Columns', value: 4 },
          { label: '6 Columns', value: 6 },
          { label: '12 Columns', value: 12 },
        ],
      },
      gap: {
        type: 'enum',
        label: 'Gap Spacing',
        defaultValue: 'medium',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
    },
  },
  STACK: {
    type: 'STACK',
    displayName: 'Stack Layout',
    category: 'layout',
    icon: 'Rows',
    allowedParents: ['SECTION', 'CONTAINER', 'GRID'],
    allowedChildren: ['STAT_CARD', 'STATUS_CARD', 'DATA_TABLE', 'CHART_PLACEHOLDER', 'BUTTON', 'STACK', 'TABS', 'FORM_SECTION'],
    properties: {
      direction: {
        type: 'enum',
        label: 'Stack Direction',
        defaultValue: 'vertical',
        options: [
          { label: 'Horizontal (Row)', value: 'horizontal' },
          { label: 'Vertical (Column)', value: 'vertical' },
        ],
      },
      gap: {
        type: 'enum',
        label: 'Gap Spacing',
        defaultValue: 'medium',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
      alignment: {
        type: 'enum',
        label: 'Alignment',
        defaultValue: 'start',
        options: [
          { label: 'Start', value: 'start' },
          { label: 'Center', value: 'center' },
          { label: 'End', value: 'end' },
        ],
      },
    },
  },
  STAT_CARD: {
    type: 'STAT_CARD',
    displayName: 'Stat Card',
    category: 'finance',
    icon: 'TrendingUp',
    allowedParents: ['GRID', 'STACK', 'SECTION', 'CONTAINER'],
    properties: {
      label: {
        type: 'string',
        label: 'Metric Label',
        defaultValue: 'Metric Title',
      },
      value: {
        type: 'string',
        label: 'Value Display',
        defaultValue: '0',
      },
      description: {
        type: 'string',
        label: 'Bottom Description',
        defaultValue: '',
      },
      cardIconName: {
        type: 'enum',
        label: 'Icon',
        defaultValue: 'Shield',
        options: [
          { label: 'None', value: '' },
          { label: 'Shield (Blockers)', value: 'Shield' },
          { label: 'Warning (Issues)', value: 'AlertCircle' },
          { label: 'Check (Success)', value: 'CheckCircle2' },
          { label: 'Document (Report)', value: 'FileText' },
        ],
      },
      change: {
        type: 'string',
        label: 'Percentage',
        defaultValue: '0.0',
      },
      trendText: {
        type: 'string',
        label: 'Trend Text',
        defaultValue: 'vs last month',
      },
      positive: {
        type: 'boolean',
        label: 'Is Positive Trend',
        defaultValue: true,
      },
      showTrendIcon: {
        type: 'boolean',
        label: 'Show Trend Icon',
        defaultValue: true,
      },
      titleColor: {
        type: 'string',
        label: 'Title Color',
        defaultValue: '#64748B',
      },
      valueColor: {
        type: 'string',
        label: 'Value Color',
        defaultValue: '#0F172A',
      },
      trendColor: {
        type: 'string',
        label: 'Trend Color',
        defaultValue: '#64748B',
      },
      descriptionColor: {
        type: 'string',
        label: 'Description Color',
        defaultValue: '#64748B',
      },
      iconColor: {
        type: 'string',
        label: 'Icon Color',
        defaultValue: '#64748B',
      },
      gridSpan: {
        type: 'enum',
        label: 'Grid Column Span',
        defaultValue: 4,
        options: [
          { label: 'Span 1', value: 1 },
          { label: 'Span 2', value: 2 },
          { label: 'Span 3', value: 3 },
          { label: 'Span 4', value: 4 },
          { label: 'Span 6', value: 6 },
          { label: 'Span 12', value: 12 },
        ],
      },
    },
  },
  STATUS_CARD: {
    type: 'STATUS_CARD',
    displayName: 'Status Card',
    category: 'finance',
    icon: 'AlertCircle',
    allowedParents: ['GRID', 'STACK', 'SECTION', 'CONTAINER'],
    properties: {
      status: {
        type: 'enum',
        label: 'Status Level',
        defaultValue: 'pending',
        options: [
          { label: 'Pending (Neutral)', value: 'pending' },
          { label: 'Approved (Success)', value: 'approved' },
          { label: 'Critical (Destructive)', value: 'critical' },
        ],
      },
      title: {
        type: 'string',
        label: 'Status Title',
        defaultValue: 'Status Pending',
      },
      message: {
        type: 'string',
        label: 'Status Message',
        defaultValue: 'Requires administrative action.',
      },
    },
  },
  DATA_TABLE: {
    type: 'DATA_TABLE',
    displayName: 'Data Table',
    category: 'data',
    icon: 'Table',
    allowedParents: ['SECTION', 'CONTAINER', 'STACK'],
    properties: {
      title: {
        type: 'string',
        label: 'Table Title',
        defaultValue: 'Recent Financial Transactions',
      },
      density: {
        type: 'enum',
        label: 'Row Density',
        defaultValue: 'comfortable',
        options: [
          { label: 'Compact', value: 'compact' },
          { label: 'Comfortable', value: 'comfortable' },
        ],
      },
      columns: {
        type: 'json',
        label: 'Columns',
        defaultValue: [
          { key: 'id', label: 'ID', type: 'string' },
          { key: 'type', label: 'Transaction', type: 'string' },
          { key: 'vendor', label: 'Vendor', type: 'string' },
          { key: 'amount', label: 'Amount', type: 'string' },
          { key: 'date', label: 'Date', type: 'string' },
          { key: 'status', label: 'Status', type: 'string' },
        ],
      },
      rows: {
        type: 'json',
        label: 'Rows',
        defaultValue: [
          { id: 'TXN-0941', type: 'Vendor Payout', vendor: 'Vertex Tech Ltd', amount: '₹4,12,500', date: '12 Aug 2026', status: 'Approved' },
          { id: 'TXN-0892', type: 'Tax Retainer', vendor: 'Crest Advisory', amount: '₹75,000', date: '11 Aug 2026', status: 'Pending' },
          { id: 'TXN-0740', type: 'Cloud SaaS', vendor: 'AWS Inc.', amount: '₹2,10,000', date: '09 Aug 2026', status: 'Approved' },
        ],
      },
    },
  },
  CHART_PLACEHOLDER: {
    type: 'CHART_PLACEHOLDER',
    displayName: 'Chart Placeholder',
    category: 'visualization',
    icon: 'BarChart',
    allowedParents: ['SECTION', 'CONTAINER', 'STACK'],
    properties: {
      chartType: {
        type: 'enum',
        label: 'Chart Visualization Type',
        defaultValue: 'bar',
        options: [
          { label: 'Bar Chart', value: 'bar' },
          { label: 'Line Chart', value: 'line' },
          { label: 'Donut Chart', value: 'donut' },
        ],
      },
      height: {
        type: 'enum',
        label: 'Height Variant',
        defaultValue: 'normal',
        options: [
          { label: 'Short', value: 'short' },
          { label: 'Normal', value: 'normal' },
          { label: 'Tall', value: 'tall' },
        ],
      },
    },
  },
  BUTTON: {
    type: 'BUTTON',
    displayName: 'Button',
    category: 'action',
    icon: 'Layers', // Visual layout mapping
    allowedParents: ['SECTION', 'CONTAINER', 'STACK', 'GRID'],
    properties: {
      text: {
        type: 'string',
        label: 'Button Label',
        defaultValue: 'Execute Action',
      },
      variant: {
        type: 'enum',
        label: 'Visual Variant',
        defaultValue: 'primary',
        options: [
          { label: 'Primary Solid', value: 'primary' },
          { label: 'Secondary Subtle', value: 'secondary' },
          { label: 'Destructive Red', value: 'destructive' },
        ],
      },
      size: {
        type: 'enum',
        label: 'Button Size',
        defaultValue: 'normal',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Normal', value: 'normal' },
        ],
      },
      action: {
        type: 'string',
        label: 'Destination (URL / Path)',
        defaultValue: '',
      },
    },
  },
  TABS: {
    type: 'TABS',
    displayName: 'Tabs',
    category: 'layout',
    icon: 'Folder',
    allowedParents: ['SECTION', 'CONTAINER', 'STACK'],
    allowedChildren: ['STACK', 'GRID', 'CONTAINER'],
    properties: {
      tabs: {
        type: 'json',
        label: 'Tab Pages',
        defaultValue: [
          { id: 'tab-1', label: 'Tab 1' },
          { id: 'tab-2', label: 'Tab 2' },
        ],
      },
      activeTabId: {
        type: 'string',
        label: 'Active Tab ID',
        defaultValue: 'tab-1',
      },
    },
  },
  FORM_SECTION: {
    type: 'FORM_SECTION',
    displayName: 'Form Section',
    category: 'layout',
    icon: 'FileText',
    allowedParents: ['SECTION', 'CONTAINER', 'STACK'],
    allowedChildren: ['STAT_CARD', 'STATUS_CARD', 'DATA_TABLE', 'CHART_PLACEHOLDER', 'BUTTON', 'FIELD'],
    properties: {
      title: {
        type: 'string',
        label: 'Section Title',
        defaultValue: 'Section Title',
      },
      actionLabel: {
        type: 'string',
        label: 'Action Label',
        defaultValue: '',
      },
      columnCount: {
        type: 'enum',
        label: 'Column Layout',
        defaultValue: 2,
        options: [
          { label: '1 Column', value: 1 },
          { label: '2 Columns', value: 2 },
        ],
      },
    },
  },
  FIELD: {
    type: 'FIELD',
    displayName: 'Field',
    category: 'data',
    icon: 'Text',
    allowedParents: ['FORM_SECTION'],
    properties: {
      label: {
        type: 'string',
        label: 'Field Label',
        defaultValue: 'Field Label',
      },
      value: {
        type: 'string',
        label: 'Field Value',
        defaultValue: 'Field Value',
      },
      fieldType: {
        type: 'enum',
        label: 'Field Type',
        defaultValue: 'text',
        options: [
          { label: 'Text Input', value: 'text' },
          { label: 'Select Dropdown', value: 'select' },
          { label: 'Status Badge', value: 'status' },
          { label: 'Read Only Text', value: 'readonly' },
        ],
      },
      options: {
        type: 'json',
        label: 'Select Options',
        defaultValue: [
          { value: 'option-1', label: 'Option 1' },
          { value: 'option-2', label: 'Option 2' },
        ],
      },
    },
  },
};
