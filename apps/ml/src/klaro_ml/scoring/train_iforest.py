"""IsolationForest training script — trains on real user data from Supabase.

Run manually once enough users have bank data, and nightly in production:

    python -m klaro_ml.scoring.train_iforest

Requires the `ml` extra and Supabase credentials in environment:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import pathlib
import pickle
import sys
from typing import Any

import numpy as np

from klaro_ml.scoring.anomaly_detector import ANOMALY_FEATURES, _extract_anomaly_features
from klaro_ml.settings import get_settings

MIN_USERS = 30  # minimum real users required before training


def _make_supabase_client() -> Any:
    try:
        from supabase import create_client  # type: ignore[import-not-found]
    except ImportError as e:
        raise SystemExit("supabase package not installed. Run: pip install supabase") from e
    settings = get_settings()
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def fetch_all_user_data() -> list[dict[str, Any]]:
    """Fetch transactions, profile, bank_connections, and kyc_documents for all users."""
    sb = _make_supabase_client()

    # Fetch all users who have bank connections
    connections_res = sb.table("bank_connections").select("user_id").execute()
    user_ids = list({row["user_id"] for row in (connections_res.data or [])})

    if len(user_ids) < MIN_USERS:
        return []

    user_datasets: list[dict[str, Any]] = []
    for uid in user_ids:
        txs = (
            sb.table("transactions").select("*").eq("user_id", uid).execute().data or []
        )
        if len(txs) < 10:
            continue  # skip users with too few transactions

        profile = (
            sb.table("profiles").select("*").eq("id", uid).maybe_single().execute().data or {}
        )
        bank_conns = (
            sb.table("bank_connections").select("*").eq("user_id", uid).execute().data or []
        )
        kyc_docs = (
            sb.table("kyc_documents").select("*").eq("user_id", uid).execute().data or []
        )

        user_datasets.append({
            "user_id": uid,
            "transactions": txs,
            "profile": profile,
            "bank_connections": bank_conns,
            "kyc_documents": kyc_docs,
        })

    return user_datasets


def build_feature_matrix(user_datasets: list[dict[str, Any]]) -> np.ndarray:
    """Extract the 9 anomaly features for each user → (n_users, 9) matrix."""
    rows = []
    for ud in user_datasets:
        try:
            features = _extract_anomaly_features(ud)
            rows.append([features[f] for f in ANOMALY_FEATURES])
        except Exception:
            continue  # skip users whose feature extraction fails

    if not rows:
        raise ValueError("No valid feature rows produced from user data.")
    return np.array(rows, dtype=float)


def train_and_save(X: np.ndarray) -> pathlib.Path:
    """Fit IForest on X, persist model bundle, return path."""
    try:
        from pyod.models.iforest import IForest  # type: ignore[import-not-found]
    except ImportError as e:
        raise SystemExit(
            "PyOD not installed. Run: pip install 'klaro-ml[ml]'"
        ) from e

    model = IForest(contamination=0.05, random_state=42)
    model.fit(X)

    bundle = {
        "model": model,
        "feature_means": X.mean(axis=0),
        "feature_stds": X.std(axis=0),
        "trained_on_n": len(X),
    }

    out_path = pathlib.Path(__file__).parent / "models" / "iforest.pkl"
    out_path.parent.mkdir(exist_ok=True)
    with out_path.open("wb") as f:
        pickle.dump(bundle, f)

    return out_path


def main() -> None:
    print("Fetching real user data from Supabase...")
    user_datasets = fetch_all_user_data()

    if len(user_datasets) < MIN_USERS:
        print(
            f"Only {len(user_datasets)} users with sufficient data. "
            f"Need {MIN_USERS} to train. Skipping — anomaly layer stays as neutral stub."
        )
        sys.exit(0)

    print(f"Building feature matrix for {len(user_datasets)} users...")
    X = build_feature_matrix(user_datasets)

    print(f"Training IsolationForest on {len(X)} users (contamination=0.05)...")
    out_path = train_and_save(X)
    print(f"Model saved → {out_path}")
    print(f"Features: {list(ANOMALY_FEATURES)}")
    print(f"Feature means: {X.mean(axis=0).round(4).tolist()}")


if __name__ == "__main__":
    main()
