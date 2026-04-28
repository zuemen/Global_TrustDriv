// Determines Identity Assurance Level (IAL) from uploaded filenames.
// In production this would resolve actual DIDs against a registry.

const IAL_PATTERNS = [
  { ial: 'GOV_CERTIFIED',  tier: 4, re: /passport|national.?id|gov|moica|citizen/i },
  { ial: 'MED_VERIFIED',   tier: 3, re: /medical|health|clinical|hospital|nurse|doctor|pharm/i },
  { ial: 'EDU_VERIFIED',   tier: 2, re: /transcript|degree|diploma|certificate|academic|university|college|school/i },
  { ial: 'PROF_VERIFIED',  tier: 2, re: /employment|work|job|career|hr|salary|offer|experience|resume|cv/i },
  { ial: 'FIN_VERIFIED',   tier: 2, re: /bank|tax|finance|account|statement|kyc|fund/i },
];

const ssiService = {
  verify(filenames) {
    let bestTier = 0;
    let bestIal  = 'MYDATA_LIGHT';

    for (const name of filenames) {
      for (const { ial, tier, re } of IAL_PATTERNS) {
        if (re.test(name) && tier > bestTier) {
          bestTier = tier;
          bestIal  = ial;
        }
      }
    }

    return {
      signatureValid: filenames.length > 0,
      didResolved: true,
      ial: bestIal,
      ialTier: bestTier || 1,
      issuer: 'Global Trust Registry',
      docCount: filenames.length,
    };
  },
};

module.exports = ssiService;
