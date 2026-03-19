import { useState } from 'react';

const CORRECT_PIN = '1234';

function PinScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKey = (digit) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      if (newPin === CORRECT_PIN) {
        setTimeout(() => onUnlock(), 200);
      } else {
        setTimeout(() => {
          setError(true);
          setPin('');
        }, 400);
      }
    }
  };

  const handleBack = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="pin-screen" role="main" aria-label="Caregiver PIN entry">
      <div className="pin-icon" aria-hidden="true">🔒</div>
      <h2 style={{ color: 'var(--navy)' }}>Caregiver Access</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 260 }}>
        Enter your 4-digit PIN to view the patient's medication dashboard.
      </p>

      <div className="pin-dots" role="status" aria-label={`PIN: ${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} aria-hidden="true" />
        ))}
      </div>

      {error && (
        <p role="alert" style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.9rem' }}>
          ❌ Incorrect PIN. Please try again.
        </p>
      )}

      {/* Hint */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Demo PIN: <strong>1234</strong>
      </p>

      <div className="pin-keypad" role="group" aria-label="PIN keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} className="pin-key" onClick={() => handleKey(d)} aria-label={d}>
            {d}
          </button>
        ))}
        <div />
        <button className="pin-key" onClick={() => handleKey('0')} aria-label="0">0</button>
        <button className="pin-key backspace" onClick={handleBack} aria-label="Delete">⌫</button>
      </div>
    </div>
  );
}

function Dashboard() {
  // Read cached data
  let medicines = [];
  let schedule = null;
  let takenDoses = {};

  try {
    const meds = localStorage.getItem('medicare_medicines_cache');
    if (meds) medicines = JSON.parse(meds);
  } catch {}

  try {
    const sched = localStorage.getItem('medicare_schedule_cache');
    if (sched) schedule = JSON.parse(sched);
  } catch {}

  try {
    const taken = localStorage.getItem('medicare_doses_taken');
    if (taken) {
      const parsed = JSON.parse(taken);
      const today = new Date().toDateString();
      takenDoses = parsed.date === today ? parsed.doses : {};
    }
  } catch {}

  const totalSlots = schedule?.schedule?.daily_schedule?.reduce(
    (acc, slot) => acc + (slot.medicines?.length || 0), 0
  ) || 0;

  const takenCount = Object.values(takenDoses).filter(Boolean).length;
  const missedCount = Math.max(0, totalSlots - takenCount);
  const adherencePct = totalSlots > 0 ? Math.round((takenCount / totalSlots) * 100) : 0;

  return (
    <div>
      {/* Status banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--navy) 0%, var(--primary) 100%)',
          color: '#fff',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ opacity: 0.75, fontSize: '0.8rem', marginBottom: 2 }}>PATIENT</p>
            <h2>Medication Report</h2>
            <p style={{ opacity: 0.75, fontSize: '0.82rem', marginTop: 4 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{adherencePct}%</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>Adherence</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{takenCount}</div>
          <div className="stat-label">Doses Taken</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: missedCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
            {missedCount}
          </div>
          <div className="stat-label">Doses Missed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{medicines.length}</div>
          <div className="stat-label">Active Meds</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalSlots}</div>
          <div className="stat-label">Total Doses</div>
        </div>
      </div>

      {/* Active medicines */}
      <p className="section-label">Active Medicines</p>
      {medicines.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
            No medicines found in cache. Ask the patient to open the app and add medicines.
          </p>
        </div>
      ) : (
        medicines.map((med) => (
          <div key={med.id} className="medicine-card" style={{ background: 'var(--surface-2)' }}>
            <div className="med-icon" aria-hidden="true">💊</div>
            <div className="med-info">
              <h3>{med.name}</h3>
              <div className="med-meta">
                <span className="med-tag">{med.dosage}</span>
                <span className="med-tag">⏰ {med.timing}</span>
                <span className="med-tag">📅 {med.duration}</span>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Biometric placeholder */}
      <div className="section-divider" />
      <div
        className="card"
        style={{
          border: '2px dashed var(--border)',
          textAlign: 'center',
          background: 'transparent',
        }}
      >
        <span style={{ fontSize: '2rem' }}>🔐</span>
        <h3 style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Biometric Lock</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>
          Fingerprint / Face ID authentication placeholder.
          Integrate with Capacitor Biometrics plugin for production.
        </p>
        <button
          className="btn btn-outline btn-sm"
          style={{ marginTop: 14, width: 'auto' }}
          onClick={() => alert('Biometric authentication would be triggered here in the native app.')}
        >
          🔓 Simulate Biometric Auth
        </button>
      </div>
    </div>
  );
}

export default function CaregiverDashboard() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PinScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <span className="badge badge-success">
          <span className="live-dot" style={{ marginRight: 0 }} aria-hidden="true" />
          Live View
        </span>
        <button
          className="btn btn-outline btn-sm"
          style={{ width: 'auto' }}
          onClick={() => setUnlocked(false)}
        >
          🔒 Lock
        </button>
      </div>
      <Dashboard />
    </div>
  );
}
