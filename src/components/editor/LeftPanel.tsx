"use client";

import { useState } from "react";
import { Box, ListTree } from "lucide-react";
import ComponentLibrary from "./ComponentLibrary";
import ComponentTree from "./ComponentTree";

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState<"library" | "tree">("library");

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Sidebar Tabs Header */}
      <div className="h-10 border-b border-panel-border flex bg-slate-50 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === "library"
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Box size={13} />
          <span>Library</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tree")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === "tree"
              ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ListTree size={13} />
          <span>Hierarchy</span>
        </button>
      </div>

      {/* Tab Panel Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "library" ? <ComponentLibrary /> : <ComponentTree />}
      </div>
    </div>
  );
}
