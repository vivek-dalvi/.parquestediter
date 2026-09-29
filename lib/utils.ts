import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function arrayBufferToBase64(
  buffer: ArrayBuffer | Uint8Array | number[] | string,
  mimeType = "image/png"
): string {
  if (typeof buffer === "string") {
    if (buffer.startsWith("data:image/")) return buffer;
    if (buffer.startsWith("http://") || buffer.startsWith("https://")) return buffer;
    // Check if raw binary string
    let binary = "";
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer.charCodeAt(i) & 0xff);
    }
    return `data:${mimeType};base64,${btoa(binary)}`;
  }

  let bytes: Uint8Array;
  if (buffer instanceof Uint8Array) {
    bytes = buffer;
  } else if (Array.isArray(buffer)) {
    bytes = new Uint8Array(buffer);
  } else if (buffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(buffer);
  } else {
    return "";
  }

  // Detect mime type from magic bytes
  if (bytes.length >= 4) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      mimeType = "image/png";
    } else if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      mimeType = "image/jpeg";
    } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      mimeType = "image/gif";
    } else if (bytes.length > 11 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      mimeType = "image/webp";
    }
  }

  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Robustly inspects any data value (HuggingFace Struct, Uint8Array, Base64, JSON string, Object)
 * and returns whether it is an image and its data URL.
 */
export function isImageValue(val: unknown): { isImage: boolean; src?: string; path?: string } {
  if (!val) return { isImage: false };

  // 1. If string
  if (typeof val === "string") {
    const trimmed = val.trim();

    if (
      trimmed.startsWith("data:image/") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("blob:")
    ) {
      return { isImage: true, src: trimmed };
    }

    // Check if JSON string like {"bytes": ...} or {"src": ...}
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        return isImageValue(parsed);
      } catch {
        // Continue
      }
    }

    // Check if raw Base64 image
    if (trimmed.length > 100 && /^[A-Za-z0-9+/=]+$/.test(trimmed.slice(0, 100))) {
      return { isImage: true, src: `data:image/png;base64,${trimmed}` };
    }

    // Check if raw binary string starting with PNG/JFIF
    if (trimmed.includes("PNG") || trimmed.includes("JFIF") || trimmed.includes("Exif") || trimmed.startsWith("\x89PNG") || trimmed.startsWith("\ufffdPNG")) {
      try {
        return { isImage: true, src: arrayBufferToBase64(trimmed) };
      } catch {
        // ignore
      }
    }
  }

  // 2. If Uint8Array
  if (val instanceof Uint8Array) {
    if (isLikelyImageBytes(val)) {
      return { isImage: true, src: arrayBufferToBase64(val) };
    }
  }

  // 3. If Object (e.g. HuggingFace image struct: { bytes: ..., path: ... })
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, any>;

    if (typeof obj.src === "string") {
      return { isImage: true, src: obj.src, path: obj.path };
    }

    if (obj.bytes !== undefined && obj.bytes !== null) {
      const src = arrayBufferToBase64(obj.bytes);
      if (src) {
        return { isImage: true, src, path: obj.path };
      }
    }

    if (obj.data !== undefined && obj.data !== null) {
      const src = arrayBufferToBase64(obj.data);
      if (src) {
        return { isImage: true, src, path: obj.path };
      }
    }
  }

  return { isImage: false };
}

export function isLikelyImageBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  // GIF: 47 49 46
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true;
  // WebP: RIFF ... WEBP
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
  ) {
    return true;
  }
  return false;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
