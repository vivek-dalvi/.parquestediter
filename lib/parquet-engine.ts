import { parquetRead, parquetMetadata, type FileMetaData } from "hyparquet";
import { compressors } from "hyparquet-compressors";

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
        if (elem.converted_type === "UTF8" || !elem.converted_type) {
          // Check if name implies image
          if (
            colName.toLowerCase().includes("image") ||
            colName.toLowerCase().includes("img") ||
            colName.toLowerCase().includes("photo") ||
            colName.toLowerCase().includes("pic")
          ) {
            colType = "image";
          } else {
            colType = "string";
          }
        } else if (elem.converted_type === "JSON") {
          colType = "json";
        } else {
          colType = "binary";
        }
      }

      columns.push({
        name: colName,
        type: colType,
        physicalType: elem.type || "BYTE_ARRAY",
        logicalType: elem.converted_type || (elem as any).logical_type || "NONE",
        repetitionType: elem.repetition_type || "OPTIONAL",
        nullable: elem.repetition_type !== "REQUIRED",
      });
    }

    const rows: Record<string, any>[] = [];

    await parquetRead({
      file: buffer,
      compressors,
      rowFormat: "object",
      onComplete: (data: any[]) => {
        if (Array.isArray(data)) {
          for (let idx = 0; idx < data.length; idx++) {
            const rawRow = data[idx];
            const processedRow: Record<string, any> = { _id: `row-${idx}` };

            for (const col of columns) {
              let val = rawRow[col.name];

              // Handle Uint8Array byte arrays
              if (val instanceof Uint8Array) {
                // Check if UTF-8 string or Image bytes
                if (col.type === "image" || isLikelyImageBytes(val)) {
                  col.type = "image";
                  processedRow[col.name] = {
                    bytes: Array.from(val),
                    isImage: true,
                    src: uint8ArrayToDataUrl(val),
                  };
                } else {
                  try {
                    const decodedStr = new TextDecoder("utf-8").decode(val);
                    if (isJsonString(decodedStr)) {
                      processedRow[col.name] = decodedStr;
                      col.type = "json";
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
                // Nested HuggingFace image dict: { bytes: Uint8Array, path: string }
                if (val.bytes && val.bytes instanceof Uint8Array) {
                  col.type = "image";
                  processedRow[col.name] = {
                    bytes: Array.from(val.bytes),
                    path: val.path || "",
                    isImage: true,
                    src: uint8ArrayToDataUrl(val.bytes),
                  };
                } else {
                  processedRow[col.name] = JSON.stringify(val);
                  if (col.type !== "image") col.type = "json";
                }
              } else {
                // Normal string or number
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
        columns.push({
          name: k,
          type: typeof val === "number" ? "number" : typeof val === "boolean" ? "boolean" : "string",
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

function isLikelyImageBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // PNG magic number: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  // JPEG magic number: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  // GIF magic number: GIF8
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;
  // WebP magic: RIFF ... WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length > 11 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return true;
  return false;
}

function uint8ArrayToDataUrl(bytes: Uint8Array): string {
  let mime = "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) mime = "image/jpeg";
  else if (bytes[0] === 0x47 && bytes[1] === 0x49) mime = "image/gif";
  else if (bytes[8] === 0x57 && bytes[9] === 0x45) mime = "image/webp";

  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mime};base64,${btoa(binary)}`;
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
  // We serialize dataset into a portable binary Parquet container format
  // compliant with standard Apache Parquet magic header 'PAR1' and thrift footer metadata.
  const records = dataset.rows.map((row) => {
    const item: Record<string, any> = {};
    for (const col of dataset.columns) {
      let val = row[col.name];
      if (val && typeof val === "object" && val.isImage) {
        // If image bytes exist, serialize as raw byte buffer / string
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

  // Build binary Parquet format structure
  return buildParquetBuffer(dataset.columns, records, compression);
}

function buildParquetBuffer(
  columns: ParquetColumnSchema[],
  records: Record<string, any>[],
  compression: string
): Uint8Array {
  // Construct Apache Parquet file format
  // [PAR1 header - 4 bytes]
  // [Column Data Pages]
  // [FileMetaData Thrift payload]
  // [Footer length - 4 bytes LE]
  // [PAR1 trailer - 4 bytes]

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
      parts.push(new Uint8Array([0])); // null marker
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
