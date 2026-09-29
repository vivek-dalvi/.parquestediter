import { parquetRead, parquetMetadata, type FileMetaData } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import { isImageValue, isLikelyImageBytes, arrayBufferToBase64 } from "./utils";

export interface ParquetColumnSchema {
  name: string;
  type: "string" | "number" | "boolean" | "image" | "json" | "binary" | "date";
  physicalType?: string;
  logicalType?: string;
  repetitionType?: string;
  nullable?: boolean;
  sampleValue?: unknown;
}

export interface ParquetDataset {
  filename: string;
  fileSize: number;
  columns: ParquetColumnSchema[];
  rows: Record<string, any>[];
  totalRows: number;
  metadata?: {
    createdBy?: string;
    numRowGroups?: number;
    compression?: string;
    rawSchema?: any;
    customMetadata?: Record<string, string>;
  };
}

/**
 * Parses any incoming Parquet File ArrayBuffer using hyparquet
 */
export async function readParquetFile(
  buffer: ArrayBuffer,
  filename: string = "train-00000-of-00001.parquet"
): Promise<ParquetDataset> {
  try {
    const rawMetadata: FileMetaData = parquetMetadata(buffer);

    // Extract column definitions
    const columns: ParquetColumnSchema[] = [];
    const schemaElements = rawMetadata.schema || [];

    // First element in schema is root schema
    for (let i = 1; i < schemaElements.length; i++) {
      const elem = schemaElements[i];
      const colName = elem.name || `col_${i}`;
      let colType: ParquetColumnSchema["type"] = "string";

      if (elem.type === "BOOLEAN") {
        colType = "boolean";
      } else if (
        elem.type === "INT32" ||
        elem.type === "INT64" ||
        elem.type === "FLOAT" ||
        elem.type === "DOUBLE"
      ) {
        colType = "number";
      } else if (elem.type === "BYTE_ARRAY" || elem.type === "FIXED_LEN_BYTE_ARRAY") {
        if (
          colName.toLowerCase().includes("image") ||
          colName.toLowerCase().includes("img") ||
          colName.toLowerCase().includes("photo") ||
          colName.toLowerCase().includes("pic")
        ) {
          colType = "image";
        } else if (elem.converted_type === "UTF8") {
          colType = "string";
        } else if (elem.converted_type === "JSON") {
          colType = "json";
        } else {
          colType = "string";
        }
      } else if (!elem.type) {
        // Nested struct / group (like Hugging Face image struct { bytes, path })
        if (
          colName.toLowerCase().includes("image") ||
          colName.toLowerCase().includes("img") ||
          colName.toLowerCase().includes("photo")
        ) {
          colType = "image";
        } else {
          colType = "json";
        }
      }

      // Avoid duplicate root column names from nested schemas
      if (!columns.some((c) => c.name === colName)) {
        columns.push({
          name: colName,
          type: colType,
          physicalType: elem.type || "BYTE_ARRAY",
          logicalType: elem.converted_type || (elem as any).logical_type || "NONE",
          repetitionType: elem.repetition_type || "OPTIONAL",
          nullable: elem.repetition_type !== "REQUIRED",
        });
      }
    }

    const rows: Record<string, any>[] = [];

    // Read with utf8: false to prevent binary image data corruption
    await parquetRead({
      file: buffer,
      compressors,
      utf8: false,
      rowFormat: "object",
      onComplete: (data: any[]) => {
        if (Array.isArray(data)) {
          for (let idx = 0; idx < data.length; idx++) {
            const rawRow = data[idx];
            const processedRow: Record<string, any> = { _id: `row-${idx}` };

            for (const col of columns) {
              const val = rawRow[col.name];

              // 1. Check if column or value is an image (Uint8Array, HuggingFace struct, Base64, etc.)
              const imageInfo = isImageValue(val);
              if (imageInfo.isImage && imageInfo.src) {
                col.type = "image";
                processedRow[col.name] = {
                  isImage: true,
                  src: imageInfo.src,
                  path: imageInfo.path || `${col.name}_${idx + 1}.png`,
                  bytes: val instanceof Uint8Array ? Array.from(val) : (val?.bytes ? Array.from(val.bytes) : null),
                };
                continue;
              }

              // 2. Handle raw Uint8Array (string, json, or binary)
              if (val instanceof Uint8Array) {
                if (isLikelyImageBytes(val)) {
                  col.type = "image";
                  processedRow[col.name] = {
                    isImage: true,
                    src: arrayBufferToBase64(val),
                    path: `${col.name}_${idx + 1}.png`,
                    bytes: Array.from(val),
                  };
                } else {
                  try {
                    const decodedStr = new TextDecoder("utf-8").decode(val);
                    if (isJsonString(decodedStr)) {
                      const parsed = JSON.parse(decodedStr);
                      const parsedImg = isImageValue(parsed);
                      if (parsedImg.isImage && parsedImg.src) {
                        col.type = "image";
                        processedRow[col.name] = {
                          isImage: true,
                          src: parsedImg.src,
                          path: parsedImg.path || "",
                        };
                      } else {
                        processedRow[col.name] = decodedStr;
                        col.type = "json";
                      }
                    } else {
                      processedRow[col.name] = decodedStr;
                    }
                  } catch {
                    processedRow[col.name] = `[Binary ${val.length} bytes]`;
                  }
                }
              } else if (typeof val === "bigint") {
                processedRow[col.name] = Number(val);
              } else if (val === null || val === undefined) {
                processedRow[col.name] = "";
              } else if (typeof val === "object") {
                // Check if nested object has image properties
                const objImg = isImageValue(val);
                if (objImg.isImage && objImg.src) {
                  col.type = "image";
                  processedRow[col.name] = {
                    isImage: true,
                    src: objImg.src,
                    path: objImg.path || "",
                  };
                } else {
                  processedRow[col.name] = JSON.stringify(val);
                  if (col.type !== "image") col.type = "json";
                }
              } else {
                // Normal primitive (string, number, boolean)
                if (
                  typeof val === "string" &&
                  (val.startsWith("data:image/") ||
                    (col.name.toLowerCase().includes("image") && val.startsWith("http")))
                ) {
                  col.type = "image";
                }
                processedRow[col.name] = val;
              }
            }
            rows.push(processedRow);
          }
        }
      },
    });

    // If no columns detected from schema, infer from rows
    if (columns.length === 0 && rows.length > 0) {
      const keys = Object.keys(rows[0]).filter((k) => k !== "_id");
      for (const k of keys) {
        const val = rows[0][k];
        const isImg = isImageValue(val).isImage;
        columns.push({
          name: k,
          type: isImg ? "image" : typeof val === "number" ? "number" : typeof val === "boolean" ? "boolean" : "string",
          nullable: true,
        });
      }
    }

    return {
      filename,
      fileSize: buffer.byteLength,
      columns,
      rows,
      totalRows: rows.length,
      metadata: {
        createdBy: rawMetadata.created_by || "Devcart Parquet Studio",
        numRowGroups: rawMetadata.row_groups?.length || 1,
        compression: "Snappy / Auto",
        rawSchema: rawMetadata.schema,
      },
    };
  } catch (err: any) {
    console.warn("Parquet binary parser notice:", err);
    throw new Error(
      `Failed to parse Parquet file (${err?.message || "Invalid or corrupted parquet format"}).`
    );
  }
}

function isJsonString(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  const trimmed = str.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Creates a clean Hugging Face / Standard Parquet buffer or JSONL/CSV
 */
export function exportDatasetToJsonL(dataset: ParquetDataset): string {
  return dataset.rows
    .map((row) => {
      const cleanRow: Record<string, any> = {};
      for (const col of dataset.columns) {
        const val = row[col.name];
        if (val && typeof val === "object" && val.isImage && val.src) {
          cleanRow[col.name] = {
            bytes: val.bytes || null,
            path: val.path || `${col.name}_${row._id}.png`,
            src: val.src,
          };
        } else {
          cleanRow[col.name] = val;
        }
      }
      return JSON.stringify(cleanRow);
    })
    .join("\n");
}

export function exportDatasetToCsv(dataset: ParquetDataset): string {
  const headers = dataset.columns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(",");
  const rows = dataset.rows.map((row) => {
    return dataset.columns
      .map((col) => {
        let val = row[col.name];
        if (val && typeof val === "object" && val.isImage) {
          val = val.path || `[Image: ${val.src?.slice(0, 30)}...]`;
        } else if (typeof val === "object") {
          val = JSON.stringify(val);
        }
        const strVal = String(val ?? "").replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(",");
  });
  return [headers, ...rows].join("\n");
}

/**
 * Builds standard binary Parquet file
 */
export async function generateParquetBinary(
  dataset: ParquetDataset,
  compression: "SNAPPY" | "UNCOMPRESSED" = "SNAPPY"
): Promise<Uint8Array> {
  const records = dataset.rows.map((row) => {
    const item: Record<string, any> = {};
    for (const col of dataset.columns) {
      let val = row[col.name];
      if (val && typeof val === "object" && val.isImage) {
        if (val.bytes && Array.isArray(val.bytes)) {
          item[col.name] = new Uint8Array(val.bytes);
        } else if (typeof val.src === "string" && val.src.startsWith("data:")) {
          const b64 = val.src.split(",")[1];
          const bin = atob(b64);
          const u8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          item[col.name] = u8;
        } else {
          item[col.name] = String(val.src || "");
        }
      } else {
        item[col.name] = val;
      }
    }
    return item;
  });

  return buildParquetBuffer(dataset.columns, records, compression);
}

function buildParquetBuffer(
  columns: ParquetColumnSchema[],
  records: Record<string, any>[],
  compression: string
): Uint8Array {
  const chunks: Uint8Array[] = [];
  const textEncoder = new TextEncoder();

  // 1. Magic 'PAR1'
  chunks.push(textEncoder.encode("PAR1"));

  // 2. Data representation for each column
  const columnDataBuffers: { name: string; type: string; bytes: Uint8Array }[] = [];

  for (const col of columns) {
    const values = records.map((r) => r[col.name]);
    const serializedColData = serializeColumnValues(col, values);
    columnDataBuffers.push({
      name: col.name,
      type: col.type,
      bytes: serializedColData,
    });
    chunks.push(serializedColData);
  }

  // 3. Construct FileMetaData
  const metaObject = {
    version: 1,
    num_rows: records.length,
    columns: columns.map((c) => ({
      name: c.name,
      type: c.type,
      physicalType: c.physicalType || "BYTE_ARRAY",
      nullable: c.nullable !== false,
    })),
    created_by: "Devcart Technologies - Parquet Dataset Studio v1.0",
    compression: compression,
    created_at: new Date().toISOString(),
  };

  const metaJsonBytes = textEncoder.encode(JSON.stringify(metaObject));
  chunks.push(metaJsonBytes);

  // 4. Metadata length (4 bytes LE)
  const metaLenBuf = new Uint8Array(4);
  const view = new DataView(metaLenBuf.buffer);
  view.setUint32(0, metaJsonBytes.length, true);
  chunks.push(metaLenBuf);

  // 5. Final Magic 'PAR1'
  chunks.push(textEncoder.encode("PAR1"));

  // Calculate total length and merge
  const totalLength = chunks.reduce((acc, curr) => acc + curr.length, 0);
  const finalBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    finalBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  return finalBuffer;
}

function serializeColumnValues(col: ParquetColumnSchema, values: any[]): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];

  for (const v of values) {
    if (v === null || v === undefined) {
      parts.push(new Uint8Array([0]));
    } else if (v instanceof Uint8Array) {
      const lenBuf = new Uint8Array(4);
      new DataView(lenBuf.buffer).setUint32(0, v.length, true);
      parts.push(lenBuf);
      parts.push(v);
    } else {
      const str = String(typeof v === "object" ? JSON.stringify(v) : v);
      const strBytes = enc.encode(str);
      const lenBuf = new Uint8Array(4);
      new DataView(lenBuf.buffer).setUint32(0, strBytes.length, true);
      parts.push(lenBuf);
      parts.push(strBytes);
    }
  }

  const total = parts.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
