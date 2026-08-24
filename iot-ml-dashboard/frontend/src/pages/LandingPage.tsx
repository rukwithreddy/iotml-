import type { PageView, User } from '../types/dashboard';

interface LandingPageProps {
  setActivePage: (page: PageView) => void;
  user: User | null;
}

export function LandingPage({ setActivePage, user }: LandingPageProps) {
  return (
    <div className="landing-page">
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge-pill">
            <span className="badge-dot" />
            Structural Health &amp; Anomaly Intelligence
          </div>
          <h1 className="hero-title">
            Intelligent Bridge Structural Health Monitoring
          </h1>
          <p className="hero-subtitle">
            Real-time multi-sensor telemetry combined with Machine Learning risk assessment to safeguard critical transport infrastructure against structural degradation and environmental stress.
          </p>
          <div className="hero-actions">
            {user ? (
              <button className="btn btn-primary btn-lg" onClick={() => setActivePage('dashboard')}>
                Open Live Dashboard &rarr;
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={() => setActivePage('login')}>
                Access Dashboard Login &rarr;
              </button>
            )}
            <a href="#system-architecture" className="btn btn-outline btn-lg">
              System Architecture
            </a>
          </div>
        </div>

        {/* Bridge Visual Diagram */}
        <div className="hero-visual">
          <div className="bridge-graphic-card">
            <div className="graphic-header">
              <span className="graphic-title">Bridge Sensor Architecture</span>
              <span className="graphic-tag">Node Array v1</span>
            </div>
            <svg className="bridge-svg" viewBox="0 0 700 320" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Sky Background & Grid */}
              <rect width="700" height="320" rx="12" fill="#F8FAFC" />
              <path d="M0 80H700M0 160H700M0 240H700" stroke="#E2E8F0" strokeDasharray="4 4" />

              {/* Water Line */}
              <rect x="0" y="250" width="700" height="70" fill="#E0F2FE" />
              <path d="M0 250Q175 245 350 250T700 250V320H0Z" fill="#BAE6FD" opacity="0.6" />

              {/* Bridge Abutments */}
              <rect x="20" y="160" width="70" height="100" fill="#94A3B8" rx="4" />
              <rect x="610" y="160" width="70" height="100" fill="#94A3B8" rx="4" />

              {/* Bridge Piers */}
              <rect x="220" y="140" width="40" height="120" fill="#64748B" rx="4" />
              <rect x="440" y="140" width="40" height="120" fill="#64748B" rx="4" />

              {/* Bridge Deck */}
              <rect x="20" y="140" width="660" height="24" fill="#334155" rx="4" />
              <rect x="30" y="144" width="640" height="4" fill="#0F172A" />

              {/* Suspension Cables */}
              <path d="M240 140L340 60L440 140" stroke="#2563EB" strokeWidth="3" fill="none" />
              <path d="M55 140L240 60L440 60L645 140" stroke="#2563EB" strokeWidth="2.5" fill="none" />
              <line x1="240" y1="60" x2="240" y2="140" stroke="#64748B" strokeWidth="4" />
              <line x1="440" y1="60" x2="440" y2="140" stroke="#64748B" strokeWidth="4" />

              {/* Vertical Suspender Lines */}
              <line x1="120" y1="100" x2="120" y2="140" stroke="#94A3B8" strokeWidth="1.5" />
              <line x1="180" y1="75" x2="180" y2="140" stroke="#94A3B8" strokeWidth="1.5" />
              <line x1="300" y1="60" x2="300" y2="140" stroke="#94A3B8" strokeWidth="1.5" />
              <line x1="380" y1="60" x2="380" y2="140" stroke="#94A3B8" strokeWidth="1.5" />
              <line x1="500" y1="75" x2="500" y2="140" stroke="#94A3B8" strokeWidth="1.5" />
              <line x1="580" y1="100" x2="580" y2="140" stroke="#94A3B8" strokeWidth="1.5" />

              {/* Sensor Node Callouts */}
              {/* 1. Distance Sensor */}
              <g transform="translate(110, 130)">
                <circle cx="10" cy="10" r="10" fill="#2563EB" />
                <circle cx="10" cy="10" r="4" fill="#FFFFFF" />
                <rect x="-35" y="-30" width="90" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1" />
                <text x="10" y="-15" fill="#0F172A" fontSize="10" fontWeight="700" textAnchor="middle">Ultrasonic Dist</text>
              </g>

              {/* 2. Vibration Sensor */}
              <g transform="translate(230, 50)">
                <circle cx="10" cy="10" r="10" fill="#DC2626" />
                <circle cx="10" cy="10" r="4" fill="#FFFFFF" />
                <rect x="-35" y="-30" width="90" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1" />
                <text x="10" y="-15" fill="#0F172A" fontSize="10" fontWeight="700" textAnchor="middle">Piezo Vibration</text>
              </g>

              {/* 3. Temp / Humidity Sensor */}
              <g transform="translate(340, 130)">
                <circle cx="10" cy="10" r="10" fill="#059669" />
                <circle cx="10" cy="10" r="4" fill="#FFFFFF" />
                <rect x="-35" y="-30" width="90" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1" />
                <text x="10" y="-15" fill="#0F172A" fontSize="10" fontWeight="700" textAnchor="middle">DHT22 Temp/Hum</text>
              </g>

              {/* 4. Acoustic Sensor */}
              <g transform="translate(510, 130)">
                <circle cx="10" cy="10" r="10" fill="#D97706" />
                <circle cx="10" cy="10" r="4" fill="#FFFFFF" />
                <rect x="-35" y="-30" width="90" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1" />
                <text x="10" y="-15" fill="#0F172A" fontSize="10" fontWeight="700" textAnchor="middle">Acoustic Sound</text>
              </g>

              {/* 5. Soil Settlement Probe */}
              <g transform="translate(430, 230)">
                <circle cx="10" cy="10" r="10" fill="#7C3AED" />
                <circle cx="10" cy="10" r="4" fill="#FFFFFF" />
                <rect x="-40" y="26" width="100" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1" />
                <text x="10" y="41" fill="#0F172A" fontSize="10" fontWeight="700" textAnchor="middle">Soil Moisture/Settle</text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* ── System Overview Explanation ───────────────────────────────── */}
      <section id="system-architecture" className="landing-section">
        <div className="section-header">
          <h2 className="section-heading">Continuous Structural Integrity Inspection</h2>
          <p className="section-lead">
            Bridges face daily fatigue from traffic loading, thermal expansion, moisture ingress, and ground settlement. Our system couples hardware telemetry with Machine Learning inference to identify anomalies before critical failures occur.
          </p>
        </div>

        <div className="overview-grid">
          <div className="overview-card">
            <div className="card-icon blue">📡</div>
            <h3>Edge Hardware Stream</h3>
            <p>
              High-frequency Arduino micro-controllers capture multi-channel analog and digital inputs, transmitting formatted CSV data streams across serial interfaces.
            </p>
          </div>
          <div className="overview-card">
            <div className="card-icon green">💾</div>
            <h3>Persistent CSV Storage</h3>
            <p>
              Every incoming telemetry frame is recorded into server-side CSV historical archives, providing traceable audit logs and data sources for trends.
            </p>
          </div>
          <div className="overview-card">
            <div className="card-icon purple">🤖</div>
            <h3>AI Anomaly Classifier</h3>
            <p>
              Trained Random Forest models process displacement, temperature, vibration, and settlement vectors to classify structural safety into Low, Medium, or High risk levels.
            </p>
          </div>
        </div>
      </section>

      {/* ── Sensor Specifications Grid ─────────────────────────────────── */}
      <section className="landing-section bg-alt">
        <div className="section-header">
          <h2 className="section-heading">Integrated Sensor Matrix</h2>
          <p className="section-lead">
            The physical monitoring node integrates five core sensing channels to capture multi-dimensional physical phenomena.
          </p>
        </div>

        <div className="sensors-spec-grid">
          <div className="spec-card">
            <span className="spec-badge">Ultrasonic</span>
            <h4>Deck Displacement</h4>
            <p>Measures structural deflection and clearance changes under heavy vehicle passage.</p>
            <div className="spec-meta">Unit: <strong>cm / mm</strong></div>
          </div>

          <div className="spec-card">
            <span className="spec-badge">DHT22</span>
            <h4>Ambient Temperature &amp; Humidity</h4>
            <p>Tracks thermal expansion cycles and moisture saturation influencing concrete &amp; steel expansion.</p>
            <div className="spec-meta">Unit: <strong>°C &amp; % RH</strong></div>
          </div>

          <div className="spec-card">
            <span className="spec-badge">Microphone ADC</span>
            <h4>Acoustic Noise Signal</h4>
            <p>Detects structural cracking noise, joint impacts, and ambient acoustic energy spikes.</p>
            <div className="spec-meta">Unit: <strong>10-bit Raw ADC</strong></div>
          </div>

          <div className="spec-card">
            <span className="spec-badge">Capacitive Probe</span>
            <h4>Sub-surface Soil Moisture</h4>
            <p>Monitors foundation soil moisture content to detect washouts and pier settlement risks.</p>
            <div className="spec-meta">Unit: <strong>Soil % &amp; ADC</strong></div>
          </div>

          <div className="spec-card">
            <span className="spec-badge">Piezoelectric</span>
            <h4>Structural Vibration</h4>
            <p>Captures structural dynamic oscillation, seismic energy, and resonant frequencies.</p>
            <div className="spec-meta">Unit: <strong>Piezo ADC / ms²</strong></div>
          </div>
        </div>
      </section>

      {/* ── AI / ML Explanation ────────────────────────────────────────── */}
      <section className="landing-section">
        <div className="section-header">
          <h2 className="section-heading">Machine Learning &amp; Hybrid Risk Evaluation</h2>
          <p className="section-lead">
            Combining machine learning models trained on historical bridge behavior with internal structural thresholds for optimal safety evaluation.
          </p>
        </div>

        <div className="ai-feature-box">
          <div className="ai-feature-content">
            <h3>Unified Final Severity Assessment</h3>
            <p>
              The system evaluates live sensor telemetry against both statistical Random Forest classifiers and physical safety boundaries. The final health status displayed is always the governing higher severity level:
            </p>
            <div className="severity-scale">
              <span className="scale-item low">Low Risk (Normal Operation)</span>
              <span className="scale-item med">Medium Risk (Inspection Required)</span>
              <span className="scale-item high">High Risk (Immediate Structural Warning)</span>
            </div>
            <p className="small-note">
              No technical boundaries or raw conditional rules are displayed to operators — providing a clear, actionable risk assessment at a glance.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Inspect Live Telemetry?</h2>
          <p>Sign in with your engineer credentials to access real-time charts, ML prediction results, and sensor controls.</p>
          {user ? (
            <button className="btn btn-primary btn-lg" onClick={() => setActivePage('dashboard')}>
              Go to Live Dashboard &rarr;
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={() => setActivePage('login')}>
              Log In to System &rarr;
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
