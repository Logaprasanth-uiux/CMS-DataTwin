"use client";

import { useEditorStore } from "@/store/editorStore";
import { DocumentNode } from "@/types/document";
import { COMPONENT_REGISTRY } from "@/registry";
import { getComponentIcon } from "./ComponentLibrary";
import { Copy, Trash2, ChevronRight, ChevronDown, FileText } from "lucide-react";
import React, { useState } from "react";

export default function ComponentTree() {
  const { pages, activePageId, selectedNodeId, selectNode, duplicateNode, removeNode, renameNode } = useEditorStore();
  const document = activePageId ? pages[activePageId] : null;

  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

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
    if (node.customLabel) return node.customLabel;
    const registryEntry = COMPONENT_REGISTRY[node.type];
    return registryEntry ? registryEntry.displayName : node.type;
  };

  const handleRenameCommit = (nodeId: string) => {
    renameNode(nodeId, renameValue.trim() || undefined);
    setRenamingNodeId(null);
  };

  const handleRenameKeyDown = (nodeId: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameCommit(nodeId);
    } else if (e.key === "Escape") {
      setRenamingNodeId(null); // Cancel
    }
  };

  const handleRenameDoubleClick = (node: DocumentNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingNodeId(node.id);
    setRenameValue(node.customLabel || getNodeName(node));
  };

  // Recursive Tree Item Render
  const renderTreeItem = (node: DocumentNode, level = 0) => {
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes[node.id] || false;
    const registryEntry = COMPONENT_REGISTRY[node.type];
    const iconName = registryEntry ? registryEntry.icon : "HelpCircle";
    const isRenaming = renamingNodeId === node.id;

    return (
      <div key={node.id} className="flex flex-col select-none">
        {/* Node label block */}
        <div
          onClick={() => selectNode(node.id)}
          onDoubleClick={(e) => handleRenameDoubleClick(node, e)}
          className={`group flex items-center justify-between px-2 py-1.5 cursor-pointer border-l-2 hover:bg-slate-50 transition-all ${
            isSelected
              ? "bg-slate-100/80 border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
          style={{ paddingLeft: level === 0 ? "8px" : "4px" }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
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

            {/* Display Label or Inline input */}
            {isRenaming ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRenameCommit(node.id)}
                onKeyDown={(e) => handleRenameKeyDown(node.id, e)}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="text-[11px] bg-white border border-blue-500 rounded px-1 py-0.5 outline-none font-semibold text-slate-800 w-full max-w-[160px]"
                autoFocus
              />
            ) : (
              <span 
                className="text-xs truncate font-medium flex-1"
                title="Double click to rename component"
              >
                {getNodeName(node)}
              </span>
            )}
          </div>

          {/* Quick actions shown on hover */}
          {!isRenaming && (
            <div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-gradient-to-l from-slate-50 pl-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateNode(node.id);
                }}
                title="Duplicate Node"
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/55 transition-colors cursor-pointer"
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
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 size={10.5} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Child items recursive render with visual Nesting Guide Lines */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col ml-3.5 pl-1.5 border-l border-slate-100/80">
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
