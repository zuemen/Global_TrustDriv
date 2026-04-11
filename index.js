const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const vaultService = require('./services/vaultsage');
const trustEngine = require('./services/trustEngine');
const ssiService = require('./services/ssi');

dotenv.config();

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/trust-notary', async (req, res) => {
    try {
        const { credential, targetCountry, goal } = req.body;
        if (!credential) return res.status(400).json({ success: false, error: 'Missing Credential' });

        console.log(`[LOG] Analyzing ${goal} for ${targetCountry}`);

        // 1. SSI 驗證
        const ssiResult = await ssiService.verify(credential);

        // 2. VaultSage 分析
        const analysis = await vaultService.process(credential, { targetCountry, goal });

        // 3. 信任分與有利度計算
        const trustInfo = trustEngine.calculateCredibility(ssiResult, 'TIER_1_GOV_EDU');
        const advantage = trustEngine.evaluateAdvantage(analysis, goal);

        res.json({
            success: true,
            trustInfo: { ...trustInfo, advantage },
            analysis: analysis
        });

    } catch (error) {
        console.error('[SERVER ERROR]', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`\n====================================================`);
    console.log(`🚀 Global TrustDrive 7.0 is LIVE`);
    console.log(`👉 http://localhost:${port}`);
    console.log(`====================================================\n`);
});
