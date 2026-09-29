import { ParquetDataset } from "./parquet-engine";

function svgToDataUrl(svg: string): string {
  if (typeof Buffer !== "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(svg, "utf-8").toString("base64")}`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Helper to create synthetic OCR invoice/document SVG data URLs
function createSyntheticDocumentSvg(
  title: string,
  docNumber: string,
  items: { label: string; value: string }[],
  accentColor = "#3b82f6"
): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="280" viewBox="0 0 480 280">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/>
    </filter>
  </defs>
  
  <rect width="480" height="280" fill="#0f172a" rx="12"/>
  <rect x="10" y="10" width="460" height="260" fill="url(#bg)" rx="8" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)"/>
  
  <!-- Header Banner -->
  <rect x="10" y="10" width="460" height="42" fill="${accentColor}" rx="8" />
  <text x="28" y="36" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="bold" letter-spacing="0.5">${title}</text>
  <text x="440" y="35" fill="#ffffff" font-family="monospace" font-size="12" text-anchor="end">${docNumber}</text>

  <!-- Content Rows -->
  ${items
    .map((item, idx) => {
      const y = 80 + idx * 36;
      return `
      <g>
        <rect x="26" y="${y - 16}" width="428" height="28" fill="${idx % 2 === 0 ? "#f1f5f9" : "transparent"}" rx="4" />
        <text x="36" y="${y + 3}" fill="#64748b" font-family="Arial, sans-serif" font-size="12" font-weight="600">${item.label}:</text>
        <text x="440" y="${y + 3}" fill="#0f172a" font-family="monospace" font-size="13" font-weight="bold" text-anchor="end">${item.value}</text>
      </g>
    `;
    })
    .join("")}

  <!-- Footer Verification Stamp -->
  <line x1="26" y1="230" x2="454" y2="230" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4"/>
  <circle cx="50" cy="248" r="10" fill="${accentColor}" opacity="0.15"/>
  <text x="68" y="252" fill="#64748b" font-family="sans-serif" font-size="10">OFFICIAL OCR GROUND TRUTH - DEVCART TECHNOLOGIES</text>
</svg>
  `.trim();

  return svgToDataUrl(svg);
}

export const SAMPLE_DATASETS: Record<string, () => ParquetDataset> = {
  "train-ocr-invoices": () => ({
    filename: "train-00000-of-00001.parquet",
    fileSize: 184520,
    columns: [
      { name: "id", type: "string", nullable: false },
      { name: "image", type: "image", nullable: false },
      { name: "ground_truth", type: "string", nullable: false },
      { name: "category", type: "string", nullable: true },
      { name: "bboxes", type: "json", nullable: true },
      { name: "language", type: "string", nullable: true },
      { name: "confidence_target", type: "number", nullable: true },
    ],
    rows: [
      {
        _id: "row-1",
        id: "INV-2026-001",
        image: {
          src: createSyntheticDocumentSvg(
            "TECH CORP GLOBAL INVOICE",
            "DOC #INV-9841",
            [
              { label: "Vendor Name", value: "Devcart Technologies Pvt Ltd" },
              { label: "Client Account", value: "Nexus AI Infrastructure" },
              { label: "Tax Ident (GSTIN)", value: "27AAACD1478Q1Z4" },
              { label: "Total Amount Due", value: "$4,850.00 USD" },
            ],
            "#2563eb"
          ),
          isImage: true,
          path: "images/invoice_001.png",
        },
        ground_truth:
          "TECH CORP GLOBAL INVOICE\nDOC #INV-9841\nVendor: Devcart Technologies Pvt Ltd\nClient: Nexus AI Infrastructure\nGSTIN: 27AAACD1478Q1Z4\nTotal Amount Due: $4,850.00 USD",
        category: "Invoice",
        bboxes: JSON.stringify([
          { text: "TECH CORP GLOBAL INVOICE", x: 28, y: 15, w: 250, h: 30 },
          { text: "Devcart Technologies Pvt Ltd", x: 180, y: 64, w: 260, h: 28 },
          { text: "$4,850.00 USD", x: 320, y: 172, w: 120, h: 28 },
        ]),
        language: "en",
        confidence_target: 0.995,
      },
      {
        _id: "row-2",
        id: "REC-2026-042",
        image: {
          src: createSyntheticDocumentSvg(
            "SUPERMARKET RETAIL RECEIPT",
            "REC #88201",
            [
              { label: "Store Name", value: "Metro Mart Superstore" },
              { label: "Cashier", value: "Operator #14 - Terminal 2" },
              { label: "Items Purchased", value: "12 Qty Grocery & Dairy" },
              { label: "Card Paid", value: "VISA Ending in 4192 - $134.80" },
            ],
            "#10b981"
          ),
          isImage: true,
          path: "images/receipt_042.png",
        },
        ground_truth:
          "SUPERMARKET RETAIL RECEIPT\nREC #88201\nStore: Metro Mart Superstore\nCashier: Operator #14\nItems: 12 Qty\nPaid: $134.80 (VISA 4192)",
        category: "Receipt",
        bboxes: JSON.stringify([
          { text: "SUPERMARKET RETAIL RECEIPT", x: 28, y: 15, w: 280, h: 30 },
          { text: "Metro Mart Superstore", x: 200, y: 64, w: 240, h: 28 },
          { text: "$134.80", x: 350, y: 172, w: 90, h: 28 },
        ]),
        language: "en",
        confidence_target: 0.988,
      },
      {
        _id: "row-3",
        id: "MED-2026-109",
        image: {
          src: createSyntheticDocumentSvg(
            "CLINICAL LAB TEST REPORT",
            "LAB #90218",
            [
              { label: "Patient Name", value: "Alex Rivera (Age: 34 / M)" },
              { label: "Diagnostic Panel", value: "Complete Blood Chemistry" },
              { label: "Hemoglobin", value: "14.8 g/dL (Normal Range)" },
              { label: "Status & Verified", value: "APPROVED BY DR. K. SHARMA" },
            ],
            "#8b5cf6"
          ),
          isImage: true,
          path: "images/lab_report_109.png",
        },
        ground_truth:
          "CLINICAL LAB TEST REPORT\nLAB #90218\nPatient: Alex Rivera (Age: 34 / M)\nPanel: Complete Blood Chemistry\nHemoglobin: 14.8 g/dL (Normal)\nStatus: APPROVED BY DR. K. SHARMA",
        category: "Medical",
        bboxes: JSON.stringify([
          { text: "CLINICAL LAB TEST REPORT", x: 28, y: 15, w: 260, h: 30 },
          { text: "Alex Rivera", x: 220, y: 64, w: 220, h: 28 },
          { text: "APPROVED", x: 300, y: 172, w: 140, h: 28 },
        ]),
        language: "en",
        confidence_target: 0.999,
      },
      {
        _id: "row-4",
        id: "SHP-2026-554",
        image: {
          src: createSyntheticDocumentSvg(
            "AIR FREIGHT BILL OF LADING",
            "AWB #773-8991",
            [
              { label: "Origin Airport", value: "BOM (Mumbai Intl) - IN" },
              { label: "Destination Airport", value: "SFO (San Francisco) - US" },
              { label: "Package Weight", value: "48.50 KG (3 Crates)" },
              { label: "Priority Service", value: "EXPRESS CARGO - SECURE" },
            ],
            "#f59e0b"
          ),
          isImage: true,
          path: "images/freight_554.png",
        },
        ground_truth:
          "AIR FREIGHT BILL OF LADING\nAWB #773-8991\nOrigin: BOM (Mumbai Intl) - IN\nDestination: SFO (San Francisco) - US\nWeight: 48.50 KG\nService: EXPRESS CARGO",
        category: "Shipping",
        bboxes: JSON.stringify([
          { text: "AIR FREIGHT BILL OF LADING", x: 28, y: 15, w: 270, h: 30 },
          { text: "BOM -> SFO", x: 200, y: 64, w: 240, h: 28 },
          { text: "48.50 KG", x: 340, y: 136, w: 100, h: 28 },
        ]),
        language: "en",
        confidence_target: 0.992,
      },
      {
        _id: "row-5",
        id: "ID-2026-781",
        image: {
          src: createSyntheticDocumentSvg(
            "GOVERNMENT ID VERIFICATION",
            "ID #DL-90881",
            [
              { label: "Full Legal Name", value: "Vivek Dalvi" },
              { label: "Date of Birth", value: "15-AUG-1996" },
              { label: "Issuing Authority", value: "Department of Transportation" },
              { label: "Card Status", value: "VERIFIED ACTIVE • CLASS C" },
            ],
            "#ec4899"
          ),
          isImage: true,
          path: "images/id_781.png",
        },
        ground_truth:
          "GOVERNMENT ID VERIFICATION\nID #DL-90881\nName: Vivek Dalvi\nDOB: 15-AUG-1996\nAuthority: Department of Transportation\nStatus: VERIFIED ACTIVE • CLASS C",
        category: "ID Card",
        bboxes: JSON.stringify([
          { text: "GOVERNMENT ID VERIFICATION", x: 28, y: 15, w: 280, h: 30 },
          { text: "Vivek Dalvi", x: 250, y: 64, w: 190, h: 28 },
          { text: "VERIFIED ACTIVE", x: 280, y: 172, w: 160, h: 28 },
        ]),
        language: "en",
        confidence_target: 0.997,
      },
    ],
    totalRows: 5,
    metadata: {
      createdBy: "Devcart Technologies OCR Dataset Engine",
      numRowGroups: 1,
      compression: "Snappy (Optimized for Hugging Face)",
    },
  }),

  "tabular-ml-dataset": () => ({
    filename: "train-00000-of-00001.parquet",
    fileSize: 98200,
    columns: [
      { name: "record_id", type: "number", nullable: false },
      { name: "prompt", type: "string", nullable: false },
      { name: "response_text", type: "string", nullable: false },
      { name: "score", type: "number", nullable: true },
      { name: "approved", type: "boolean", nullable: false },
      { name: "created_by", type: "string", nullable: true },
    ],
    rows: [
      {
        _id: "row-1",
        record_id: 101,
        prompt: "Extract tabular financial balance sheet from PDF scan",
        response_text: "Parsed 14 line items with 99.8% field matching precision.",
        score: 0.98,
        approved: true,
        created_by: "devcart_ai",
      },
      {
        _id: "row-2",
        record_id: 102,
        prompt: "OCR handwriting on medical prescription",
        response_text: "Amoxicillin 500mg - 3 times daily after meals for 7 days.",
        score: 0.95,
        approved: true,
        created_by: "devcart_ai",
      },
      {
        _id: "row-3",
        record_id: 103,
        prompt: "Segment vehicle registration plate in low-light camera frame",
        response_text: "Plate detected: MH-12-DE-9082 with bounding box [120, 340, 240, 90]",
        score: 0.99,
        approved: true,
        created_by: "devcart_ai",
      },
      {
        _id: "row-4",
        record_id: 104,
        prompt: "Multi-lingual receipt parsing (Hindi + English)",
        response_text: "Total: ₹3,450.00 | कुल राशि: ₹3,450.00 | GST: 18%",
        score: 0.97,
        approved: true,
        created_by: "devcart_ai",
      },
    ],
    totalRows: 4,
    metadata: {
      createdBy: "Devcart Technologies",
      numRowGroups: 1,
      compression: "Snappy",
    },
  }),
};
