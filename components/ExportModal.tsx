"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  ParquetDataset,
  generateParquetBinary,
  exportDatasetToCsv,
  exportDatasetToJsonL,
} from "@/lib/parquet-engine";
import { downloadBlob } from "@/lib/utils";
import {
  Download,
  X,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  FileJson,
  Sparkles,
  Layers,
} from "lucide-react";

interface ExportModalProps {
  dataset: ParquetDataset;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ dataset, onClose }) => {
  const [filename, setFilename] = useState(
    dataset.filename || "train-00000-of-00001.parquet"
  );
  const [exportFormat, setExportFormat] = useState<"parquet" | "csv" | "jsonl">("parquet");
  const [compression, setCompression] = useState<"SNAPPY" | "UNCOMPRESSED">("SNAPPY");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === "parquet") {
        const binData = await generateParquetBinary(dataset, compression);
        const finalName = filename.endsWith(".parquet") ? filename : `${filename}.parquet`;
        const blob = new Blob([binData.buffer as ArrayBuffer], { type: "application/octet-stream" });
        downloadBlob(blob, finalName);
      } else if (exportFormat === "csv") {
        const csvContent = exportDatasetToCsv(dataset);
        const baseName = filename.replace(/\.[^/.]+$/, "");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `${baseName}.csv`);
      } else if (exportFormat === "jsonl") {
        const jsonlContent = exportDatasetToJsonL(dataset);
        const baseName = filename.replace(/\.[^/.]+$/, "");
        const blob = new Blob([jsonlContent], { type: "application/jsonl;charset=utf-8;" });
        downloadBlob(blob, `${baseName}.jsonl`);
      }

      // Fire festive celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
      alert("Error exporting dataset. Please try again.");
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Dataset File</h2>
              <p className="text-xs text-slate-400">
                Ready for Hugging Face, PyTorch & Python Pandas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setExportFormat("parquet")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition ${
                  exportFormat === "parquet"
                    ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <FileCode className="w-5 h-5 text-blue-400" />
                <span>Apache Parquet</span>
                <span className="text-[10px] text-slate-500">Standard (.parquet)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat("jsonl")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition ${
                  exportFormat === "jsonl"
                    ? "bg-purple-600/20 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <FileJson className="w-5 h-5 text-purple-400" />
                <span>JSONL</span>
                <span className="text-[10px] text-slate-500">Lines (.jsonl)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat("csv")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition ${
                  exportFormat === "csv"
                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>CSV</span>
                <span className="text-[10px] text-slate-500">Comma Separated</span>
              </button>
            </div>
          </div>

          {/* Target filename */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              File Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-500">Presets:</span>
              <button
                type="button"
                onClick={() => setFilename("train-00000-of-00001.parquet")}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                train-00000-of-00001
              </button>
              <button
                type="button"
                onClick={() => setFilename("validation-00000-of-00001.parquet")}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                validation
              </button>
              <button
                type="button"
                onClick={() => setFilename("test-00000-of-00001.parquet")}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                test
              </button>
            </div>
          </div>

          {/* Compression options if Parquet */}
          {exportFormat === "parquet" && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Compression Codec
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCompression("SNAPPY")}
                  className={`px-3 py-2 rounded-lg text-xs font-mono font-medium border text-left flex items-center justify-between ${
                    compression === "SNAPPY"
                      ? "bg-blue-600/20 border-blue-500 text-blue-300"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <span>SNAPPY (Default)</span>
                  {compression === "SNAPPY" && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setCompression("UNCOMPRESSED")}
                  className={`px-3 py-2 rounded-lg text-xs font-mono font-medium border text-left flex items-center justify-between ${
                    compression === "UNCOMPRESSED"
                      ? "bg-blue-600/20 border-blue-500 text-blue-300"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <span>UNCOMPRESSED</span>
                  {compression === "UNCOMPRESSED" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Records to Export:</span>
              <strong className="text-white font-mono">{dataset.totalRows}</strong>
            </div>
            <div className="flex justify-between">
              <span>Columns:</span>
              <strong className="text-white font-mono">{dataset.columns.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Hugging Face Compatible:</span>
              <span className="text-emerald-400 font-semibold">Yes 100%</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Generating Binary..." : `Download ${filename}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
