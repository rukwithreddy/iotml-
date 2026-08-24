import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDashboardData } from '../hooks/useDashboardData';
import type { SeverityLevel, SensorReading } from '../types/dashboard';

// ── Severity rank order (Low < Medium < High) ──────────────────────────────────
const SEV_ORDER: Record<string, number> = { Low: 1, Medium: 2, High: 3 };

function higherSeverity(a?: string | null, b?: string | null): SeverityLevel {
  const rA = SEV_ORDER[a || 'Low'] || 1;
  const rB = SEV_ORDER[b || 'Low'] || 1;
  const maxRank = Math.max(rA, rB);
  if (maxRank >= 3) return 'High';
  if (maxRank === 2) return 'Medium';
  return 'Low';
}

function sevBadgeClass(level: SeverityLevel | null | undefined): string {
  if (level === 'High') return 'badge-danger';
  if (level === 'Medium') return 'badge-warning';
  if (level === 'Low') return 'badge-success';
  return 'badge-muted';
}

function fmtTemp(v: number | null | undefined): string {
  if (v === null || v === undefined) return 'Sensor error';
  return `${v.toFixed(1)} °C`;
}

function fmtTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Chart data builder from CSV-backed history ────────────────────────────────
function buildChartHistory(history: SensorReading[]) {
  const slice = history.slice(-30); // Last 30 points for clean live visualization
  return slice.map((r) => ({
    time: fmtTime(r.captured_at),
    temperature: r.temperature_c !== null && r.temperature_c !== undefined ? Number(r.temperature_c.toFixed(1)) : null,
    humidity: r.humidity !== null && r.humidity !== undefined ? Number(r.humidity.toFixed(1)) : null,
    distance: r.distance_cm > 0 ? Number(r.distance_cm.toFixed(1)) : null,
    sound: Number(r.sound_raw),
    moisture: Number(r.soil_raw),
    vibration: Number(r.vibration_raw),
  }));
}

// ── Recharts Custom Tooltip ──────────────────────────────────────────────────
function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-time">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="chart-tooltip-row" style={{ color: entry.color }}>
          <span>{entry.name}:</span>
          <strong>
            {entry.value !== null && entry.value !== undefined
              ? (typeof entry.value === 'number' ? entry.value : entry.value)
              : 'N/A'}
          </strong>
        </div>
      ))}
    </div>
  );
}

// ── Mini Sparkline for Sensor Cards ──────────────────────────────────────────
function MiniSparkline({ data, dataKey, strokeColor }: { data: any[]; dataKey: string; strokeColor: string }) {
  if (!data || data.length < 2) {
    return <div className="sparkline-placeholder">Streaming history…</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={strokeColor}
          strokeWidth={1.8}
          fill={`url(#spark-${dataKey})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Individual Sensor Card Component ──────────────────────────────────────────
function SensorCard({
  title,
  value,
  subtitle,
  severity,
  historyData,
  dataKey,
  accentColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  severity: SeverityLevel;
  historyData: any[];
  dataKey: string;
  accentColor: string;
}) {
  return (
    <div className="dash-card sensor-metric-card">
      <div className="card-top-row">
        <span className="metric-title">{title}</span>
        <span className={`metric-badge ${sevBadgeClass(severity)}`}>{severity} Status</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-subtitle">{subtitle}</div>
      <div className="sparkline-container">
        <MiniSparkline data={historyData} dataKey={dataKey} strokeColor={accentColor} />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const data = useDashboardData();
  const { sensor, prediction, system, error, lastUpdated, history } = data;

  const serialConnected = system?.serial_connected ?? false;
  const mlPred = prediction?.prediction ?? 'Low';
  const confidence = prediction?.confidence ?? null;

  // Final Combined Severities (governed by higher of ML prediction and internal rules)
  const finalSev = prediction?.final_severity;
  const distSev: SeverityLevel = finalSev?.distance || higherSeverity(mlPred, sensor && sensor.distance_cm > 60 ? 'High' : sensor && sensor.distance_cm > 30 ? 'Medium' : 'Low');
  const tempSev: SeverityLevel = finalSev?.temperature || higherSeverity(mlPred, sensor && sensor.temperature_c !== null ? (sensor.temperature_c > 40 ? 'High' : sensor.temperature_c > 30 ? 'Medium' : 'Low') : 'Low');
  const soundSev: SeverityLevel = finalSev?.sound || higherSeverity(mlPred, sensor && sensor.sound_raw > 2000 ? 'High' : sensor && sensor.sound_raw > 1500 ? 'Medium' : 'Low');
  const moistSev: SeverityLevel = finalSev?.moisture || higherSeverity(mlPred, sensor && sensor.soil_raw > 700 ? 'High' : sensor && sensor.soil_raw > 400 ? 'Medium' : 'Low');
  const vibSev: SeverityLevel = finalSev?.vibration || higherSeverity(mlPred, sensor && sensor.vibration_raw > 900 ? 'High' : sensor && sensor.vibration_raw > 400 ? 'Medium' : 'Low');
  const overallSev: SeverityLevel = finalSev?.overall || higherSeverity(mlPred, Math.max(SEV_ORDER[distSev], SEV_ORDER[tempSev], SEV_ORDER[soundSev], SEV_ORDER[moistSev], SEV_ORDER[vibSev]) === 3 ? 'High' : 'Low');

  const chartHistory = buildChartHistory(history);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        {/* ── Top Overview Banner ────────────────────────────────────────── */}
        <div className="dashboard-header-banner">
          <div className="banner-main-info">
            <h1 className="dash-title">Live Bridge Structural Health Dashboard</h1>
            <p className="dash-subtitle">
              Integrated real-time hardware telemetry, automated CSV persistence, and AI anomaly inference.
            </p>
          </div>
          <div className="banner-status-group">
            <div className={`connection-pill ${serialConnected ? 'online' : 'offline'}`}>
              <span className="dot" />
              <span>{serialConnected ? 'Arduino Stream Connected' : 'Stream Disconnected'}</span>
            </div>
            <div className="update-time-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{lastUpdated ? `Updated ${fmtTime(lastUpdated)}` : 'Polling…'}</span>
            </div>
          </div>
        </div>

        {/* ── Key Metrics Summary: Single Anomaly Reading & System Info ── */}
        <div className="dash-summary-row" style={{ gridTemplateColumns: '2fr 1fr' }}>

          {/* Single Anomaly Reading Card */}
          <div className={`dash-card overall-health-card health-${overallSev.toLowerCase()}`}>
            <div className="card-top-row">
              <span className="section-eyebrow">Anomaly Prediction</span>
              <span className={`metric-badge ${sevBadgeClass(overallSev)}`}>{overallSev} Status</span>
            </div>
            <div className="health-display">
              <div className="health-badge-large">{overallSev}</div>
              <div style={{ flex: 1 }}>
                <div className="health-desc" style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem', marginBottom: '6px' }}>
                  {overallSev === 'Low' && 'Structural health within normal operating parameters.'}
                  {overallSev === 'Medium' && 'Elevated risk telemetry detected. Structural verification recommended.'}
                  {overallSev === 'High' && 'Critical warning threshold triggered. Immediate inspection required.'}
                </div>
                {confidence !== null && (
                  <div className="ai-confidence-meter" style={{ marginTop: '8px' }}>
                    <div className="meter-label">Model Confidence: <strong>{(confidence * 100).toFixed(1)}%</strong></div>
                    <div className="meter-bar-track">
                      <div className="meter-bar-fill" style={{ width: `${(confidence * 100).toFixed(1)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Telemetry Specs */}
          <div className="dash-card system-info-card">
            <div className="card-top-row">
              <span className="section-eyebrow">System Telemetry</span>
              <span className="metric-badge badge-muted">CSV History</span>
            </div>
            <div className="info-list">
              <div className="info-item">
                <span>CSV Archive:</span>
                <strong>{history.length} Saved Records</strong>
              </div>
              <div className="info-item">
                <span>Model Classifier:</span>
                <strong>{system?.model_loaded ? 'Random Forest ✓' : 'Unloaded'}</strong>
              </div>
              <div className="info-item">
                <span>Sequence ID:</span>
                <strong>#{sensor?.sec ?? '0'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── Live Sensor Grid (6 Channels) ────────────────────────────── */}
        <div className="section-heading-row">
          <h2>Live Sensor Measurements</h2>
          <span className="section-sublabel">Updated every 2 seconds from serial stream</span>
        </div>

        <div className="sensor-metrics-grid">
          <SensorCard
            title="Temperature"
            value={sensor ? fmtTemp(sensor.temperature_c) : '—'}
            subtitle="DHT22 Sensor"
            severity={tempSev}
            historyData={chartHistory}
            dataKey="temperature"
            accentColor="#2563eb"
          />

          <SensorCard
            title="Distance (Deflection)"
            value={sensor && sensor.distance_cm > 0 ? `${sensor.distance_cm.toFixed(1)} cm` : sensor ? 'Err' : '—'}
            subtitle="Ultrasonic Clearance"
            severity={distSev}
            historyData={chartHistory}
            dataKey="distance"
            accentColor="#7c3aed"
          />

          <SensorCard
            title="Acoustic Sound"
            value={sensor ? `${sensor.sound_raw}` : '—'}
            subtitle="Raw ADC Level"
            severity={soundSev}
            historyData={chartHistory}
            dataKey="sound"
            accentColor="#d97706"
          />

          <SensorCard
            title="Soil Moisture"
            value={sensor ? `${sensor.soil_percent}%` : '—'}
            subtitle={`Raw: ${sensor?.soil_raw ?? '—'}`}
            severity={moistSev}
            historyData={chartHistory}
            dataKey="moisture"
            accentColor="#059669"
          />

          <SensorCard
            title="Structural Vibration"
            value={sensor ? `${sensor.vibration_percent}%` : '—'}
            subtitle={`Raw: ${sensor?.vibration_raw ?? '—'}`}
            severity={vibSev}
            historyData={chartHistory}
            dataKey="vibration"
            accentColor="#dc2626"
          />

          <div className="dash-card sensor-metric-card">
            <div className="card-top-row">
              <span className="metric-title">Relative Humidity</span>
              <span className="metric-badge badge-info">Ambient</span>
            </div>
            <div className="metric-value">
              {sensor?.humidity !== null && sensor?.humidity !== undefined ? `${sensor.humidity.toFixed(1)} %` : '—'}
            </div>
            <div className="metric-subtitle">DHT22 Channel</div>
            <div className="sparkline-container">
              <MiniSparkline data={chartHistory} dataKey="humidity" strokeColor="#0891b2" />
            </div>
          </div>
        </div>

        {/* ── Live Historical Sensor Graphs (6 Separate Sensors) ───────── */}
        <div className="section-heading-row" style={{ marginTop: '36px' }}>
          <h2>Live Historical Sensor Graphs</h2>
          <span className="section-sublabel">6 individual sensor trends sourced continuously from CSV data log ({history.length} records)</span>
        </div>

        <div className="graphs-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>

          {/* Graph 1: Temperature */}
          <div className="dash-card graph-card">
            <div className="card-top-row">
              <h3 className="graph-card-title">Temperature (°C)</h3>
              <span className="metric-badge badge-muted">DHT22 Probe</span>
            </div>
            <div className="graph-wrapper">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#2563eb" strokeWidth={2} fill="url(#colorTemp)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graph 2: Relative Humidity */}
          <div className="dash-card graph-card">
            <div className="card-top-row">
              <h3 className="graph-card-title">Relative Humidity (%)</h3>
              <span className="metric-badge badge-muted">DHT22 Probe</span>
            </div>
            <div className="graph-wrapper">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#0891b2" strokeWidth={2} fill="url(#colorHum)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graph 3: Ultrasonic Clearance Distance */}
          <div className="dash-card graph-card">
            <div className="card-top-row">
              <h3 className="graph-card-title">Ultrasonic Clearance Distance (cm)</h3>
              <span className="metric-badge badge-muted">Deflection Channel</span>
            </div>
            <div className="graph-wrapper">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="distance" name="Distance (cm)" stroke="#7c3aed" strokeWidth={2} fill="url(#colorDist)" connectNulls isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graph 4: Acoustic Sound Level */}
          <div className="dash-card graph-card">
            <div className="card-top-row">
              <h3 className="graph-card-title">Acoustic Sound Level (Raw ADC)</h3>
              <span className="metric-badge badge-muted">Microphone Sensor</span>
            </div>
            <div className="graph-wrapper">
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 1023]} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line type="monotone" dataKey="sound" name="Sound ADC" stroke="#d97706" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graph 5: Soil Moisture */}
          <div className="dash-card graph-card">
            <div className="card-top-row">
              <h3 className="graph-card-title">Soil Moisture (Raw ADC)</h3>
              <span className="metric-badge badge-muted">Capacitive Probe</span>
            </div>
            <div className="graph-wrapper">
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 1023]} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line type="monotone" dataKey="moisture" name="Soil Moisture ADC" stroke="#059669" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graph 6: Structural Vibration */}
          <div className="dash-card graph-card">
            <div className="card-top-row">
              <h3 className="graph-card-title">Structural Vibration (Raw ADC)</h3>
              <span className="metric-badge badge-muted">Piezoelectric Sensor</span>
            </div>
            <div className="graph-wrapper">
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 1023]} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line type="monotone" dataKey="vibration" name="Vibration ADC" stroke="#dc2626" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── Raw Stream Inspector ─────────────────────────────────────── */}
        <div className="dash-card raw-stream-card" style={{ marginTop: '24px' }}>
          <div className="card-top-row">
            <h3 className="graph-card-title">Raw Hardware Serial Frame</h3>
            <span className="metric-badge badge-muted">Live Buffer</span>
          </div>
          <pre className="raw-stream-box">{sensor ? sensor.raw_line : 'Waiting for incoming serial frame…'}</pre>
        </div>

        {/* ── Error Banner ─────────────────────────────────────────────── */}
        {error && (
          <div className="dashboard-error-card">
            <strong>System Connection Notice:</strong> {error}
          </div>
        )}

      </div>
    </div>
  );
}
