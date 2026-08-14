import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { PageDocument, DocumentNode } from '../types/document';
import { findNode, findParentNode, duplicateSubtree, isDescendant, generateId } from '../utils/layoutUtils';

// Default mock pages database
const initialPages: Record<string, PageDocument> = {
  'finance-overview': {
    id: 'finance-overview',
    name: 'Finance Overview',
    type: 'Dashboard',
    description: 'Enterprise financial overview dashboard displaying core operational layout metrics.',
    status: 'Published',
    version: 1,
    layout: {
      id: 'root-section-overview',
      type: 'SECTION',
      props: {
        padding: 'medium',
        background: 'default',
      },
      children: [
        {
          id: 'overview-container',
          type: 'CONTAINER',
          props: {
            maxWidth: 'xl',
          },
          children: [
            {
              id: 'metrics-grid',
              type: 'GRID',
              props: {
                columns: 12,
                gap: 'medium',
              },
              children: [
                {
                  id: 'stat-revenue',
                  type: 'STAT_CARD',
                  props: {
                    label: 'Total Revenue',
                    value: '₹2.4M',
                    change: '+12.4%',
                    positive: true,
                    cardIconName: 'CheckCircle2',
                    gridSpan: 4,
                  },
                },
                {
                  id: 'stat-approvals',
                  type: 'STAT_CARD',
                  props: {
                    label: 'Pending Approvals',
                    value: '₹450K',
                    change: '-4.2%',
                    positive: false,
                    cardIconName: 'Shield',
                    gridSpan: 4,
                  },
                },
                {
                  id: 'stat-pos',
                  type: 'STAT_CARD',
                  props: {
                    label: 'Active Purchase Orders',
                    value: '85',
                    change: '+8.3%',
                    positive: true,
                    cardIconName: 'AlertCircle',
                    gridSpan: 4,
                  },
                },
                {
                  id: 'compliance-alert',
                  type: 'STATUS_CARD',
                  props: {
                    status: 'pending',
                    title: 'Compliance Review Required',
                    message: '2 vendor invoices are currently pending reconciliation approval.',
                    gridSpan: 12,
                  },
                },
              ],
            },
            {
              id: 'chart-stack',
              type: 'STACK',
              props: {
                direction: 'vertical',
                gap: 'medium',
                alignment: 'start',
              },
              children: [
                {
                  id: 'revenue-chart',
                  type: 'CHART_PLACEHOLDER',
                  props: {
                    chartType: 'bar',
                    height: 'normal',
                  },
                },
              ],
            },
            {
              id: 'table-stack',
              type: 'STACK',
              props: {
                direction: 'vertical',
                gap: 'medium',
                alignment: 'start',
              },
              children: [
                {
                  id: 'transactions-table',
                  type: 'DATA_TABLE',
                  props: {
                    title: 'Recent Financial Transactions',
                    density: 'comfortable',
                  },
                },
                {
                  id: 'reconciliation-btn',
                  type: 'BUTTON',
                  props: {
                    text: 'Run Reconciliation Scanner',
                    variant: 'primary',
                    size: 'normal',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  'transaction-hub': {
    id: 'transaction-hub',
    name: 'Transaction Hub',
    type: 'Workspace',
    description: 'Operational sync workspace for processing and reconciling financial payouts.',
    status: 'Draft',
    version: 1,
    layout: {
      id: 'root-section-hub',
      type: 'SECTION',
      props: {
        padding: 'medium',
        background: 'default',
      },
      children: [
        {
          id: 'hub-container',
          type: 'CONTAINER',
          props: {
            maxWidth: 'lg',
          },
          children: [
            {
              id: 'hub-grid',
              type: 'GRID',
              props: {
                columns: 12,
                gap: 'medium',
              },
              children: [
                {
                  id: 'stat-total-txns',
                  type: 'STAT_CARD',
                  props: {
                    label: 'Total Transactions',
                    value: '25,482',
                    change: '+14.2%',
                    positive: true,
                    cardIconName: 'FileText',
                    gridSpan: 6,
                  },
                },
                {
                  id: 'stat-failed-txns',
                  type: 'STAT_CARD',
                  props: {
                    label: 'Failed Payouts',
                    value: '14',
                    change: '-50.0%',
                    positive: true,
                    cardIconName: 'AlertCircle',
                    gridSpan: 6,
                  },
                },
              ],
            },
            {
              id: 'hub-stack',
              type: 'STACK',
              props: {
                direction: 'vertical',
                gap: 'medium',
                alignment: 'start',
              },
              children: [
                {
                  id: 'hub-sync-btn',
                  type: 'BUTTON',
                  props: {
                    text: 'Refresh Hub Status',
                    variant: 'secondary',
                    size: 'normal',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  'accounts-payable': {
    id: 'accounts-payable',
    name: 'Accounts Payable',
    type: 'Dashboard',
    description: 'Tracking metrics ledger for pending, reconciled, and audited vendor invoice records.',
    status: 'Published',
    version: 1,
    layout: {
      id: 'root-section-ap',
      type: 'SECTION',
      props: {
        padding: 'medium',
        background: 'default',
      },
      children: [
        {
          id: 'ap-container',
          type: 'CONTAINER',
          props: {
            maxWidth: 'xl',
          },
          children: [
            {
              id: 'ap-table',
              type: 'DATA_TABLE',
              props: {
                title: 'Accounts Payable Ledger',
                density: 'comfortable',
              },
            },
          ],
        },
      ],
    },
  },
  'accounts-receivable': {
    id: 'accounts-receivable',
    name: 'Accounts Receivable',
    type: 'Workspace',
    description: 'Operational analytics view displaying customer payout donut graphs and invoice summaries.',
    status: 'Draft',
    version: 1,
    layout: {
      id: 'root-section-ar',
      type: 'SECTION',
      props: {
        padding: 'medium',
        background: 'default',
      },
      children: [
        {
          id: 'ar-container',
          type: 'CONTAINER',
          props: {
            maxWidth: 'lg',
          },
          children: [
            {
              id: 'ar-stack',
              type: 'STACK',
              props: {
                direction: 'vertical',
                gap: 'medium',
                alignment: 'center',
              },
              children: [
                {
                  id: 'ar-chart',
                  type: 'CHART_PLACEHOLDER',
                  props: {
                    chartType: 'donut',
                    height: 'normal',
                  },
                },
                {
                  id: 'ar-pdf-btn',
                  type: 'BUTTON',
                  props: {
                    text: 'Export Ledger PDF',
                    variant: 'primary',
                    size: 'normal',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },
};

export interface DragState {
  isDragging: boolean;
  sourceType: 'library' | 'canvas' | null;
  sourceNodeId?: string;
  componentType?: string;
  targetNodeId: string | null;
  targetParentId: string | null;
  dropIntent: 'before' | 'after' | 'inside' | null;
  isValid: boolean;
}

const defaultDragState: DragState = {
  isDragging: false,
  sourceType: null,
  sourceNodeId: undefined,
  componentType: undefined,
  targetNodeId: null,
  targetParentId: null,
  dropIntent: null,
  isValid: false,
};

interface EditorState {
  pages: Record<string, PageDocument>;
  activePageId: string | null;
  selectedNodeId: string | null;
  previewMode: boolean;
  
  // Drag state
  dragState: DragState;
  
  // History stack
  past: PageDocument[];
  future: PageDocument[];
  
  // Actions
  loadPage: (pageId: string | null) => void;
  createPage: (name: string, type: string) => string;
  selectNode: (id: string | null) => void;
  setPreviewMode: (previewMode: boolean) => void;
  
  // Mutations
  updateNodeProps: (id: string, props: Record<string, any>) => void;
  renameNode: (nodeId: string, customLabel: string | undefined) => void;
  updatePageMetadata: (pageId: string, metadata: { name?: string; description?: string; status?: 'Draft' | 'Under Review' | 'Published' }) => void;
  addNode: (parentId: string, node: Omit<DocumentNode, 'id'> & { id?: string }, index?: number) => void;
  updateNodeChildren: (id: string, children: DocumentNode[]) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  moveNode: (nodeId: string, targetParentId: string, index: number, intent: 'before' | 'after' | 'inside') => void;
  
  // Drag operations
  setDragState: (drag: Partial<DragState>) => void;
  resetDragState: () => void;
  
  // Zoom operations
  zoom: number;
  zoomMode: 'manual' | 'fit';
  setZoom: (zoom: number) => void;
  setZoomOnly: (zoom: number) => void;
  setZoomMode: (mode: 'manual' | 'fit') => void;
  
  // History operations
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    pages: initialPages,
    activePageId: null,
    selectedNodeId: null,
    previewMode: false,
    zoom: 100,
    zoomMode: 'manual',
    dragState: defaultDragState,
    past: [],
    future: [],

    loadPage: (pageId) =>
      set((state) => {
        state.activePageId = pageId;
        state.selectedNodeId = null;
        state.previewMode = false;
        state.past = [];
        state.future = [];
        state.zoom = 100;
        state.zoomMode = 'manual';
      }),

    createPage: (name, type) => {
      const pageId = `page_${Math.random().toString(36).substring(2, 9)}`;
      
      const newPage: PageDocument = {
        id: pageId,
        name: name || 'New Page',
        type: type || 'Page',
        description: '',
        status: 'Draft',
        version: 1,
        layout: {
          id: `root-section-${pageId}`,
          type: 'SECTION',
          props: {
            padding: 'medium',
            background: 'default',
          },
          children: [
            {
              id: `container-${pageId}`,
              type: 'CONTAINER',
              props: {
                maxWidth: 'lg',
              },
              children: [],
            }
          ],
        },
      };

      set((state) => {
        state.pages[pageId] = newPage;
      });

      return pageId;
    },

    selectNode: (id) =>
      set((state) => {
        state.selectedNodeId = id;
      }),

    setPreviewMode: (previewMode) =>
      set((state) => {
        state.previewMode = previewMode;
      }),

    setDragState: (drag) =>
      set((state) => {
        state.dragState = { ...state.dragState, ...drag };
      }),

    resetDragState: () =>
      set((state) => {
        state.dragState = defaultDragState;
      }),

    setZoom: (zoom) =>
      set((state) => {
        state.zoom = Math.max(50, Math.min(100, zoom));
        state.zoomMode = 'manual';
      }),

    setZoomOnly: (zoom) =>
      set((state) => {
        state.zoom = Math.max(50, Math.min(100, zoom));
      }),

    setZoomMode: (mode) =>
      set((state) => {
        state.zoomMode = mode;
      }),

    commitHistory: () =>
      set((state) => {
        const pageId = state.activePageId;
        if (!pageId || !state.pages[pageId]) return;
        state.past.push(JSON.parse(JSON.stringify(state.pages[pageId])));
        state.future = []; // Clear redo stack on mutation
      }),

    undo: () =>
      set((state) => {
        const pageId = state.activePageId;
        if (!pageId || !state.pages[pageId] || state.past.length === 0) return;

        const previous = state.past.pop()!;
        state.future.push(JSON.parse(JSON.stringify(state.pages[pageId])));
        state.pages[pageId] = previous;
        state.selectedNodeId = null;
      }),

    redo: () =>
      set((state) => {
        const pageId = state.activePageId;
        if (!pageId || !state.pages[pageId] || state.future.length === 0) return;

        const next = state.future.pop()!;
        state.past.push(JSON.parse(JSON.stringify(state.pages[pageId])));
        state.pages[pageId] = next;
        state.selectedNodeId = null;
      }),

    updateNodeProps: (id, props) =>
      set((state) => {
        const pageId = state.activePageId;
        if (!pageId || !state.pages[pageId]) return;
        updateNodeInTree(state.pages[pageId].layout, id, props);
      }),

    updateNodeChildren: (id, children) =>
      set((state) => {
        const pageId = state.activePageId;
        if (!pageId || !state.pages[pageId]) return;

        const activePage = state.pages[pageId];
        state.past.push(JSON.parse(JSON.stringify(activePage)));
        state.future = [];

        updateNodeChildrenInTree(activePage.layout, id, children);
      }),

    addNode: (parentId, node, index) =>
      set((state) => {
        const pageId = state.activePageId;
        if (!pageId || !state.pages[pageId]) return;

        const activePage = state.pages[pageId];
        state.past.push(JSON.parse(JSON.stringify(activePage)));
        state.future = [];

        const nodeChildren = node.children ? [...node.children] : [];
        if (node.type === "TABS" && nodeChildren.length === 0) {
          nodeChildren.push(
            {
              id: generateId("STACK"),
              type: "STACK",
              props: {
                direction: "vertical",
                gap: "medium",
                alignment: "start",
              },
              children: [],
            },
            {
              id: generateId("STACK"),
              type: "STACK",
              props: {
                direction: "vertical",
                gap: "medium",
                alignment: "start",
              },
              children: [],
            }
          );
        }

        const fullNode: DocumentNode = {
          id: node.id || generateId(node.type),
          type: node.type,
          props: node.props,
          children: nodeChildren,
        };

        const activeLayout = activePage.layout;
        if (activeLayout.id === parentId) {
          if (!activeLayout.children) activeLayout.children = [];
          if (typeof index === 'number') {
            activeLayout.children.splice(index, 0, fullNode);
          } else {
            activeLayout.children.push(fullNode);
          }
        } else {
          // Recursive insert
          const parent = findNode(activeLayout, parentId);
          if (parent) {
            if (!parent.children) parent.children = [];
            if (typeof index === 'number') {
              parent.children.splice(index, 0, fullNode);
            } else {
              parent.children.push(fullNode);
            }
          }
        }
      }),

    removeNode: (id) =>
      set((state) => {
        const pageId = state.activePageId;
        if (!pageId || !state.pages[pageId]) return;

        const activePage = state.pages[pageId];
        if (activePage.layout.id === id) return; // Prevent root delete

        state.past.push(JSON.parse(JSON.stringify(activePage)));
        state.future = [];

        const parentNode = findParentNode(activePage.layout, id);
        if (parentNode && parentNode.children) {
          const idx = parentNode.children.findIndex((c) => c.id === id);
          if (idx !== -1) {
            parentNode.children.splice(idx, 1);
          }
        }

        if (state.selectedNodeId === id) {
          state.selectedNodeId = null;
        }
      }),

    duplicateNode: (id) =>
      set((state) => {
        const pageId = state.activePageId;
        if (!pageId || !state.pages[pageId]) return;

        const activePage = state.pages[pageId];
        if (activePage.layout.id === id) return; // Prevent root duplicate

        state.past.push(JSON.parse(JSON.stringify(activePage)));
        state.future = [];

        const parentNode = findParentNode(activePage.layout, id);
        if (parentNode && parentNode.children) {
          const idx = parentNode.children.findIndex((c) => c.id === id);
          if (idx !== -1) {
            const originalNode = parentNode.children[idx];
            const duplicate = duplicateSubtree(originalNode);
            parentNode.children.splice(idx + 1, 0, duplicate);
            state.selectedNodeId = duplicate.id; // Select clone
          }
        }
      }),

    moveNode: (nodeId, targetParentId, index, intent) =>
      set((state) => {
        const pageId = state.activePageId;
        if (!pageId || !state.pages[pageId]) return;

        const activePage = state.pages[pageId];
        const nodeToMove = findNode(activePage.layout, nodeId);
        if (!nodeToMove) return;

        // Prevent invalid recursive move
        if (isDescendant(nodeToMove, targetParentId)) return;

        state.past.push(JSON.parse(JSON.stringify(activePage)));
        state.future = [];

        // Remove from old parent
        const oldParent = findParentNode(activePage.layout, nodeId);
        if (oldParent && oldParent.children) {
          const idx = oldParent.children.findIndex((c) => c.id === nodeId);
          if (idx !== -1) {
            oldParent.children.splice(idx, 1);
          }
        }

        // Insert into target parent
        const targetParent = findNode(activePage.layout, targetParentId);
        if (targetParent) {
          if (!targetParent.children) targetParent.children = [];
          
          let insertIndex = index;
          if (intent === 'inside') {
            insertIndex = targetParent.children.length;
          }
          
          targetParent.children.splice(insertIndex, 0, nodeToMove);
        }
      }),

    renameNode: (nodeId, customLabel) =>
      set((state) => {
        const pageId = state.activePageId;
        if (!pageId || !state.pages[pageId]) return;

        const activePage = state.pages[pageId];
        state.past.push(JSON.parse(JSON.stringify(activePage)));
        state.future = [];

        const targetNode = findNode(activePage.layout, nodeId);
        if (targetNode) {
          targetNode.customLabel = customLabel || undefined;
        }
      }),

    updatePageMetadata: (pageId, metadata) =>
      set((state) => {
        if (!state.pages[pageId]) return;
        
        state.past.push(JSON.parse(JSON.stringify(state.pages[pageId])));
        state.future = [];

        const page = state.pages[pageId];
        if (metadata.name !== undefined) page.name = metadata.name;
        if (metadata.description !== undefined) page.description = metadata.description;
        if (metadata.status !== undefined) page.status = metadata.status;
      }),
  }))
);

// Private helper for mutation recursion
const updateNodeInTree = (node: DocumentNode, id: string, updatedProps: Record<string, any>): boolean => {
  if (node.id === id) {
    node.props = { ...node.props, ...updatedProps };
    return true;
  }
  if (node.children) {
    for (const child of node.children) {
      if (updateNodeInTree(child, id, updatedProps)) return true;
    }
  }
  return false;
};

const updateNodeChildrenInTree = (node: DocumentNode, id: string, children: DocumentNode[]): boolean => {
  if (node.id === id) {
    node.children = children;
    return true;
  }
  if (node.children) {
    for (const child of node.children) {
      if (updateNodeChildrenInTree(child, id, children)) return true;
    }
  }
  return false;
};
