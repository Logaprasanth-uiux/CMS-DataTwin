"use client";

import { useEditorStore } from "@/store/editorStore";
import ComponentResolver from "./ComponentResolver";

export default function PageRenderer() {
  const { pages, activePageId } = useEditorStore();

  if (!activePageId || !pages[activePageId]) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200/60 max-w-md mx-auto my-12">
        <p className="text-xs font-semibold text-slate-500">No active page selected</p>
        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
          Please return to the Pages workspace to select or create a page document.
        </p>
      </div>
    );
  }

  const activePage = pages[activePageId];

  // Initiates recursive layout rendering from the active page layout tree
  return <ComponentResolver node={activePage.layout} />;
}
