const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const multer     = require('multer');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const vaultService  = require('./services/vaultsage');
const trustEngine   = require('./services/trustEngine');
const ssiService    = require('./services/ssi');

dotenv.config();

const app  = express();
const port = process.env.PORT || 4000;
const VAULT_KEY = process.env.VAULTSAGE_API_KEY;

if (!VAULT_KEY) {
  console.error('[FATAL] VAULTSAGE_API_KEY is not set in .env');
  process.exit(1);
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please wait.' },
});
app.use('/api/', limiter);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
});

// ── In-memory document store with TTL ───────────────────────────────────────
const sharedDocs = new Map();
const DOC_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

setInterval(() => {
  const now = Date.now();
  for (const [id, doc] of sharedDocs) {
    if (now - doc.createdAt > DOC_TTL_MS) sharedDocs.delete(id);
  }
}, 10 * 60 * 1000);

// ── Routes ───────────────────────────────────────────────────────────────────

// Main notary endpoint — accepts multipart/form-data
app.post('/api/trust-notary', upload.array('documents', 10), async (req, res) => {
  try {
    const files = req.files;
    const { targetCountry, goal } = req.body;

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

    // 3. Trust score
    const trustInfo = trustEngine.calculateCredibility(ssiResult);
    const advantage = trustEngine.evaluateAdvantage(goal, trustInfo.score);

    // 4. Build share URLs
    const host = req.headers.host || `localhost:${port}`;
    const proto = req.secure ? 'https' : 'http';
    const localShareLink = `${proto}://${host}/share/${analysis.docId}`;

    // 5. Persist for SmartDrop
    sharedDocs.set(analysis.docId, {
      analysis,
      trustInfo,
      targetCountry,
      goal,
      vaultChatId: analysis.vaultChatId,
      createdAt: Date.now(),
    });

    res.json({
      success: true,
      trustInfo: { ...trustInfo, advantage },
      analysis,
      shareLink: localShareLink,
      vaultShareLink: analysis.vaultShareUrl,
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
  const doc = sharedDocs.get(req.params.docId);
  if (!doc) return res.status(404).json({ success: false, error: 'Document not found or expired.' });
  res.json({ success: true, data: doc });
});

// Real AI chat via VaultSage
app.post('/api/chat', async (req, res) => {
  try {
    const { docId, message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Missing message.' });

    const doc = sharedDocs.get(docId);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found or expired.' });
    if (!doc.vaultChatId) return res.status(400).json({ success: false, error: 'No active VaultSage chat session.' });

    const response = await vaultService.chatFollowUp(VAULT_KEY, doc.vaultChatId, message);
    res.json({ success: true, response });

  } catch (err) {
    console.error('[CHAT ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log('\n====================================================');
  console.log('  Global TrustDrive 7.0 + VaultSage AI — LIVE');
  console.log(`  http://localhost:${port}`);
  console.log('====================================================\n');
});
