"use client";

import React from "react";
import { formatBytes } from "@/lib/utils";
import {
  FileText,
  Table,
  Columns3,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";

interface ParquetStatsBannerProps {
  filename: string;
  totalRows: number;
  totalCols: number;
  fileSize: number;
  compression: string;
  imageColsCount: number;
  onAddRow: () => void;
  onAddColumn: () => void;
  onClearRows: () => void;
}

export const ParquetStatsBanner: React.FC<ParquetStatsBannerProps> = ({
  filename,
  totalRows,
  totalCols,
  fileSize,
  compression,
  imageColsCount,
  onAddRow,
  onAddColumn,
  onClearRows,
}) => {
  return (
    <div className="w-full mb-6">
      {/* Top Banner Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl glass-card relative overflow-hidden border border-slate-700/60 shadow-xl">
        {/* Background Subtle Gradient Glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* File & Dataset Info */}
        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2 font-mono">
                {filename}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Hugging Face Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
              <span>Standard ML Parquet Format</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
              <span>Devcart OCR Engine</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-blue-400 font-mono">train-00000-of-00001</span>
            </p>
          </div>
        </div>

        {/* Quick Toolbar Buttons */}
        <div className="flex items-center gap-2.5 relative z-10">
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Row</span>
          </button>

          <button
            type="button"
            onClick={onAddColumn}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition transform active:scale-95"
          >
            <Columns3 className="w-4 h-4 text-indigo-400" />
            <span>Add Column</span>
          </button>

          <button
            type="button"
            onClick={onClearRows}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition"
            title="Clear all records"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* 3D Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl glass-card border border-slate-800/80 flex items-center gap-3.5 transition-all duration-300 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 group">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Records
            </div>
            <div className="text-xl font-extrabold text-white font-mono mt-0.5">
              {totalRows.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl glass-card border border-slate-800/80 flex items-center gap-3.5 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 group">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition">
            <Columns3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Columns
            </div>
            <div className="text-xl font-extrabold text-white font-mono mt-0.5">
              {totalCols}
              {imageColsCount > 0 && (
                <span className="text-xs font-normal text-emerald-400 ml-1.5">
                  ({imageColsCount} OCR)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl glass-card border border-slate-800/80 flex items-center gap-3.5 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 group">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Memory / Size
            </div>
            <div className="text-xl font-extrabold text-white font-mono mt-0.5">
              {formatBytes(fileSize)}
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl glass-card border border-slate-800/80 flex items-center gap-3.5 transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 group">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Codec / Engine
            </div>
            <div className="text-sm font-bold text-white font-mono mt-1 truncate max-w-[140px]">
              {compression}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
