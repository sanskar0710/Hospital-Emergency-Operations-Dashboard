import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import {
  Activity, Users, Bed, Clock, LayoutDashboard,
  HeartPulse, BarChart3, Database, Settings,
  Bell, Search, RefreshCw, ArrowUpRight
} from "lucide-react";

const API = "http://127.0.0.1:5000";

function downloadCSV(rows, filename = "data-export.csv") {
  if (!Array.isArray(rows) || rows.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];

  const escapeCSV = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [
    headers.map(escapeCSV).join(","),
    ...rows.map(row =>
      headers.map(header => escapeCSV(row[header])).join(",")
    )
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
function App() {

  const [overview, setOverview] = useState(null);
  const [ed, setEd] = useState([]);
  const [triage, setTriage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nhs, setNhs] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("ED Stays");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activePage, setActivePage] = useState("Overview");


// Data Explorer data and filtering
const explorerData =
  selectedDataset === "ED Stays" ? ed : triage;

const columns =
  explorerData.length > 0
    ? Object.keys(explorerData[0])
    : [];

const filteredData = explorerData.filter((row) =>
  columns.some((column) =>
    String(row[column] ?? "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )
);

const rowsPerPage = 10;

const totalPages = Math.max(
  1,
  Math.ceil(filteredData.length / rowsPerPage)
);

const visibleRows = filteredData.slice(
  (currentPage - 1) * rowsPerPage,
  currentPage * rowsPerPage
);

  

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [kpi, edData, triageData, nhsData] = await Promise.all([
  axios.get(`${API}/api/overview`),
  axios.get(`${API}/api/data/ed`),
  axios.get(`${API}/api/data/triage`),
  axios.get(`${API}/api/data/nhs`)
]);

setOverview(kpi.data);
setEd(edData.data);
setTriage(triageData.data);
setNhs(nhsData.data);

    } catch (err) {
      setError("Unable to connect to hospital API. Check Flask server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const hourly = Array.from({ length: 24 }, (_, hour) => ({
  hour: `${String(hour).padStart(2, "0")}:00`,
  count: 0
}));

ed.forEach(row => {
  const raw = row.intime ?? row.Intime ?? row.INTIME;

  if (!raw) return;

  const timestamp = String(raw).trim();
  const match = timestamp.match(/(?:T|\s)(\d{1,2}):(\d{2})(?::\d{2})?/);

  let hour;

  if (match) {
    hour = Number(match[1]);
  } else {
    const parsed = new Date(timestamp);

    if (!Number.isNaN(parsed.getTime())) {
      hour = parsed.getHours();
    }
  }

  if (Number.isInteger(hour) && hour >= 0 && hour < 24) {
    hourly[hour].count += 1;
  }
});

  const dispositions = {};
  ed.forEach(row => {
    const name = row.disposition || "Unknown";
    dispositions[name] = (dispositions[name] || 0) + 1;
  });

  const acuities = {};
  triage.forEach(row => {
    const value = Number(row.acuity);
    if (Number.isFinite(value) && value > 0) {
      acuities[value] = (acuities[value] || 0) + 1;
    }
  });

  const cards = [
    {
      title: "Total ED Visits",
      value: overview?.total_visits ?? "--",
      icon: Users,
      color: "#42d6c5",
      description: "Unique emergency visits"
    },
    {
      title: "Admission Rate",
      value: overview ? `${overview.admission_rate}%` : "--",
      icon: Bed,
      color: "#8c9cff",
      description: "Visits resulting in admission"
    },
    {
      title: "High Acuity Rate",
      value: overview ? `${overview.high_acuity_rate}%` : "--",
      icon: HeartPulse,
      color: "#ff8c9a",
      description: "Acuity levels 1 and 2"
    },
    {
      title: "Triage Records",
      value: overview?.triage_records ?? "--",
      icon: Activity,
      color: "#e5b96c",
      description: "Available triage records"
    }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Activity /></div>
          <div>
            <h2>MED<span>FLOW</span></h2>
            <small>OPERATIONS INTELLIGENCE</small>
          </div>
        </div>

        <div className="menu-label">WORKSPACE</div>
        <nav className="sidebar-nav">
  {[
    { name: "Overview", icon: LayoutDashboard },
    { name: "Live Operations", icon: Activity },
    { name: "Patient Acuity", icon: HeartPulse },
    { name: "Patient Flow", icon: Clock },
    { name: "Capacity Analysis", icon: BarChart3 },
    { name: "Data Explorer", icon: Database }
  ].map((item) => {
    const Icon = item.icon;

    return (
      <button
        key={item.name}
        className={`nav-link ${
          activePage === item.name ? "active" : ""
        }`}
        onClick={() => setActivePage(item.name)}
      >
        <Icon size={19} />
        <span>{item.name}</span>
      </button>
    );
  })}
</nav>

        <div className="sidebar-bottom">
          <a><Settings /> Settings</a>
          <div className="profile">
            <div className="avatar">HC</div>
            <div>
              <strong>Hospital Control</strong>
              <small>Administrator</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
  WORKSPACE / {activePage.toUpperCase()}
</div>

<h1>
  {activePage === "Overview"
    ? "Hospital Operations Command Center"
    : activePage}
</h1>
            <p>Monitor emergency department performance and patient flow.</p>
          </div>

          <div className="top-actions">
            <button className="icon-button" onClick={loadDashboard}>
              <RefreshCw size={18} />
            </button>
            <button className="icon-button"><Bell size={18} /></button>
            <div className="live-status">
              <span></span> API CONNECTED
            </div>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading">Loading hospital analytics...</div>
        ) : (
          <>{activePage === "Overview" && (
  <>
            <section className="welcome-row">
              <div>
                <h2>Overview Dashboard</h2>
                <p>Your emergency department at a glance.</p>
              </div>
              <div className="updated">
                <span className="status-dot"></span>
                Dataset loaded successfully
              </div>
            </section>

            <section className="kpi-grid">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div className="kpi-card" key={card.title}>
                    <div className="kpi-top">
                      <span>{card.title}</span>
                      <div className="kpi-icon" style={{ color: card.color }}>
                        <Icon size={21} />
                      </div>
                    </div>
                    <h2>{card.value}</h2>
                    <div className="kpi-description">
                      {card.description}
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="chart-grid">
              <div className="panel large-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Emergency Arrivals by Hour</h3>
                    <p>Distribution of ED arrivals across 24 hours</p>
                  </div>
                  <span className="chart-tag">ED DATA</span>
                </div>

                
<Plot
  data={[
  {
    x: hourly.map(x => x.hour),
    y: hourly.map(x => x.count),
    type: "scatter",
    mode: "lines+markers",
    name: "ED Visits",
    line: {
      color: "#42d6c5",
      width: 3,
      shape: "spline"
    },
    marker: {
      size: 7,
      color: "#42d6c5"
    }
  }
]}
  layout={{
    autosize: true,
    height: 300,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: {
      color: "#9baab9",
      family: "Inter, sans-serif",
      size: 11
    },
    margin: { l: 45, r: 15, t: 15, b: 45 },
    xaxis: {
      title: "Arrival Time",
      gridcolor: "#263341",
      tickmode: "array",
      tickvals: hourly
        .filter((_, i) => i % 3 === 0)
        .map(x => x.hour),
      tickangle: 0,
      automargin: true,
      zeroline: false
    },
    yaxis: {
      gridcolor: "#263341",
      title: "Number of Visits",
      rangemode: "tozero",
      zeroline: false
    },
    showlegend: false,
    hovermode: "x unified"
  }}
  config={{
    responsive: true,
    displayModeBar: false
  }}
  style={{
    width: "100%",
    height: "300px"
  }}
/>

              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Patient Disposition</h3>
                    <p>ED visit outcomes</p>
                  </div>
                </div>

               


<Plot
  data={[{
    labels: Object.keys(dispositions),
    values: Object.values(dispositions),
    type: "pie",
    hole: 0.65,
    sort: false,
    domain: { x: [0, 0.53], y: [0.05, 0.95] },
    marker: {
      colors: [
        "#42d6c5",
        "#8c9cff",
        "#e5b96c",
        "#ff8c9a",
        "#5b9bd5",
        "#ff923e",
        "#75b85a"
      ]
    },
    textinfo: "none",
    hovertemplate:
      "<b>%{label}</b><br>Visits: %{value}<br>Share: %{percent}<extra></extra>"
  }]}
  layout={{
    autosize: true,
    height: 300,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#c6d0dc", size: 10 },
    margin: { l: 5, r: 5, t: 5, b: 5 },
    showlegend: true,
    legend: {
      orientation: "v",
      x: 0.56,
      y: 0.5,
      xanchor: "left",
      yanchor: "middle",
      font: { size: 9 },
      itemsizing: "constant"
    }
  }}
  config={{
    responsive: true,
    displayModeBar: false
  }}
  style={{ width: "100%", height: "300px" }}
/>



              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Patient Acuity Distribution</h3>
                    <p>Records grouped by triage severity</p>
                  </div>
                  <span className="chart-tag">TRIAGE</span>
                </div>

                <Plot
                  data={[{
                    x: Object.keys(acuities).map(x => `Level ${x}`),
                    y: Object.values(acuities),
                    type: "bar",
                    marker: {
                      color: ["#ff7185", "#e5b96c", "#42d6c5", "#8c9cff"]
                    },
                    hovertemplate: "%{x}<br>Patients: %{y}<extra></extra>"
                  }]}
                  layout={{
                    autosize: true,
                    height: 280,
                    paper_bgcolor: "rgba(0,0,0,0)",
                    plot_bgcolor: "rgba(0,0,0,0)",
                    font: { color: "#9baab9" },
                    margin: { l: 40, r: 10, t: 15, b: 40 },
                    xaxis: { gridcolor: "#263341" },
                    yaxis: { gridcolor: "#263341", title: "Records" },
                    showlegend: false
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: "100%" }}
                />
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recent ED Visits</h3>
                    <p>Latest records in the dataset</p>
                  </div>
                  <span className="chart-tag">RECORDS</span>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Stay ID</th>
                        <th>Arrival</th>
                        <th>Disposition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ed.slice(-6).reverse().map((row, i) => (
                        <tr key={row.stay_id || i}>
                          <td>{row.stay_id}</td>
                          <td>{row.intime || "—"}</td>
                          <td>
                            <span className="disposition">
                              {row.disposition || "Unknown"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
                </>
    )}

{activePage === "Patient Flow" && (
  <>
    <section className="welcome-row">
      <div>
        <h2>Patient Flow Analysis</h2>
        <p>Monitor emergency department length of stay and patient outcomes.</p>
      </div>
    </section>

    <section className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-top">
          <span>Average Patient LOS</span>
        </div>
        <h2>
  {(() => {
    const losValues = ed
      .map(row => Number(row.patient_los))
      .filter(value => Number.isFinite(value) && value > 0);

    if (losValues.length === 0) return "N/A";

    const average =
      losValues.reduce((sum, value) => sum + value, 0) /
      losValues.length;

    return `${average.toFixed(2)} hrs`;
  })()}
</h2>
        <div className="kpi-description">Average recorded ED stay</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-top">
          <span>Admitted Patients</span>
        </div>
        <h2>
          {ed.filter(row => String(row.disposition || "").toUpperCase() === "ADMITTED").length}
        </h2>
        <div className="kpi-description">Visits resulting in admission</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-top">
          <span>Discharged Home</span>
        </div>
        <h2>
          {ed.filter(row => String(row.disposition || "").toUpperCase() === "HOME").length}
        </h2>
        <div className="kpi-description">Patients sent home</div>
      </div>
    </section>

    <section className="chart-grid">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Patient LOS by Acuity</h3>
            <p>Average length of stay for each acuity level</p>
          </div>
        </div>

        <Plot
          data={[{
            x: [1, 2, 3, 4].map(String),
            
y: [1, 2, 3, 4].map(level => {
    const rows = triage.filter(
        row => Number(row.acuity) === level
    );

    const edLosByStayId = new Map(
        ed.map(row => [
            String(row.stay_id),
            Number(row.patient_los)
        ])
    );

    const values = rows
        .map(row => edLosByStayId.get(String(row.stay_id)))
        .filter(value => Number.isFinite(value) && value > 0);

    return values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null;
}),

            type: "bar",
            marker: { color: "#42d6c5" }
          }]}
          layout={{
            autosize: true,
            height: 350,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#c6d0dc" },
            margin: { l: 50, r: 20, t: 20, b: 40 },
            xaxis: { title: "Acuity Level", gridcolor: "#263341" },
            yaxis: { title: "Average LOS (hours)", gridcolor: "#263341" }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Patient Disposition</h3>
            <p>Admission and discharge outcomes</p>
          </div>
        </div>

        <Plot
          data={[{
            x: Object.keys(dispositions),
            y: Object.values(dispositions),
            type: "bar",
            marker: { color: "#8c9cff" }
          }]}
          layout={{
            autosize: true,
            height: 350,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#c6d0dc" },
            margin: { l: 45, r: 15, t: 20, b: 100 },
            xaxis: { tickangle: -35 },
            yaxis: { title: "Visits", gridcolor: "#263341" }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>
    </section>
  </>
)}


{activePage === "Patient Acuity" && (
  <>
    <section className="welcome-row">
      <div>
        <h2>Patient Acuity Analysis</h2>
        <p>Understand patient severity and prioritise high-risk emergency visits.</p>
      </div>
    </section>

    <section className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-top">
          <span>Total Triage Records</span>
        </div>
        <h2>{triage.length}</h2>
        <div className="kpi-description">Available triage records</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-top">
          <span>High Acuity Patients</span>
        </div>
        <h2>
          {triage.filter(row => [1, 2].includes(Number(row.acuity))).length}
        </h2>
        <div className="kpi-description">Acuity levels 1 and 2</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-top">
          <span>High Acuity Rate</span>
        </div>
        <h2>
          {triage.length
            ? (triage.filter(row => [1, 2].includes(Number(row.acuity))).length / triage.length * 100).toFixed(2) + "%"
            : "0%"}
        </h2>
        <div className="kpi-description">Share of all triage records</div>
      </div>
    </section>

    <section className="chart-grid">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Patient Acuity Distribution</h3>
            <p>Number of patients at each acuity level</p>
          </div>
        </div>

        <Plot
          data={[{
            x: Object.keys(acuities),
            y: Object.values(acuities),
            type: "bar",
            marker: {
              color: ["#ff8c9a", "#e5b96c", "#42d6c5", "#8c9cff"]
            }
          }]}
          layout={{
            autosize: true,
            height: 350,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#c6d0dc" },
            margin: { l: 40, r: 20, t: 20, b: 40 },
            xaxis: { title: "Acuity Level", gridcolor: "#263341" },
            yaxis: { title: "Patients", gridcolor: "#263341" }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>High Acuity Breakdown</h3>
            <p>Critical and urgent patient records</p>
          </div>
        </div>

        <Plot
          data={[{
            labels: ["High Acuity (1 & 2)", "Other Acuity"],
            values: [
              triage.filter(row => [1, 2].includes(Number(row.acuity))).length,
              triage.filter(row => ![1, 2].includes(Number(row.acuity))).length
            ],
            type: "pie",
            hole: 0.65,
            marker: { colors: ["#ff8c9a", "#42d6c5"] },
            textinfo: "label+percent"
          }]}
          layout={{
            autosize: true,
            height: 350,
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#c6d0dc" },
            margin: { l: 10, r: 10, t: 20, b: 20 }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>
    </section>
  </>
)}


{activePage === "Live Operations" && (
  <section className="chart-grid">
    <div className="panel large-panel">
      <div className="panel-heading">
        <div>
          <h3>Emergency Arrivals by Hour</h3>
          <p>Hourly distribution of emergency department visits</p>
        </div>
        <span className="chart-tag">LIVE OPERATIONS</span>
      </div>

      <Plot
        data={[{
          x: hourly.map(x => x.hour),
          y: hourly.map(x => x.count),
          type: "scatter",
          mode: "lines+markers",
          fill: "tozeroy",
          line: { color: "#42d6c5", width: 3 },
          fillcolor: "rgba(66,214,197,0.10)"
        }]}
        layout={{
          autosize: true,
          height: 350,
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: { color: "#c6d0dc" },
          margin: { l: 40, r: 20, t: 20, b: 45 },
          xaxis: { gridcolor: "#263341" },
          yaxis: { gridcolor: "#263341", title: "Visits" }
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%" }}
      />
    </div>

    <div className="panel">
      <div className="panel-heading">
        <div>
          <h3>Patient Disposition</h3>
          <p>Distribution of ED visit outcomes</p>
        </div>
      </div>

      <Plot
        data={[{
          labels: Object.keys(dispositions),
          values: Object.values(dispositions),
          type: "pie",
          hole: 0.65,
          textinfo: "percent",
          marker: {
            colors: [
              "#42d6c5", "#8c9cff", "#e5b96c",
              "#ff8c9a", "#719ed4", "#f28e45", "#79b66a"
            ]
          }
        }]}
        layout={{
          autosize: true,
          height: 350,
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: { color: "#c6d0dc" },
          margin: { l: 10, r: 10, t: 20, b: 20 },
          showlegend: true
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%" }}
      />
    </div>
  </section>
)}

{activePage === "Capacity Analysis" && (
  <>
    <section className="welcome-row">
      <div>
        <h2>NHS Capacity & Demand Analysis</h2>
        <p>Historical A&E activity and emergency admission trends across England.</p>
      </div>
      <span className="chart-tag">NHS ENGLAND DATA</span>
    </section>

    {(() => {
      const records = [...nhs]
        .filter(row => row.Period)
        .sort((a, b) => new Date(a.Period) - new Date(b.Period));

      const latest = records[records.length - 1] || {};
      const total = key =>
        records.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);

      const cards = [
        {
          title: "Total A&E Attendances",
          value: Math.round(total("Total_Attendances")).toLocaleString("en-GB"),
          description: "Across all available months"
        },
        {
          title: "Emergency Admissions",
          value: Math.round(total("Total_Emergency_Admissions")).toLocaleString("en-GB"),
          description: "Across all available months"
        },
        {
          title: "Latest 4+ Hour Waits",
          value: Number(latest.Patients_Over_4_Hours || 0).toLocaleString("en-GB"),
          description: "Latest recorded month"
        },
        {
          title: "Latest 12+ Hour Waits",
          value: Number(latest.Patients_Over_12_Hours || 0).toLocaleString("en-GB"),
          description: "Latest recorded month"
        }
      ];

      const chartLayout = {
        autosize: true,
        height: 320,
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#9baab9", family: "Inter, sans-serif" },
        margin: { l: 65, r: 25, t: 25, b: 65 },
        xaxis: { gridcolor: "#263341", tickangle: -35 },
        yaxis: { gridcolor: "#263341", rangemode: "tozero" },
        legend: { orientation: "h", y: -0.3 }
      };

      return (
        <>
          <section className="kpi-grid">
            {cards.map(card => (
              <div className="kpi-card" key={card.title}>
                <div className="kpi-top">
                  <span>{card.title}</span>
                </div>
                <h2>{card.value}</h2>
                <div className="kpi-description">{card.description}</div>
              </div>
            ))}
          </section>

          <section className="chart-grid">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Monthly A&E Attendances</h3>
                  <p>Historical monthly attendance volume</p>
                </div>
                <span className="chart-tag">ATTENDANCES</span>
              </div>
              <Plot
                data={[{
                  x: records.map(r => r.Period),
                  y: records.map(r => Number(r.Total_Attendances) || 0),
                  type: "scatter",
                  mode: "lines",
                  name: "Attendances",
                  line: { color: "#42d6c5", width: 3 }
                }]}
                layout={chartLayout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: "100%" }}
              />
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Monthly Emergency Admissions</h3>
                  <p>Admissions through A&E</p>
                </div>
                <span className="chart-tag">ADMISSIONS</span>
              </div>
              <Plot
                data={[{
                  x: records.map(r => r.Period),
                  y: records.map(r => Number(r.Total_Emergency_Admissions) || 0),
                  type: "scatter",
                  mode: "lines",
                  name: "Admissions",
                  line: { color: "#8c9cff", width: 3 }
                }]}
                layout={chartLayout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: "100%" }}
              />
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>A&E Type Comparison</h3>
                  <p>Type 1, Type 2 and Type 3 attendances</p>
                </div>
                <span className="chart-tag">A&E TYPES</span>
              </div>
              <Plot
                data={[
                  {
                    x: records.map(r => r.Period),
                    y: records.map(r => Number(r.Type_1_Attendances) || 0),
                    type: "scatter",
                    mode: "lines",
                    name: "Type 1"
                  },
                  {
                    x: records.map(r => r.Period),
                    y: records.map(r => Number(r.Type_2_Attendances) || 0),
                    type: "scatter",
                    mode: "lines",
                    name: "Type 2"
                  },
                  {
                    x: records.map(r => r.Period),
                    y: records.map(r => Number(r.Type_3_Attendances) || 0),
                    type: "scatter",
                    mode: "lines",
                    name: "Type 3"
                  }
                ]}
                layout={chartLayout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: "100%" }}
              />
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Extended Waiting Times</h3>
                  <p>Patients waiting over 4 hours and 12 hours</p>
                </div>
                <span className="chart-tag">WAIT TIMES</span>
              </div>
              <Plot
                data={[
                  {
                    x: records.map(r => r.Period),
                    y: records.map(r => Number(r.Patients_Over_4_Hours) || 0),
                    type: "scatter",
                    mode: "lines",
                    name: "Over 4 hours",
                    line: { color: "#e5b96c", width: 2 }
                  },
                  {
                    x: records.map(r => r.Period),
                    y: records.map(r => Number(r.Patients_Over_12_Hours) || 0),
                    type: "scatter",
                    mode: "lines",
                    name: "Over 12 hours",
                    line: { color: "#ff8c9a", width: 2 }
                  }
                ]}
                layout={chartLayout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: "100%" }}
              />
            </div>
          </section>

          <p className="kpi-description">
            Source: NHS England historical monthly A&E activity dataset.
            Figures represent the sum of the available monthly records where
            indicated; the latest waiting-time figures refer to the latest
            available month.
          </p>
        </>
      );
    })()}
  </>
)}


            
{activePage === "Data Explorer" && (
  <section className="data-explorer">
    <div className="welcome-row">
      <div>
        <h2>Data Explorer</h2>
        <p>Explore and inspect your hospital datasets.</p>
      </div>
      <button className="download-btn" onClick={downloadCSV}>
        Export CSV
      </button>
    </div>

    <div className="explorer-stats">
      <div className="explorer-stat">
        <span>Total Records</span>
        <h2>{explorerData.length}</h2>
      </div>
      <div className="explorer-stat">
        <span>Total Columns</span>
        <h2>{columns.length}</h2>
      </div>
      <div className="explorer-stat">
        <span>Filtered Records</span>
        <h2>{filteredData.length}</h2>
      </div>
    </div>

    <div className="explorer-toolbar">
      <div className="dataset-switch">
        <button
          className={selectedDataset === "ED Stays" ? "selected" : ""}
          onClick={() => {
            setSelectedDataset("ED Stays");
            setCurrentPage(1);
            setSearchTerm("");
          }}
        >
          ED Stays
        </button>

        <button
          className={selectedDataset === "Triage" ? "selected" : ""}
          onClick={() => {
            setSelectedDataset("Triage");
            setCurrentPage(1);
            setSearchTerm("");
          }}
        >
          Triage
        </button>
      </div>

      <input
        placeholder="Search records..."
        value={searchTerm}
        onChange={e => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
      />
    </div>

    <div className="explorer-table-card">
      <h3>{selectedDataset} Records</h3>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={index}>
                {columns.map(column => (
                  <td key={column}>
                    {String(row[column] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <span>Page {currentPage} of {totalPages}</span>
        <div>
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </section>
)}

            <footer>
              MEDFLOW • Hospital Operations Analytics
              <span>Local dataset • Flask REST API</span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
