"use client";

import React from "react";
import { DocumentNode } from "@/types/document";
import { useEditorStore } from "@/store/editorStore";
import { COMPONENT_REGISTRY } from "@/registry";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { TrendingUp, TrendingDown, Info, ShieldAlert, CheckCircle2, ChevronRight, GripVertical } from "lucide-react";

interface ComponentResolverProps {
  node: DocumentNode;
}

export default function ComponentResolver({ node }: ComponentResolverProps) {
  const { selectedNodeId, selectNode, previewMode, dragState } = useEditorStore();
  const isSelected = selectedNodeId === node.id;

  const registryEntry = COMPONENT_REGISTRY[node.type];
  if (!registryEntry) {
    return <div className="p-2 border border-red-200 text-red-500 text-xs">Unknown component type: {node.type}</div>;
  }

  // Setup dnd-kit drag and drop hooks
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: node.id,
    disabled: previewMode,
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: node.id,
    disabled: previewMode,
  });

  // Combine drag and drop refs
  const setCombinedRef = (element: HTMLElement | null) => {
    setDragRef(element);
    setDropRef(element);
  };

  // Handle component select click
  const handleSelect = (e: React.MouseEvent) => {
    if (previewMode) return;
    e.stopPropagation();
    selectNode(node.id);
  };

  // Render children layout nodes recursively
  const renderChildren = () => {
    if (!node.children || node.children.length === 0) {
      if (!previewMode && ['SECTION', 'CONTAINER', 'GRID', 'STACK'].includes(node.type)) {
        return (
          <div className="py-8 px-4 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/20 select-none">
            Drop components inside this {registryEntry.displayName.toLowerCase()}
          </div>
        );
      }
      return null;
    }
    return node.children.map((child) => (
      <ComponentResolver key={child.id} node={child} />
    ));
  };

  // 1. SECTION Component Renders
  const renderSection = () => {
    const { padding, background } = node.props;
    
    const paddingStyles = {
      none: "py-0 px-0",
      small: "py-3 px-4",
      medium: "py-6 px-6",
      large: "py-12 px-8",
    }[padding as string] || "py-6 px-6";

    const bgStyles = {
      default: "bg-white",
      accent: "bg-slate-50/70 border-y border-slate-100/80",
    }[background as string] || "bg-white";

    return (
      <section className={`w-full ${paddingStyles} ${bgStyles} transition-colors min-h-[80px]`}>
        {renderChildren()}
      </section>
    );
  };

  // 2. CONTAINER Component Renders
  const renderContainer = () => {
    const { maxWidth } = node.props;

    const widthStyles = {
      md: "max-w-3xl",
      lg: "max-w-5xl",
      xl: "max-w-7xl",
      full: "max-w-full",
    }[maxWidth as string] || "max-w-5xl";

    return (
      <div className={`mx-auto w-full px-4 ${widthStyles} transition-all min-h-[60px]`}>
        {renderChildren()}
      </div>
    );
  };

  // 3. GRID Component Renders
  const renderGrid = () => {
    const { columns, gap } = node.props;
    
    const gapStyles = {
      small: "gap-3",
      medium: "gap-5",
      large: "gap-8",
    }[gap as string] || "gap-5";

    const gridStyle: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: `repeat(${columns || 4}, minmax(0, 1fr))`,
    };

    return (
      <div style={gridStyle} className={`w-full ${gapStyles} min-h-[60px]`}>
        {renderChildren()}
      </div>
    );
  };

  // 4. STACK Component Renders
  const renderStack = () => {
    const { direction, gap, alignment } = node.props;

    const directionClass = direction === "horizontal" ? "flex-row flex-wrap" : "flex-col";
    
    const gapStyles = {
      small: "gap-3",
      medium: "gap-5",
      large: "gap-8",
    }[gap as string] || "gap-5";

    const alignStyles = {
      start: direction === "horizontal" ? "items-start" : "justify-start",
      center: direction === "horizontal" ? "items-center" : "justify-center",
      end: direction === "horizontal" ? "items-end" : "justify-end",
    }[alignment as string] || "items-start";

    return (
      <div className={`flex w-full ${directionClass} ${gapStyles} ${alignStyles} min-h-[60px]`}>
        {renderChildren()}
      </div>
    );
  };

  // 5. STAT_CARD Component Renders
  const renderStatCard = () => {
    const { label, value, change, positive, gridSpan } = node.props;

    const spanStyle: React.CSSProperties = gridSpan 
      ? { gridColumn: `span ${gridSpan} / span ${gridSpan}` } 
      : {};

    return (
      <div
        style={spanStyle}
        className="flex flex-col gap-2 rounded-lg p-4 border border-slate-100 shadow-sm bg-white hover:shadow transition-all min-h-[96px]"
      >
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
          {label || "Stat Label"}
        </span>
        <span className="text-2xl font-semibold tracking-tight text-slate-800 leading-none mt-0.5">
          {value || "₹0.00"}
        </span>
        <div className="flex items-center gap-1.5 mt-auto text-[10px] text-slate-400 font-medium whitespace-nowrap select-none">
          <div className="flex items-center gap-1 shrink-0">
            {positive ? (
              <TrendingUp size={12} className="text-emerald-500" />
            ) : (
              <TrendingDown size={12} className="text-red-500" />
            )}
            <span
              className={`text-xs font-mono font-bold leading-none ${
                positive ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {change || "0.0%"}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">vs last month</span>
        </div>
      </div>
    );
  };

  // 6. STATUS_CARD Component Renders
  const renderStatusCard = () => {
    const { status, title, message, gridSpan } = node.props;

    const spanStyle: React.CSSProperties = gridSpan 
      ? { gridColumn: `span ${gridSpan} / span ${gridSpan}` } 
      : {};

    const statusConfig = {
      pending: {
        bg: "bg-slate-50/60 border-slate-200/80 text-slate-700",
        icon: <Info size={13.5} className="text-slate-400 shrink-0 mt-0.5" />,
      },
      approved: {
        bg: "bg-emerald-50/50 border-emerald-100 text-emerald-900",
        icon: <CheckCircle2 size={13.5} className="text-emerald-500 shrink-0 mt-0.5" />,
      },
      critical: {
        bg: "bg-red-50/40 border-red-100 text-red-900",
        icon: <ShieldAlert size={13.5} className="text-red-500 shrink-0 mt-0.5" />,
      },
    }[status as string] || {
      bg: "bg-slate-50 border-slate-200 text-slate-700",
      icon: <Info size={13.5} className="text-slate-400 shrink-0 mt-0.5" />,
    };

    return (
      <div
        style={spanStyle}
        className={`flex items-start gap-2.5 rounded-lg border p-3.5 shadow-sm ${statusConfig.bg}`}
      >
        {statusConfig.icon}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-semibold text-slate-800 leading-normal">{title || "Status Alert"}</span>
          <span className="text-[10px] text-slate-500 leading-relaxed font-medium">{message || "System details information message."}</span>
        </div>
      </div>
    );
  };

  // 7. DATA_TABLE Component Renders
  const renderDataTable = () => {
    const { title, density } = node.props;
    const isCompact = density === "compact";

    const rows = [
      { id: "TXN-0941", type: "Vendor Payout", vendor: "Vertex Tech Ltd", amount: "₹4,12,500", date: "12 Aug 2026", status: "Approved" },
      { id: "TXN-0892", type: "Tax Retainer", vendor: "Crest Advisory", amount: "₹75,000", date: "11 Aug 2026", status: "Pending" },
      { id: "TXN-0740", type: "Cloud SaaS", vendor: "AWS Inc.", amount: "₹2,10,000", date: "09 Aug 2026", status: "Approved" },
    ];

    return (
      <div className="w-full bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-700 tracking-wide uppercase">
            {title || "Recent Transactions"}
          </h4>
          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium tracking-wide">
            DATA MOCK
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider">
                <th className={`${isCompact ? "py-1.5 px-3" : "py-2.5 px-4"}`}>ID</th>
                <th className={`${isCompact ? "py-1.5 px-3" : "py-2.5 px-4"}`}>Transaction</th>
                <th className={`${isCompact ? "py-1.5 px-3" : "py-2.5 px-4"}`}>Vendor</th>
                <th className={`${isCompact ? "py-1.5 px-3" : "py-2.5 px-4"}`}>Amount</th>
                <th className={`${isCompact ? "py-1.5 px-3" : "py-2.5 px-4"}`}>Date</th>
                <th className={`${isCompact ? "py-1.5 px-3" : "py-2.5 px-4"}`}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {rows.map((row) => (
                <tr key={row.id} className="text-xs text-slate-600 hover:bg-slate-50/30 transition-colors">
                  <td className={`${isCompact ? "py-1.5 px-3" : "py-2 px-4"} font-mono font-medium text-slate-400`}>{row.id}</td>
                  <td className={`${isCompact ? "py-1.5 px-3" : "py-2 px-4"} font-medium text-slate-800`}>{row.type}</td>
                  <td className={`${isCompact ? "py-1.5 px-3" : "py-2 px-4"} font-medium`}>{row.vendor}</td>
                  <td className={`${isCompact ? "py-1.5 px-3" : "py-2 px-4"} font-mono font-semibold text-slate-800`}>{row.amount}</td>
                  <td className={`${isCompact ? "py-1.5 px-3" : "py-2 px-4"} text-slate-400 font-medium`}>{row.date}</td>
                  <td className={`${isCompact ? "py-1.5 px-3" : "py-2 px-4"}`}>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${
                      row.status === "Approved" 
                        ? "bg-emerald-50 text-emerald-600" 
                        : "bg-amber-50 text-amber-600"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 8. CHART_PLACEHOLDER Component Renders
  const renderChartPlaceholder = () => {
    const { chartType, height } = node.props;

    const heightStyles = {
      short: "h-28",
      normal: "h-44",
      tall: "h-64",
    }[height as string] || "h-44";

    return (
      <div className="w-full bg-white rounded-lg border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {chartType === "bar" ? "Revenue Performance Graph" : chartType === "line" ? "Reconciliation Success Trend" : "Transaction Categorization"}
          </span>
          <span className="text-[9px] text-slate-400 font-mono font-medium">Monthly Series</span>
        </div>

        <div className={`w-full ${heightStyles} bg-slate-50/50 rounded border border-slate-100 flex items-center justify-center p-4 relative overflow-hidden`}>
          {chartType === "bar" && (
            <div className="w-full h-full flex items-end justify-around gap-2 px-4 pt-4">
              <div className="w-1/8 bg-slate-200 h-[30%] rounded-t-sm" />
              <div className="w-1/8 bg-slate-200 h-[45%] rounded-t-sm" />
              <div className="w-1/8 bg-slate-300 h-[60%] rounded-t-sm" />
              <div className="w-1/8 bg-slate-900 h-[85%] rounded-t-sm" />
              <div className="w-1/8 bg-slate-900 h-[70%] rounded-t-sm" />
              <div className="w-1/8 bg-slate-200 h-[50%] rounded-t-sm" />
              <div className="w-1/8 bg-slate-300 h-[92%] rounded-t-sm" />
              <div className="w-1/8 bg-slate-900 h-[80%] rounded-t-sm" />
            </div>
          )}

          {chartType === "line" && (
            <svg className="w-full h-full p-2" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d="M0,25 Q15,10 30,18 T60,5 T90,12 T100,10"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="1.5"
                className="stroke-slate-900"
              />
              <path
                d="M0,25 Q15,10 30,18 T60,5 T90,12 T100,10 L100,30 L0,30 Z"
                fill="url(#chartGrad)"
                opacity="0.05"
              />
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#111113" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>
          )}

          {chartType === "donut" && (
            <div className="flex items-center gap-6">
              <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="30" stroke="#f1f3f5" strokeWidth="8" fill="transparent" />
                  <circle cx="40" cy="40" r="30" stroke="#111113" strokeWidth="8" fill="transparent" strokeDasharray="188" strokeDashoffset="75" />
                  <circle cx="40" cy="40" r="30" stroke="#6c757d" strokeWidth="8" fill="transparent" strokeDasharray="188" strokeDashoffset="140" />
                </svg>
                <div className="text-[10px] font-mono font-bold text-slate-800">75%</div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-slate-900" />
                  <span>Corporate Payouts (65%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span>SaaS Cloud Fees (25%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-slate-200" />
                  <span>General Expense (10%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 9. BUTTON Component Renders
  const renderButton = () => {
    const { text, variant, size } = node.props;

    const variantStyles = {
      primary: "bg-slate-950 text-white hover:bg-slate-800 border border-transparent shadow-sm",
      secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-sm",
      destructive: "bg-red-600 text-white hover:bg-red-700 border border-transparent shadow-sm",
    }[variant as string] || "bg-slate-950 text-white";

    const sizeStyles = {
      small: "text-xs px-3 py-1.5 rounded",
      normal: "text-sm px-4.5 py-2 rounded-md",
    }[size as string] || "text-sm px-4.5 py-2 rounded-md";

    return (
      <button
        type="button"
        className={`font-semibold transition-all inline-flex items-center gap-1.5 ${variantStyles} ${sizeStyles}`}
      >
        <span>{text || "Action"}</span>
        <ChevronRight size={13} className="opacity-80" />
      </button>
    );
  };

  const renderComponent = () => {
    switch (node.type) {
      case "SECTION": return renderSection();
      case "CONTAINER": return renderContainer();
      case "GRID": return renderGrid();
      case "STACK": return renderStack();
      case "STAT_CARD": return renderStatCard();
      case "STATUS_CARD": return renderStatusCard();
      case "DATA_TABLE": return renderDataTable();
      case "CHART_PLACEHOLDER": return renderChartPlaceholder();
      case "BUTTON": return renderButton();
      default: return null;
    }
  };

  if (previewMode) {
    return renderComponent();
  }

  // Determine current active drop hover indicators
  const isTarget = dragState.isDragging && dragState.targetNodeId === node.id;
  const isInsideIntent = isTarget && dragState.dropIntent === "inside";
  const isBeforeIntent = isTarget && dragState.dropIntent === "before";
  const isAfterIntent = isTarget && dragState.dropIntent === "after";

  let indicatorStyles = "outline-transparent";
  if (isInsideIntent) {
    indicatorStyles = dragState.isValid
      ? "outline-dashed outline-2 outline-blue-500/85 bg-blue-50/10 rounded-lg"
      : "outline outline-2 outline-red-400 bg-red-50/5 rounded-lg cursor-not-allowed";
  }

  const gridSpan = node.props.gridSpan;
  const resolverStyle: React.CSSProperties = {};
  if (gridSpan) {
    resolverStyle.gridColumn = `span ${gridSpan} / span ${gridSpan}`;
  }

  return (
    <div
      ref={setCombinedRef}
      onClick={handleSelect}
      style={resolverStyle}
      className={`relative group/resolver transition-all select-none duration-150 ${indicatorStyles} ${
        isDragging ? "opacity-30" : ""
      } ${
        isSelected
          ? "outline outline-1.5 outline-blue-500 rounded relative z-10 shadow-sm"
          : "hover:outline hover:outline-1 hover:outline-blue-400/50 rounded"
      }`}
    >
      {/* Before insertion indicator line */}
      {isBeforeIntent && (
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-blue-500 rounded-full z-30 animate-pulse" />
      )}

      {/* Selected Indicator Tag Bar with grip handle listener */}
      {isSelected && (
        <div className="absolute -top-4.5 left-0 z-25 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-t flex items-center gap-1 select-none shadow-sm leading-none">
          <span
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing hover:bg-white/20 p-0.5 rounded shrink-0"
            title="Drag to reorder component"
          >
            <GripVertical size={9} />
          </span>
          <span>{registryEntry.displayName}</span>
        </div>
      )}

      {/* Hover Indicator Tag Bar with grip handle listener */}
      {!isSelected && (
        <div className="absolute -top-4.5 left-0 z-20 bg-slate-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-t flex items-center gap-1 opacity-0 group-hover/resolver:opacity-100 transition-opacity duration-100 select-none leading-none">
          <span
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing hover:bg-white/20 p-0.5 rounded shrink-0"
            title="Drag to reorder component"
          >
            <GripVertical size={9} />
          </span>
          <span>{registryEntry.displayName}</span>
        </div>
      )}

      {/* Render Component visuals */}
      <div className="p-0.5">
        {renderComponent()}
      </div>

      {/* After insertion indicator line */}
      {isAfterIntent && (
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-500 rounded-full z-30 animate-pulse" />
      )}
    </div>
  );
}
