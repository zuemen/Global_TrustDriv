import re

IAL_SCORES = {
    "GOV_CERTIFIED": 40,
    "MED_VERIFIED":  35,
    "EDU_VERIFIED":  30,
    "PROF_VERIFIED": 30,
    "FIN_VERIFIED":  28,
    "MYDATA_LIGHT":  15,
}

def calculate_credibility(ssi_result: dict, ai_verdict: str = "") -> dict:
    score = 0
    if ssi_result.get("signature_valid"):
        score += 30
    if ssi_result.get("did_resolved"):
        score += 10
    score += IAL_SCORES.get(ssi_result.get("ial", ""), 10)
    score += min((ssi_result.get("doc_count", 1) - 1) * 5, 10)

    # Calibrate with real VaultSage AI verdict
    if re.search(r"\bAPPROVED\b", ai_verdict, re.I):
        score = min(score + 8, 100)
    elif re.search(r"\bCONDITIONAL\b", ai_verdict, re.I):
        score = max(score - 5, 0)
    elif re.search(r"\bINSUFFICIENT\b", ai_verdict, re.I):
        score = max(score - 15, 0)

    score = min(score, 100)
    if score >= 90:
        level = "EAL6+ Sovereign"
    elif score >= 75:
        level = "EAL4 Institutional"
    elif score >= 60:
        level = "EAL2 Verified"
    else:
        level = "Provisional"

    return {"score": score, "level": level, "ial": ssi_result.get("ial", "MYDATA_LIGHT")}


def evaluate_advantage(goal: str, score: int) -> dict:
    stars = 5 if score >= 90 else 4 if score >= 75 else 3 if score >= 60 else 2
    verdicts = {
        5: f"Exceptional profile. VaultSage AI predicts very high approval probability for {goal}.",
        4: "Strong credential set. Minor supplemental documents may further strengthen the case.",
        3: "Adequate credentials. Some requirements may need clarification with the target authority.",
        2: "Conditional review recommended before submission.",
    }
    return {"stars": stars, "analysis": verdicts[stars]}
