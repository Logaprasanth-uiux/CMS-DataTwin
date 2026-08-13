"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditorStore } from "@/store/editorStore";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import TopToolbar from "@/components/editor/TopToolbar";
import LeftPanel from "@/components/editor/LeftPanel";
import Canvas from "@/components/editor/Canvas";
import PropertiesInspector from "@/components/editor/PropertiesInspector";
import { findNode, findParentNode, isDescendant, isValidNesting } from "@/utils/layoutUtils";
import { COMPONENT_REGISTRY } from "@/registry";

export default function EditorPageRoute() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;
  const { pages, activePageId, loadPage, previewMode, dragState, setDragState, resetDragState, addNode, moveNode, zoom } = useEditorStore();
  
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(340);
  
  const isResizingLeft = useRef(false);
  const isResizingRight = useRef(false);

  // Setup sensors for click/drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4, // Drag starts only after moving 4px to avoid clicking interference
      },
    })
  );

  // Synchronize route parameters with store active page
  useEffect(() => {
    if (pageId) {
      if (pages[pageId]) {
        if (activePageId !== pageId) {
          loadPage(pageId);
        }
      } else {
        router.push("/");
      }
    }
  }, [pageId, pages, activePageId, loadPage, router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft.current) {
        const newWidth = Math.max(260, Math.min(380, e.clientX));
        setLeftWidth(newWidth);
      }
      if (isResizingRight.current) {
        const newWidth = Math.max(300, Math.min(420, window.innerWidth - e.clientX));
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingLeft.current = false;
      isResizingRight.current = false;
      document.body.style.cursor = "default";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // 1. Drag Start Handler
  const handleDragStart = (event: any) => {
    const { active } = event;
    const activeId = active.id.toString();
    const isLibrary = activeId.startsWith("library::");

    setDragState({
      isDragging: true,
      sourceType: isLibrary ? "library" : "canvas",
      sourceNodeId: isLibrary ? undefined : activeId,
      componentType: isLibrary ? activeId.replace("library::", "") : undefined,
    });
  };

  // 2. Drag Hover / Over Handler (Pointer-coordinate Drop Intent calculation)
  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over || !activePageId || !pages[activePageId]) {
      setDragState({
        targetNodeId: null,
        targetParentId: null,
        dropIntent: null,
        isValid: false,
      });
      return;
    }

    const targetNodeId = over.id.toString();
    const draggedId = active.id.toString();
    const activePage = pages[activePageId];

    // Determine the type of the dragged component
    let draggedType = "";
    const isLibraryDrag = draggedId.startsWith("library::");
    if (isLibraryDrag) {
      draggedType = draggedId.replace("library::", "");
    } else {
      const draggedNode = findNode(activePage.layout, draggedId);
      if (draggedNode) {
        draggedType = draggedNode.type;
      }
    }

    if (!draggedType) return;

    // Get coordinates and target rect properties
    const targetRect = over.rect;
    const pointerCoordinates = event.pointerCoordinates;

    // Determine insertion intention (before, after, inside) based on vertical hover coordinates
    let dropIntent: "before" | "after" | "inside" = "inside";
    if (pointerCoordinates && targetRect) {
      const relativeY = pointerCoordinates.y - targetRect.top;
      const percentY = relativeY / targetRect.height;
      if (percentY < 0.2) {
        dropIntent = "before";
      } else if (percentY > 0.8) {
        dropIntent = "after";
      }
    }

    // Resolve index locations in page document layout
    let targetParentId = targetNodeId;
    const targetNode = findNode(activePage.layout, targetNodeId);
    if (!targetNode) return;

    if (dropIntent === "inside") {
      targetParentId = targetNodeId;
    } else {
      const parentNode = findParentNode(activePage.layout, targetNodeId);
      if (parentNode) {
        targetParentId = parentNode.id;
      } else {
        // Fallback: If no parent container exists (root section), insert inside
        dropIntent = "inside";
        targetParentId = targetNodeId;
      }
    }

    // Validate parent/child contract rules
    let isValid = true;
    const targetParentNode = findNode(activePage.layout, targetParentId);
    if (!targetParentNode) {
      isValid = false;
    } else {
      isValid = isValidNesting(draggedType, targetParentNode.type);
    }

    // Prevent invalid recursive moves (moving parent inside its own children subtree)
    if (!isLibraryDrag && isValid) {
      const draggedNode = findNode(activePage.layout, draggedId);
      if (draggedNode && isDescendant(draggedNode, targetParentId)) {
        isValid = false;
      }
    }

    setDragState({
      targetNodeId,
      targetParentId,
      dropIntent,
      isValid,
    });
  };

  // 3. Drag End Handler (Drop Mutation transaction commits)
  const handleDragEnd = (event: any) => {
    const { active } = event;
    const draggedId = active.id.toString();
    const isLibraryDrag = draggedId.startsWith("library::");

    if (dragState.isValid && dragState.targetParentId !== null && dragState.dropIntent !== null && activePageId && pages[activePageId]) {
      const activePage = pages[activePageId];
      
      // Calculate target index in parent array
      let targetIndex = 0;
      const targetParentNode = findNode(activePage.layout, dragState.targetParentId);
      if (targetParentNode && targetParentNode.children) {
        if (dragState.dropIntent === "inside") {
          targetIndex = targetParentNode.children.length;
        } else {
          const siblingIndex = targetParentNode.children.findIndex((c) => c.id === dragState.targetNodeId);
          targetIndex = dragState.dropIntent === "before" ? siblingIndex : siblingIndex + 1;
        }
      }

      if (isLibraryDrag) {
        // Add new component: Library -> Canvas
        const componentType = draggedId.replace("library::", "");
        const registryEntry = COMPONENT_REGISTRY[componentType];
        
        // Generate default properties schema map
        const defaultProps: Record<string, any> = {};
        if (registryEntry) {
          Object.entries(registryEntry.properties).forEach(([propKey, propSchema]) => {
            defaultProps[propKey] = propSchema.defaultValue;
          });
        }

        addNode(dragState.targetParentId, {
          type: componentType,
          props: defaultProps,
        }, targetIndex);
      } else {
        // Move existing component: Canvas -> Canvas
        moveNode(draggedId, dragState.targetParentId, targetIndex, dragState.dropIntent);
      }
    }

    resetDragState();
  };

  // Avoid loading screen before page ID is resolved in active store
  if (activePageId !== pageId || !pages[pageId]) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium text-xs font-mono">
        Resolving composition page session...
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen overflow-hidden bg-background select-none font-sans text-foreground">
        {/* Top Header Toolbar */}
        <TopToolbar />

        {/* Editor Content Area */}
        <div className="flex-1 min-h-0 relative">
          {previewMode ? (
            // In Preview Mode, render only the Canvas in full layout space
            <div className="w-full h-full bg-slate-50 overflow-y-auto">
              <Canvas />
            </div>
          ) : (
            // In Editor Mode, render panels using the custom resizable splits
            <div className="flex h-full w-full overflow-hidden">
              {/* Left Panel: Library & Tree */}
              <div 
                style={{ width: `${leftWidth}px` }} 
                className="bg-card flex flex-col border-r border-panel-border shrink-0 min-h-0 overflow-hidden"
              >
                <LeftPanel />
              </div>
              
              {/* Left Resize Handle */}
              <div 
                onMouseDown={() => {
                  isResizingLeft.current = true;
                  document.body.style.cursor = "col-resize";
                }}
                className="w-[4px] hover:w-[6px] bg-slate-100/60 hover:bg-blue-400 cursor-col-resize shrink-0 transition-all z-25 relative"
              />

              {/* Center Visual Layout Canvas */}
              <div className="flex-1 min-w-0 h-full flex flex-col bg-slate-50 overflow-hidden">
                <Canvas />
              </div>
              
              {/* Right Resize Handle */}
              <div 
                onMouseDown={() => {
                  isResizingRight.current = true;
                  document.body.style.cursor = "col-resize";
                }}
                className="w-[4px] hover:w-[6px] bg-slate-100/60 hover:bg-blue-400 cursor-col-resize shrink-0 transition-all z-25 relative"
              />

              {/* Right Panel: Properties Config */}
              <div 
                style={{ width: `${rightWidth}px` }} 
                className="bg-card flex flex-col border-l border-panel-border shrink-0 min-h-0 overflow-hidden"
              >
                <PropertiesInspector />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating custom Drag Overlay ghost representation */}
      <DragOverlay dropAnimation={null}>
        {dragState.isDragging ? (
          <div 
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top left",
            }}
            className="bg-white border-2 border-[#228be6] rounded-md px-3 py-2 shadow-lg flex items-center gap-2 cursor-grabbing pointer-events-none opacity-80 text-xs font-medium text-slate-800"
          >
            <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-1 rounded uppercase">
              {dragState.sourceType === "library" ? "Add" : "Move"}
            </span>
            <span>
              {dragState.sourceType === "library"
                ? COMPONENT_REGISTRY[dragState.componentType!]?.displayName || dragState.componentType
                : COMPONENT_REGISTRY[pages[activePageId]!.layout.id === dragState.sourceNodeId ? pages[activePageId]!.layout.type : findNode(pages[activePageId]!.layout, dragState.sourceNodeId!)?.type || ""]?.displayName || "Component"}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
