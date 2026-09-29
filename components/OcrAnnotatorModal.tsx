"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ParquetDataset } from "@/lib/parquet-engine";
import { isImageValue, fileToBase64 } from "@/lib/utils";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Upload,
  Layers,
  Crosshair,
  FileText,
  Save,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface BBoxItem {
  id?: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface OcrAnnotatorModalProps {
  dataset: ParquetDataset;
  activeRowId: string | null;
  onClose: () => void;
  onSaveRow: (rowId: string, updatedFields: Record<string, any>) => void;
}

export const OcrAnnotatorModal: React.FC<OcrAnnotatorModalProps> = ({
  dataset,
  activeRowId,
  onClose,
  onSaveRow,
}) => {
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBBox, setCurrentBBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Local editing fields for current row
  const [groundTruthText, setGroundTruthText] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("en");
  const [bboxes, setBboxes] = useState<BBoxItem[]>([]);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [imageColName, setImageColName] = useState<string>("image");
  const [saveIndicator, setSaveIndicator] = useState(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize currentRowIndex ONLY when activeRowId changes
  const prevActiveRowIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeRowId && activeRowId !== prevActiveRowIdRef.current) {
      prevActiveRowIdRef.current = activeRowId;
      const idx = dataset.rows.findIndex((r) => r._id === activeRowId);
      if (idx !== -1) {
        setCurrentRowIndex(idx);
      }
    }
  }, [activeRowId, dataset.rows]);

  // Load row data when currentRowIndex changes
  const loadRowData = useCallback((index: number) => {
    const row = dataset.rows[index];
    if (!row) return;

    // Detect image column
    let foundSrc = "";
    let foundImgCol = "image";
    for (const col of dataset.columns) {
      const val = row[col.name];
      const imgInfo = isImageValue(val);
      if (imgInfo.isImage && imgInfo.src) {
        foundSrc = imgInfo.src;
        foundImgCol = col.name;
        break;
      }
    }
    setImageSrc(foundSrc);
    setImageColName(foundImgCol);

    // Ground truth text
    const textVal =
      row["ground_truth"] ??
      row["text"] ??
      row["transcription"] ??
      row["label"] ??
      row["prompt"] ??
      "";
    setGroundTruthText(typeof textVal === "object" ? JSON.stringify(textVal, null, 2) : String(textVal));

    // Category
    setCategory(String(row["category"] || row["type"] || "Document"));

    // Language
    setLanguage(String(row["language"] || "en"));

    // Bounding Boxes
    const rawBboxes = row["bboxes"] || row["bounding_boxes"] || row["bbox"];
    if (rawBboxes) {
      try {
        const parsed = typeof rawBboxes === "string" ? JSON.parse(rawBboxes) : rawBboxes;
        if (Array.isArray(parsed)) {
          setBboxes(parsed);
        } else {
          setBboxes([]);
        }
      } catch {
        setBboxes([]);
      }
    } else {
      setBboxes([]);
    }
  }, [dataset.rows, dataset.columns]);

  useEffect(() => {
    loadRowData(currentRowIndex);
  }, [currentRowIndex, loadRowData]);

  const currentRow = dataset.rows[currentRowIndex];

  // Save helper
  const handleSave = useCallback(() => {
    if (!currentRow) return;
    const updated: Record<string, any> = {
      ground_truth: groundTruthText,
      category: category,
      language: language,
      bboxes: JSON.stringify(bboxes),
    };

    if (imageSrc) {
      updated[imageColName] = {
        isImage: true,
        src: imageSrc,
        path: `images/row_${currentRowIndex + 1}.png`,
      };
    }

    onSaveRow(currentRow._id, updated);
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  }, [currentRow, groundTruthText, category, language, bboxes, imageSrc, imageColName, currentRowIndex, onSaveRow]);

  // Next / Prev navigation
  const handleNext = useCallback(() => {
    handleSave();
    if (currentRowIndex < dataset.rows.length - 1) {
      setCurrentRowIndex((prev) => prev + 1);
    }
  }, [handleSave, currentRowIndex, dataset.rows.length]);

  const handlePrev = useCallback(() => {
    handleSave();
    if (currentRowIndex > 0) {
      setCurrentRowIndex((prev) => prev - 1);
    }
  }, [handleSave, currentRowIndex]);

  // Handle Box Drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setDrawStart({ x, y });
    setIsDrawing(true);
    setCurrentBBox({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / zoom;
    const currentY = (e.clientY - rect.top) / zoom;

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const w = Math.abs(currentX - drawStart.x);
    const h = Math.abs(currentY - drawStart.y);

    setCurrentBBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBBox) return;
    setIsDrawing(false);
    if (currentBBox.w > 10 && currentBBox.h > 10) {
      const newBox: BBoxItem = {
        id: `box-${Date.now()}`,
        text: "Detected Text Region",
        x: Math.round(currentBBox.x),
        y: Math.round(currentBBox.y),
        w: Math.round(currentBBox.w),
        h: Math.round(currentBBox.h),
      };
      setBboxes((prev) => [...prev, newBox]);
    }
    setCurrentBBox(null);
    setDrawStart(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const b64 = await fileToBase64(file);
      setImageSrc(b64);
    }
  };

  if (!currentRow) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-6xl h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">OCR Ground Truth Annotator</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
                  Row {currentRowIndex + 1} of {dataset.rows.length}
                </span>
                {saveIndicator && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium animate-pulse flex items-center gap-1">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Visual OCR Dataset Editor • Devcart Technologies
              </p>
            </div>
          </div>

          {/* Row Navigation (Prev / Next) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentRowIndex === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
              title="Previous Row"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev Row</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentRowIndex >= dataset.rows.length - 1}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition"
              title="Save & Advance to Next Row"
            >
              <span>Next Row</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition ml-2"
              title="Close Annotator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left / Visual Canvas Area (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-950 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden">
            {/* Canvas Toolbar */}
            <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 z-10">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <span className="text-[11px] text-slate-400 font-mono ml-1">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Replace Image</span>
                </button>
              </div>
            </div>

            {/* Interactive Image Canvas */}
            <div
              ref={imageContainerRef}
              className="flex-1 overflow-auto p-6 flex items-center justify-center relative select-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
            >
              {imageSrc ? (
                <div
                  className="relative inline-block border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl cursor-crosshair bg-slate-900"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                    transition: isDrawing ? "none" : "transform 0.1s ease-out",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  {/* Document Image */}
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="OCR Target Document"
                    className="max-w-full max-h-[58vh] object-contain pointer-events-none block"
                    draggable={false}
                  />

                  {/* Render Existing Bounding Boxes */}
                  {bboxes.map((box, bIdx) => (
                    <div
                      key={box.id || bIdx}
                      style={{
                        position: "absolute",
                        left: `${box.x}px`,
                        top: `${box.y}px`,
                        width: `${box.w}px`,
                        height: `${box.h}px`,
                      }}
                      className="border-2 border-indigo-400 bg-indigo-500/20 hover:bg-indigo-500/30 transition group/box cursor-pointer"
                    >
                      <div className="absolute -top-5 left-0 px-1.5 py-0.2 bg-indigo-600 text-[10px] text-white rounded font-mono shadow truncate max-w-[120px]">
                        #{bIdx + 1} {box.text || "Box"}
                      </div>
                    </div>
                  ))}

                  {/* Active Drawing Box */}
                  {currentBBox && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${currentBBox.x}px`,
                        top: `${currentBBox.y}px`,
                        width: `${currentBBox.w}px`,
                        height: `${currentBBox.h}px`,
                      }}
                      className="border-2 border-dashed border-emerald-400 bg-emerald-500/20 pointer-events-none"
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 gap-3">
                  <FileText className="w-12 h-12 text-slate-600" />
                  <span className="text-sm font-semibold">No Image Attached to this Record</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
                  >
                    <Upload className="w-4 h-4" />
                    Attach Document Image
                  </button>
                </div>
              )}
            </div>

            {/* Canvas Bottom Hint */}
            <div className="p-2 border-t border-slate-800/80 bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between">
              <span>💡 Click & drag over text to create OCR bounding boxes</span>
              <span>Zoom & Pan supported</span>
            </div>
          </div>

          {/* Right / Ground Truth Editor Form (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 flex flex-col overflow-y-auto p-5 space-y-5">
            {/* Ground Truth Transcription Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Ground Truth Transcription</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Exact text recognized from the document for model training (TrOCR, Donut, Florence-2).
              </p>
              <textarea
                rows={6}
                value={groundTruthText}
                onChange={(e) => setGroundTruthText(e.target.value)}
                placeholder="Enter exact ground truth text here..."
                className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed"
              />
            </div>

            {/* Category & Language */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Category / Type</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Invoice, Receipt, ID"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Language</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. en, hi, fr, de"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Bounding Boxes List */}
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Bounding Boxes ({bboxes.length})</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newBox: BBoxItem = {
                      id: `box-${Date.now()}`,
                      text: "New Box",
                      x: 20,
                      y: 20,
                      w: 120,
                      h: 40,
                    };
                    setBboxes((prev) => [...prev, newBox]);
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Manual Box
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {bboxes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                    No bounding boxes drawn yet. Click & drag on the image on the left.
                  </div>
                ) : (
                  bboxes.map((b, idx) => (
                    <div
                      key={b.id || idx}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={b.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBboxes((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, text: val } : item))
                          );
                        }}
                        className="flex-1 px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="Box transcription..."
                      />
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        [{b.x},{b.y},{b.w},{b.h}]
                      </span>
                      <button
                        type="button"
                        onClick={() => setBboxes((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 rounded text-red-400 hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Save & Next Row Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
              >
                <Save className="w-4 h-4 text-blue-400" />
                <span>Save Changes</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentRowIndex >= dataset.rows.length - 1}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                <span>Save & Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
