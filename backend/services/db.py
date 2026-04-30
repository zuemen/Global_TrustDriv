import json
import os
import time
import threading
from typing import Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
STORE_FILE = os.path.join(DATA_DIR, "docs.json")
DOC_TTL_SEC = 7 * 24 * 60 * 60  # 7 days

_lock = threading.Lock()
_store: dict = {}


def _load():
    global _store
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(STORE_FILE, "r", encoding="utf-8") as f:
            _store = json.load(f)
    except Exception:
        _store = {}


def _save():
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(_store, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[DB] Write error: {e}")


_load()


def set_doc(doc_id: str, doc: dict):
    with _lock:
        _store[doc_id] = {**doc, "created_at": doc.get("created_at", time.time())}
        _save()


def get_doc(doc_id: str) -> Optional[dict]:
    with _lock:
        doc = _store.get(doc_id)
        if not doc:
            return None
        if time.time() - doc.get("created_at", 0) > DOC_TTL_SEC:
            del _store[doc_id]
            _save()
            return None
        return doc


def cleanup():
    with _lock:
        cutoff = time.time() - DOC_TTL_SEC
        stale = [k for k, v in _store.items() if v.get("created_at", 0) < cutoff]
        if stale:
            for k in stale:
                del _store[k]
            _save()
