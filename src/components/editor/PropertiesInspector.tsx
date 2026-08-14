"use client";

import { useEditorStore } from "@/store/editorStore";
import { COMPONENT_REGISTRY } from "@/registry";
import { DocumentNode } from "@/types/document";
import { Sliders, Settings, Text, Palette, Layout, Trash2, Copy, FileText, Layers, Plus, ArrowUp, ArrowDown, Edit2, Check, X } from "lucide-react";
import React, { useState, useEffect } from "react";

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
  content: ["label", "value", "cardIconName", "change", "trendText", "showTrendIcon", "positive", "description", "title", "columns", "rows", "message", "text"],
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

const renameColumnKey = (oldKey: string, newKey: string, currentRows: any[]) => {
  return currentRows.map(row => {
    const newRow = { ...row };
    if (oldKey in newRow) {
      newRow[newKey] = newRow[oldKey];
      delete newRow[oldKey];
    }
    return newRow;
  });
};

const deleteColumnKey = (key: string, currentRows: any[]) => {
  return currentRows.map(row => {
    const newRow = { ...row };
    delete newRow[key];
    return newRow;
  });
};

const addColumnKey = (key: string, type: string, currentRows: any[]) => {
  const defaultVal = type === 'number' ? 0 : type === 'boolean' ? false : "";
  return currentRows.map(row => {
    const newRow = { ...row };
    if (!(key in newRow)) {
      newRow[key] = defaultVal;
    }
    return newRow;
  });
};

function ColumnsEditor({
  columns,
  onChange,
  rows,
  onRowsChange,
}: {
  columns: any[];
  onChange: (cols: any[]) => void;
  rows: any[];
  onRowsChange: (rows: any[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [editLabel, setEditLabel] = useState("");
  const [editKey, setEditKey] = useState("");
  const [editType, setEditType] = useState<"string" | "number" | "boolean">("string");

  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newType, setNewType] = useState<"string" | "number" | "boolean">("string");

  const handleStartEdit = (index: number) => {
    const col = columns[index];
    setEditingIndex(index);
    setEditLabel(col.label);
    setEditKey(col.key);
    setEditType(col.type || "string");
    setIsAdding(false);
  };

  const handleSaveEdit = (index: number) => {
    const oldCol = columns[index];
    const newColKey = editKey.trim() || oldCol.key;
    const newColLabel = editLabel.trim() || oldCol.label;
    
    const updatedCols = [...columns];
    updatedCols[index] = {
      ...oldCol,
      label: newColLabel,
      key: newColKey,
      type: editType,
    };
    
    let updatedRows = rows;
    if (oldCol.key !== newColKey) {
      updatedRows = renameColumnKey(oldCol.key, newColKey, rows);
    }
    
    if (oldCol.type !== editType) {
      updatedRows = updatedRows.map(row => {
        const newRow = { ...row };
        const val = newRow[newColKey];
        if (editType === 'number') {
          const num = Number(val);
          newRow[newColKey] = isNaN(num) ? 0 : num;
        } else if (editType === 'boolean') {
          newRow[newColKey] = !!val;
        } else {
          newRow[newColKey] = val === undefined || val === null ? "" : String(val);
        }
        return newRow;
      });
    }

    onChange(updatedCols);
    onRowsChange(updatedRows);
    setEditingIndex(null);
  };

  const handleAddColumn = () => {
    const key = newKey.trim();
    const label = newLabel.trim();
    if (!key || !label) {
      alert("Key and Label are required.");
      return;
    }
    if (columns.some(c => c.key === key)) {
      alert("A column with this key already exists.");
      return;
    }

    const newCol = { key, label, type: newType };
    const updatedCols = [...columns, newCol];
    const updatedRows = addColumnKey(key, newType, rows);

    onChange(updatedCols);
    onRowsChange(updatedRows);
    setIsAdding(false);
    setNewKey("");
    setNewLabel("");
    setNewType("string");
  };

  const handleDeleteColumn = (index: number) => {
    const colToDelete = columns[index];
    const updatedCols = columns.filter((_, i) => i !== index);
    const updatedRows = deleteColumnKey(colToDelete.key, rows);

    onChange(updatedCols);
    onRowsChange(updatedRows);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const updatedCols = [...columns];
    const temp = updatedCols[index];
    updatedCols[index] = updatedCols[newIndex];
    updatedCols[newIndex] = temp;
    onChange(updatedCols);
    
    if (editingIndex === index) {
      setEditingIndex(newIndex);
    } else if (editingIndex === newIndex) {
      setEditingIndex(index);
    }
  };

  return (
    <div className="space-y-2 border border-slate-200 rounded-md p-2 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Columns ({columns.length})</span>
        {!isAdding && editingIndex === null && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm cursor-pointer"
          >
            <Plus size={10} />
            <span>Add Column</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="border border-slate-200 rounded p-2 bg-white space-y-2 text-[10px]">
          <div className="font-bold text-slate-600">New Column Details</div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="space-y-0.5">
              <label className="text-[8px] font-semibold text-slate-400">Label</label>
              <input
                type="text"
                placeholder="e.g. Vendor"
                value={newLabel}
                onChange={e => {
                  setNewLabel(e.target.value);
                  if (!newKey) {
                    setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                  }
                }}
                className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white text-slate-800"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[8px] font-semibold text-slate-400">Field Key</label>
              <input
                type="text"
                placeholder="e.g. vendor"
                value={newKey}
                onChange={e => setNewKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white text-slate-800"
              />
            </div>
          </div>
          <div className="space-y-0.5">
            <label className="text-[8px] font-semibold text-slate-400">Data Type</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as any)}
              className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white text-slate-800"
            >
              <option value="string">String (Text)</option>
              <option value="number">Number (Numeric)</option>
              <option value="boolean">Boolean (Yes/No)</option>
            </select>
          </div>
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2 py-0.5 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer text-slate-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddColumn}
              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer font-semibold"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {editingIndex !== null && (
        <div className="border border-slate-200 rounded p-2 bg-white space-y-2 text-[10px]">
          <div className="font-bold text-slate-600">Edit Column Details</div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="space-y-0.5">
              <label className="text-[8px] font-semibold text-slate-400">Label</label>
              <input
                type="text"
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white text-slate-800"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[8px] font-semibold text-slate-400">Field Key</label>
              <input
                type="text"
                value={editKey}
                onChange={e => setEditKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white text-slate-800"
              />
            </div>
          </div>
          <div className="space-y-0.5">
            <label className="text-[8px] font-semibold text-slate-400">Data Type</label>
            <select
              value={editType}
              onChange={e => setEditType(e.target.value as any)}
              className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white text-slate-800"
            >
              <option value="string">String (Text)</option>
              <option value="number">Number (Numeric)</option>
              <option value="boolean">Boolean (Yes/No)</option>
            </select>
          </div>
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setEditingIndex(null)}
              className="px-2 py-0.5 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer text-slate-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveEdit(editingIndex)}
              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
        {columns.map((col, index) => {
          const isCurrentEditing = editingIndex === index;
          return (
            <div
              key={col.key || index}
              className={`flex items-center justify-between p-1.5 rounded border text-[10px] transition-colors ${
                isCurrentEditing
                  ? "border-blue-500 bg-blue-50/10"
                  : "border-slate-100 bg-white"
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-slate-800 block truncate">{col.label}</span>
                <span className="font-mono text-[8px] text-slate-400 truncate block mt-0.5">
                  key: {col.key} &bull; type: {col.type || "string"}
                </span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 ml-1.5">
                <button
                  type="button"
                  onClick={() => handleMoveColumn(index, "up")}
                  disabled={index === 0}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveColumn(index, "down")}
                  disabled={index === columns.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => handleStartEdit(index)}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                  title="Edit Column"
                >
                  <Edit2 size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteColumn(index)}
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 cursor-pointer"
                  title="Delete Column"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RowsEditor({
  columns,
  rows,
  onChange,
}: {
  columns: any[];
  rows: any[];
  onChange: (rows: any[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveCellChange = (rowIndex: number, colKey: string, val: any) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [colKey]: val,
    };
    onChange(updatedRows);
  };

  const handleAddRow = () => {
    const newRow: Record<string, any> = {};
    columns.forEach(col => {
      newRow[col.key] = col.type === 'number' ? 0 : col.type === 'boolean' ? false : "";
    });
    
    if ('id' in newRow) {
      newRow['id'] = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    
    onChange([...rows, newRow]);
    setEditingIndex(rows.length);
  };

  const handleDeleteRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    onChange(updatedRows);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= rows.length) return;

    const updatedRows = [...rows];
    const temp = updatedRows[index];
    updatedRows[index] = updatedRows[newIndex];
    updatedRows[newIndex] = temp;
    onChange(updatedRows);

    if (editingIndex === index) {
      setEditingIndex(newIndex);
    } else if (editingIndex === newIndex) {
      setEditingIndex(index);
    }
  };

  return (
    <div className="space-y-2 border border-slate-200 rounded-md p-2 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rows ({rows.length})</span>
        <button
          type="button"
          onClick={handleAddRow}
          className="flex items-center gap-1 text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm cursor-pointer"
        >
          <Plus size={10} />
          <span>Add Row</span>
        </button>
      </div>

      {editingIndex !== null && editingIndex < rows.length && (
        <div className="border border-slate-200 rounded p-2.5 bg-white space-y-2 text-[10px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <span className="font-bold text-slate-600">Editing Row {editingIndex + 1} Cells</span>
            <button
              type="button"
              onClick={() => setEditingIndex(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X size={12} />
            </button>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {columns.map(col => {
              const rowData = rows[editingIndex];
              const cellValue = rowData[col.key] !== undefined ? rowData[col.key] : "";
              
              return (
                <div key={col.key} className="space-y-0.5">
                  <label className="text-[8px] font-semibold text-slate-500 uppercase tracking-wide">
                    {col.label} ({col.key})
                  </label>
                  {col.type === 'boolean' ? (
                    <div className="flex bg-slate-100 p-0.5 rounded gap-0.5 w-full">
                      <button
                        type="button"
                        onClick={() => handleSaveCellChange(editingIndex, col.key, true)}
                        className={`flex-1 text-[9px] font-bold py-0.5 px-1 rounded transition-all select-none cursor-pointer text-center ${
                          cellValue === true ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveCellChange(editingIndex, col.key, false)}
                        className={`flex-1 text-[9px] font-bold py-0.5 px-1 rounded transition-all select-none cursor-pointer text-center ${
                          cellValue === false ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  ) : col.type === 'number' ? (
                    <input
                      type="number"
                      value={cellValue}
                      onChange={e => handleSaveCellChange(editingIndex, col.key, Number(e.target.value))}
                      className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white text-slate-800"
                    />
                  ) : (
                    <input
                      type="text"
                      value={cellValue}
                      onChange={e => handleSaveCellChange(editingIndex, col.key, e.target.value)}
                      className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:bg-white text-slate-800"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
        {rows.map((row, index) => {
          const isCurrentEditing = editingIndex === index;
          const firstCol = columns[0];
          const secondCol = columns[1];
          const previewText1 = firstCol ? `${firstCol.label}: ${row[firstCol.key] || ""}` : "";
          const previewText2 = secondCol ? `${secondCol.label}: ${row[secondCol.key] || ""}` : "";
          const previewString = [previewText1, previewText2].filter(Boolean).join(" | ");

          return (
            <div
              key={index}
              className={`flex items-center justify-between p-1.5 rounded border text-[10px] transition-colors ${
                isCurrentEditing
                  ? "border-blue-500 bg-blue-50/10"
                  : "border-slate-100 bg-white"
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-slate-800 block">Row {index + 1}</span>
                <span className="text-[8px] text-slate-400 block truncate mt-0.5 font-medium leading-none">
                  {previewString || "(No values)"}
                </span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 ml-1.5">
                <button
                  type="button"
                  onClick={() => handleMoveRow(index, "up")}
                  disabled={index === 0}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveRow(index, "down")}
                  disabled={index === rows.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => handleStartEdit(index)}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                  title="Edit Row Cells"
                >
                  <Edit2 size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRow(index)}
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 cursor-pointer"
                  title="Delete Row"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
      case "json":
        if (key === "columns") {
          const currentColumns = value || [];
          const currentRows = selectedNode.props.rows !== undefined ? selectedNode.props.rows : (contract.properties.rows?.defaultValue || []);
          return (
            <ColumnsEditor
              columns={currentColumns}
              onChange={handleFieldChange}
              rows={currentRows}
              onRowsChange={(updatedRows) => updateNodeProps(selectedNode.id, { rows: updatedRows })}
            />
          );
        }
        if (key === "rows") {
          const currentRows = value || [];
          const currentColumns = selectedNode.props.columns !== undefined ? selectedNode.props.columns : (contract.properties.columns?.defaultValue || []);
          return (
            <RowsEditor
              columns={currentColumns}
              rows={currentRows}
              onChange={handleFieldChange}
            />
          );
        }
        return null;
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
