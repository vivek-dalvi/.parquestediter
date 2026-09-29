<div align="center">
  <a href="https://devcart-technologies.in/">
    <img src="https://i.ibb.co/8D1FTxPx/devcart-technologies-logo.jpg" alt="Devcart Technologies Logo" width="120" height="120" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />
  </a>

  # Parquet Dataset Studio & OCR Builder
  ### Professional Parquet (`train-00000-of-00001.parquet`) Editor & Vision OCR Dataset Engine

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Framework: Next.js 15](https://img.shields.io/badge/Framework-Next.js%2015-black.svg)](https://nextjs.org/)
  [![Format: Apache Parquet](https://img.shields.io/badge/Format-Apache%20Parquet-orange.svg)](https://parquet.apache.org/)
  [![Compatibility: Hugging Face](https://img.shields.io/badge/Compatibility-Hugging%20Face%20Datasets-yellow.svg)](https://huggingface.co/docs/datasets)
  [![Company: Devcart Technologies](https://img.shields.io/badge/Developed%20by-Devcart%20Technologies-emerald.svg)](https://devcart-technologies.in/)

  <p align="center">
    <b>Engineered with ❤️ by <a href="https://devcart-technologies.in/">Devcart Technologies</a></b><br/>
    <i>Lead Developer: Vivek Dalvi | Contact: <a href="mailto:info@devcart-technologies.in">info@devcart-technologies.in</a></i>
  </p>
</div>

---

## 🌟 Overview

**Parquet Dataset Studio** is a modern, full-featured web application designed specifically for **Machine Learning engineers, OCR model developers, and Hugging Face dataset creators**. 

It allows you to:
- 📂 **Load and Inspect** any existing `.parquet` file (such as `train-00000-of-00001.parquet`, `validation-00000-of-00001.parquet`, etc.).
- ✏️ **Edit Records & Columns**: Modify rows, add new labels, edit transcriptions, and change column data types in real-time.
- 🖼️ **Visual OCR Annotator**: View document, invoice, receipt, and license plate images directly, draw interactive bounding boxes, and attach ground truth transcriptions.
- ⚡ **Batch Images to Parquet**: Drag and drop batches of raw images (`.png`, `.jpg`, `.webp`) and automatically bundle them into a structured Hugging Face Parquet dataset.
- 💾 **Export & Download**: Export single-shard and multi-shard Apache Parquet binary files with Snappy compression, CSV, or JSONL formats.
- 🐍 **Ready-to-Train Code Snippets**: Instant copy-paste code for Python Pandas, Hugging Face `load_dataset()`, PyTorch `DataLoader`, and Hugging Face Hub uploads.

---

## 🏢 About the Developer & Company

This open-source project is developed and maintained by **Devcart Technologies**.

- 🌐 **Official Website**: [https://devcart-technologies.in/](https://devcart-technologies.in/)
- 📧 **Official Email**: [info@devcart-technologies.in](mailto:info@devcart-technologies.in)
- 👨‍💻 **Lead Author**: Vivek Dalvi
- 📜 **License**: Open Source MIT License

---

## ✨ Key Features

### 1. 📊 Interactive Parquet Data Grid
- **Inline Cell Editing**: Modify strings, integers, floats, booleans, and JSON objects inline.
- **Image Recognition**: Automatically detects image byte arrays, Base64 strings, and URLs with instant preview thumbnails.
- **Search & Filter**: Global keyword search and per-column ascending/descending sorting.
- **Row Operations**: Insert new records, duplicate existing rows, and remove records in one click.

### 2. 🔍 Visual OCR Ground Truth Annotator
- **Interactive Canvas**: Zoom (50% to 300%), pan, and inspect high-resolution documents, receipts, and scans.
- **Click-and-Drag Bounding Boxes**: Draw precise rectangle bounding boxes over text regions, table rows, and signatures.
- **Box-level & Full-text Transcription**: Annotate line-by-line bounding box coordinates `[x, y, width, height]` alongside full-document ground truth.
- **Metadata Management**: Assign categories (e.g. `Invoice`, `Receipt`, `ID Card`, `Shipping Label`) and language codes.

### 3. 🚀 Batch Images-to-Parquet Studio
- Drag and drop dozens of document images at once.
- Auto-generates standard Hugging Face dataset schemas (`id`, `image`, `ground_truth`, `category`, `bboxes`, `language`, `split`).
- One-click compile into `train-00000-of-00001.parquet`.

### 4. 📐 Schema & Metadata Inspector
- Inspect Apache Parquet file headers, magic bytes (`PAR1`), repetition levels, and Thrift metadata.
- Add new custom typed columns (String, Number, Boolean, Image, JSON, Binary).
- Rename or delete columns across all rows instantly.

### 5. 📦 High-Performance Binary Export
- Generates standard Apache Parquet format compatible with `pyarrow`, `fastparquet`, and `duckdb`.
- Presets for standard dataset splits:
  - `train-00000-of-00001.parquet`
  - `validation-00000-of-00001.parquet`
  - `test-00000-of-00001.parquet`
- Optional CSV and JSONL format export.

---

## 💻 Python & Hugging Face Integration

Once you export your `train-00000-of-00001.parquet` file, you can immediately train your vision models:

### 1. Load with Hugging Face Datasets
```python
from datasets import load_dataset

# Load your exported Parquet dataset
dataset = load_dataset("parquet", data_files={"train": "train-00000-of-00001.parquet"})

print(dataset)
sample = dataset["train"][0]
print("Ground Truth Transcription:\n", sample["ground_truth"])
```

### 2. Load with Python Pandas
```python
import pandas as pd

# Load and inspect dataset
df = pd.read_parquet("train-00000-of-00001.parquet")
print(f"Loaded {len(df)} records with columns: {list(df.columns)}")
print(df.head())
```

### 3. PyTorch OCR DataLoader (TrOCR / Donut / Florence-2)
```python
import torch
from torch.utils.data import Dataset, DataLoader
import pandas as pd
from PIL import Image
import io, base64

class OCRParquetDataset(Dataset):
    def __init__(self, parquet_path):
        self.df = pd.read_parquet(parquet_path)

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        text = row.get("ground_truth", "")
        
        # Parse embedded image
        img_data = row.get("image")
        if isinstance(img_data, dict) and "src" in img_data:
            b64 = img_data["src"].split(",")[-1]
            img_bytes = base64.b64decode(b64)
            image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        else:
            image = Image.new("RGB", (480, 280), (255, 255, 255))

        return {"image": image, "text": text}

# Initialize loader
train_dataset = OCRParquetDataset("train-00000-of-00001.parquet")
train_loader = DataLoader(train_dataset, batch_size=4, shuffle=True)
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS v4 & Glassmorphism 3D Theme
- **Parquet Engine**: `hyparquet`, `hyparquet-compressors` (Pure JS zero-dependency decompilation & generation)
- **Icons & Motion**: `lucide-react`, `motion`
- **Branding**: Devcart Technologies

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node.js 20 or 22 recommended)
- npm or yarn

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/vivek-dalvi/.parquestediter.git
cd .parquestediter

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start editing Parquet files.

### Production Build

```bash
npm run build
npm run start
```

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 **Vivek Dalvi** & **Devcart Technologies** ([https://devcart-technologies.in/](https://devcart-technologies.in/)).

---

<div align="center">
  <p><b>Devcart Technologies</b> • Empowering the Next Generation of AI & Vision Datasets</p>
  <p>For inquiries, partnerships, or support: <a href="mailto:info@devcart-technologies.in">info@devcart-technologies.in</a></p>
</div>
