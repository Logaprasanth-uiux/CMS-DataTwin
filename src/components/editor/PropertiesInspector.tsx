"use client";

import { useEditorStore } from "@/store/editorStore";
import { COMPONENT_REGISTRY } from "@/registry";
import { DocumentNode } from "@/types/document";
import { Sliders, Settings, Text, Palette, Layout, Trash2, Copy, FileText, Layers } from "lucide-react";
import React from "react";

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
  content: ["label", "value", "cardIconName", "change", "trendText", "showTrendIcon", "positive", "description", "title", "message", "text"],
  appearance: [
    "titleColor",
    "valueColor",
    "trendColor",
    "descriptionColor",
    "iconColor",
    "variant",
    "size",
    "status",
    "chartType",
    "height",
    "density",
    "background"
  ],
  layout: ["gridSpan", "columns", "gap", "direction", "alignment", "padding", "maxWidth"],
  behavior: ["action"],
};

const ColorPickerField = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  return (
    <div className="flex items-center gap-1.5 w-full">
      {/* Visual Color Preview circle containing the native picker */}
      <div 
        style={{ backgroundColor: value || "#FFFFFF" }}
        className="h-4.5 w-4.5 rounded-full border border-slate-200 shadow-sm shrink-0 hover:scale-105 transition-transform relative overflow-hidden cursor-pointer"
        title="Select color"
      >
        <input
          type="color"
          value={value && value.startsWith("#") && value.length === 7 ? value : "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 border-0"
        />
      </div>
      {/* Hex input field */}
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded focus:bg-white font-mono text-slate-700 font-semibold"
        placeholder="#FFFFFF"
      />
    </div>
  );
};


export default function PropertiesInspector() {
  const { pages, activePageId, selectedNodeId, updateNodeProps, removeNode, duplicateNode, renameNode, updatePageMetadata } = useEditorStore();
  const document = activePageId ? pages[activePageId] : null;

  if (!document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-white">
        <Sliders className="h-6 w-6 text-slate-300 mb-2" />
        <span className="text-xs font-semibold text-slate-400">Inspector Panel</span>
        <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-relaxed">
          No active page document.
        </p>
      </div>
    );
  }

  // 1. Page Settings Mode
  if (selectedNodeId === "page-document") {
    const handleMetadataChange = (key: string, val: string) => {
      updatePageMetadata(document.id, { [key]: val });
    };

    return (
      <div className="flex flex-col h-full bg-white select-none">
        {/* Inspector Header */}
        <div className="h-10 border-b border-panel-border bg-slate-50/50 flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <Settings size={12.5} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Page Configurations
            </span>
          </div>
        </div>

        {/* Page Title Summary */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/20 flex items-center gap-2">
          <FileText size={14} className="text-slate-500" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-800 truncate leading-tight">
              {document.name}
            </div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate select-all">
              Route ID: {document.id}
            </div>
          </div>
        </div>

        {/* Scrollable metadata editor */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          <div className="space-y-4">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <FileText size={10} />
              <span>Page Metadata</span>
            </h4>
            
            {/* Page Name Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 tracking-wide">
                Page Document Name
              </label>
              <input
                type="text"
                value={document.name}
                onChange={(e) => handleMetadataChange("name", e.target.value)}
                className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white transition-all text-slate-800 font-semibold"
              />
            </div>

            {/* Page ID / Route Field (Read Only) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 tracking-wide flex justify-between">
                <span>Route ID (Technical)</span>
                <span className="text-[8px] text-slate-400 font-mono uppercase bg-slate-100 px-1 rounded leading-normal select-none">Read Only</span>
              </label>
              <input
                type="text"
                value={document.id}
                readOnly
                className="w-full px-2 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md text-slate-500 font-mono"
              />
            </div>

            {/* Status Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 tracking-wide">
                Page Document Status
              </label>
              <div className="flex bg-slate-100 p-0.5 rounded-md gap-0.5 w-full">
                {(["Draft", "Under Review", "Published"] as const).map((statusVal) => {
                  const isSelected = document.status === statusVal;
                  return (
                    <button
                      key={statusVal}
                      type="button"
                      onClick={() => handleMetadataChange("status", statusVal)}
                      className={`flex-1 text-[10px] font-bold py-1 px-1 rounded transition-all select-none cursor-pointer text-center ${
                        isSelected
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {statusVal}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 tracking-wide">
                Page Description
              </label>
              <textarea
                value={document.description || ""}
                onChange={(e) => handleMetadataChange("description", e.target.value)}
                rows={4}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white transition-all text-slate-800 font-medium leading-relaxed resize-none"
                placeholder="Describe the purpose of this page document..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Component Settings Mode
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
  const getGroupProperties = (groupName: "content" | "appearance" | "layout" | "behavior") => {
    const keys = PROPERTY_GROUPS[groupName];
    return Object.entries(contract.properties).filter(([key]) => keys.includes(key));
  };

  const contentProps = getGroupProperties("content");
  const appearanceProps = getGroupProperties("appearance");
  const layoutProps = getGroupProperties("layout");
  const behaviorProps = getGroupProperties("behavior");

  // Render a specific property input field
  const renderPropertyField = (key: string, schema: any) => {
    const value = selectedNode.props[key] !== undefined ? selectedNode.props[key] : schema.defaultValue;

    const handleFieldChange = (val: any) => {
      updateNodeProps(selectedNode.id, { [key]: val });
    };

    if (key.toLowerCase().includes("color")) {
      return (
        <ColorPickerField value={value} onChange={handleFieldChange} />
      );
    }

    switch (schema.type) {
      case "string":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleFieldChange(e.target.value)}
            className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white transition-all text-slate-800 font-semibold"
          />
        );
      case "number":
        return (
          <input
            type="number"
            value={value === undefined ? "" : value}
            onChange={(e) => handleFieldChange(Number(e.target.value))}
            className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white transition-all text-slate-800 font-semibold"
          />
        );
      case "boolean":
        return (
          <div className="flex bg-slate-100 p-0.5 rounded-md gap-0.5 w-full">
            <button
              type="button"
              onClick={() => handleFieldChange(true)}
              className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded transition-all select-none cursor-pointer text-center ${
                value === true ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange(false)}
              className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded transition-all select-none cursor-pointer text-center ${
                value === false ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              No
            </button>
          </div>
        );
      case "enum":
        // Segmented control selector for options of 3 items or fewer
        if (schema.options && schema.options.length <= 3) {
          return (
            <div className="flex bg-slate-100 p-0.5 rounded-md gap-0.5 w-full">
              {schema.options.map((opt: any) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleFieldChange(opt.value)}
                    className={`flex-1 text-[10px] font-bold py-1 px-1 rounded transition-all select-none cursor-pointer text-center truncate ${
                      isSelected
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          );
        }
        return (
          <select
            value={value}
            onChange={(e) => {
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
          {selectedNode.customLabel || contract.displayName}
        </div>
        <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate select-all">
          ID: {selectedNode.id}
        </div>
      </div>

      {/* Scrollable property editor sections */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Section 1: COMPONENT metadata section */}
        <div className="space-y-3.5">
          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <Layers size={10} />
            <span>Component Identity</span>
          </h4>
          <div className="space-y-3">
            {/* Component Type (Read Only) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 tracking-wide flex justify-between">
                <span>Technical Type</span>
                <span className="text-[8px] text-slate-400 font-mono uppercase bg-slate-100 px-1 rounded leading-normal">Read Only</span>
              </label>
              <input
                type="text"
                value={selectedNode.type}
                readOnly
                className="w-full px-2 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md text-slate-500 font-mono"
              />
            </div>
            
            {/* Technical ID (Read Only) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 tracking-wide flex justify-between">
                <span>Technical ID</span>
                <span className="text-[8px] text-slate-400 font-mono uppercase bg-slate-100 px-1 rounded leading-normal">Read Only</span>
              </label>
              <input
                type="text"
                value={selectedNode.id}
                readOnly
                className="w-full px-2 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md text-slate-500 font-mono"
              />
            </div>

            {/* Custom Display Label (Editable) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 tracking-wide">
                Display Name (Custom Label)
              </label>
              <input
                type="text"
                value={selectedNode.customLabel || ""}
                onChange={(e) => renameNode(selectedNode.id, e.target.value)}
                placeholder={contract.displayName}
                className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white transition-all text-slate-800 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Section 2: CONTENT Fields */}
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

        {/* Section 3: APPEARANCE Fields */}
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

        {/* Section 4: LAYOUT Fields */}
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

        {/* Section 5: BEHAVIOR Fields */}
        {behaviorProps.length > 0 && (
          <div className="space-y-3.5 pt-1">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Sliders size={10} />
              <span>Behavior & Actions</span>
            </h4>
            <div className="space-y-3">
              {behaviorProps.map(([key, schema]) => (
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
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
          >
            <Copy size={12} />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={() => removeNode(selectedNode.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold bg-red-50 border border-red-100 text-red-600 hover:bg-red-100/50 shadow-sm transition-all cursor-pointer"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
