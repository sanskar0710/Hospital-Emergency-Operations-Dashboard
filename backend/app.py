
from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Dataset paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

ED_FILE = os.path.join(DATA_DIR, "edstays.csv")
TRIAGE_FILE = os.path.join(DATA_DIR, "triage.csv")
NHS_FILE = os.path.join(
    DATA_DIR,
    "Monthly-AE-Time-Series-August-2026-YG43sd.xls"
)


def load_csv(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
    return pd.read_csv(path)


def load_data():
    ed = load_csv(ED_FILE)
    triage = load_csv(TRIAGE_FILE)

    # Join patient-level ED and triage records
    if "stay_id" in ed.columns and "stay_id" in triage.columns:
        merged = ed.merge(
            triage,
            on="stay_id",
            how="left",
            suffixes=("", "_triage")
        )
    else:
        merged = ed.copy()

    return ed, triage, merged


@app.route("/")
def home():
    return jsonify({
        "message": "Hospital Operations API is running",
        "status": "success"
    })


@app.route("/api/health")
def health():
    return jsonify({"status": "healthy"})


@app.route("/api/overview")
def overview():
    try:
        ed, triage, merged = load_data()

        total_visits = int(ed["stay_id"].nunique())

        admission_rate = 0
        if "disposition" in ed.columns and total_visits:
            admitted = ed["disposition"].astype(str).str.lower().str.contains(
                "admit", na=False
            ).sum()
            admission_rate = round(admitted / total_visits * 100, 2)

        acuity_rate = 0
        if "acuity" in triage.columns and len(triage):
            acuity = pd.to_numeric(triage["acuity"], errors="coerce")
            acuity_rate = round(
                acuity.isin([1, 2]).sum() / len(triage) * 100, 2
            )

        return jsonify({
            "total_visits": total_visits,
            "admission_rate": admission_rate,
            "high_acuity_rate": acuity_rate,
            "triage_records": len(triage)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/data/ed")
def ed_data():
    try:
        ed, _, _ = load_data()

        # Calculate Patient LOS in hours
        if "intime" in ed.columns and "outtime" in ed.columns:
            ed["intime"] = pd.to_datetime(ed["intime"], errors="coerce")
            ed["outtime"] = pd.to_datetime(ed["outtime"], errors="coerce")
        
            ed["patient_los"] = (
                (ed["outtime"] - ed["intime"]).dt.total_seconds() / 3600
            )

            # Invalid or negative durations are excluded
            ed.loc[ed["patient_los"] < 0, "patient_los"] = None

        return jsonify(
            ed.head(500).fillna("").to_dict(orient="records")
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/data/triage")
def triage_data():
    try:
        _, triage, _ = load_data()
        return jsonify(
            triage.head(500).fillna("").to_dict(orient="records")
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/data/merged")
def merged_data():
    try:
        _, _, merged = load_data()
        return jsonify(
            merged.head(500).fillna("").to_dict(orient="records")
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
 
@app.route("/api/data/nhs")
def nhs_data():
    try:
        from pathlib import Path

        nhs_path = Path(__file__).parent / "data" / "nhs_cleaned.csv"
        nhs = pd.read_csv(nhs_path)

        nhs = nhs.astype(object).where(pd.notna(nhs), None)

        return jsonify(
            nhs.to_dict(orient="records")
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
   


@app.route("/api/columns")
def columns():
    try:
        ed, triage, merged = load_data()
        return jsonify({
            "ed_columns": ed.columns.tolist(),
            "triage_columns": triage.columns.tolist(),
            "merged_columns": merged.columns.tolist()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    


if __name__ == "__main__":
    app.run(debug=True, port=5000)
