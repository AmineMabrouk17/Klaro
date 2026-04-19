from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from klaro_ml.main import app

client = TestClient(app)

_STUB_USER_DATA = {
    "user_id": "u1",
    "transactions": [],
    "profile": {},
    "bank_connections": [],
    "kyc_documents": [],
}


def test_health() -> None:
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_score_endpoint_insufficient_data() -> None:
    """With no transactions the endpoint must return 422 INSUFFICIENT_DATA."""
    with patch("klaro_ml.routes.score.fetch_user_data", return_value=_STUB_USER_DATA):
        res = client.post("/score", json={"userId": "u1"})
    assert res.status_code == 422
    body = res.json()
    assert body["detail"]["code"] == "INSUFFICIENT_DATA"
    assert isinstance(body["detail"]["data_gaps"], list)


def test_score_endpoint_returns_shape() -> None:
    """With sufficient data the endpoint returns a valid score response."""
    from datetime import date, timedelta

    def _tx(days_ago: int, amount: float, tx_type: str = "credit") -> dict:
        return {
            "transaction_date": (date.today() - timedelta(days=days_ago)).isoformat(),
            "amount": amount,
            "transaction_type": tx_type,
            "counterparty": "Test",
            "description": None,
            "category": None,
        }

    transactions = (
        [_tx(i * 5, 1500, "credit") for i in range(1, 16)]  # 15 credits spread over 75 days
        + [_tx(i * 5 + 2, 800, "debit") for i in range(1, 10)]  # 9 debits
    )

    sufficient_data = {
        "user_id": "u1",
        "transactions": transactions,
        "profile": {"kyc_status": "verified", "occupation_category": "salaried"},
        "bank_connections": [
            {"created_at": (date.today() - timedelta(days=400)).isoformat()}
        ],
        "kyc_documents": [],
    }

    with patch("klaro_ml.routes.score.fetch_user_data", return_value=sufficient_data):
        res = client.post("/score", json={"userId": "u1"})

    assert res.status_code == 200
    body = res.json()
    assert 0 <= body["score"] <= 1000
    assert body["band"] in {"POOR", "FAIR", "GOOD", "VERY_GOOD", "EXCELLENT"}
    assert "coaching_tips" in body
    assert "explanation" in body
    assert "risk_category" in body
    assert 0.0 <= body["data_sufficiency"] <= 1.0
