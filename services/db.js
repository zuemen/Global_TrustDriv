const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'docs.json');
const DOC_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let _store = {};

function _load() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    _store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch {
    _store = {};
  }
}

function _save() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(_store, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] Write error:', e.message);
  }
}

_load();

const store = {
  set(docId, doc) {
    _store[docId] = { ...doc, createdAt: doc.createdAt || Date.now() };
    _save();
  },

  get(docId) {
    const doc = _store[docId];
    if (!doc) return null;
    if (Date.now() - doc.createdAt > DOC_TTL_MS) {
      delete _store[docId];
      _save();
      return null;
    }
    return doc;
  },

  delete(docId) {
    delete _store[docId];
    _save();
  },

  cleanup() {
    const cutoff = Date.now() - DOC_TTL_MS;
    let changed = false;
    for (const [id, doc] of Object.entries(_store)) {
      if (doc.createdAt < cutoff) {
        delete _store[id];
        changed = true;
      }
    }
    if (changed) _save();
  },
};

setInterval(() => store.cleanup(), 10 * 60 * 1000);

module.exports = store;
