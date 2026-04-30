import os
import time
from typing import List

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from services import db, ssi, trust_engine, vaultsage

load_dotenv()

VAULT_KEY = os.getenv("VAULTSAGE_API_KEY", "")
if not VAULT_KEY:
    raise RuntimeError("[FATAL] VAULTSAGE_API_KEY is not set in .env")

app = FastAPI(title="Global TrustDrive API", version="7.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────

class GapAdvisorRequest(BaseModel):
    doc_id: str

class ChatRequest(BaseModel):
    doc_id: str
    message: str

# ── API Routes ────────────────────────────────────────────────────────────────

@app.post("/api/trust-notary")
async def trust_notary(
    request: Request,
    documents: List[UploadFile] = File(...),
    targetCountry: str = Form(...),
    goal: str = Form(...),
):
    if not documents:
        raise HTTPException(400, "No documents uploaded.")

    files = []
    for doc in documents:
        content = await doc.read()
        files.append({
            "content":   content,
            "filename":  doc.filename,
            "mime_type": doc.content_type or "application/octet-stream",
        })

    print(f"\n[NOTARY] {goal} / {targetCountry} — {len(files)} file(s): {[f['filename'] for f in files]}")

    analysis   = await vaultsage.process_documents(VAULT_KEY, files, targetCountry, goal)
    ssi_result = ssi.verify([f["filename"] for f in files])
    trust_info = trust_engine.calculate_credibility(ssi_result, analysis["advantage_analysis"])
    advantage  = trust_engine.evaluate_advantage(goal, trust_info["score"])

    proto = "https" if request.url.scheme == "https" else "http"
    host  = request.headers.get("host", f"localhost:{request.url.port or 8000}")
    local_share_link = f"{proto}://{host}/share/{analysis['doc_id']}"

    db.set_doc(analysis["doc_id"], {
        "analysis":       analysis,
        "trust_info":     trust_info,
        "target_country": targetCountry,
        "goal":           goal,
        "vault_chat_id":  analysis["vault_chat_id"],
        "created_at":     time.time(),
    })

    return {
        "success":         True,
        "trust_info":      {**trust_info, "advantage": advantage},
        "analysis":        analysis,
        "share_link":      local_share_link,
        "vault_share_link": analysis["vault_share_url"],
    }


@app.get("/api/share-data/{doc_id}")
async def get_share_data(doc_id: str):
    doc = db.get_doc(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found or expired.")
    return {"success": True, "data": doc}


@app.post("/api/gap-advisor")
async def gap_advisor(body: GapAdvisorRequest):
    doc = db.get_doc(body.doc_id)
    if not doc:
        raise HTTPException(404, "Session not found or expired.")

    file_ids = doc["analysis"].get("vault_file_ids", [])
    if not file_ids:
        raise HTTPException(400, "No VaultSage file IDs in session.")

    print(f"[GAP ADVISOR] {doc['goal']} / {doc['target_country']}")
    gaps = await vaultsage.analyze_gaps(VAULT_KEY, file_ids, doc["goal"], doc["target_country"])
    return {"success": True, "gaps": gaps}


@app.post("/api/chat")
async def ai_chat(body: ChatRequest):
    if not body.message:
        raise HTTPException(400, "Missing message.")

    doc = db.get_doc(body.doc_id)
    if not doc:
        raise HTTPException(404, "Document not found or expired.")
    if not doc.get("vault_chat_id"):
        raise HTTPException(400, "No active VaultSage chat session.")

    response = await vaultsage.chat_follow_up(VAULT_KEY, doc["vault_chat_id"], body.message)
    return {"success": True, "response": response}


# ── Serve React build in production ──────────────────────────────────────────

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    @app.get("/share/{doc_id}", include_in_schema=False)
    async def serve_frontend(doc_id: str = ""):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
