# 🛠️ OmniSurv: Enterprise Environment Setup Guide
### *Engineered by Team Cyber Synergists — Smart India Hackathon (SIH2026)*

---

```
  ██████╗ ██╗   ██╗██████╗ ███████╗██████╗     ███████╗██╗   ██╗███╗   ██╗███████╗██████╗  ██████╗ ██╗███████╗████████╗███████╗
 ██╔════╝ ╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗    ██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝██╔══██╗██╔════╝ ██║██╔════╝╚══██╔══╝██╔════╝
 ██║       ╚████╔╝ ██████╔╝█████╗  ██████╔╝    ███████╗ ╚████╔╝ ██╔██╗ ██║█████╗  ██████╔╝██║  ███╗██║███████╗   ██║   ███████╗
 ██║        ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗    ╚════██║  ╚██╔╝  ██║╚██╗██║██╔══╝  ██╔══██╗██║   ██║██║╚════██║   ██║   ╚════██║
 ╚██████╗    ██║   ██████╔╝███████╗██║  ██║    ███████║   ██║   ██║ ╚████║███████╗██║  ██║╚██████╔╝██║███████║   ██║   ███████║
  ╚═════╝    ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝    ╚══════╝   ╚═╝   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚══════╝   ╚═╝   ╚══════╝
                     Forensic Innovation for Law Enforcement & Digital Investigators
```

---

## 📌 Introduction & Architectural Scope

**OmniSurv** is a multi-vendor digital forensic workstation designed to acquire, carve, reconstruct, and analyze video evidence from proprietary DVR/NVR surveillance equipment (Dahua, Hikvision, CP Plus, Honeywell, TP-Link, Godrej, Uniview, and Matrix).

This document outlines the end-to-end setup process for developers, forensic examiners, and security teams across Windows, Linux, and macOS environments.

---

## 💻 1. System Requirements & Prerequisites

### Minimum Hardware
- **CPU**: Quad-core x86_64 processor (Intel Core i5 8th Gen+ / AMD Ryzen 5+)
- **RAM**: 16 GB RAM (32 GB recommended for multi-gigabyte disk carving)
- **Storage**: 50 GB free NVMe/SSD space (dedicated partition for raw disk dumps & carved frames)
- **Network**: Internet connection for Gemini & Groq cloud API access

### Software Dependencies
| Component | Minimum Version | Installation Check | Purpose |
|---|---|---|---|
| **Python** | 3.10 or 3.11 | `python --version` | Forensic carving engine & FastAPI backend |
| **Node.js** | 18.x or 20.x | `node -v` | TanStack Start + React 19 Frontend |
| **npm** | 9.x or 10.x | `npm -v` | Frontend dependency manager |
| **FFmpeg** | 4.4+ (6.0+ recommended) | `ffmpeg -version` | Lossless stream extraction, audio/video remuxing |
| **Git** | 2.30+ | `git --version` | Version control & repository tracking |

---

## 🧰 2. Installing System-Level Dependencies

### Windows (PowerShell with Winget or Chocolatey)
```powershell
# Install Python 3.11, Node.js LTS, Git, and FFmpeg
winget install Python.Python.3.11
winget install OpenJS.NodeJS.LTS
winget install Gyan.FFmpeg
winget install Git.Git
```
> **IMPORTANT (FFmpeg PATH)**: Ensure `ffmpeg.exe` and `ffprobe.exe` are in your Windows System PATH. Verify by executing `ffmpeg -version` in a fresh terminal.

### Ubuntu / Debian Linux
```bash
sudo apt update && sudo apt install -y \
    python3 python3-pip python3-venv \
    nodejs npm \
    ffmpeg \
    git \
    libmagic1 \
    libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0
```

### macOS (Homebrew)
```zsh
brew update
brew install python@3.11 node ffmpeg git libmagic
```

---

## ⚙️ 3. Repository Directory Structure

```
OmniSurv/
├── docs/
│   └── screenshots/              # Forensic UI module captures & platform logo
├── Forensic Engine/              # Low-level carving test harness & vendor parsers
│   ├── carving_engine.py         # 8-OEM byte-level stream carver
│   ├── test_carving_engine.py    # Unit tests for carving logic
│   └── .env.example
├── omnisurv backened/            # Production FastAPI backend application
│   ├── app/
│   │   ├── config.py             # App configuration & storage paths
│   │   ├── database_service.py   # Dual-mode SQLite / PostgreSQL pgvector service
│   │   ├── key_manager.py        # 10 Groq + 5 Gemini rotating API manager
│   │   ├── main.py               # FastAPI entrypoint & router aggregation
│   │   ├── report_service.py     # Forensic PDF report generator (ReportLab/WeasyPrint)
│   │   └── recovery/             # OEM vendor stubs & parsing pipelines
│   ├── routers/                  # Evidence, Analysis, Reports, OEM REST endpoints
│   ├── tests/                    # 19/19 pytest suite
│   ├── requirements.txt          # Python dependencies
│   └── .env.example
├── pixel-perfect-render-5182/    # Modern Investigator UI (React 19 + TanStack)
│   ├── public/                   # Static assets & omnisurv-logo.png
│   ├── src/                      # Components, routes, and state stores
│   │   └── lib/api.ts            # REST connector to FastAPI port 8000
│   ├── package.json
│   └── vite.config.ts
├── start_all.ps1                 # Unified Windows startup script
├── README.md                     # Comprehensive platform architecture & specs
├── WALKTHROUGH.md                # Forensic examination operational guide
├── ENV_SETUP.md                  # This document
├── LICENSE                       # Apache 2.0 License (Cyber Synergists)
└── .gitignore                    # Security and secret protection configuration
```

---

## 🐍 4. Backend & Forensic Engine Setup

### Step 4.1: Create Python Virtual Environment
Navigate to the project root and create a shared virtual environment:

```powershell
# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### Step 4.2: Install Backend Dependencies
Navigate to `omnisurv backened/` and install required packages:

```bash
cd "omnisurv backened"
pip install --upgrade pip
pip install -r requirements.txt
```

#### Core Package Roster
- `fastapi` & `uvicorn[standard]` — High-throughput async REST server
- `pydantic` & `pydantic-settings` — Strict data validation and schema enforcement
- `sqlalchemy` & `aiosqlite` — Zero-dependency embedded database engine
- `google-generativeai` — Google Gemini multimodal video perception SDK
- `groq` — Groq sub-second LLaMA/Qwen inference engine
- `reportlab` — Forensic PDF certificate generator (with Section 65B/63 attestation)
- `python-multipart` — Chunked disk image streaming and multipart intake
- `pytest` & `pytest-asyncio` — Automated test harness

### Step 4.3: Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` to configure your keys and storage options:

```ini
# ============================================================
# OmniSurv Configuration — Team Cyber Synergists
# ============================================================

# Database URL:
# Zero-config SQLite (default):
DATABASE_URL=sqlite+aiosqlite:///./omnisurv.db
# Or PostgreSQL + pgvector (production):
# DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/omnisurv

# Evidence storage directory (created automatically):
EVIDENCE_STORAGE_PATH=evidence_storage

# Cloud AI Multi-Key Rotation Pool:
# Google Gemini API (Provide 1 to 5 keys, separated by commas):
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_KEYS=key1,key2,key3,key4,key5
GEMINI_MODEL=gemini-3.8-flash

# Groq API (Provide 1 to 10 keys, separated by commas):
GROQ_API_KEY=your_groq_api_key_here
GROQ_KEYS=key1,key2,key3,key4,key5,key6,key7,key8,key9,key10
GROQ_MODEL=qwen/qwen3.8-27b
```

### Step 4.4: Run Automated Backend & Engine Tests
Ensure all forensic modules, vendor parsers, and endpoints are healthy:

```powershell
# 1. Test Backend (19/19 tests)
cd "s:\Omnisurv-SIH2026\omnisurv backened"
python -m pytest

# 2. Test Forensic Carving Engine (10/10 tests)
cd "s:\Omnisurv-SIH2026\Forensic Engine"
python -m pytest
```

Expected output:
```
============================= 19 passed in 2.14s ==============================
============================= 10 passed in 1.48s ==============================
```

---

## ⚛️ 5. Frontend Dashboard Setup

### Step 5.1: Install Node Dependencies
Open a new terminal window, navigate to `pixel-perfect-render-5182/`:

```bash
cd "s:\Omnisurv-SIH2026\pixel-perfect-render-5182"
npm install
```

### Step 5.2: Verify API Endpoint
The frontend communicates with the FastAPI backend at `http://localhost:8000`. This is configured in `src/lib/api.ts`:
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
```

### Step 5.3: Start Vite Development Server
```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

The workstation dashboard will be accessible at:
👉 **`http://127.0.0.1:5173`**

---

## 🚀 6. One-Click Launch Options

### Windows PowerShell Script
Launch both backend and frontend concurrently with a single command from the root directory:

```powershell
.\start_all.ps1
```

This script:
1. Verifies Python virtual environment and dependencies.
2. Starts Uvicorn ASGI server on `http://127.0.0.1:8000`.
3. Starts Vite dev server on `http://127.0.0.1:5173`.
4. Spawns interactive log outputs.

---

## 🔍 7. Verification Checklist

| Check | Command / URL | Expected Result |
|---|---|---|
| **Backend Health API** | `curl http://127.0.0.1:8000/health` | `{"status": "healthy", "service": "OmniSurv DVR/NVR Forensic Engine"}` |
| **Interactive API Docs** | Open `http://127.0.0.1:8000/docs` | Swagger UI with Evidence, Analysis, Reports, OEM endpoints |
| **Frontend Workstation** | Open `http://127.0.0.1:5173` | Pixel-perfect forensic dashboard with Cyber Synergists logo |
| **AI Key Rotator Status** | Upload sample video clip in `/findings` | Gemini Flash & Groq Qwen process video and extract timestamped events |
| **PDF Report Engine** | Generate report in `/reports` | Instant cryptographic PDF download with SHA-256 hash |

---

## ❓ 8. Troubleshooting & FAQ

### Q1: `ffmpeg: command not found` during carving
- **Cause**: FFmpeg binaries are not registered in the system environment `PATH`.
- **Fix**: Download FFmpeg from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) (Windows) or install via `apt install ffmpeg` (Linux). Restart your PowerShell/Terminal session and run `ffmpeg -version`.

### Q2: Gemini returns `429: Resource Exhausted`
- **Cause**: Free tier Google Gemini accounts have strict Requests Per Minute (RPM) limits.
- **Fix**: OmniSurv includes an automatic 5-key rotator (`GEMINI_KEYS` in `.env`). Provide up to 5 keys separated by commas. The system will rotate instantly to an un-throttled key upon receiving a 429 response.

### Q3: Groq returns `404: Model not found`
- **Cause**: Certain legacy LLaMA model IDs may be deprecated on your Groq project tier.
- **Fix**: OmniSurv defaults to `qwen/qwen3.8-27b`, which is active, ultra-fast, and highly accurate. You can also specify `openai/gpt-oss-120b` or `openai/gpt-oss-20b` via `GROQ_MODEL` in `.env`.

### Q4: PostgreSQL connection fails
- **Cause**: Local PostgreSQL service is not running or missing `pgvector` extension.
- **Fix**: OmniSurv features a **zero-dependency fallback**: if PostgreSQL is unavailable, it automatically initializes an embedded SQLite database (`omnisurv.db`) without requiring any database server installation!

---

*Crafted with precision for forensic integrity by **Cyber Synergists** (SIH2026).*
