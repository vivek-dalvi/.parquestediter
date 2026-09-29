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

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array, mimeType = "image/png"): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

export function isImageValue(val: unknown): { isImage: boolean; src?: string } {
  if (typeof val === "string") {
    if (val.startsWith("data:image/") || val.startsWith("https://") || val.startsWith("http://") || val.endsWith(".png") || val.endsWith(".jpg") || val.endsWith(".jpeg") || val.endsWith(".webp") || val.endsWith(".svg")) {
      return { isImage: true, src: val };
    }
    // Check if long raw base64 string
    if (val.length > 200 && /^[A-Za-z0-9+/=]+$/.test(val.slice(0, 100))) {
      return { isImage: true, src: `data:image/png;base64,${val}` };
    }
  } else if (val instanceof Uint8Array || (typeof val === "object" && val !== null && "bytes" in val)) {
    try {
      const bytes = (val as any).bytes || val;
      return { isImage: true, src: arrayBufferToBase64(bytes) };
    } catch {
      return { isImage: false };
    }
  } else if (typeof val === "object" && val !== null && "src" in val && typeof (val as any).src === "string") {
    return { isImage: true, src: (val as any).src };
  }
  return { isImage: false };
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
