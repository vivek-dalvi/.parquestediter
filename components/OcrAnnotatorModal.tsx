"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Copy,
  Layers,
  Sparkles,
  MousePointer,
  Crosshair,
  FileText,
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

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with activeRowId on open
  useEffect(() => {
    if (!activeRowId) return;
    const idx = dataset.rows.findIndex((r) => r._id === activeRowId);
    if (idx !== -1) {
      setCurrentRowIndex(idx);
    }
  }, [activeRowId, dataset.rows]);

  // Load row data when currentRowIndex changes
  useEffect(() => {
    const row = dataset.rows[currentRowIndex];
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
      row["ground_truth"] ||
      row["text"] ||
      row["transcription"] ||
      row["label"] ||
      row["prompt"] ||
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
  }, [currentRowIndex, dataset.rows, dataset.columns]);

  const currentRow = dataset.rows[currentRowIndex];
  if (!currentRow) return null;

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

  // Replace/Upload Image for current row
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const b64 = await fileToBase64(file);
      setImageSrc(b64);
    }
  };

  const handleSave = () => {
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
  };

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
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  Row {currentRowIndex + 1} of {dataset.rows.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visual OCR Dataset Editor • Devcart Technologies
              </p>
            </div>
          </div>

          {/* Row Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleSave();
                setCurrentRowIndex((i) => Math.max(0, i - 1));
              }}
              disabled={currentRowIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => {
                handleSave();
                setCurrentRowIndex((i) => Math.min(dataset.rows.length - 1, i + 1));
              }}
              disabled={currentRowIndex === dataset.rows.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition ml-2"
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
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
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
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Replace Image</span>
                </button>
                <div className="text-[11px] text-indigo-400 flex items-center gap-1 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
                  <MousePointer className="w-3 h-3" />
                  <span>Click & Drag to Box Text</span>
                </div>
              </div>
            </div>

            {/* Canvas / Image Display */}
            <div
              ref={imageContainerRef}
              className="flex-1 overflow-auto p-6 flex items-center justify-center relative select-none grid-bg cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {imageSrc ? (
                <div
                  className="relative transition-transform duration-75 origin-center shadow-2xl rounded-lg border border-slate-700 bg-slate-900"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="OCR Target"
                    className="max-w-none pointer-events-none rounded"
                    style={{ maxHeight: "420px" }}
                  />

                  {/* Existing Bounding Boxes */}
                  {bboxes.map((box, idx) => (
                    <div
                      key={box.id || idx}
                      className="absolute border-2 border-indigo-500 bg-indigo-500/15 group cursor-pointer"
                      style={{
                        left: `${box.x}px`,
                        top: `${box.y}px`,
                        width: `${box.w}px`,
                        height: `${box.h}px`,
                      }}
                      title={box.text}
                    >
                      <div className="absolute -top-5 left-0 bg-indigo-600 text-white text-[9px] font-bold px-1 rounded shadow whitespace-nowrap">
                        #{idx + 1}: {box.text.slice(0, 15)}
                      </div>
                    </div>
                  ))}

                  {/* Currently Drawing Box */}
                  {currentBBox && (
                    <div
                      className="absolute border-2 border-dashed border-emerald-400 bg-emerald-400/20 pointer-events-none"
                      style={{
                        left: `${currentBBox.x}px`,
                        top: `${currentBBox.y}px`,
                        width: `${currentBBox.w}px`,
                        height: `${currentBBox.h}px`,
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <Upload className="w-12 h-12 mx-auto mb-2 opacity-40 text-blue-400" />
                  <p className="text-sm font-semibold text-slate-300">No Image in this Row</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload an image or document snippet to create OCR ground truth
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg transition"
                  >
                    Upload Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right / Ground Truth Editor & BBoxes (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 flex flex-col overflow-y-auto divide-y divide-slate-800">
            {/* Ground Truth Text Area */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ground Truth Text (Transcription)</span>
                </label>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(groundTruthText);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <textarea
                value={groundTruthText}
                onChange={(e) => setGroundTruthText(e.target.value)}
                rows={6}
                placeholder="Enter verified OCR ground truth text here..."
                className="w-full p-3 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition leading-relaxed"
              />
            </div>

            {/* Metadata Fields */}
            <div className="p-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Document Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Invoice, Receipt, ID..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Language Code
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="en, hi, es, fr..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Bounding Box Annotations List */}
            <div className="p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Bounding Boxes ({bboxes.length})</span>
                </span>
                <button
                  onClick={() => {
                    const newBox: BBoxItem = {
                      id: `box-${Date.now()}`,
                      text: "New Text Line",
                      x: 20,
                      y: 20,
                      w: 120,
                      h: 24,
                    };
                    setBboxes([...bboxes, newBox]);
                  }}
                  className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Box
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {bboxes.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No bounding boxes drawn yet. Click and drag on the image on the left to mark text regions.
                  </p>
                ) : (
                  bboxes.map((box, idx) => (
                    <div
                      key={box.id || idx}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-xs"
                    >
                      <span className="w-5 text-indigo-400 font-mono font-bold text-[11px]">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={box.text}
                        onChange={(e) => {
                          const updated = [...bboxes];
                          updated[idx].text = e.target.value;
                          setBboxes(updated);
                        }}
                        placeholder="Text in box..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">
                        [{box.x},{box.y},{box.w},{box.h}]
                      </span>
                      <button
                        onClick={() => {
                          setBboxes(bboxes.filter((_, i) => i !== idx));
                        }}
                        className="p-1 rounded text-red-400 hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Changes are saved to the current Parquet dataset in-memory.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
