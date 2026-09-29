<div align="center">
  <a href="https://devcart-technologies.in/">
    <img src="https://i.ibb.co/8D1FTxPx/devcart-technologies-logo.jpg" alt="Devcart Technologies Logo" width="120" height="120" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />
  </a>

  # Parquet Dataset Studio
  ### High-Performance Apache Parquet Editor & Visual Vision-OCR Dataset Engine

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Framework: Next.js 15](https://img.shields.io/badge/Framework-Next.js%2015-black.svg)](https://nextjs.org/)
  [![Format: Apache Parquet](https://img.shields.io/badge/Format-Apache%20Parquet-orange.svg)](https://parquet.apache.org/)
  [![Company: Devcart Technologies](https://img.shields.io/badge/Developed%20by-Devcart%20Technologies-emerald.svg)](https://devcart-technologies.in/)

  <p align="center">
    <b>Engineered with ❤️ by <a href="https://devcart-technologies.in/">Devcart Technologies</a></b><br/>
    <i>Lead Developer: Vivek Dalvi | Contact: <a href="mailto:info@devcart-technologies.in">info@devcart-technologies.in</a></i>
  </p>
</div>

---

## 🌟 Overview

**Parquet Dataset Studio** is a modern, standalone web application engineered by **Devcart Technologies** for **Data Scientists, Machine Learning Engineers, and Vision-OCR Researchers**.

It provides an all-in-one browser-based studio to view, edit, annotate, convert, and export columnar Apache Parquet files without requiring external Python environments.

### Core Capabilities:
- 📂 **Instant Parquet File Loading**: Open local `.parquet` / `.parq` binary files directly in your browser with zero latency.
- ✏️ **Interactive Columnar Data Grid**: Full CRUD operations on cells, rows, and schema columns with multi-page navigation and instant search.
- 🖼️ **Visual OCR Ground Truth Annotator**: Zoom (up to 300%), pan, draw precise bounding boxes, and save ground-truth transcriptions with seamless **Next / Prev** row navigation.
- ⚡ **Batch Images to Parquet**: Drag & drop hundreds of local images (`.png`, `.jpg`, `.webp`) and convert them into binary-encoded Parquet dataset records.
- 📐 **Schema & Metadata Inspector**: Audit column physical types (`BYTE_ARRAY`, `INT64`, `BOOLEAN`), Thrift metadata, and compression codecs (`Snappy`, `Uncompressed`).
- 💾 **Binary Parquet Export**: Export standard, production-ready `.parquet` files compatible with Python Pandas, PyArrow, DuckDB, Polars, and PyTorch.

---

## 🏢 About Devcart Technologies

- 🌐 **Official Website**: [https://devcart-technologies.in/](https://devcart-technologies.in/)
- 📧 **Official Inquiries**: [info@devcart-technologies.in](mailto:info@devcart-technologies.in)
- 👨‍💻 **Lead Developer**: Vivek Dalvi
- 📜 **License**: Open Source MIT License

---

## ✨ Features & Architecture

### 1. 📊 Real-Time Columnar Data Grid
- **Inline Cell Editing**: Modify strings, numbers, booleans, JSON objects, and image metadata with keyboard shortcuts (`Enter` to save, `Escape` to cancel).
- **Binary Image Rendering**: Automatic recognition of binary PNG/JPEG buffers and embedded image structs with visual thumbnail previews.
- **Fast Search & Filter**: Real-time multi-column search query filtering.
- **Complete Pagination**: Per-page selector (10, 25, 50, 100 rows), direct page jumps, and full Prev / Next navigation.

### 2. 🔍 Visual OCR Ground Truth Annotator
- **Interactive Document Canvas**: High-resolution rendering of document, invoice, receipt, and license plate scans.
- **Click-and-Drag Bounding Boxes**: Draw bounding rectangles over text regions with live `[x, y, width, height]` coordinates.
- **Line & Full-Text Transcriptions**: Record exact multi-line transcriptions for machine learning model training.
- **Sequential Row Workflow**: Easily advance through records with the **"Save & Next"** button.

### 3. 🚀 Batch Image Compiler
- Upload raw image folders or multiple files at once.
- Auto-extracts image dimensions and generates standard columnar dataset schemas (`id`, `image`, `ground_truth`, `category`, `bboxes`, `language`).
- One-click build and export.

### 4. 📐 Parquet Schema Manager
- Add new typed columns (`String`, `Number`, `Boolean`, `Image`, `JSON`, `Binary`).
- Rename or delete existing columns across the entire dataset.

---

## 💻 Python & ML Integration

Exported Parquet files are 100% compliant with the standard Apache Parquet format and can be used immediately across data science tools:

### 1. Python Pandas
```python
import pandas as pd

# Load and inspect dataset
df = pd.read_parquet("train-00000-of-00001.parquet")
print(f"Loaded {len(df)} records with columns: {list(df.columns)}")
print(df.head())
```

### 2. PyTorch OCR DataLoader
```python
import torch
from torch.utils.data import Dataset, DataLoader
import pandas as pd
from PIL import Image
import io, base64

class VisionOCRDataset(Dataset):
    def __init__(self, parquet_path):
        self.df = pd.read_parquet(parquet_path)

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        text = row.get("ground_truth", "")
        
        # Load embedded image bytes
        img_data = row.get("image")
        if isinstance(img_data, dict) and "src" in img_data:
            b64 = img_data["src"].split(",")[-1]
            img_bytes = base64.b64decode(b64)
            image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        else:
            image = Image.new("RGB", (480, 280), (255, 255, 255))

        return {"image": image, "text": text}

# Initialize training loader
dataset = VisionOCRDataset("train-00000-of-00001.parquet")
dataloader = DataLoader(dataset, batch_size=8, shuffle=True)
```

### 3. DuckDB / Polars
```python
import duckdb

# Query Parquet directly with SQL
con = duckdb.connect()
result = con.execute("SELECT id, category, length(ground_truth) as text_len FROM 'train-00000-of-00001.parquet'").df()
print(result)
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS v4 with Custom Glassmorphism UI
- **Parquet Engine**: `hyparquet`, `hyparquet-compressors` (Pure JS zero-dependency parsing & generation)
- **Icons & UI**: `lucide-react`, `motion`
- **Branding**: Devcart Technologies

---

## 🚀 Getting Started

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## 📜 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

Copyright (c) 2026 **Vivek Dalvi** & **Devcart Technologies** ([https://devcart-technologies.in/](https://devcart-technologies.in/)).

<div align="center">
  <p><b>Devcart Technologies</b> • Next Generation ML & Vision Data Solutions</p>
  <p>Contact: <a href="mailto:info@devcart-technologies.in">info@devcart-technologies.in</a></p>
</div>
