const { kv } = require('@vercel/kv');

/**
 * Global TrustDrive 7.0 Persistence Layer
 * Using Vercel KV (Redis) to survive cold starts.
 * docId serves as the key.
 */

const DOC_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

const store = {
  async set(docId, doc) {
    try {
      const data = { ...doc, createdAt: doc.createdAt || Date.now() };
      await kv.set(docId, data, { ex: DOC_TTL_SECONDS });
      console.log(`[DB] Saved ${docId}`);
    } catch (e) {
      console.error(`[DB] Error setting ${docId}:`, e.message);
    }
  },

  async get(docId) {
    try {
      const doc = await kv.get(docId);
      if (!doc) return null;
      return doc;
    } catch (e) {
      console.error(`[DB] Error getting ${docId}:`, e.message);
      return null;
    }
  },

  async delete(docId) {
    try {
      await kv.del(docId);
    } catch (e) {
      console.error(`[DB] Error deleting ${docId}:`, e.message);
    }
  }
};

module.exports = store;
