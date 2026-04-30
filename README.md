# Global TrustDrive 7.0
### AI-Native Cross-Border Credential Notary · Powered by VaultSage

> Built for the **NURIE.AI Visionary AI 2026 Competition** `#vaultsage`

---

## The Problem

Over **100,000 Taiwanese and Korean** students, professionals, and digital nomads spend **40+ hours per application** gathering, verifying, and formatting credentials for overseas study, work visas, and healthcare licensing — without knowing what's missing until rejection.

## The Solution

Global TrustDrive is a **VaultSage-powered credential intelligence platform** that:

- Authenticates documents in **under 5 minutes** using AI
- Provides **jurisdiction-specific compliance analysis** for 9 countries
- Identifies **missing documents** with AI-guided remediation steps (Gap Advisor)
- Generates **shareable, tamper-evident credential reports** (SmartDrop™)
- Produces **printable Trust Passports** for official submission

---

## Stack

| Layer    | Technology |
|----------|-----------|
| Backend  | Python 3.11 · FastAPI · httpx (async) |
| Frontend | React 18 · Vite · Tailwind CSS |
| AI       | VaultSage API (upload, process, chat, share) |
| Storage  | JSON persistence (7-day TTL) |
| i18n     | English · 中文 · 한국어 |

---

## VaultSage API Usage

| Feature | Endpoint | Usage |
|---------|----------|-------|
| File Upload | `POST /files/` | Upload credential documents |
| Processing Status | `POST /files/processing-status` | Poll until AI processing completes |
| AI Analysis | `POST /chat/message/v2` | Jurisdiction-specific credential analysis |
| Gap Advisor | `POST /chat/message/v2` | Missing document identification |
| AI Chat | `POST /chat/message/v2` | Follow-up Q&A on credentials |
| Share | `POST /share/` | Create tamper-evident share links |

---

## Quick Start

### Backend (Python)
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env
# Edit .env → add VAULTSAGE_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev          # dev server at http://localhost:5173
# or
npm run build        # build → backend serves at http://localhost:8000
```

---

## Features

### AI Notary
Upload any credential document (PDF, JPEG, PNG, DOCX) and get a complete AI analysis in minutes, including compliance verdict (APPROVED / CONDITIONAL / INSUFFICIENT), strengths, and gaps.

### Gap Advisor
AI identifies every missing document for your specific goal + country combination, with official authority names, websites, and processing times.

### SmartDrop™ Viewer
Shareable credential report with:
- AI chat for Q&A about the documents
- QR code for instant verification
- 7-day secure link with expiry countdown

### Trust Passport
One-click printable credential certificate formatted for official submission.

### Multi-Language
Full UI in English, 中文 (Traditional Chinese), and 한국어 (Korean).

---

## Supported Jurisdictions & Goals

**Countries:** USA · Germany · Singapore · UK · Taiwan · South Korea · Japan · Canada · Australia

**Goals:** University Study · Employment · Healthcare License · Digital Nomad Visa · Talent Pass · Skilled Migration Visa · Exchange Program · Banking Setup

---

## Social Media

[![#vaultsage](https://img.shields.io/badge/%23vaultsage-VaultSage-38bdf8)](https://vaultsage.ai)

Built with ❤️ for NURIE.AI Visionary AI 2026
