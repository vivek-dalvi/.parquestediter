"use client";

import React, { useState } from "react";
import { ParquetDataset } from "@/lib/parquet-engine";
import { generateUUID } from "@/lib/utils";
import { Plus, X, Check, FilePlus } from "lucide-react";

interface AddRowModalProps {
  dataset: ParquetDataset;
  onClose: () => void;
  onAdd: (newRow: Record<string, any>) => void;
}

export const AddRowModal: React.FC<AddRowModalProps> = ({ dataset, onClose, onAdd }) => {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    dataset.columns.forEach((col) => {
      if (col.type === "number") initial[col.name] = 0;
      else if (col.type === "boolean") initial[col.name] = false;
      else if (col.type === "json") initial[col.name] = "{}";
      else initial[col.name] = "";
    });
    return initial;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rowId = `row-${Date.now()}`;
    const newRow: Record<string, any> = { _id: rowId, ...formData };
    
    // Auto populate id if blank
    if ("id" in formData && !formData["id"]) {
      newRow["id"] = `DOC-${Date.now().toString().slice(-4)}`;
    }

    onAdd(newRow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add New Record</h2>
              <p className="text-xs text-slate-400">Insert row into dataset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3.5">
            {dataset.columns.map((col) => (
              <div key={col.name}>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  <span className="font-mono">{col.name}</span>
                  <span className="text-[10px] text-slate-500 ml-2 font-mono uppercase">
                    ({col.type})
                  </span>
                </label>

                {col.type === "boolean" ? (
                  <select
                    value={String(formData[col.name])}
                    onChange={(e) =>
                      setFormData({ ...formData, [col.name]: e.target.value === "true" })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : col.type === "number" ? (
                  <input
                    type="number"
                    value={formData[col.name]}
                    onChange={(e) =>
                      setFormData({ ...formData, [col.name]: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                ) : col.name === "ground_truth" || col.name === "text" ? (
                  <textarea
                    rows={3}
                    value={formData[col.name]}
                    onChange={(e) =>
                      setFormData({ ...formData, [col.name]: e.target.value })
                    }
                    placeholder="Enter ground truth text..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[col.name] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [col.name]: e.target.value })
                    }
                    placeholder={`Enter ${col.name}...`}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition"
            >
              <Check className="w-4 h-4" />
              <span>Insert Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
