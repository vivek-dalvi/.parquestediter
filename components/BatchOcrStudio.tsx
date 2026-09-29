"use client";

import React, { useState, useRef } from "react";
import { ParquetDataset } from "@/lib/parquet-engine";
import { fileToBase64, generateUUID } from "@/lib/utils";
import {
  Images,
  UploadCloud,
  FilePlus2,
  Trash2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  FileText,
} from "lucide-react";

interface BatchOcrStudioProps {
  onDatasetCreated: (newDataset: ParquetDataset) => void;
  onAppendToDataset: (newRows: any[]) => void;
  currentDataset: ParquetDataset;
}

interface QueuedImage {
  id: string;
  file: File;
  previewUrl: string;
  transcription: string;
  category: string;
  docId: string;
}

export const BatchOcrStudio: React.FC<BatchOcrStudioProps> = ({
  onDatasetCreated,
  onAppendToDataset,
  currentDataset,
}) => {
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const [datasetFilename, setDatasetFilename] = useState("train-00000-of-00001.parquet");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    const newItems: QueuedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = await fileToBase64(file);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

      newItems.push({
        id: generateUUID(),
        file,
        previewUrl,
        transcription: `Transcription for ${file.name}\nExtracted text lines and labels...`,
        category: "Invoice / Document",
        docId: `DOC-${Date.now().toString().slice(-4)}-${i + 1}`,
      });
    }

    setQueuedImages((prev) => [...prev, ...newItems]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateNewDataset = () => {
    if (queuedImages.length === 0) return;

    const rows = queuedImages.map((img, idx) => ({
      _id: `row-${idx + 1}`,
      id: img.docId,
      image: {
        isImage: true,
        src: img.previewUrl,
        path: `images/${img.file.name}`,
      },
      ground_truth: img.transcription,
      category: img.category,
      bboxes: JSON.stringify([
        { text: img.docId, x: 20, y: 20, w: 200, h: 28 },
        { text: "Ground Truth Line 1", x: 20, y: 60, w: 320, h: 28 },
      ]),
      language: "en",
      split: "train",
    }));

    const newDataset: ParquetDataset = {
      filename: datasetFilename || "train-00000-of-00001.parquet",
      fileSize: queuedImages.reduce((acc, curr) => acc + curr.file.size, 0) + 12000,
      columns: [
        { name: "id", type: "string", nullable: false },
        { name: "image", type: "image", nullable: false },
        { name: "ground_truth", type: "string", nullable: false },
        { name: "category", type: "string", nullable: true },
        { name: "bboxes", type: "json", nullable: true },
        { name: "language", type: "string", nullable: true },
        { name: "split", type: "string", nullable: true },
      ],
      rows,
      totalRows: rows.length,
      metadata: {
        createdBy: "Devcart Technologies OCR Studio",
        compression: "Snappy (Hugging Face standard)",
      },
    };

    onDatasetCreated(newDataset);
  };

  const handleAppend = () => {
    if (queuedImages.length === 0) return;

    const rows = queuedImages.map((img, idx) => ({
      _id: `row-${currentDataset.rows.length + idx + 1}`,
      id: img.docId,
      image: {
        isImage: true,
        src: img.previewUrl,
        path: `images/${img.file.name}`,
      },
      ground_truth: img.transcription,
      category: img.category,
      bboxes: "[]",
      language: "en",
      split: "train",
    }));

    onAppendToDataset(rows);
    setQueuedImages([]);
  };

  return (
    <div className="w-full space-y-6">
      {/* Studio Header Card */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Images className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Batch OCR Dataset Studio
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Convert local image files into a Hugging Face compatible Parquet dataset
              </p>
            </div>
          </div>

          {/* Target filename config */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Output Parquet Name
              </span>
              <input
                type="text"
                value={datasetFilename}
                onChange={(e) => setDatasetFilename(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-semibold focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Image Uploader Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-10 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-900/40 hover:bg-slate-900/80 transition cursor-pointer flex flex-col items-center justify-center text-center group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFilesSelected}
          accept="image/png, image/jpeg, image/webp, image/svg+xml"
          multiple
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition duration-300 shadow-xl">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-bold text-white mt-4">
          Select or Drag & Drop Multiple Document Images
        </h3>
        <p className="text-xs text-slate-400 max-w-md mt-1">
          Supports PNG, JPG, JPEG, WebP, SVG. Images will be encoded as binary / Base64 into
          standard Hugging Face dataset columns (`image`, `ground_truth`, `id`).
        </p>

        <button
          type="button"
          className="mt-4 px-4 py-2 rounded-xl bg-slate-800 group-hover:bg-emerald-600 text-slate-200 group-hover:text-white text-xs font-semibold shadow transition"
        >
          {isProcessing ? "Processing Images..." : "Browse Local Files"}
        </button>
      </div>

      {/* Batch Preview & Staging */}
      {queuedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                Staged Images ({queuedImages.length})
              </span>
              <span className="text-xs text-slate-400">
                Ready to compile into Parquet dataset
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQueuedImages([])}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>

              <button
                onClick={handleAppend}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                Append to Current File
              </button>

              <button
                onClick={handleCreateNewDataset}
                className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Create New Parquet ({datasetFilename})</span>
              </button>
            </div>
          </div>

          {/* Staged Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queuedImages.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl glass-card border border-slate-800 flex flex-col gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate font-mono">
                        {item.docId}
                      </span>
                      <button
                        onClick={() =>
                          setQueuedImages(queuedImages.filter((q) => q.id !== item.id))
                        }
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {item.file.name}
                    </span>
                    <input
                      type="text"
                      value={item.category}
                      onChange={(e) => {
                        const updated = [...queuedImages];
                        updated[idx].category = e.target.value;
                        setQueuedImages(updated);
                      }}
                      className="mt-1 w-full px-2 py-0.5 text-[11px] rounded bg-slate-950 border border-slate-800 text-slate-300"
                      placeholder="Category..."
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Ground Truth Text
                  </span>
                  <textarea
                    rows={2}
                    value={item.transcription}
                    onChange={(e) => {
                      const updated = [...queuedImages];
                      updated[idx].transcription = e.target.value;
                      setQueuedImages(updated);
                    }}
                    placeholder="Enter OCR ground truth..."
                    className="w-full p-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
