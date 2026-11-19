# Hospital Emergency Operations Dashboard 🏥📊

An end-to-end healthcare analytics and operational intelligence platform designed for monitoring emergency department (ED) patient flows, triage severity classifications, hospital bed utilization, and NHS A&E performance indicators.

---

## 🌟 Key Features

- **Executive KPI Overview**: Real-time metrics for total ED visits, average length of stay (LOS), patient admission rates, and triage severity distributions.
- **Emergency Department (ED) Analytics**: Patient-level tracking of arrival modes, disposition status, and demographic breakdown.
- **Triage & Acuity Insights**: Detailed analysis of patient acuity levels (ESI 1-5), vital signs (heart rate, respiratory rate, oxygen saturation, temperature, blood pressure), and pain scores.
- **NHS A&E Performance Benchmarking**: Integration with NHS monthly emergency department time-series records to monitor admission trends, breach counts, and performance targets.
- **Interactive Visualizations**: Dynamic charts and histograms powered by Plotly.js and Lucide icons.
- **Data Export**: Export patient records and operational data directly to CSV.
- **Tableau Analytics Workbook**: Included `FINAL IDV.twb` Tableau workbook for exploratory data visualization.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Charts & Visualizations**: [Plotly.js](https://plotly.com/javascript/) (`react-plotly.js`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Linting**: [Oxlint](https://oxc.rs/)

### Backend
- **Framework**: [Python Flask](https://flask.palletsprojects.com/)
- **CORS Handling**: `Flask-CORS`
- **Data Processing**: [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
- **Spreadsheet Parsers**: `openpyxl`, `xlrd`

### Business Intelligence & Reporting
- **Tableau**: `FINAL IDV.twb`

---

## 📂 Project Structure

```plaintext
hospital-project/
├── backend/
│   ├── data/
│   │   ├── edstays.csv                               # Patient emergency department stays
│   │   ├── triage.csv                                # Patient triage vital signs and acuity
│   │   ├── Monthly-AE-Time-Series-August-2026-YG43sd.xls  # NHS A&E monthly records
│   │   └── nhs_cleaned.csv                           # Cleaned NHS time series
│   ├── app.py                                        # Flask REST API endpoints
│   ├── inspect_nhs.py                                # Data inspection and preprocessing helper
│   └── requirements.txt                              # Python dependencies
├── frontend/
│   ├── public/                                       # Static assets
│   ├── src/
│   │   ├── App.jsx                                   # Main dashboard application UI
│   │   ├── App.css                                   # Dashboard styling
│   │   ├── main.jsx                                  # React entry point
│   │   └── index.css                                 # Base styling
│   ├── package.json                                  # Frontend dependencies
│   ├── vite.config.js                                # Vite configuration
│   └── index.html                                    # Application entry HTML
├── FINAL IDV.twb                                     # Tableau workbook
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.9+ installed
- **Node.js**: 18+ and `npm` installed
- **Git**

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt

# Run the Flask API server
python app.py
```

The Flask server will start at `http://127.0.0.1:5000`.

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

The React dashboard will be accessible at `http://localhost:5173`.

---

## 📊 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Health check & API status |
| `/api/overview` | `GET` | High-level summary metrics & KPIs |
| `/api/ed-records` | `GET` | Emergency department patient stays dataset |
| `/api/triage-records` | `GET` | Triage records with vitals & acuity scores |
| `/api/nhs-series` | `GET` | NHS monthly emergency department statistics |

---

## 📄 License

This project is licensed under the MIT License - feel free to use and adapt it for academic or organizational purposes.
