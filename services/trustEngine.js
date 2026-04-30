const IAL_SCORES = {
  GOV_CERTIFIED: 40,
  MED_VERIFIED:  35,
  EDU_VERIFIED:  30,
  PROF_VERIFIED: 30,
  FIN_VERIFIED:  28,
  MYDATA_LIGHT:  15,
};

const trustEngine = {
  calculateCredibility(ssiResult, aiVerdict = '') {
    let score = 0;
    if (ssiResult.signatureValid) score += 30;
    if (ssiResult.didResolved)    score += 10;
    score += IAL_SCORES[ssiResult.ial] || 10;
    score += Math.min((ssiResult.docCount - 1) * 5, 10);

    // Calibrate with actual VaultSage AI verdict
    if (/\bAPPROVED\b/i.test(aiVerdict))          score = Math.min(score + 8, 100);
    else if (/\bCONDITIONAL\b/i.test(aiVerdict))  score = Math.max(score - 5, 0);
    else if (/\bINSUFFICIENT\b/i.test(aiVerdict)) score = Math.max(score - 15, 0);

    score = Math.min(score, 100);
    const level =
      score >= 90 ? 'EAL6+ Sovereign' :
      score >= 75 ? 'EAL4 Institutional' :
      score >= 60 ? 'EAL2 Verified' :
                    'Provisional';
    return { score, level, ial: ssiResult.ial };
  },

  evaluateAdvantage(goal, score) {
    const stars = score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : 2;
    const verdictMap = {
      5: `Exceptional profile. VaultSage AI predicts very high approval probability for ${goal}.`,
      4: 'Strong credential set. Minor supplemental documents may further strengthen the case.',
      3: 'Adequate credentials. Some requirements may need clarification with the target authority.',
      2: 'Conditional review recommended before submission.',
    };
    return { stars, analysis: verdictMap[stars] };
  },
};

module.exports = trustEngine;
