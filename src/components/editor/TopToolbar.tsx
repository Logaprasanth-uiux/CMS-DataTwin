"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { Monitor, Eye, Edit2, ChevronDown, Check, Undo, Redo } from "lucide-react";
import Link from "next/link";

export default function TopToolbar() {
  const { pages, activePageId, previewMode, setPreviewMode, undo, redo, past, future, zoom, zoomMode, setZoom, setZoomMode } = useEditorStore();
  const activePage = activePageId ? pages[activePageId] : null;
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  return (
    <header className="h-12 bg-white border-b border-panel-border flex items-center justify-between px-4 z-30 select-none">
      {/* Left section: Graphite Branding and Breadcrumb Back Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-1.5 hover:opacity-85 transition-opacity">
          {/* Graphite CMS Logo Icon */}
          <div className="flex items-center justify-center h-6 w-6 rounded bg-slate-500 text-white font-black text-[10px] tracking-wider">
            DT
          </div>
          <span className="font-extrabold text-[10px] tracking-wide text-slate-500 uppercase font-mono">DataTwin</span>
        </Link>
        <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono font-bold tracking-wide">CMS</span>
        
        <span className="text-slate-300 text-xs mx-1">/</span>
        
        <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
          Pages
        </Link>
        
        <span className="text-slate-300 text-xs mx-1">/</span>
        
        {/* Dynamic Page Identity */}
        <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
          {activePage ? activePage.name : "New Page"}
        </span>

        {/* Dynamic Status Badge */}
        {activePage && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ml-2 font-mono uppercase tracking-wider ${
            activePage.status === "Published"
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : "bg-amber-50 text-amber-600 border border-amber-100"
          }`}>
            {activePage.status}
          </span>
        )}
      </div>

      {/* Middle section: Viewport and Zoom Mockups */}
      <div className="flex items-center gap-4">
        {/* Viewport indicators - Desktop is default in Phase 1 */}
        <div className="flex items-center bg-slate-50 border border-slate-200/80 p-0.5 rounded-md">
          <button 
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white text-slate-800 shadow-sm border border-slate-100"
            title="Desktop view"
          >
            <Monitor size={12} className="text-slate-600" />
            <span className="font-medium">Desktop</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-200"></div>

        {/* Zoom selector Dropdown */}
        <div className="relative">
          <button 
            type="button" 
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 font-mono px-2 py-1 rounded hover:bg-slate-50 transition-colors cursor-pointer select-none"
          >
            <span>{zoomMode === "fit" ? "Fit" : `${zoom}%`}</span>
            <ChevronDown size={11} className="text-slate-400 font-bold" />
          </button>

          {showZoomMenu && (
            <>
              {/* Back-drop to close menu */}
              <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={() => setShowZoomMenu(false)}
              />
              {/* Menu items */}
              <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-75">
                {[100, 90, 80, 70, 60, 50].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      setZoom(step);
                      setShowZoomMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-mono font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                      zoom === step && zoomMode !== "fit"
                        ? "text-blue-600 bg-blue-50/50"
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <span>{step}%</span>
                    {zoom === step && zoomMode !== "fit" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    )}
                  </button>
                ))}
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    setZoomMode("fit");
                    setShowZoomMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                    zoomMode === "fit"
                      ? "text-blue-600 bg-blue-50/50"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span>Fit to Canvas</span>
                  {zoomMode === "fit" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right section: Save indicator and Preview Toggle */}
      <div className="flex items-center gap-3">
        {/* Save State Indicator */}
        <div className="flex items-center gap-1.5 bg-emerald-50/30 border border-emerald-100/50 px-2 py-1 rounded">
          <Check size={11} className="text-emerald-500" />
          <span className="text-[9px] text-emerald-600 font-bold tracking-wider font-mono uppercase">Saved</span>
        </div>

        {/* History Undo / Redo */}
        <div className="flex items-center bg-slate-50 border border-slate-200/80 p-0.5 rounded-md">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className={`p-1 rounded transition-colors ${
              canUndo
                ? "text-slate-600 hover:text-slate-800 hover:bg-white cursor-pointer"
                : "text-slate-300 cursor-not-allowed opacity-50"
            }`}
            title="Undo"
          >
            <Undo size={11} />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className={`p-1 rounded transition-colors ${
              canRedo
                ? "text-slate-600 hover:text-slate-800 hover:bg-white cursor-pointer"
                : "text-slate-300 cursor-not-allowed opacity-50"
            }`}
            title="Redo"
          >
            <Redo size={11} />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-200"></div>

        {/* Preview / Edit Toggle */}
        <div className="flex items-center bg-slate-50 border border-slate-200/80 p-0.5 rounded-md">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              !previewMode
                ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Edit2 size={11} />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              previewMode
                ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Eye size={11} />
            <span>Preview</span>
          </button>
        </div>
      </div>
    </header>
  );
}
