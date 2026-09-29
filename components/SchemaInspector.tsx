"use client";

import React, { useState } from "react";
import { ParquetDataset, ParquetColumnSchema } from "@/lib/parquet-engine";
import {
  Layers,
  FileSpreadsheet,
  Database,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Binary,
  Code,
  Sparkles,
} from "lucide-react";

interface SchemaInspectorProps {
  dataset: ParquetDataset;
  onAddColumn: (newCol: ParquetColumnSchema) => void;
  onDeleteColumn: (colName: string) => void;
}

export const SchemaInspector: React.FC<SchemaInspectorProps> = ({
  dataset,
  onAddColumn,
  onDeleteColumn,
}) => {
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState<ParquetColumnSchema["type"]>("string");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    onAddColumn({
      name: newColName.trim(),
      type: newColType,
      nullable: true,
      physicalType: newColType === "number" ? "INT64" : newColType === "boolean" ? "BOOLEAN" : "BYTE_ARRAY",
      logicalType: newColType === "json" ? "JSON" : newColType === "string" ? "UTF8" : "NONE",
    });
    setNewColName("");
  };

  return (
    <div className="w-full space-y-6">
      {/* Schema Card Header */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Parquet Schema & Metadata Inspector
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect physical/logical types, nullability, and compression properties
            </p>
          </div>
        </div>

        {/* File Format Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-semibold">
            Standard Apache Parquet V1 / Thrift Meta
          </span>
        </div>
      </div>

      {/* Schema Table & Add Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Column Schema Grid (8 Cols) */}
        <div className="lg:col-span-8 glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Column Definitions ({dataset.columns.length})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="py-3 px-4 font-semibold">Column Name</th>
                  <th className="py-3 px-4 font-semibold">App Type</th>
                  <th className="py-3 px-4 font-semibold">Physical / Logical</th>
                  <th className="py-3 px-4 font-semibold">Nullable</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/20">
                {dataset.columns.map((col) => (
                  <tr key={col.name} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {col.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-semibold">
                        {col.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {col.physicalType || "BYTE_ARRAY"} / {col.logicalType || "UTF8"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-mono font-semibold ${
                          col.nullable !== false ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {col.nullable !== false ? "YES (OPTIONAL)" : "NO (REQUIRED)"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteColumn(col.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
                        title="Delete Column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Add Column & Technical Metadata (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Add Column Box */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add New Schema Column</span>
            </h3>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Column Name
                </label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. bounding_box, label, score..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Data Type
                </label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="string">string (Text / UTF-8)</option>
                  <option value="image">image (Binary Image / Base64)</option>
                  <option value="number">number (Integer / Float)</option>
                  <option value="boolean">boolean (True / False)</option>
                  <option value="json">json (Nested Dict / Array)</option>
                  <option value="binary">binary (Raw Bytes)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition mt-2"
              >
                Add Column to Dataset
              </button>
            </form>
          </div>

          {/* Low-level Metadata details */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Parquet File Header Info</span>
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Magic Bytes:</span>
                <span className="text-emerald-400">PAR1 (Apache Standard)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Target Filename:</span>
                <span className="text-white truncate max-w-[150px]">{dataset.filename}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Rows in Buffer:</span>
                <span className="text-white">{dataset.totalRows}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Compression:</span>
                <span className="text-blue-400">Snappy Decompressor</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Author Engine:</span>
                <span className="text-slate-300">Devcart Technologies</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
