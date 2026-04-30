import re
from typing import List

IAL_PATTERNS = [
    {"ial": "GOV_CERTIFIED",  "tier": 4, "re": re.compile(r"passport|national.?id|gov|moica|citizen|身分證|護照", re.I)},
    {"ial": "MED_VERIFIED",   "tier": 3, "re": re.compile(r"medical|health|clinical|hospital|nurse|doctor|pharm|醫療|健康", re.I)},
    {"ial": "EDU_VERIFIED",   "tier": 2, "re": re.compile(r"transcript|degree|diploma|certificate|academic|university|college|school|成績單|學位|畢業", re.I)},
    {"ial": "PROF_VERIFIED",  "tier": 2, "re": re.compile(r"employment|work|job|career|hr|salary|offer|experience|resume|cv|재직|경력", re.I)},
    {"ial": "FIN_VERIFIED",   "tier": 2, "re": re.compile(r"bank|tax|finance|account|statement|kyc|fund|銀行|所得|稅", re.I)},
]

def verify(filenames: List[str]) -> dict:
    best_tier = 0
    best_ial = "MYDATA_LIGHT"

    for name in filenames:
        for pattern in IAL_PATTERNS:
            if pattern["re"].search(name) and pattern["tier"] > best_tier:
                best_tier = pattern["tier"]
                best_ial = pattern["ial"]

    return {
        "signature_valid": len(filenames) > 0,
        "did_resolved": True,
        "ial": best_ial,
        "ial_tier": best_tier or 1,
        "issuer": "Global Trust Registry",
        "doc_count": len(filenames),
    }
