const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const vaultService = require('./services/vaultsage');
const trustEngine = require('./services/trustEngine');
const ssiService = require('./services/ssi');
const path = require('path');

dotenv.config();

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory store for shared documents
const sharedDocs = new Map();

app.post('/api/trust-notary', async (req, res) => {
    try {
        const { credentials, targetCountry, goal } = req.body;
        // Accept single or multiple credentials for Cross-Document Query
        let creds = Array.isArray(credentials) ? credentials : [req.body.credential].filter(Boolean);
        
        if (!creds || creds.length === 0) return res.status(400).json({ success: false, error: 'Missing Credential(s)' });

        console.log(`[LOG] Analyzing ${goal} for ${targetCountry} with ${creds.length} documents`);

        // 1. SSI 驗證 (verify all)
        let ssiResult = null;
        for (const cred of creds) {
            ssiResult = await ssiService.verify(cred); // Just keeping the last one for simplicity in demo
        }

        // 2. VaultSage 分析 (Cross-Document Query + PII Redaction)
        const analysis = await vaultService.process(creds, { targetCountry, goal });

        // 3. 信任分與有利度計算
        const trustInfo = trustEngine.calculateCredibility(ssiResult, 'TIER_1_GOV_EDU');
        const advantage = trustEngine.evaluateAdvantage(analysis, goal);

        // Store for SmartDrop
        sharedDocs.set(analysis.docId, { analysis, trustInfo, targetCountry, goal });

        res.json({
            success: true,
            trustInfo: { ...trustInfo, advantage },
            analysis: analysis,
            shareLink: `http://localhost:${port}/share/${analysis.docId}`
        });

    } catch (error) {
        console.error('[SERVER ERROR]', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// SmartDrop Feature
app.get('/share/:docId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'share.html'));
});

app.get('/api/share-data/:docId', (req, res) => {
    const doc = sharedDocs.get(req.params.docId);
    if (doc) {
        res.json({ success: true, data: doc });
    } else {
        res.status(404).json({ success: false, error: 'Document not found' });
    }
});

// Chat with Credential Feature
app.post('/api/chat', (req, res) => {
    const { docId, message } = req.body;
    const doc = sharedDocs.get(docId);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

    // Mock AI Chat Response
    const response = `Based on the document (Goal: ${doc.goal}, Target: ${doc.targetCountry}), here is the answer to your question "${message}": The credential has been verified and aligns with the required standards.`;
    res.json({ success: true, response });
});

app.listen(port, () => {
    console.log(`\n====================================================`);
    console.log(`🚀 Global TrustDrive 7.0 is LIVE`);
    console.log(`👉 http://localhost:${port}`);
    console.log(`====================================================\n`);
});
