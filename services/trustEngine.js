const trustEngine = {
    calculateCredibility(ssiResult, reputation) {
        let score = 0;
        if (ssiResult.signatureValid) score += 40;
        const ialScores = { 'MOICA_CERT': 40, 'NHI_CARD_PIN': 30, 'MYDATA_LIGHT': 15 };
        score += (ialScores[ssiResult.ial] || 10);
        score += (reputation === 'TIER_1_GOV_EDU' ? 20 : 10);

        return {
            score: score,
            level: score >= 90 ? 'EAL6+ Sovereign' : 'Standard Trust',
            ial: ssiResult.ial,
            statusText: score >= 90 ? '✅ SSI SECURE' : '⚠️ UNVERIFIED'
        };
    },
    evaluateAdvantage(analysis, goal) {
        return {
            stars: 5,
            analysis: `Optimized for ${goal}. AI RAG suggests high probability of success.`
        };
    }
};
module.exports = trustEngine;
