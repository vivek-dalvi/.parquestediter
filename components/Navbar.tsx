"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  FileCode2,
  Upload,
  Plus,
  Download,
  Sparkles,
  Layers,
  Table as TableIcon,
  Eye,
  Images,
  Code2,
} from "lucide-react";

interface NavbarProps {
  currentTab: "grid" | "ocr-annotator" | "batch-ocr" | "schema" | "code";
  onTabChange: (tab: "grid" | "ocr-annotator" | "batch-ocr" | "schema" | "code") => void;
  onFileUpload: (file: File) => void;
  onNewDataset: () => void;
  onLoadSample: (sampleKey: string) => void;
  onOpenExport: () => void;
  datasetName: string;
  totalRows: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onFileUpload,
  onNewDataset,
  onLoadSample,
  onOpenExport,
  datasetName,
  totalRows,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 shadow-2xl backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Devcart Technologies Branding */}
          <div className="flex items-center gap-3">
            <div className="relative group flex items-center justify-center">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 p-0.5 flex items-center justify-center shadow-lg">
                <Image
                  src="https://i.ibb.co/8D1FTxPx/devcart-technologies-logo.jpg"
                  alt="Devcart Technologies Logo"
                  width={38}
                  height={38}
                  className="object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                  priority
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
                  Parquet Studio
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  OCR ML
                </span>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                by <strong className="text-slate-200 font-semibold">Devcart Technologies</strong>
              </span>
            </div>
          </div>

          {/* Center Tabs navigation */}
          <div className="hidden md:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => onTabChange("grid")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                currentTab === "grid"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Data Grid</span>
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-black/30 font-mono">
                {totalRows}
              </span>
            </button>

            <button
              onClick={() => onTabChange("ocr-annotator")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                currentTab === "ocr-annotator"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>OCR Annotator</span>
            </button>

            <button
              onClick={() => onTabChange("batch-ocr")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                currentTab === "batch-ocr"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Images className="w-3.5 h-3.5 text-emerald-400" />
              <span>Images to Parquet</span>
            </button>

            <button
              onClick={() => onTabChange("schema")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                currentTab === "schema"
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Schema & Stats</span>
            </button>

            <button
              onClick={() => onTabChange("code")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                currentTab === "code"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Python / HF Code</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".parquet,.parq,.csv,.jsonl,.json"
              className="hidden"
            />

            {/* Load Sample Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Samples</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-56 rounded-xl glass-card p-1.5 shadow-2xl opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-50">
                <button
                  onClick={() => onLoadSample("train-ocr-invoices")}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-blue-600/20 text-slate-200 hover:text-blue-300 transition flex flex-col"
                >
                  <span className="font-semibold text-white">Invoice / Receipt OCR</span>
                  <span className="text-[10px] text-slate-400">train-00000-of-00001.parquet</span>
                </button>
                <button
                  onClick={() => onLoadSample("tabular-ml-dataset")}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-emerald-600/20 text-slate-200 hover:text-emerald-300 transition flex flex-col mt-1"
                >
                  <span className="font-semibold text-white">Multimodal ML Dataset</span>
                  <span className="text-[10px] text-slate-400">Prompt & ground truth rows</span>
                </button>
              </div>
            </div>

            {/* Load Parquet File button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
              title="Open .parquet file from your computer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Open Parquet</span>
            </button>

            {/* New Blank File */}
            <button
              onClick={onNewDataset}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition"
              title="Create blank Parquet file"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New</span>
            </button>

            {/* Export & Download Parquet button */}
            <button
              onClick={onOpenExport}
              className="relative group flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download className="w-3.5 h-3.5 group-hover:animate-bounce" />
              <span>Export Parquet</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-2 border-t border-slate-800">
          <button
            onClick={() => onTabChange("grid")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentTab === "grid" ? "bg-blue-600 text-white" : "text-slate-400 bg-slate-900"
            }`}
          >
            Grid ({totalRows})
          </button>
          <button
            onClick={() => onTabChange("ocr-annotator")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentTab === "ocr-annotator" ? "bg-indigo-600 text-white" : "text-slate-400 bg-slate-900"
            }`}
          >
            OCR Annotator
          </button>
          <button
            onClick={() => onTabChange("batch-ocr")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentTab === "batch-ocr" ? "bg-emerald-600 text-white" : "text-slate-400 bg-slate-900"
            }`}
          >
            Images to Parquet
          </button>
          <button
            onClick={() => onTabChange("schema")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentTab === "schema" ? "bg-amber-600 text-white" : "text-slate-400 bg-slate-900"
            }`}
          >
            Schema
          </button>
          <button
            onClick={() => onTabChange("code")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              currentTab === "code" ? "bg-cyan-600 text-white" : "text-slate-400 bg-slate-900"
            }`}
          >
            Python Code
          </button>
        </div>
      </div>
    </header>
  );
};
