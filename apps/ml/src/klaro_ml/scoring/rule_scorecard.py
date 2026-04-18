"""Layer 1 — Rule-based scorecard.

Pure deterministic math computed directly from raw transaction lists.
Each sub-score returns a float in [0, 1]. All functions are defensive
against null fields and sparse data (OCR-extracted or scraped).

Defensive invariants for all transaction dicts:
  - transaction_date: ISO date string (always present)
  - amount: positive float (direction encoded in transaction_type)
  - transaction_type: "credit" | "debit"
  - category: str | None
  - counterparty: str | None
  - description: str | None
"""

from __future__ import annotations

import statistics
from datetime import date, datetime
from typing import Any

import numpy as np

RULE_WEIGHTS: dict[str, float] = {
    "income_stability": 0.25,
    "payment_regularity": 0.20,
    "debt_ratio": 0.20,
    "balance_trend": 0.15,
    "account_age": 0.10,
    "income_diversity": 0.10,
}

_UTILITY_KEYWORDS = (
    "steg", "sonede", "ooredoo", "tunisie telecom", "orange tunisie",
    "telecom", "eau", "electricite", "electricity", "gaz",
)

_DEBT_KEYWORDS = (
    "credit", "pret", "remboursement", "versement", "echéance",
    "echeance", "loan", "dette", "retraite credit",
)


def _clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def _parse_date(tx: dict[str, Any]) -> date:
    raw = tx.get("transaction_date", "")
    try:
        return date.fromisoformat(str(raw)[:10])
    except ValueError:
        return date.today()


def _month_key(d: date) -> str:
    return d.strftime("%Y-%m")


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


def score_income_stability(transactions: list[dict[str, Any]]) -> float:
    """CV-based income stability: low coefficient of variation → high score.

    Groups monthly credit totals, computes std/mean (CV). Returns 0.4 if
    fewer than 3 distinct months are available.
    """
    credits = [t for t in transactions if t.get("transaction_type") == "credit"]
    monthly: dict[str, float] = {}
    for t in credits:
        key = _month_key(_parse_date(t))
        monthly[key] = monthly.get(key, 0.0) + float(t.get("amount", 0))

    if len(monthly) < 3:
        return 0.4  # not enough history

    values = list(monthly.values())
    mean = statistics.mean(values)
    if mean == 0:
        return 0.4
    cv = statistics.stdev(values) / mean
    return _clamp(1.0 - cv)


def score_payment_regularity(transactions: list[dict[str, Any]]) -> float:
    """Utility payment on-time rate: payments on day ≤ 5 of month count as on-time.

    Filters for utility payments (STEG, Sonede, Ooredoo, Tunisie Telecom, Orange).
    Returns 0.5 if no utility payments found.
    """
    utility_txs = [
        t for t in transactions
        if t.get("transaction_type") == "debit" and _is_utility(t)
    ]
    if not utility_txs:
        return 0.5

    on_time = sum(1 for t in utility_txs if _parse_date(t).day <= 5)
    return _clamp(on_time / len(utility_txs))


def score_debt_ratio(transactions: list[dict[str, Any]]) -> float:
    """Monthly debt-to-income ratio scored against 3 tiers.

    < 30%  → 1.0
    30–45% → 0.6
    > 45%  → 0.2

    Returns 0.2 when no income transactions exist.
    """
    debits = [t for t in transactions if t.get("transaction_type") == "debit"]
    credits = [t for t in transactions if t.get("transaction_type") == "credit"]

    if not credits:
        return 0.2

    # Aggregate per month
    debt_monthly: dict[str, float] = {}
    income_monthly: dict[str, float] = {}

    for t in debits:
        if _is_debt(t):
            key = _month_key(_parse_date(t))
            debt_monthly[key] = debt_monthly.get(key, 0.0) + float(t.get("amount", 0))

    for t in credits:
        key = _month_key(_parse_date(t))
        income_monthly[key] = income_monthly.get(key, 0.0) + float(t.get("amount", 0))

    avg_debt = sum(debt_monthly.values()) / max(len(debt_monthly), 1)
    avg_income = sum(income_monthly.values()) / max(len(income_monthly), 1)

    if avg_income == 0:
        return 0.2
    ratio = avg_debt / avg_income
    if ratio < 0.30:
        return 1.0
    if ratio < 0.45:
        return 0.6
    return 0.2


def score_balance_trend(transactions: list[dict[str, Any]]) -> float:
    """Linear regression slope on monthly net balances.

    Positive slope (improving) → closer to 1.0; negative → closer to 0.2.
    Returns 0.5 if fewer than 2 months of data.
    """
    monthly_net: dict[str, float] = {}
    for t in transactions:
        key = _month_key(_parse_date(t))
        amount = float(t.get("amount", 0))
        if t.get("transaction_type") == "credit":
            monthly_net[key] = monthly_net.get(key, 0.0) + amount
        else:
            monthly_net[key] = monthly_net.get(key, 0.0) - amount

    if len(monthly_net) < 2:
        return 0.5

    sorted_months = sorted(monthly_net.keys())
    balances = [monthly_net[m] for m in sorted_months]

    # Running cumulative balance
    cumulative = []
    running = 0.0
    for b in balances:
        running += b
        cumulative.append(running)

    x = np.arange(len(cumulative), dtype=float)
    slope = float(np.polyfit(x, cumulative, 1)[0])
    mean_bal = abs(statistics.mean(cumulative)) or 1.0

    normalized = slope / mean_bal
    if normalized > 0.05:
        return 1.0
    if normalized > 0:
        return 0.7
    if normalized > -0.05:
        return 0.5
    return 0.2


def score_account_age(bank_connections: list[dict[str, Any]]) -> float:
    """Months since earliest bank connection, capped at 24 for maximum score.

    Returns 0.4 when no connections exist.
    """
    if not bank_connections:
        return 0.4

    today = date.today()
    earliest = today
    for conn in bank_connections:
        raw = conn.get("created_at", "")
        try:
            d = date.fromisoformat(str(raw)[:10])
            if d < earliest:
                earliest = d
        except ValueError:
            continue

    months = (today - earliest).days / 30.44
    return _clamp(months / 24.0)


def score_income_diversity(transactions: list[dict[str, Any]]) -> float:
    """Distinct income counterparties, normalized to 3 for maximum score.

    Falls back to description when counterparty is null.
    Returns 0.4 when no credit transactions exist.
    """
    credits = [t for t in transactions if t.get("transaction_type") == "credit"]
    if not credits:
        return 0.4

    sources = set()
    for t in credits:
        label = t.get("counterparty") or t.get("description") or ""
        if label.strip():
            sources.add(label.strip().lower())

    return _clamp(len(sources) / 3.0)


_RULE_FUNCS: dict[str, Any] = {
    "income_stability": lambda ud: score_income_stability(ud.get("transactions") or []),
    "payment_regularity": lambda ud: score_payment_regularity(ud.get("transactions") or []),
    "debt_ratio": lambda ud: score_debt_ratio(ud.get("transactions") or []),
    "balance_trend": lambda ud: score_balance_trend(ud.get("transactions") or []),
    "account_age": lambda ud: score_account_age(ud.get("bank_connections") or []),
    "income_diversity": lambda ud: score_income_diversity(ud.get("transactions") or []),
}


def compute_rule_score(user_data: dict[str, Any]) -> dict[str, Any]:
    """Aggregate all 6 rule sub-scores into a weighted total.

    Returns:
        sub_scores: dict of individual 0–1 scores per dimension
        weighted: float 0–1 weighted total
    """
    sub_scores = {key: fn(user_data) for key, fn in _RULE_FUNCS.items()}
    weighted = sum(sub_scores[k] * RULE_WEIGHTS[k] for k in sub_scores)
    return {"sub_scores": sub_scores, "weighted": weighted}
