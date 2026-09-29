"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { ParquetColumnSchema, ParquetDataset } from "@/lib/parquet-engine";
import { isImageValue } from "@/lib/utils";
import {
  Search,
  ArrowUpDown,
  Trash2,
  Copy,
  Eye,
  Edit3,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  PlusCircle,
  FileCode,
} from "lucide-react";

interface ParquetGridProps {
  dataset: ParquetDataset;
  onUpdateCell: (rowId: string, colName: string, value: any) => void;
  onDeleteRow: (rowId: string) => void;
  onDuplicateRow: (rowId: string) => void;
  onOpenOcrAnnotator: (rowId: string) => void;
  onDeleteColumn: (colName: string) => void;
  onRenameColumn: (oldName: string, newName: string) => void;
  onChangeColumnType: (colName: string, newType: ParquetColumnSchema["type"]) => void;
}

export const ParquetGrid: React.FC<ParquetGridProps> = ({
  dataset,
  onUpdateCell,
  onDeleteRow,
  onDuplicateRow,
  onOpenOcrAnnotator,
  onDeleteColumn,
  onRenameColumn,
  onChangeColumnType,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Editing state
  const [editingCell, setEditingCell] = useState<{ rowId: string; colName: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Column management dropdown
  const [activeColMenu, setActiveColMenu] = useState<string | null>(null);

  // Filter & Sort rows
  const filteredRows = useMemo(() => {
    let result = [...dataset.rows];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((row) => {
        return dataset.columns.some((col) => {
          const val = row[col.name];
          if (val === null || val === undefined) return false;
          if (typeof val === "object") {
            return JSON.stringify(val).toLowerCase().includes(q);
          }
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }
        const strA = String(valA);
        const strB = String(valB);
        return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [dataset.rows, dataset.columns, searchQuery, sortColumn, sortDirection]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(colName);
      setSortDirection("asc");
    }
  };

  const startEdit = (rowId: string, colName: string, currentVal: any) => {
    setEditingCell({ rowId, colName });
    if (typeof currentVal === "object" && currentVal !== null) {
      setEditValue(JSON.stringify(currentVal, null, 2));
    } else {
      setEditValue(String(currentVal ?? ""));
    }
  };

  const saveEdit = () => {
    if (!editingCell) return;
    const col = dataset.columns.find((c) => c.name === editingCell.colName);
    let finalVal: any = editValue;

    if (col?.type === "number") {
      const num = Number(editValue);
      finalVal = isNaN(num) ? 0 : num;
    } else if (col?.type === "boolean") {
      finalVal = editValue.toLowerCase() === "true" || editValue === "1";
    } else if (col?.type === "json") {
      try {
        finalVal = JSON.parse(editValue);
      } catch {
        finalVal = editValue;
      }
    }

    onUpdateCell(editingCell.rowId, editingCell.colName, finalVal);
    setEditingCell(null);
  };

  return (
    <div className="w-full glass-card rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search across all fields & ground truths..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Page size & info */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Quick Page Navigator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span>
              Page <strong className="text-white">{currentPage}</strong> of{" "}
              <strong className="text-white">{totalPages}</strong>
            </span>
            <div className="flex items-center ml-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="overflow-x-auto w-full max-h-[620px] relative">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur border-b border-slate-800 shadow-md">
            <tr>
              <th className="py-3 px-3 w-12 text-center text-slate-500 font-mono">#</th>
              {dataset.columns.map((col) => (
                <th
                  key={col.name}
                  className="py-3 px-3.5 text-slate-300 font-semibold tracking-wide border-r border-slate-800/40 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSort(col.name)}
                      className="flex items-center gap-1.5 hover:text-blue-400 transition text-left"
                    >
                      <span className="font-mono">{col.name}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
                    </button>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-400 font-mono uppercase">
                        {col.type}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveColMenu(activeColMenu === col.name ? null : col.name)
                          }
                          className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>

                        {/* Column dropdown */}
                        {activeColMenu === col.name && (
                          <div className="absolute right-0 top-full mt-1 w-44 rounded-xl glass-card p-1.5 shadow-2xl z-30 border border-slate-700">
                            <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                              Column: {col.name}
                            </div>
                            <button
                              onClick={() => {
                                const newName = prompt("Rename column:", col.name);
                                if (newName && newName.trim() && newName !== col.name) {
                                  onRenameColumn(col.name, newName.trim());
                                }
                                setActiveColMenu(null);
                              }}
                              className="w-full text-left px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3 h-3 text-blue-400" />
                              Rename
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete column "${col.name}"?`)) {
                                  onDeleteColumn(col.name);
                                }
                                setActiveColMenu(null);
                              }}
                              className="w-full text-left px-2 py-1 text-xs text-red-400 hover:bg-red-950/40 rounded-lg flex items-center gap-1.5 mt-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete Column
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </th>
              ))}
              <th className="py-3 px-3 w-28 text-center text-slate-400">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={dataset.columns.length + 2}
                  className="py-16 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileCode className="w-8 h-8 text-slate-600" />
                    <span className="text-sm font-semibold">No records found</span>
                    <span className="text-xs text-slate-500">
                      {searchQuery
                        ? "Try clearing your search query."
                        : "Click 'Add Row' or import images to get started."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, index) => {
                const rowIndex = (currentPage - 1) * pageSize + index + 1;
                return (
                  <tr
                    key={row._id || index}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {rowIndex}
                    </td>

                    {dataset.columns.map((col) => {
                      const val = row[col.name];
                      const isEditing =
                        editingCell?.rowId === row._id && editingCell?.colName === col.name;
                      const imageInfo = isImageValue(val);

                      return (
                        <td
                          key={col.name}
                          className="py-2.5 px-3.5 border-r border-slate-800/30 max-w-xs truncate font-mono text-slate-200"
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit();
                                  if (e.key === "Escape") setEditingCell(null);
                                }}
                                className="w-full px-2 py-1 text-xs rounded bg-slate-950 border border-blue-500 text-white focus:outline-none"
                              />
                              <button
                                onClick={saveEdit}
                                className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingCell(null)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : imageInfo.isImage && imageInfo.src ? (
                            /* OCR Image preview pill */
                            <div className="flex items-center gap-2">
                              <div
                                onClick={() => onOpenOcrAnnotator(row._id)}
                                className="relative w-14 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 cursor-pointer hover:border-blue-400 group/img shadow transition"
                                title="Click to open full OCR Visual Annotator"
                              >
                                <img
                                  src={imageInfo.src}
                                  alt="OCR Snippet"
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition"
                                />
                                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                                  <Eye className="w-3.5 h-3.5 text-white drop-shadow" />
                                </div>
                              </div>
                              <button
                                onClick={() => onOpenOcrAnnotator(row._id)}
                                className="text-[11px] text-blue-400 hover:underline font-sans"
                              >
                                Annotate
                              </button>
                            </div>
                          ) : col.type === "boolean" ? (
                            <button
                              onClick={() => onUpdateCell(row._id, col.name, !val)}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                val
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {String(val)}
                            </button>
                          ) : col.type === "json" ? (
                            <div
                              onClick={() => startEdit(row._id, col.name, val)}
                              className="cursor-pointer text-indigo-300 hover:text-indigo-200 truncate max-w-[200px]"
                              title="Click to edit JSON"
                            >
                              {typeof val === "object" ? JSON.stringify(val) : String(val || "{}")}
                            </div>
                          ) : (
                            <div
                              onClick={() => startEdit(row._id, col.name, val)}
                              className="cursor-pointer hover:text-blue-300 transition truncate"
                              title="Click to edit"
                            >
                              {val !== undefined && val !== null && val !== "" ? (
                                String(val)
                              ) : (
                                <span className="text-slate-600 italic">null</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Row action buttons */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenOcrAnnotator(row._id)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition"
                          title="Open OCR Annotator for this row"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateRow(row._id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Duplicate row"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRow(row._id)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <strong>{paginatedRows.length}</strong> of{" "}
          <strong>{filteredRows.length}</strong> records
          {searchQuery && ` (filtered from ${dataset.rows.length} total)`}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">
            Double-click or tap any cell to edit inline
          </span>
        </div>
      </div>
    </div>
  );
};
