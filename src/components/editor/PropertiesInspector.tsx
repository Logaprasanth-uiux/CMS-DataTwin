"use client";

import { useEditorStore } from "@/store/editorStore";
import { COMPONENT_REGISTRY } from "@/registry";
import { DocumentNode } from "@/types/document";
import { Sliders, Settings, Text, Palette, Layout, Trash2, Copy } from "lucide-react";

// Recursive search helper to locate the selected node in the document layout
const findNodeById = (node: DocumentNode, id: string): DocumentNode | null => {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};

// Categorize property keys for clean logical grouping
const PROPERTY_GROUPS = {
  content: ["label", "value", "change", "positive", "title", "message", "text"],
  appearance: ["variant", "size", "status", "chartType", "height", "density", "background"],
  layout: ["gridSpan", "columns", "gap", "direction", "alignment", "padding", "maxWidth"],
};

export default function PropertiesInspector() {
  const { pages, activePageId, selectedNodeId, updateNodeProps, removeNode, duplicateNode } = useEditorStore();
  const document = activePageId ? pages[activePageId] : null;

  if (!document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-white">
        <Sliders className="h-6 w-6 text-slate-300 mb-2" />
        <span className="text-xs font-semibold text-slate-400">Inspector Panel</span>
        <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-relaxed">
          No active page document
        </p>
      </div>
    );
  }

  if (!selectedNodeId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-white">
        <Sliders className="h-6 w-6 text-slate-300 mb-2" />
        <span className="text-xs font-semibold text-slate-400">Inspector Panel</span>
        <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-relaxed">
          Select a component on the canvas or tree hierarchy to edit configuration.
        </p>
      </div>
    );
  }

  const selectedNode = findNodeById(document.layout, selectedNodeId);
  if (!selectedNode) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-400 text-xs">
        Node {selectedNodeId} not found in layout.
      </div>
    );
  }

  const contract = COMPONENT_REGISTRY[selectedNode.type];
  if (!contract) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-400 text-xs">
        Registry contract missing for type: {selectedNode.type}
      </div>
    );
  }

  // Filter properties by category group
  const getGroupProperties = (groupName: "content" | "appearance" | "layout") => {
    const keys = PROPERTY_GROUPS[groupName];
    return Object.entries(contract.properties).filter(([key]) => keys.includes(key));
  };

  const contentProps = getGroupProperties("content");
  const appearanceProps = getGroupProperties("appearance");
  const layoutProps = getGroupProperties("layout");

  // Render a specific property input field
  const renderPropertyField = (key: string, schema: any) => {
    const value = selectedNode.props[key] !== undefined ? selectedNode.props[key] : schema.defaultValue;

    const handleFieldChange = (val: any) => {
      updateNodeProps(selectedNode.id, { [key]: val });
    };

    switch (schema.type) {
      case "string":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleFieldChange(e.target.value)}
            className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white transition-all text-slate-800 font-medium"
          />
        );
      case "number":
        return (
          <input
            type="number"
            value={value === undefined ? "" : value}
            onChange={(e) => handleFieldChange(Number(e.target.value))}
            className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white transition-all text-slate-800 font-medium"
          />
        );
      case "boolean":
        return (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleFieldChange(!value)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                value ? "bg-slate-900" : "bg-slate-200"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                  value ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-[10px] text-slate-500 font-semibold ml-2 font-mono uppercase">
              {value ? "Active" : "Inactive"}
            </span>
          </div>
        );
      case "enum":
        return (
          <select
            value={value}
            onChange={(e) => {
              // Parse number values correctly
              const rawVal = e.target.value;
              const numericVal = Number(rawVal);
              handleFieldChange(isNaN(numericVal) ? rawVal : numericVal);
            }}
            className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white transition-all text-slate-800 font-semibold cursor-pointer"
          >
            {schema.options?.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Inspector Header */}
      <div className="h-10 border-b border-panel-border bg-slate-50/50 flex items-center justify-between px-3">
        <div className="flex items-center gap-1.5">
          <Settings size={12.5} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Properties Inspector
          </span>
        </div>
      </div>

      {/* Component Title Summary */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/20">
        <div className="text-xs font-bold text-slate-800 leading-tight">
          {contract.displayName}
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate select-all">
          ID: {selectedNode.id}
        </div>
      </div>

      {/* Scrollable property editor sections */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Section A: Content Fields */}
        {contentProps.length > 0 && (
          <div className="space-y-3.5">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Text size={10} />
              <span>Component Content</span>
            </h4>
            <div className="space-y-3">
              {contentProps.map(([key, schema]) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 tracking-wide">
                    {schema.label}
                  </label>
                  {renderPropertyField(key, schema)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section B: Appearance Fields */}
        {appearanceProps.length > 0 && (
          <div className="space-y-3.5 pt-1">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Palette size={10} />
              <span>Appearance & Styling</span>
            </h4>
            <div className="space-y-3">
              {appearanceProps.map(([key, schema]) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 tracking-wide">
                    {schema.label}
                  </label>
                  {renderPropertyField(key, schema)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section C: Layout & Spacing Fields */}
        {layoutProps.length > 0 && (
          <div className="space-y-3.5 pt-1">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Layout size={10} />
              <span>Layout & Alignment</span>
            </h4>
            <div className="space-y-3">
              {layoutProps.map(([key, schema]) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 tracking-wide">
                    {schema.label}
                  </label>
                  {renderPropertyField(key, schema)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick panel footer operations */}
      {selectedNode.id !== document.layout.id && (
        <div className="p-3 bg-slate-50/50 border-t border-panel-border flex items-center gap-2">
          <button
            type="button"
            onClick={() => duplicateNode(selectedNode.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Copy size={12} />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={() => removeNode(selectedNode.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold bg-red-50 border border-red-100 text-red-600 hover:bg-red-100/50 shadow-sm transition-all"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
