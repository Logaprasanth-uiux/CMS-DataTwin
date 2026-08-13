"use client";

import { useEditorStore } from "@/store/editorStore";
import { DocumentNode } from "@/types/document";
import { COMPONENT_REGISTRY } from "@/registry";
import { getComponentIcon } from "./ComponentLibrary";
import { Copy, Trash2, ChevronRight, ChevronDown, FileText } from "lucide-react";
import { useState } from "react";

export default function ComponentTree() {
  const { pages, activePageId, selectedNodeId, selectNode, duplicateNode, removeNode } = useEditorStore();
  const document = activePageId ? pages[activePageId] : null;
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  if (!document) {
    return (
      <div className="p-4 text-xs text-slate-400 font-mono">
        No active page document
      </div>
    );
  }

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper to determine node display name inside the tree
  const getNodeName = (node: DocumentNode): string => {
    const registryEntry = COMPONENT_REGISTRY[node.type];
    const defaultName = registryEntry ? registryEntry.displayName : node.type;
    
    // Attempt to pull user-facing labels to make tree nodes descriptive
    if (node.props.label) return `${defaultName} (${node.props.label})`;
    if (node.props.title) return `${defaultName} (${node.props.title})`;
    if (node.props.text) return `${defaultName} ("${node.props.text}")`;
    
    return defaultName;
  };

  // Recursive Tree Item Render
  const renderTreeItem = (node: DocumentNode, level = 0) => {
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes[node.id] || false;
    const registryEntry = COMPONENT_REGISTRY[node.type];
    const iconName = registryEntry ? registryEntry.icon : "HelpCircle";

    return (
      <div key={node.id} className="flex flex-col select-none">
        {/* Node label block */}
        <div
          onClick={() => selectNode(node.id)}
          className={`group flex items-center justify-between px-2 py-1.5 cursor-pointer border-l-2 hover:bg-slate-50 transition-all ${
            isSelected
              ? "bg-slate-100/80 border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Collapse chevron */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(node.id, e)}
                className="p-0.5 rounded hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 shrink-0"
              >
                {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
              </button>
            ) : (
              <span className="w-[17px] h-4 shrink-0" />
            )}
            
            {/* Component Icon */}
            <span className="text-slate-400 shrink-0 group-hover:text-slate-600">
              {getComponentIcon(iconName, 12)}
            </span>

            {/* Display Label */}
            <span className="text-xs truncate font-medium">{getNodeName(node)}</span>
          </div>

          {/* Quick actions shown on hover */}
          <div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-gradient-to-l from-slate-50 pl-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                duplicateNode(node.id);
              }}
              title="Duplicate Node"
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/55 transition-colors"
            >
              <Copy size={10.5} />
            </button>
            
            {/* Root node cannot be removed */}
            {node.id !== document.layout.id && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNode(node.id);
                }}
                title="Delete Node"
                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={10.5} />
              </button>
            )}
          </div>
        </div>

        {/* Child items recursive render */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {node.children!.map((child) => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Document Root Label */}
      <div className="p-2 border-b border-panel-border bg-slate-50/50 flex items-center gap-1.5 px-3">
        <FileText size={12.5} className="text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Page Structure Tree
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {renderTreeItem(document.layout)}
      </div>
    </div>
  );
}
