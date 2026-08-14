"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { COMPONENT_REGISTRY } from "@/registry";
import { ComponentContract } from "@/registry/contracts";
import { useEditorStore } from "@/store/editorStore";
import { findNode, findParentNode, isValidNesting } from "@/utils/layoutUtils";
import * as Icons from "lucide-react";

// Helper to resolve icon from name string
export function getComponentIcon(iconName: string, size = 14) {
  const IconComponent = (Icons as any)[iconName];
  if (IconComponent) {
    return <IconComponent size={size} />;
  }
  return <Icons.HelpCircle size={size} />;
}

// Compact descriptions for components
const COMPONENT_DESCRIPTIONS: Record<string, string> = {
  SECTION: "Full-width content block with layout padding options.",
  CONTAINER: "Max-width wrapper to center and restrict grid size.",
  GRID: "Flexible 12-column responsive layout engine.",
  STACK: "Flexbox structure for rows or columns layout.",
  STAT_CARD: "Financial indicator card showing metrics and trends.",
  STATUS_CARD: "Visual banner for critical actions or approvals.",
  DATA_TABLE: "Tabular display of mock transactions.",
  CHART_PLACEHOLDER: "Line, bar, or donut trend graph representation.",
  BUTTON: "Executable click event selector.",
  TABS: "Horizontal tabs panel to toggle container contents.",
  FORM_SECTION: "Semantic enterprise card grid to layout form components.",
  FIELD: "A single informational or editable form field label and value.",
};

// Draggable wrapper component for Library items
function DraggableItem({ type, children }: { type: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library::${type}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing select-none transition-opacity ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      {children}
    </div>
  );
}

export default function ComponentLibrary() {
  const { pages, activePageId, selectedNodeId, addNode } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [insertContext, setInsertContext] = useState<{
    compType: string;
    targetNodeId: string;
    allowedOptions: { label: string; action: () => void }[];
  } | null>(null);

  const allComponents = Object.values(COMPONENT_REGISTRY);

  // Filter components by search query
  const filteredComponents = allComponents.filter((comp) =>
    comp.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const categories: Record<string, ComponentContract[]> = {
    layout: [],
    finance: [],
    data: [],
    visualization: [],
    action: [],
  };

  filteredComponents.forEach((comp) => {
    if (categories[comp.category]) {
      categories[comp.category].push(comp);
    }
  });

  const categoryLabels: Record<string, string> = {
    layout: "Layout & Spacing",
    finance: "Financial Operations",
    data: "Data Presentation",
    visualization: "Analytics & Charts",
    action: "Interactive Actions",
  };

  // Handle explicit non-drag component insertion clicks
  const handleCardClick = (compType: string) => {
    if (!activePageId || !pages[activePageId]) return;
    
    if (!selectedNodeId) {
      alert("Please select a target component on the canvas or hierarchy tree first to insert.");
      return;
    }

    const activePage = pages[activePageId];
    const selectedNode = findNode(activePage.layout, selectedNodeId);
    if (!selectedNode) return;

    const allowedOptions: { label: string; action: () => void }[] = [];
    const parentNode = findParentNode(activePage.layout, selectedNodeId);

    // Resolve default props map
    const registryEntry = COMPONENT_REGISTRY[compType];
    const defaultProps: Record<string, any> = {};
    if (registryEntry) {
      Object.entries(registryEntry.properties).forEach(([propKey, propSchema]) => {
        defaultProps[propKey] = propSchema.defaultValue;
      });
    }

    // A. "Insert Inside" container option
    const isContainer = ["SECTION", "CONTAINER", "GRID", "STACK"].includes(selectedNode.type);
    if (isContainer && isValidNesting(compType, selectedNode.type)) {
      allowedOptions.push({
        label: `Insert inside "${registryEntry?.displayName || selectedNode.type}"`,
        action: () => {
          addNode(selectedNodeId, {
            type: compType,
            props: defaultProps,
          });
        },
      });
    }

    // B. "Insert Before / After" sibling options
    if (parentNode && isValidNesting(compType, parentNode.type)) {
      const siblingIndex = parentNode.children ? parentNode.children.findIndex((c) => c.id === selectedNodeId) : 0;

      allowedOptions.push({
        label: `Insert before "${selectedNode.type.toLowerCase().replace('_', ' ')}"`,
        action: () => {
          addNode(parentNode.id, {
            type: compType,
            props: defaultProps,
          }, siblingIndex);
        },
      });

      allowedOptions.push({
        label: `Insert after "${selectedNode.type.toLowerCase().replace('_', ' ')}"`,
        action: () => {
          addNode(parentNode.id, {
            type: compType,
            props: defaultProps,
          }, siblingIndex + 1);
        },
      });
    }

    if (allowedOptions.length === 0) {
      alert(`Violates layout constraints: Cannot insert "${registryEntry?.displayName}" relative to selected "${selectedNode.type}".`);
      return;
    }

    setInsertContext({
      compType,
      targetNodeId: selectedNodeId,
      allowedOptions,
    });
  };

  return (
    <div className="p-3 flex flex-col h-full select-none bg-white relative">
      {/* Search Input */}
      <div className="relative mb-4">
        <Icons.Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white transition-all text-slate-800"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-2.5 hover:text-slate-700 text-slate-400"
          >
            <Icons.X size={12} />
          </button>
        )}
      </div>

      {/* Components List grouped by Category */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {Object.keys(categories).map((catKey) => {
          const comps = categories[catKey];
          if (comps.length === 0) return null;

          return (
            <div key={catKey} className="space-y-1.5">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase pl-1.5">
                {categoryLabels[catKey]}
              </h3>
              <div className="grid grid-cols-1 gap-1">
                {comps.map((comp) => (
                  <DraggableItem key={comp.type} type={comp.type}>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(comp.type);
                      }}
                      className="group flex items-start gap-2.5 p-2 rounded-md border border-slate-100 bg-white hover:border-slate-200/80 hover:bg-slate-50/50 cursor-pointer transition-all"
                      title="Drag to Canvas or click to open insertion context"
                    >
                      <div className="flex items-center justify-center h-7 w-7 rounded bg-slate-50 border border-slate-100 text-slate-600 group-hover:bg-white group-hover:text-slate-800 transition-colors shrink-0">
                        {getComponentIcon(comp.icon, 14)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                          {comp.displayName}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-relaxed truncate">
                          {COMPONENT_DESCRIPTIONS[comp.type] || comp.displayName}
                        </div>
                      </div>
                    </div>
                  </DraggableItem>
                ))}
              </div>
            </div>
          );
        })}

        {filteredComponents.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs">
            No components matched your search.
          </div>
        )}
      </div>

      {/* Explicit Insertion Context Dropdown Modal */}
      {insertContext && (
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-[220px] p-3 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1">
              <Icons.PlusCircle size={10} />
              <span>Add Component</span>
            </div>
            <div className="text-[10px] text-slate-600 font-medium leading-normal">
              Insert <span className="font-bold text-slate-800">{COMPONENT_REGISTRY[insertContext.compType]?.displayName}</span>:
            </div>
            <div className="flex flex-col gap-1">
              {insertContext.allowedOptions.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    opt.action();
                    setInsertContext(null);
                  }}
                  className="w-full text-left text-[11px] font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 border border-slate-200/60 hover:border-blue-100 px-2 py-1.5 rounded transition-all cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setInsertContext(null)}
                className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100/80 border border-transparent px-2 py-1 rounded mt-1.5 transition-all cursor-pointer uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
