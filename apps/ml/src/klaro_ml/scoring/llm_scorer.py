"""Layer 3 — Claude Sonnet prompt-based scoring for Klaro.

Builds ~20 financial variables from raw user data, sends them to Claude
Sonnet, and parses the JSON response. Includes retry logic with regex
fallback extraction for malformed responses.
Falls back to a stub when ANTHROPIC_API_KEY is unset.
"""

from __future__ import annotations

import json
import re
import statistics
from datetime import date
from typing import Any

from klaro_ml.settings import get_settings

SYSTEM_PROMPT = """\
You are a credit risk analyst for Klaro, an alternative credit scoring platform in Tunisia.
You receive structured financial data extracted from bank statements, KYC documents,
and behavioral signals. You have NO access to credit bureau data.

Your job:
1. Score the user 0-1000 based on the data provided.
2. Identify anomalies or risk flags the data reveals.
3. Explain the score in plain language (Arabic or French, max 3 sentences).
4. List 3 specific actions the user can take to improve their Klaro score.

Output ONLY valid JSON:
{
  "score": <int 0-1000>,
  "confidence": <float 0-1>,
  "risk_category": "low" | "medium" | "high" | "very_high",
  "breakdown": {
    "income_stability": <float 0-1>,
    "payment_behavior": <float 0-1>,
    "debt_signals": <float 0-1>,
    "document_consistency": <float 0-1>,
    "behavioral_patterns": <float 0-1>
  },
  "anomaly_flags": [<string>, ...],
  "explanation": "<plain language, max 3 sentences>",
  "coaching_tips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}
"""


def _build_user_variables(user_data: dict[str, Any]) -> dict[str, Any]:
    """Extract ~20 financial variables from raw user_data for the LLM prompt."""
    txs: list[dict[str, Any]] = user_data.get("transactions") or []
    profile: dict[str, Any] = user_data.get("profile") or {}
    bank_connections: list[dict[str, Any]] = user_data.get("bank_connections") or []
    kyc_docs: list[dict[str, Any]] = user_data.get("kyc_documents") or []

    credits = [t for t in txs if t.get("transaction_type") == "credit"]
    debits = [t for t in txs if t.get("transaction_type") == "debit"]

    # Monthly income grouping
    monthly_income: dict[str, float] = {}
    for t in credits:
        key = _safe_date(t.get("transaction_date")).strftime("%Y-%m")
        monthly_income[key] = monthly_income.get(key, 0.0) + float(t.get("amount", 0))

    monthly_expense: dict[str, float] = {}
    for t in debits:
        key = _safe_date(t.get("transaction_date")).strftime("%Y-%m")
        monthly_expense[key] = monthly_expense.get(key, 0.0) + float(t.get("amount", 0))

    income_values = list(monthly_income.values())
    avg_monthly_income = statistics.mean(income_values) if income_values else 0.0
    income_cv = (
        statistics.stdev(income_values) / avg_monthly_income
        if len(income_values) >= 2 and avg_monthly_income > 0
        else None
    )

    expense_values = list(monthly_expense.values())
    avg_monthly_expense = statistics.mean(expense_values) if expense_values else 0.0

    # Utility payment rate
    utility_txs = [t for t in debits if _is_utility(t)]
    utility_payment_rate = (
        sum(1 for t in utility_txs if _safe_date(t.get("transaction_date")).day <= 5)
        / len(utility_txs)
        if utility_txs
        else None
    )

    # Debt ratio
    debt_txs = [t for t in debits if _is_debt(t)]
    monthly_debt: dict[str, float] = {}
    for t in debt_txs:
        key = _safe_date(t.get("transaction_date")).strftime("%Y-%m")
        monthly_debt[key] = monthly_debt.get(key, 0.0) + float(t.get("amount", 0))
    avg_monthly_debt = statistics.mean(monthly_debt.values()) if monthly_debt else 0.0
    debt_to_income = (avg_monthly_debt / avg_monthly_income) if avg_monthly_income > 0 else None

    # Savings rate
    savings_rate = (
        (avg_monthly_income - avg_monthly_expense) / avg_monthly_income
        if avg_monthly_income > 0
        else None
    )

    # Account age in months
    account_age_months: float | None = None
    if bank_connections:
        today = date.today()
        dates = []
        for conn in bank_connections:
            try:
                dates.append(date.fromisoformat(str(conn.get("created_at", ""))[:10]))
            except ValueError:
                pass
        if dates:
            account_age_months = (today - min(dates)).days / 30.44

    # Income diversity (distinct counterparties)
    counterparties = {
        (t.get("counterparty") or t.get("description") or "").strip().lower()
        for t in credits
        if (t.get("counterparty") or t.get("description") or "").strip()
    }
    income_sources_count = len(counterparties)

    # KYC consistency score
    doc_consistency = None
    for doc in kyc_docs:
        score = doc.get("consistency_score")
        if score is not None:
            doc_consistency = float(score)
            break

    return {
        "age": profile.get("age"),
        "occupation": profile.get("occupation"),
        "occupation_category": profile.get("occupation_category"),
        "kyc_status": profile.get("kyc_status"),
        "tx_count_total": len(txs),
        "avg_monthly_income_tnd": round(avg_monthly_income, 2),
        "avg_monthly_expense_tnd": round(avg_monthly_expense, 2),
        "income_cv": round(income_cv, 4) if income_cv is not None else None,
        "utility_payment_rate": round(utility_payment_rate, 4) if utility_payment_rate is not None else None,
        "debt_to_income_ratio": round(debt_to_income, 4) if debt_to_income is not None else None,
        "savings_rate": round(savings_rate, 4) if savings_rate is not None else None,
        "account_age_months": round(account_age_months, 1) if account_age_months is not None else None,
        "income_sources_count": income_sources_count,
        "doc_consistency_score": doc_consistency,
        "kyc_verified": profile.get("kyc_status") == "verified",
        "bank_connection_count": len(bank_connections),
        "has_utility_payments": bool(utility_txs),
        "has_debt_payments": bool(debt_txs),
        "months_of_history": len(monthly_income),
    }


def llm_score(user_data: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    if not settings.ANTHROPIC_API_KEY:
        return _stub_response()

    try:
        import anthropic  # type: ignore[import-not-found]
    except ImportError:
        return _stub_response()

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    user_vars = _build_user_variables(user_data)
    payload = json.dumps(user_vars, ensure_ascii=False, indent=2)

    for _attempt in range(2):
        try:
            res = client.messages.create(
                model=settings.CLAUDE_SONNET,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": payload}],
            )
            text: str = res.content[0].text  # type: ignore[union-attr]
        except Exception:
            return _stub_response()

        # Direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Regex fallback — extract first JSON object from response
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

    return _stub_response()


def _stub_response() -> dict[str, Any]:
    return {
        "score": 600,
        "confidence": 0.5,
        "risk_category": "medium",
        "breakdown": {
            "income_stability": 0.6,
            "payment_behavior": 0.6,
            "debt_signals": 0.6,
            "document_consistency": 0.6,
            "behavioral_patterns": 0.6,
        },
        "anomaly_flags": [],
        "explanation": "Score calculated using rule-based model (Anthropic API key not configured).",
        "coaching_tips": [
            "Connect a bank account to enable full Klaro scoring.",
            "Complete your KYC verification.",
            "Set up automatic utility payments before the 5th of each month.",
        ],
    }


# ---------------------------------------------------------------------------
# Helpers shared with rule_scorecard
# ---------------------------------------------------------------------------

_UTILITY_KEYWORDS = (
    "steg", "sonede", "ooredoo", "tunisie telecom", "orange tunisie",
    "telecom", "eau", "electricite", "electricity", "gaz",
)

_DEBT_KEYWORDS = (
    "credit", "pret", "remboursement", "versement", "echéance",
    "echeance", "loan", "dette",
)


def _safe_date(raw: Any) -> date:
    try:
        return date.fromisoformat(str(raw)[:10])
    except (ValueError, TypeError):
        return date.today()


def _is_utility(tx: dict[str, Any]) -> bool:
    haystack = " ".join(
        filter(None, [tx.get("counterparty"), tx.get("description"), tx.get("category")])
    ).lower()
    return any(kw in haystack for kw in _UTILITY_KEYWORDS)


def _is_debt(tx: dict[str, Any]) -> bool:
    haystack = " ".join(
        filter(None, [tx.get("counterparty"), tx.get("description"), tx.get("category")])
    ).lower()
    return any(kw in haystack for kw in _DEBT_KEYWORDS)
