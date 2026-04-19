"""Layer 2 — Unsupervised anomaly detection (PyOD IsolationForest).

Loads a pre-trained model from scoring/models/iforest.pkl when available.
The model is trained on real user data via train_iforest.py (run nightly in
production). Until enough real users exist, this layer returns a neutral
result so scoring stays functional without an anomaly penalty.

PyOD is in the optional `ml` extra. Falls back to neutral if unavailable.
"""

from __future__ import annotations

import math
import pathlib
import pickle
from datetime import date, timedelta
from typing import Any

ANOMALY_FEATURES: tuple[str, ...] = (
    "income_to_expense_ratio",
    "max_single_deposit",
    "tx_count_last_7_days",
    "unique_counterparties",
    "weekend_tx_ratio",
    "late_night_tx_ratio",
    "round_number_tx_ratio",
    "income_occupation_gap",
    "doc_balance_vs_scraped_balance_delta",
)

_MODEL_PATH = pathlib.Path(__file__).parent / "models" / "iforest.pkl"
_NEUTRAL: dict[str, Any] = {"anomaly_score": 0.5, "flagged": False, "top_signals": []}

# Cached model bundle: {"model", "feature_means", "feature_stds", "trained_on_n"}
_model_bundle: dict[str, Any] | None = None
_model_loaded = False  # sentinel so we only attempt load once


def _load_model() -> dict[str, Any] | None:
    global _model_bundle, _model_loaded
    if _model_loaded:
        return _model_bundle
    _model_loaded = True
    if not _MODEL_PATH.exists():
        return None
    try:
        with _MODEL_PATH.open("rb") as f:
            _model_bundle = pickle.load(f)  # noqa: S301 — internal model file
        return _model_bundle
    except Exception:
        return None


def _extract_anomaly_features(user_data: dict[str, Any]) -> dict[str, float]:
    """Compute the 9 anomaly feature values from raw user data.

    All computations are safe against missing/null fields that can occur
    with OCR-extracted or scraped transaction data.
    """
    txs: list[dict[str, Any]] = user_data.get("transactions") or []
    profile: dict[str, Any] = user_data.get("profile") or {}
    kyc_docs: list[dict[str, Any]] = user_data.get("kyc_documents") or []

    credits = [t for t in txs if t.get("transaction_type") == "credit"]
    debits = [t for t in txs if t.get("transaction_type") == "debit"]

    total_income = sum(float(t.get("amount", 0)) for t in credits)
    total_expense = sum(float(t.get("amount", 0)) for t in debits)

    # 1. income_to_expense_ratio
    income_to_expense = total_income / total_expense if total_expense > 0 else 1.0

    # 2. max_single_deposit
    max_deposit = max((float(t.get("amount", 0)) for t in credits), default=0.0)

    # 3. tx_count_last_7_days
    cutoff = date.today() - timedelta(days=7)
    recent_count = sum(
        1 for t in txs
        if _safe_date(t.get("transaction_date")) >= cutoff
    )

    # 4. unique_counterparties (credit transactions)
    counterparties = {
        (t.get("counterparty") or t.get("description") or "").strip().lower()
        for t in credits
        if (t.get("counterparty") or t.get("description") or "").strip()
    }
    unique_cp = float(len(counterparties))

    # 5. weekend_tx_ratio
    if txs:
        weekend_count = sum(1 for t in txs if _safe_date(t.get("transaction_date")).weekday() >= 5)
        weekend_ratio = weekend_count / len(txs)
    else:
        weekend_ratio = 0.0

    # 6. late_night_tx_ratio — use 0.0 when timestamps not available (date-only data)
    late_night_ratio = 0.0

    # 7. round_number_tx_ratio
    if txs:
        round_count = sum(1 for t in txs if float(t.get("amount", 0)) % 10 == 0)
        round_ratio = round_count / len(txs)
    else:
        round_ratio = 0.0

    # 8. income_occupation_gap — mismatch between declared occupation and actual income
    occupation = (profile.get("occupation_category") or "").lower()
    avg_monthly_income = total_income / max(_distinct_months(credits), 1)
    expected_income = _expected_income_by_occupation(occupation)
    if expected_income > 0:
        gap = abs(avg_monthly_income - expected_income) / expected_income
    else:
        gap = 0.0

    # 9. doc_balance_vs_scraped_balance_delta
    ocr_balance = _latest_ocr_balance(kyc_docs)
    scraped_balance = _latest_scraped_balance(txs)
    if ocr_balance is not None and scraped_balance is not None and scraped_balance != 0:
        delta = abs(ocr_balance - scraped_balance) / abs(scraped_balance)
    else:
        delta = 0.0

    return {
        "income_to_expense_ratio": income_to_expense,
        "max_single_deposit": max_deposit,
        "tx_count_last_7_days": float(recent_count),
        "unique_counterparties": unique_cp,
        "weekend_tx_ratio": weekend_ratio,
        "late_night_tx_ratio": late_night_ratio,
        "round_number_tx_ratio": round_ratio,
        "income_occupation_gap": gap,
        "doc_balance_vs_scraped_balance_delta": delta,
    }


def _top_signals(
    feature_vec: list[float], means: list[float], stds: list[float]
) -> list[str]:
    """Return up to 3 feature names with the highest absolute z-scores."""
    signals = []
    for i, (val, mu, sigma) in enumerate(zip(feature_vec, means, stds)):
        if sigma > 0:
            z = abs(val - mu) / sigma
        else:
            z = 0.0
        signals.append((z, ANOMALY_FEATURES[i]))
    signals.sort(reverse=True)
    return [name for _, name in signals[:3] if _ > 1.5]  # only report truly extreme signals


def detect_anomalies(user_data: dict[str, Any]) -> dict[str, Any]:
    """Run IsolationForest anomaly detection on user features.

    Returns neutral stub when model is unavailable (not enough real users yet).
    """
    bundle = _load_model()
    if bundle is None:
        return _NEUTRAL

    try:
        from pyod.models.iforest import IForest  # noqa: F401 — confirm PyOD available
    except ImportError:
        return _NEUTRAL

    try:
        features_dict = _extract_anomaly_features(user_data)
        feature_vec = [features_dict[f] for f in ANOMALY_FEATURES]

        model = bundle["model"]
        means: list[float] = bundle["feature_means"].tolist()
        stds: list[float] = bundle["feature_stds"].tolist()

        # decision_function: higher = more normal; predict: -1 = anomaly, 1 = normal
        raw_score = float(model.decision_function([feature_vec])[0])
        flagged = bool(model.predict([feature_vec])[0] == -1)

        # Normalise to 0–1 range using tanh
        anomaly_score = 0.5 - 0.5 * math.tanh(raw_score)

        top_signals = _top_signals(feature_vec, means, stds)

        return {
            "anomaly_score": round(anomaly_score, 4),
            "flagged": flagged,
            "top_signals": top_signals,
        }
    except Exception:
        return _NEUTRAL


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_date(raw: Any) -> date:
    try:
        return date.fromisoformat(str(raw)[:10])
    except (ValueError, TypeError):
        return date.today()


def _distinct_months(txs: list[dict[str, Any]]) -> int:
    return len({_safe_date(t.get("transaction_date")).strftime("%Y-%m") for t in txs})


def _expected_income_by_occupation(occupation: str) -> float:
    """Rough monthly income benchmarks in TND by occupation category."""
    benchmarks: dict[str, float] = {
        "salaried": 1800.0,
        "freelance": 2200.0,
        "business_owner": 3000.0,
        "student": 400.0,
        "unemployed": 0.0,
        "retired": 900.0,
    }
    return benchmarks.get(occupation, 0.0)


def _latest_ocr_balance(kyc_docs: list[dict[str, Any]]) -> float | None:
    """Extract declared balance from the most recent KYC document OCR data."""
    for doc in sorted(kyc_docs, key=lambda d: d.get("created_at", ""), reverse=True):
        ocr = doc.get("ocr_data") or {}
        balance_str = ocr.get("balance") or ocr.get("solde")
        if balance_str:
            try:
                return float(str(balance_str).replace(",", ".").replace(" ", ""))
            except ValueError:
                continue
    return None


def _latest_scraped_balance(txs: list[dict[str, Any]]) -> float | None:
    """Approximate current balance from running transaction totals."""
    if not txs:
        return None
    total = 0.0
    for t in txs:
        amt = float(t.get("amount", 0))
        if t.get("transaction_type") == "credit":
            total += amt
        else:
            total -= amt
    return total
