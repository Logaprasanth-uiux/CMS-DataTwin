"use client";

import React from "react";
import { DocumentNode } from "@/types/document";
import { useEditorStore } from "@/store/editorStore";
import { COMPONENT_REGISTRY } from "@/registry";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { TrendingUp, TrendingDown, Info, ShieldAlert, CheckCircle2, ChevronRight, GripVertical, Shield, AlertCircle, FileText } from "lucide-react";

const getStatCardIcon = (name: string, color: string) => {
  const iconProps = { size: 16, color };
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  switch (normalized) {
    case "shield":
      return <Shield {...iconProps} />;
    case "alert":
    case "alertcircle":
    case "warning":
      return <AlertCircle {...iconProps} />;
    case "check":
    case "checkcircle2":
    case "success":
      return <CheckCircle2 {...iconProps} />;
    case "file":
    case "filetext":
    case "document":
      return <FileText {...iconProps} />;
    case "trendingup":
      return <TrendingUp {...iconProps} />;
    case "trendingdown":
      return <TrendingDown {...iconProps} />;
    default:
      return null;
  }
};

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
        const allowed = registryEntry.allowedChildren || [];
        const hasLayout = allowed.some(c => COMPONENT_REGISTRY[c]?.category === "layout");
        const hasContent = allowed.some(c => COMPONENT_REGISTRY[c]?.category !== "layout");
        
        let acceptsText = "components";
        if (hasLayout && hasContent) {
          acceptsText = "Layout & Content components";
        } else if (hasLayout) {
          acceptsText = "Layout components only";
        } else if (hasContent) {
          acceptsText = "Content components only";
        }

        return (
          <div className="w-full min-h-[70px] py-4 px-4 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50/20 select-none transition-colors">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Empty {registryEntry.displayName}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Drop components here to build your layout.
            </span>
            <span className="text-[9px] text-slate-400/80 font-mono mt-1">
              Accepts: {acceptsText}
            </span>
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
    const {
      label,
      value,
      description,
      cardIconName,
      change,
      trendText,
      positive,
      titleColor,
      valueColor,
      trendColor,
      descriptionColor,
      iconColor,
      gridSpan,
      showTrendIcon,
    } = node.props;

    const spanStyle: React.CSSProperties = gridSpan 
      ? { gridColumn: `span ${gridSpan} / span ${gridSpan}` } 
      : {};

    const containerStyle: React.CSSProperties = {
      ...spanStyle,
      backgroundColor: "#FFFFFF",
      borderColor: "#E2E8F0",
      borderRadius: "12px",
      borderWidth: "1px",
      borderStyle: "solid",
    };

    // Colors
    const tColor = titleColor || "#64748B";
    const vColor = valueColor || "#0F172A";
    const trColor = trendColor || "#64748B";
    const dColor = descriptionColor || "#64748B";
    const iColor = iconColor || "#64748B";

    const activeIconName = cardIconName !== undefined ? cardIconName : (node.props.iconName || node.props.icon || "Shield");
    const cardIcon = activeIconName ? getStatCardIcon(activeIconName, iColor) : null;

    // Render logic for bottom description or trend
    const hasDescription = description !== undefined && description !== "";
    const hasTrend = change !== undefined && change !== "";
    const activeShowTrendIcon = showTrendIcon !== undefined ? showTrendIcon : true;

    return (
      <div
        style={containerStyle}
        className="flex flex-col p-4 w-full select-none justify-between gap-3 shadow-sm hover:shadow-md transition-all duration-150 min-h-[110px]"
      >
        {/* Top Row: Title and Icon */}
        <div className="flex items-start justify-between gap-4">
          <span
            style={{ color: tColor }}
            className="text-[10px] font-bold uppercase tracking-wider leading-none truncate max-w-[85%]"
          >
            {label || "Metric Title"}
          </span>
          {cardIcon && (
            <div className="shrink-0 leading-none">
              {cardIcon}
            </div>
          )}
        </div>

        {/* Main Value */}
        <div
          style={{ color: vColor }}
          className="text-2xl font-bold tracking-tight leading-none mt-1 break-words select-all"
        >
          {value || "0"}
        </div>

        {/* Bottom Section: Explicit Description OR Trend Fallback */}
        {hasDescription ? (
          <div
            style={{ color: dColor }}
            className="text-[10px] font-medium leading-relaxed select-all break-words"
          >
            {description}
          </div>
        ) : hasTrend ? (
          <div
            style={{ color: trColor }}
            className="text-[10px] font-medium leading-relaxed select-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <div className="flex items-center gap-1 shrink-0">
              {activeShowTrendIcon && (positive !== false ? (
                <TrendingUp size={11} style={{ color: trColor }} className="shrink-0" />
              ) : (
                <TrendingDown size={11} style={{ color: trColor }} className="shrink-0" />
              ))}
              <span className="font-mono font-bold leading-none">
                {change}{!change.endsWith("%") && "%"}
              </span>
            </div>
            <span className="font-medium">{trendText || "vs last month"}</span>
          </div>
        ) : null}
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
    const { title, density, columns, rows } = node.props;
    const isCompact = density === "compact";

    const DEFAULT_COLUMNS = [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'type', label: 'Transaction', type: 'string' },
      { key: 'vendor', label: 'Vendor', type: 'string' },
      { key: 'amount', label: 'Amount', type: 'string' },
      { key: 'date', label: 'Date', type: 'string' },
      { key: 'status', label: 'Status', type: 'string' },
    ];

    const DEFAULT_ROWS = [
      { id: 'TXN-0941', type: 'Vendor Payout', vendor: 'Vertex Tech Ltd', amount: '₹4,12,500', date: '12 Aug 2026', status: 'Approved' },
      { id: 'TXN-0892', type: 'Tax Retainer', vendor: 'Crest Advisory', amount: '₹75,000', date: '11 Aug 2026', status: 'Pending' },
      { id: 'TXN-0740', type: 'Cloud SaaS', vendor: 'AWS Inc.', amount: '₹2,10,000', date: '09 Aug 2026', status: 'Approved' },
    ];

    const activeColumns = columns !== undefined ? columns : DEFAULT_COLUMNS;
    const activeRows = rows !== undefined ? rows : DEFAULT_ROWS;

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
                {activeColumns.map((col: any) => (
                  <th key={col.key} className={`${isCompact ? "py-1.5 px-3" : "py-2.5 px-4"}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {activeRows.map((row: any, rIdx: number) => (
                <tr key={row.id || rIdx} className="text-xs text-slate-600 hover:bg-slate-50/30 transition-colors">
                  {activeColumns.map((col: any) => {
                    const val = row[col.key] !== undefined ? row[col.key] : "";
                    
                    if (col.key === "status") {
                      return (
                        <td key={col.key} className={`${isCompact ? "py-1.5 px-3" : "py-2 px-4"}`}>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${
                            val === "Approved" 
                              ? "bg-emerald-50 text-emerald-600" 
                              : "bg-amber-50 text-amber-600"
                          }`}>
                            {String(val)}
                          </span>
                        </td>
                      );
                    }

                    const isId = col.key === "id";
                    const isType = col.key === "type";
                    const isAmount = col.key === "amount";
                    const isDate = col.key === "date";
                    
                    const cellClassName = `${isCompact ? "py-1.5 px-3" : "py-2 px-4"} ${
                      isId ? "font-mono font-medium text-slate-400" :
                      isType ? "font-medium text-slate-800" :
                      isAmount ? "font-mono font-semibold text-slate-800" :
                      isDate ? "text-slate-400 font-medium" : "font-medium"
                    }`;

                    return (
                      <td key={col.key} className={cellClassName}>
                        {col.type === 'boolean' ? (val ? "Yes" : "No") : String(val)}
                      </td>
                    );
                  })}
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
    const { text, variant, size, action } = node.props;

    const variantStyles = {
      primary: "bg-slate-950 text-white hover:bg-slate-800 border border-transparent shadow-sm",
      secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-sm",
      destructive: "bg-red-600 text-white hover:bg-red-700 border border-transparent shadow-sm",
    }[variant as string] || "bg-slate-950 text-white";

    const sizeStyles = {
      small: "text-xs px-3 py-1.5 rounded",
      normal: "text-sm px-4.5 py-2 rounded-md",
    }[size as string] || "text-sm px-4.5 py-2 rounded-md";

    const handleButtonClick = () => {
      if (previewMode && action) {
        window.location.href = action;
      }
    };

    return (
      <button
        type="button"
        onClick={handleButtonClick}
        className={`font-semibold transition-all inline-flex items-center gap-1.5 ${variantStyles} ${sizeStyles}`}
      >
        <span>{text || "Action"}</span>
        <ChevronRight size={13} className="opacity-80" />
      </button>
    );
  };

  // 10. TABS Component Renders
  const renderTabs = () => {
    const { tabs, activeTabId } = node.props;
    const currentTabs = tabs || [];
    const activeId = activeTabId || (currentTabs[0]?.id || "");

    const activeIndex = currentTabs.findIndex((t: any) => t.id === activeId);

    // Filter/Render only the active child
    const activeChild = node.children && activeIndex >= 0 && activeIndex < node.children.length 
      ? node.children[activeIndex]
      : null;

    const handleTabClick = (tabId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      updateNodeProps(node.id, { activeTabId: tabId });
    };

    return (
      <div className="w-full flex flex-col gap-4 bg-white border border-slate-200/80 rounded-lg p-4 shadow-sm select-none">
        {/* Tab Navigation Headers */}
        <div className="flex items-center border-b border-slate-200 overflow-x-auto gap-2 scrollbar-none">
          {currentTabs.map((tab: any) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={(e) => handleTabClick(tab.id, e)}
                className={`py-2.5 px-4 font-semibold text-xs border-b-2 transition-all relative whitespace-nowrap cursor-pointer -mb-px ${
                  isActive
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab Content Area */}
        <div className="w-full min-h-[100px]">
          {activeChild ? (
            <ComponentResolver node={activeChild} />
          ) : (
            !previewMode && (
              <div className="w-full min-h-[80px] border border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-slate-50/50 p-4">
                <span className="text-[10px] text-slate-400 font-medium">Empty Tab Content. Drop layout container here.</span>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  // 11. FORM_SECTION Component Renders
  const renderFormSection = () => {
    const { title, actionLabel, columnCount } = node.props;
    const colCount = Number(columnCount) || 2;

    const gridLayoutClass = colCount === 1
      ? "grid grid-cols-1 gap-4.5"
      : "grid grid-cols-1 md:grid-cols-2 gap-4.5";

    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className="w-full flex flex-col bg-white border border-slate-200/80 rounded-lg p-5 shadow-sm select-none gap-4">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            {title || "Section Title"}
          </h3>
          {actionLabel && (
            <button
              type="button"
              className="text-[9px] font-bold text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded transition-all cursor-pointer shadow-sm"
            >
              {actionLabel}
            </button>
          )}
        </div>

        {/* Section Content Area */}
        <div className={gridLayoutClass}>
          {hasChildren ? (
            node.children?.map((child) => (
              <ComponentResolver key={child.id} node={child} />
            ))
          ) : (
            !previewMode && (
              <div className="col-span-full w-full min-h-[75px] border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center bg-slate-50/20 p-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Empty Form Section</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Drop content components here.</span>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  // 12. FIELD Component Renders
  const renderField = () => {
    const { label, value, fieldType, options } = node.props;
    const type = fieldType || "text";

    const labelEl = (
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
        {label || "Field Label"}
      </label>
    );

    const renderValue = () => {
      switch (type) {
        case "select": {
          const currentOptions = options || [];
          const matchedOption = currentOptions.find((o: any) => o.value === value);
          const displayLabel = matchedOption ? matchedOption.label : (value || "");
          return (
            <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800 w-full flex items-center justify-between select-none">
              <span>{displayLabel}</span>
              <span className="text-[9px] text-slate-400">▼</span>
            </div>
          );
        }
        case "status": {
          const statusLower = (value || "").toLowerCase();
          let bgClass = "bg-slate-50 text-slate-700 border-slate-200/60";
          let dotClass = "bg-slate-400";

          if (statusLower === "validated" || statusLower === "approved" || statusLower === "success") {
            bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
            dotClass = "bg-emerald-505"; // Wait, bg-emerald-500
            dotClass = "bg-emerald-500";
          } else if (statusLower === "pending" || statusLower === "warning" || statusLower === "validation") {
            bgClass = "bg-amber-50 text-amber-700 border-amber-200/60";
            dotClass = "bg-amber-500";
          } else if (statusLower === "critical" || statusLower === "rejected" || statusLower === "failed" || statusLower === "error") {
            bgClass = "bg-red-50 text-red-700 border-red-200/60";
            dotClass = "bg-red-500";
          }

          return (
            <div className="flex items-center min-h-[30px]">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${bgClass}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                <span>{value || ""}</span>
              </span>
            </div>
          );
        }
        case "readonly": {
          return (
            <div className="text-xs font-semibold text-slate-800 py-1 select-none">
              {value || ""}
            </div>
          );
        }
        case "text":
        default:
          return (
            <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-800 w-full select-none">
              {value || ""}
            </div>
          );
      }
    };

    return (
      <div className="w-full flex flex-col">
        {labelEl}
        {renderValue()}
      </div>
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
      case "TABS": return renderTabs();
      case "FORM_SECTION": return renderFormSection();
      case "FIELD": return renderField();
      default: return null;
    }
  };

  if (previewMode) {
    const gridSpan = node.props.gridSpan;
    const resolverStyle: React.CSSProperties = {};
    if (gridSpan) {
      resolverStyle.gridColumn = `span ${gridSpan} / span ${gridSpan}`;
    }
    return (
      <div style={resolverStyle}>
        {renderComponent()}
      </div>
    );
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
