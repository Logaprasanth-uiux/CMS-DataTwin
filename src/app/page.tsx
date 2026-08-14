"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/store/editorStore";
import { Search, Plus, FileText, ArrowRight, Layout, Rows, Monitor } from "lucide-react";

export default function PagesHome() {
  const router = useRouter();
  const { pages, createPage, loadPage } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState("");

  const pageList = Object.values(pages);

  // Filter pages based on search text
  const filteredPages = pageList.filter(
    (page) =>
      page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditPage = (pageId: string) => {
    loadPage(pageId);
    router.push(`/editor/${pageId}`);
  };

  const handleCreateNewPage = () => {
    // Call store action to construct a new blank page structure
    const newPageId = createPage("New Page", "Page");
    loadPage(newPageId);
    router.push(`/editor/${newPageId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none text-slate-800">
      {/* CMS Branding Header */}
      <header className="h-14 bg-white border-b border-slate-200/60 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          {/* Graphite logo treatment */}
          <div className="flex items-center justify-center h-7 w-7 rounded bg-slate-500 text-white font-black text-xs tracking-wider">
            DT
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs tracking-wide text-slate-600 uppercase font-mono">DataTwin</span>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">CMS</span>
          </div>
        </div>
      </header>

      {/* Main Pages Workspace Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
        {/* Workspace Title & Create Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pages</h1>
            <p className="text-xs text-slate-400 font-medium">
              Compose, manage, and edit application pages and layout configurations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateNewPage}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm border border-transparent transition-all cursor-pointer"
          >
            <Plus size={13} />
            <span>Create New Page</span>
          </button>
        </div>

        {/* Filters and List Card */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          {/* Search bar bar */}
          <div className="p-4 border-b border-slate-100 flex items-center relative">
            <Search className="absolute left-7 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search page name, type, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white transition-all text-slate-800 font-medium"
            />
          </div>

          {/* Pages Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-5">Page Name</th>
                  <th className="py-3 px-5">Layout Type</th>
                  <th className="py-3 px-5">Publishing Status</th>
                  <th className="py-3 px-5">Last Edited</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {filteredPages.map((page) => (
                  <tr
                    key={page.id}
                    onClick={() => handleEditPage(page.id)}
                    className="group text-xs text-slate-600 hover:bg-slate-50/40 transition-colors cursor-pointer"
                  >
                    {/* Page Name & Icon */}
                    <td className="py-3.5 px-5 font-semibold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">
                          <FileText size={12} />
                        </div>
                        <span className="truncate max-w-[240px]">{page.name}</span>
                      </div>
                    </td>

                    {/* Page Layout Type */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                        {page.type === "Dashboard" ? (
                          <Layout size={11} className="text-slate-400" />
                        ) : (
                          <Rows size={11} className="text-slate-400" />
                        )}
                        <span>{page.type}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide uppercase ${
                          page.status === "Published"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                            : page.status === "Under Review"
                            ? "bg-blue-50 text-blue-600 border border-blue-100/50"
                            : "bg-amber-50 text-amber-600 border border-amber-100/50"
                        }`}
                      >
                        {page.status}
                      </span>
                    </td>

                    {/* Date placeholder */}
                    <td className="py-3.5 px-5 text-slate-400 font-mono">
                      {page.id === "finance-overview"
                        ? "Aug 12, 2026"
                        : page.id === "transaction-hub"
                        ? "Aug 11, 2026"
                        : page.id === "accounts-payable"
                        ? "Aug 10, 2026"
                        : page.id === "accounts-receivable"
                        ? "Aug 09, 2026"
                        : "Just Now"}
                    </td>

                    {/* Quick navigation edit button */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPage(page.id);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer bg-slate-50 group-hover:bg-white border border-slate-200/60 rounded px-2.5 py-1"
                      >
                        <span>Edit Page</span>
                        <ArrowRight size={11} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredPages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                      No composed pages matched your search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
