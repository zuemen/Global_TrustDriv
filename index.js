const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const multer     = require('multer');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const vaultService  = require('./services/vaultsage');
const trustEngine   = require('./services/trustEngine');
const ssiService    = require('./services/ssi');
const store         = require('./services/db');

dotenv.config();

const app  = express();
const port = process.env.PORT || 4000;
const VAULT_KEY = process.env.VAULTSAGE_API_KEY;

app.set('trust proxy', 1);

if (!VAULT_KEY) {
  console.warn('[WARN] VAULTSAGE_API_KEY is not set. VaultSage API routes may fail.');
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Explicitly serve index.html for the root route to prevent 404s
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please wait.' },
});
app.use('/api/', limiter);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
});

// ── Routes ───────────────────────────────────────────────────────────────────

// Main notary endpoint — accepts multipart/form-data
app.post('/api/trust-notary', upload.array('documents', 10), async (req, res) => {
  try {
    const files = req.files;
    const { targetCountry, goal } = req.body;

    if (!VAULT_KEY) {
      return res.status(500).json({ success: false, error: 'Missing VAULTSAGE_API_KEY on server.' });
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No documents uploaded.' });
    }
    if (!targetCountry || !goal) {
      return res.status(400).json({ success: false, error: 'Missing targetCountry or goal.' });
    }

    console.log(`\n[NOTARY] ${goal} / ${targetCountry} — ${files.length} file(s): ${files.map(f => f.originalname).join(', ')}`);

    // 1. VaultSage: upload → process → AI analyse → share
    const analysis = await vaultService.process(VAULT_KEY, files, { targetCountry, goal });

    // 2. SSI: determine IAL from filenames
    const ssiResult = ssiService.verify(files.map(f => f.originalname));

    // 3. Trust score — calibrated with real VaultSage AI verdict
    const trustInfo = trustEngine.calculateCredibility(ssiResult, analysis.advantage_analysis);
    const advantage = trustEngine.evaluateAdvantage(goal, trustInfo.score);

    // 4. Build share URLs
    const host = req.headers.host || `localhost:${port}`;
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const localShareLink = `${proto}://${host}/share/${analysis.docId}`;

    // 5. Persist for SmartDrop (survives restarts via db.js)
    store.set(analysis.docId, {
      analysis,
      trustInfo,
      targetCountry,
      goal,
      vaultChatId: analysis.vaultChatId,
      createdAt: Date.now(),
    });

    // 5. Build response with snake_case for frontend
    const responseAnalysis = {
      ...analysis,
      doc_id: analysis.docId,
    };

    res.json({
      success: true,
      trust_info: { ...trustInfo, advantage },
      analysis: responseAnalysis,
      share_link: localShareLink,
      vault_share_link: analysis.vaultShareUrl,
    });

  } catch (err) {
    console.error('[NOTARY ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// SmartDrop viewer
app.get('/share/:docId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'share.html'));
});

app.get('/api/share-data/:docId', (req, res) => {
  const doc = store.get(req.params.docId);
  if (!doc) return res.status(404).json({ success: false, error: 'Document not found or expired.' });
  
  // Return with snake_case for frontend compatibility
  res.json({ 
    success: true, 
    data: {
      analysis: doc.analysis,
      trust_info: doc.trustInfo,
      target_country: doc.targetCountry,
      goal: doc.goal,
      created_at: Math.floor(doc.createdAt / 1000), // matching SharePage's expected seconds
    }
  });
});

// Gap Advisor — AI-powered missing document analysis
app.post('/api/gap-advisor', async (req, res) => {
  try {
    if (!VAULT_KEY) {
      return res.status(500).json({ success: false, error: 'Missing VAULTSAGE_API_KEY on server.' });
    }

    const { docId, doc_id } = req.body;
    const targetId = docId || doc_id;
    if (!targetId) return res.status(400).json({ success: false, error: 'Missing docId.' });

    const doc = store.get(targetId);
    if (!doc) return res.status(404).json({ success: false, error: 'Session not found or expired.' });

    const fileIds = doc.analysis?.vaultFileIds;
    if (!fileIds || fileIds.length === 0)
      return res.status(400).json({ success: false, error: 'No VaultSage file IDs in session.' });

    console.log(`[GAP ADVISOR] ${doc.goal} / ${doc.targetCountry}`);
    const { content } = await vaultService.analyzeGaps(VAULT_KEY, fileIds, doc.goal, doc.targetCountry);
    res.json({ success: true, gaps: content });
  } catch (err) {
    console.error('[GAP ADVISOR ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Real AI chat via VaultSage
app.post('/api/chat', async (req, res) => {
  try {
    if (!VAULT_KEY) {
      return res.status(500).json({ success: false, error: 'Missing VAULTSAGE_API_KEY on server.' });
    }

    const { docId, doc_id, message } = req.body;
    const targetId = docId || doc_id;
    if (!message) return res.status(400).json({ success: false, error: 'Missing message.' });

    const doc = store.get(targetId);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found or expired.' });
    if (!doc.vaultChatId) return res.status(400).json({ success: false, error: 'No active VaultSage chat session.' });

    const response = await vaultService.chatFollowUp(VAULT_KEY, doc.vaultChatId, message);
    res.json({ success: true, response });

  } catch (err) {
    console.error('[CHAT ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Start / Export ───────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log('\n====================================================');
    console.log('  Global TrustDrive 7.0 + VaultSage AI — LIVE');
    console.log(`  Local:   http://localhost:${port}`);
    console.log(`  Network: http://0.0.0.0:${port}`);
    console.log('====================================================\n');
  });
}

module.exports = app;
