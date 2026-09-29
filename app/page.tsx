"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { ParquetStatsBanner } from "@/components/ParquetStatsBanner";
import { ParquetGrid } from "@/components/ParquetGrid";
import { OcrAnnotatorModal } from "@/components/OcrAnnotatorModal";
import { BatchOcrStudio } from "@/components/BatchOcrStudio";
import { SchemaInspector } from "@/components/SchemaInspector";
import { CodeSnippetsModal } from "@/components/CodeSnippetsModal";
import { ExportModal } from "@/components/ExportModal";
import { AddRowModal } from "@/components/AddRowModal";
import { DevcartFooter } from "@/components/DevcartFooter";
import {
  ParquetDataset,
  ParquetColumnSchema,
  readParquetFile,
} from "@/lib/parquet-engine";
import { SAMPLE_DATASETS } from "@/lib/sample-datasets";
import { fileToArrayBuffer } from "@/lib/utils";
import {
  Table,
  Eye,
  Images,
  Layers,
  Code2,
  Sparkles,
  Upload,
  CheckCircle2,
  FileCode,
  AlertCircle,
} from "lucide-react";

export default function Home() {
  // Initialize with sample OCR dataset
  const [dataset, setDataset] = useState<ParquetDataset>(() =>
    SAMPLE_DATASETS["train-ocr-invoices"]()
  );

  const [currentTab, setCurrentTab] = useState<
    "grid" | "ocr-annotator" | "batch-ocr" | "schema" | "code"
  >("grid");

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [activeAnnotatorRowId, setActiveAnnotatorRowId] = useState<string | null>(
    null
  );
  const [notification, setNotification] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showNotification = (
    msg: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Open & parse incoming file
  const handleFileUpload = async (file: File) => {
    try {
      showNotification(`Reading ${file.name}...`, "info");
      const buffer = await fileToArrayBuffer(file);
      
      if (file.name.endsWith(".parquet") || file.name.endsWith(".parq")) {
        const parsed = await readParquetFile(buffer, file.name);
        setDataset(parsed);
        showNotification(`Successfully loaded ${parsed.totalRows} rows from ${file.name}`);
      } else if (file.name.endsWith(".csv")) {
        // Fallback simple CSV loader
        const text = new TextDecoder().decode(buffer);
        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        if (lines.length > 0) {
          const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
          const rows = lines.slice(1).map((line, idx) => {
            const vals = line.split(",").map((v) => v.replace(/^"|"$/g, "").trim());
            const rowObj: Record<string, any> = { _id: `row-${idx + 1}` };
            headers.forEach((h, i) => {
              rowObj[h] = vals[i] ?? "";
            });
            return rowObj;
          });
          const cols: ParquetColumnSchema[] = headers.map((h) => ({
            name: h,
            type: "string",
            nullable: true,
          }));
          setDataset({
            filename: file.name.replace(".csv", ".parquet"),
            fileSize: file.size,
            columns: cols,
            rows: rows,
            totalRows: rows.length,
          });
          showNotification(`Imported CSV as ${file.name.replace(".csv", ".parquet")}`);
        }
      } else if (file.name.endsWith(".jsonl") || file.name.endsWith(".json")) {
        const text = new TextDecoder().decode(buffer);
        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        const rows: any[] = [];
        for (let i = 0; i < lines.length; i++) {
          try {
            const parsedObj = JSON.parse(lines[i]);
            rows.push({ _id: `row-${i + 1}`, ...parsedObj });
          } catch {
            // skip bad line
          }
        }
        if (rows.length > 0) {
          const keys = Object.keys(rows[0]).filter((k) => k !== "_id");
          const cols: ParquetColumnSchema[] = keys.map((k) => ({
            name: k,
            type: k.toLowerCase().includes("image") ? "image" : typeof rows[0][k] === "number" ? "number" : "string",
            nullable: true,
          }));
          setDataset({
            filename: file.name.replace(/\.[^/.]+$/, "") + ".parquet",
            fileSize: file.size,
            columns: cols,
            rows,
            totalRows: rows.length,
          });
          showNotification(`Imported JSON dataset successfully!`);
        }
      }
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Failed to parse file", "error");
    }
  };

  // Load preset sample
  const handleLoadSample = (sampleKey: string) => {
    if (SAMPLE_DATASETS[sampleKey]) {
      const data = SAMPLE_DATASETS[sampleKey]();
      setDataset(data);
      showNotification(`Loaded dataset "${data.filename}"`);
    }
  };

  // New blank dataset
  const handleNewDataset = () => {
    const defaultData: ParquetDataset = {
      filename: "train-00000-of-00001.parquet",
      fileSize: 4096,
      columns: [
        { name: "id", type: "string", nullable: false },
        { name: "image", type: "image", nullable: true },
        { name: "ground_truth", type: "string", nullable: false },
        { name: "category", type: "string", nullable: true },
      ],
      rows: [
        {
          _id: "row-1",
          id: "DOC-001",
          image: "",
          ground_truth: "Sample initial text",
          category: "General",
        },
      ],
      totalRows: 1,
    };
    setDataset(defaultData);
    showNotification("Created new blank Parquet dataset!");
  };

  // Row operations
  const handleUpdateCell = (rowId: string, colName: string, value: any) => {
    setDataset((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => {
        if (row._id === rowId) {
          return { ...row, [colName]: value };
        }
        return row;
      }),
    }));
  };

  const handleDeleteRow = (rowId: string) => {
    setDataset((prev) => {
      const updated = prev.rows.filter((r) => r._id !== rowId);
      return {
        ...prev,
        rows: updated,
        totalRows: updated.length,
      };
    });
    showNotification("Row deleted");
  };

  const handleDuplicateRow = (rowId: string) => {
    setDataset((prev) => {
      const target = prev.rows.find((r) => r._id === rowId);
      if (!target) return prev;
      const newRow = {
        ...target,
        _id: `row-${Date.now()}`,
        id: target.id ? `${target.id}_copy` : `row_${Date.now()}`,
      };
      const updated = [...prev.rows, newRow];
      return {
        ...prev,
        rows: updated,
        totalRows: updated.length,
      };
    });
    showNotification("Row duplicated");
  };

  const handleAddRow = (newRow: Record<string, any>) => {
    setDataset((prev) => {
      const updated = [...prev.rows, newRow];
      return {
        ...prev,
        rows: updated,
        totalRows: updated.length,
      };
    });
    showNotification("New record added");
  };

  const handleClearRows = () => {
    if (confirm("Are you sure you want to clear all records in this dataset?")) {
      setDataset((prev) => ({
        ...prev,
        rows: [],
        totalRows: 0,
      }));
      showNotification("All records cleared", "info");
    }
  };

  // Column operations
  const handleAddColumn = (newCol: ParquetColumnSchema) => {
    if (dataset.columns.some((c) => c.name === newCol.name)) {
      showNotification(`Column "${newCol.name}" already exists`, "error");
      return;
    }
    setDataset((prev) => ({
      ...prev,
      columns: [...prev.columns, newCol],
      rows: prev.rows.map((r) => ({
        ...r,
        [newCol.name]: newCol.type === "number" ? 0 : newCol.type === "boolean" ? false : "",
      })),
    }));
    showNotification(`Column "${newCol.name}" added`);
  };

  const handleDeleteColumn = (colName: string) => {
    setDataset((prev) => ({
      ...prev,
      columns: prev.columns.filter((c) => c.name !== colName),
      rows: prev.rows.map((r) => {
        const copy = { ...r };
        delete copy[colName];
        return copy;
      }),
    }));
    showNotification(`Column "${colName}" removed`);
  };

  const handleRenameColumn = (oldName: string, newName: string) => {
    setDataset((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => (c.name === oldName ? { ...c, name: newName } : c)),
      rows: prev.rows.map((r) => {
        const copy = { ...r };
        copy[newName] = copy[oldName];
        delete copy[oldName];
        return copy;
      }),
    }));
    showNotification(`Renamed column to "${newName}"`);
  };

  // Count image columns
  const imageColsCount = dataset.columns.filter((c) => c.type === "image").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 relative">
      {/* Top Notification Toast */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 ${
            notification.type === "error"
              ? "bg-red-950/90 border-red-800 text-red-200"
              : notification.type === "info"
              ? "bg-blue-950/90 border-blue-800 text-blue-200"
              : "bg-emerald-950/90 border-emerald-800 text-emerald-200"
          }`}
        >
          {notification.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onFileUpload={handleFileUpload}
        onNewDataset={handleNewDataset}
        onLoadSample={handleLoadSample}
        onOpenExport={() => setIsExportOpen(true)}
        datasetName={dataset.filename}
        totalRows={dataset.totalRows}
      />

      {/* Page Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top 3D Stats & Action Banner */}
        <ParquetStatsBanner
          filename={dataset.filename}
          totalRows={dataset.totalRows}
          totalCols={dataset.columns.length}
          fileSize={dataset.fileSize}
          compression={dataset.metadata?.compression || "Snappy (Hugging Face)"}
          imageColsCount={imageColsCount}
          onAddRow={() => setIsAddRowOpen(true)}
          onAddColumn={() => setCurrentTab("schema")}
          onClearRows={handleClearRows}
        />

        {/* Tab 1: Interactive Data Grid */}
        {currentTab === "grid" && (
          <ParquetGrid
            dataset={dataset}
            onUpdateCell={handleUpdateCell}
            onDeleteRow={handleDeleteRow}
            onDuplicateRow={handleDuplicateRow}
            onOpenOcrAnnotator={(rowId) => {
              setActiveAnnotatorRowId(rowId);
              setCurrentTab("ocr-annotator");
            }}
            onDeleteColumn={handleDeleteColumn}
            onRenameColumn={handleRenameColumn}
            onChangeColumnType={(col, type) => {
              setDataset((p) => ({
                ...p,
                columns: p.columns.map((c) => (c.name === col ? { ...c, type } : c)),
              }));
            }}
          />
        )}

        {/* Tab 2: OCR Visual Annotator */}
        {currentTab === "ocr-annotator" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" />
                <span>Visual OCR Dataset Ground Truth Annotator</span>
              </h2>
              <button
                onClick={() => setCurrentTab("grid")}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                Back to Grid View
              </button>
            </div>
            <OcrAnnotatorModal
              dataset={dataset}
              activeRowId={activeAnnotatorRowId || dataset.rows[0]?._id || null}
              onClose={() => setCurrentTab("grid")}
              onSaveRow={(rowId, updated) => {
                setDataset((prev) => ({
                  ...prev,
                  rows: prev.rows.map((r) => (r._id === rowId ? { ...r, ...updated } : r)),
                }));
                showNotification("OCR ground truth updated!");
              }}
            />
          </div>
        )}

        {/* Tab 3: Batch Images to Parquet */}
        {currentTab === "batch-ocr" && (
          <BatchOcrStudio
            currentDataset={dataset}
            onDatasetCreated={(newDataset) => {
              setDataset(newDataset);
              setCurrentTab("grid");
              showNotification(`Created new dataset with ${newDataset.totalRows} images!`);
            }}
            onAppendToDataset={(newRows) => {
              setDataset((prev) => ({
                ...prev,
                rows: [...prev.rows, ...newRows],
                totalRows: prev.rows.length + newRows.length,
              }));
              setCurrentTab("grid");
              showNotification(`Appended ${newRows.length} images to dataset!`);
            }}
          />
        )}

        {/* Tab 4: Schema Inspector */}
        {currentTab === "schema" && (
          <SchemaInspector
            dataset={dataset}
            onAddColumn={handleAddColumn}
            onDeleteColumn={handleDeleteColumn}
          />
        )}

        {/* Tab 5: Python / Hugging Face Code Snippets */}
        {currentTab === "code" && <CodeSnippetsModal dataset={dataset} />}
      </main>

      {/* Floating / Direct Modals */}
      {isExportOpen && (
        <ExportModal dataset={dataset} onClose={() => setIsExportOpen(false)} />
      )}

      {isAddRowOpen && (
        <AddRowModal
          dataset={dataset}
          onClose={() => setIsAddRowOpen(false)}
          onAdd={handleAddRow}
        />
      )}

      {/* Devcart Technologies Footer */}
      <DevcartFooter />
    </div>
  );
}
