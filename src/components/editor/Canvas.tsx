"use client";

import { useEditorStore } from "@/store/editorStore";
import PageRenderer from "../renderer/PageRenderer";
import { Monitor, Layers } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";

export default function Canvas() {
  const { previewMode, selectNode, selectedNodeId, zoom, zoomMode, setZoomOnly } = useEditorStore();
  
  const workspaceRef = useRef<HTMLDivElement>(null);
  const logicalCanvasRef = useRef<HTMLDivElement>(null);
  const [logicalHeight, setLogicalHeight] = useState(800);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Clear selection when clicking the empty background of the workspace
    if ((e.target as HTMLElement).classList.contains("canvas-workspace")) {
      selectNode(null);
    }
  };

  // 1. Observer to measure logical height changes (grows/shrinks as components change)
  useEffect(() => {
    if (previewMode) return;
    const el = logicalCanvasRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setLogicalHeight(entry.contentRect.height);
      }
    });
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewMode]);

  // 2. Observer to calculate available workspace width for Fit-to-Canvas mode
  useEffect(() => {
    if (previewMode || zoomMode !== "fit") return;
    const el = workspaceRef.current;
    if (!el) return;

    const handleResize = () => {
      const { width } = el.getBoundingClientRect();
      const horizontalPadding = 64; // Margins padding
      const availableWidth = width - horizontalPadding;
      
      const rawScale = availableWidth / 1280;
      const calculatedPercent = rawScale * 100;
      
      const zoomSteps = [50, 60, 70, 80, 90, 100];
      
      // Select the largest zoom step that does not exceed calculated percentage (to avoid horizontal clipping)
      let selectedZoom = 50;
      for (const step of zoomSteps) {
        if (step <= calculatedPercent) {
          selectedZoom = step;
        }
      }
      
      setZoomOnly(selectedZoom);
    };

    handleResize(); // Initial measurement

    const observer = new ResizeObserver(() => {
      handleResize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewMode, zoomMode, setZoomOnly]);

  if (previewMode) {
    return (
      <div className="w-full min-h-full bg-slate-50 p-6 overflow-y-auto">
        <PageRenderer />
      </div>
    );
  }

  // Calculate visual scale stages
  const scale = zoom / 100;
  const stageWidth = 1280 * scale;
  const stageHeight = logicalHeight * scale;

  return (
    <div
      ref={workspaceRef}
      onClick={handleCanvasClick}
      className="canvas-workspace flex-1 overflow-auto p-8 canvas-grid-pattern relative select-none h-full min-h-0"
    >
      {/* Visual Canvas stage: tells the parent scroll viewport its scaled size */}
      <div
        className="canvas-stage mx-auto shrink-0 relative"
        style={{
          width: `${stageWidth}px`,
          height: `${stageHeight}px`,
          marginBottom: "48px",
        }}
      >
        {/* Logical 1280px Canvas: visually transformed inside stage */}
        <div
          ref={logicalCanvasRef}
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("page-canvas-bg")) {
              selectNode(null);
            }
          }}
          style={{
            width: "1280px",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
          }}
          className="flex flex-col gap-2 pb-12"
        >
          {/* Canvas Header bar */}
          <div className="flex items-center justify-between text-slate-400 text-[10px] px-1 font-mono tracking-wide mb-1 select-none">
            <div className="flex items-center gap-1.5 font-bold uppercase">
              <Monitor size={11} className="text-slate-400" />
              <span>Page Canvas</span>
              <span className="text-slate-200">|</span>
              <span className="text-slate-500">
                Desktop · 1280px ({zoom}%)
              </span>
              {zoomMode === "fit" && (
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
                  FIT ACTIVE
                </span>
              )}
            </div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Bounds Enforced
            </div>
          </div>

          {/* Visual Page Canvas */}
          <div className="page-canvas-bg bg-white shadow-md border border-slate-200/80 rounded-lg overflow-hidden flex flex-col min-h-[700px] p-6 relative">
            <PageRenderer />
          </div>
        </div>
      </div>

      {/* Mini Breadcrumb Status Bar */}
      {selectedNodeId && (
        <div className="absolute bottom-2.5 left-4 flex items-center gap-1 bg-white px-2.5 py-1 rounded-md shadow border border-slate-200/60 text-[10px] font-mono text-slate-500 font-medium">
          <Layers size={10} className="text-slate-400" />
          <span className="text-blue-500 font-semibold">{selectedNodeId}</span>
          <span className="text-slate-300">/</span>
          <span>Config Active</span>
        </div>
      )}
    </div>
  );
}
