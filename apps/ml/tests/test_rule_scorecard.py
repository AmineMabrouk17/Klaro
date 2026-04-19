"""Unit tests for the Layer 1 rule scorecard functions."""

from __future__ import annotations

from datetime import date, timedelta

import pytest

from klaro_ml.scoring.rule_scorecard import (
    compute_rule_score,
    score_account_age,
    score_balance_trend,
    score_debt_ratio,
    score_income_diversity,
    score_income_stability,
    score_payment_regularity,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _tx(
    days_ago: int,
    amount: float,
    tx_type: str = "credit",
    counterparty: str | None = None,
    description: str | None = None,
    category: str | None = None,
) -> dict:
    return {
        "transaction_date": (date.today() - timedelta(days=days_ago)).isoformat(),
        "amount": amount,
        "transaction_type": tx_type,
        "counterparty": counterparty,
        "description": description,
        "category": category,
    }


def _conn(months_ago: int) -> dict:
    return {
        "created_at": (date.today() - timedelta(days=int(months_ago * 30.44))).isoformat(),
    }


# ---------------------------------------------------------------------------
# score_income_stability
# ---------------------------------------------------------------------------

class TestIncomeStability:
    def test_empty_returns_default(self):
        assert score_income_stability([]) == 0.4

    def test_single_month_returns_default(self):
        txs = [_tx(5, 1500), _tx(3, 500)]
        assert score_income_stability(txs) == 0.4

    def test_two_months_returns_default(self):
        txs = [_tx(40, 1500), _tx(10, 1500)]
        assert score_income_stability(txs) == 0.4

    def test_perfectly_stable_income(self):
        # Exactly the same amount every month for 3 months → CV=0 → score=1.0
        txs = [
            _tx(70, 2000),
            _tx(40, 2000),
            _tx(10, 2000),
        ]
        result = score_income_stability(txs)
        assert result == 1.0

    def test_volatile_income_lower_score(self):
        txs = [
            _tx(70, 500),
            _tx(40, 5000),
            _tx(10, 100),
        ]
        result = score_income_stability(txs)
        assert result < 0.5

    def test_ignores_debits(self):
        txs = [
            _tx(70, 2000, "credit"),
            _tx(40, 2000, "credit"),
            _tx(10, 2000, "credit"),
            _tx(5, 999, "debit"),  # should not affect credit CV
        ]
        assert score_income_stability(txs) == 1.0


# ---------------------------------------------------------------------------
# score_payment_regularity
# ---------------------------------------------------------------------------

class TestPaymentRegularity:
    def test_no_utility_payments_returns_default(self):
        txs = [_tx(10, 500, "debit", description="restaurant")]
        assert score_payment_regularity(txs) == 0.5

    def test_all_on_time(self):
        # Day 3 of current month = on time (day <= 5)
        today = date.today()
        on_time_date = today.replace(day=3).isoformat()
        txs = [
            {"transaction_date": on_time_date, "amount": 80, "transaction_type": "debit",
             "description": "STEG", "counterparty": None, "category": None},
        ]
        result = score_payment_regularity(txs)
        assert result == 1.0

    def test_all_late(self):
        today = date.today()
        late_date = today.replace(day=20).isoformat()
        txs = [
            {"transaction_date": late_date, "amount": 80, "transaction_type": "debit",
             "description": "Sonede", "counterparty": None, "category": None},
        ]
        assert score_payment_regularity(txs) == 0.0

    def test_mixed_on_time_rate(self):
        today = date.today()
        on_time = today.replace(day=2).isoformat()
        late = today.replace(day=18).isoformat()
        txs = [
            {"transaction_date": on_time, "amount": 80, "transaction_type": "debit",
             "description": "STEG", "counterparty": None, "category": None},
            {"transaction_date": late, "amount": 80, "transaction_type": "debit",
             "description": "Ooredoo", "counterparty": None, "category": None},
        ]
        assert score_payment_regularity(txs) == pytest.approx(0.5)

    def test_credits_not_counted(self):
        today = date.today()
        late = today.replace(day=20).isoformat()
        txs = [
            {"transaction_date": late, "amount": 80, "transaction_type": "credit",
             "description": "STEG refund", "counterparty": None, "category": None},
        ]
        # credit txs are not utility payments → default
        assert score_payment_regularity(txs) == 0.5


# ---------------------------------------------------------------------------
# score_debt_ratio
# ---------------------------------------------------------------------------

class TestDebtRatio:
    def test_no_income_returns_low(self):
        assert score_debt_ratio([]) == 0.2

    def test_low_debt_ratio(self):
        txs = [
            _tx(10, 2000, "credit"),
            _tx(5, 400, "debit", description="remboursement credit"),
        ]
        assert score_debt_ratio(txs) == 1.0  # 400/2000 = 20% < 30%

    def test_medium_debt_ratio(self):
        txs = [
            _tx(10, 1000, "credit"),
            _tx(5, 380, "debit", description="pret"),
        ]
        assert score_debt_ratio(txs) == 0.6  # 38% is between 30-45%

    def test_high_debt_ratio(self):
        txs = [
            _tx(10, 1000, "credit"),
            _tx(5, 600, "debit", description="remboursement credit"),
        ]
        assert score_debt_ratio(txs) == 0.2  # 60% > 45%


# ---------------------------------------------------------------------------
# score_balance_trend
# ---------------------------------------------------------------------------

class TestBalanceTrend:
    def test_single_month_returns_default(self):
        txs = [_tx(5, 1000)]
        assert score_balance_trend(txs) == 0.5

    def test_growing_balance(self):
        # Month 1: +1000, Month 2: +2000, Month 3: +3000 → strong positive slope
        txs = [
            _tx(65, 1000, "credit"),
            _tx(35, 2000, "credit"),
            _tx(5, 3000, "credit"),
        ]
        assert score_balance_trend(txs) == 1.0

    def test_declining_balance(self):
        # Each month spends more than it earns → cumulative balance falls each month
        txs = [
            _tx(65, 1000, "credit"),
            _tx(65, 1600, "debit"),  # month 1: net -600
            _tx(35, 900, "credit"),
            _tx(35, 1500, "debit"),  # month 2: net -600
            _tx(5, 800, "credit"),
            _tx(5, 1400, "debit"),   # month 3: net -600
        ]
        result = score_balance_trend(txs)
        assert result <= 0.5


# ---------------------------------------------------------------------------
# score_account_age
# ---------------------------------------------------------------------------

class TestAccountAge:
    def test_no_connections_returns_default(self):
        assert score_account_age([]) == 0.4

    def test_12_months(self):
        result = score_account_age([_conn(12)])
        assert 0.45 < result < 0.55  # ~12/24 = 0.5

    def test_24_months_max(self):
        result = score_account_age([_conn(24)])
        assert result == pytest.approx(1.0, abs=0.05)

    def test_36_months_capped_at_1(self):
        result = score_account_age([_conn(36)])
        assert result == 1.0

    def test_uses_earliest_connection(self):
        result = score_account_age([_conn(6), _conn(18)])
        assert result > 0.7  # earliest is 18 months


# ---------------------------------------------------------------------------
# score_income_diversity
# ---------------------------------------------------------------------------

class TestIncomeDiversity:
    def test_no_credits_returns_default(self):
        assert score_income_diversity([]) == 0.4

    def test_single_source(self):
        txs = [_tx(5, 1000, counterparty="Employeur SA")]
        result = score_income_diversity(txs)
        assert result == pytest.approx(1 / 3, abs=0.01)

    def test_three_sources(self):
        txs = [
            _tx(10, 1000, counterparty="Employeur SA"),
            _tx(8, 500, counterparty="Client Freelance"),
            _tx(5, 200, counterparty="Loyer entrant"),
        ]
        assert score_income_diversity(txs) == 1.0

    def test_more_than_three_capped(self):
        txs = [_tx(i, 100, counterparty=f"Source {i}") for i in range(1, 7)]
        assert score_income_diversity(txs) == 1.0

    def test_null_counterparty_uses_description(self):
        txs = [
            _tx(5, 1000, counterparty=None, description="virement salaire"),
            _tx(3, 200, counterparty=None, description="loyer"),
        ]
        result = score_income_diversity(txs)
        assert result == pytest.approx(2 / 3, abs=0.01)


# ---------------------------------------------------------------------------
# compute_rule_score
# ---------------------------------------------------------------------------

class TestComputeRuleScore:
    def test_returns_expected_keys(self):
        result = compute_rule_score({"transactions": [], "bank_connections": []})
        assert "sub_scores" in result
        assert "weighted" in result
        assert set(result["sub_scores"].keys()) == {
            "income_stability", "payment_regularity", "debt_ratio",
            "balance_trend", "account_age", "income_diversity",
        }

    def test_weighted_in_range(self):
        result = compute_rule_score({"transactions": [], "bank_connections": []})
        assert 0.0 <= result["weighted"] <= 1.0

    def test_weights_sum_to_one(self):
        from klaro_ml.scoring.rule_scorecard import RULE_WEIGHTS
        assert abs(sum(RULE_WEIGHTS.values()) - 1.0) < 1e-9
