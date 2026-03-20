import { useState, useEffect } from 'react';
import BiometricAuth from './BiometricAuth';

function Dashboard({ onShowSetup }) {
  // Read cached data
  let medicines = [];
  let schedule = null;
  let takenDoses = {};

  try {
    const meds = localStorage.getItem('medicare_medicines_cache');
    if (meds) medicines = JSON.parse(meds);
    const sched = localStorage.getItem('medicare_schedule_cache');
    if (sched) schedule = JSON.parse(sched);
    const taken = localStorage.getItem('medicare_doses_taken');
    if (taken) {
      const parsed = JSON.parse(taken);
      const today = new Date().toDateString();
      takenDoses = (parsed.date === today && parsed.doses) ? parsed.doses : {};
    }
  } catch {}

  const totalSlots = schedule?.schedule?.daily_schedule?.reduce(
    (acc, slot) => acc + (slot.medicines?.length || 0), 0
  ) || 0;

  const takenCount = Object.values(takenDoses).filter(Boolean).length;
  const missedCount = Math.max(0, totalSlots - takenCount);
  const adherencePct = totalSlots > 0 ? Math.round((takenCount / totalSlots) * 100) : 0;

  // Process Activity Timeline (Last 4 events)
  const timeline = [];
  try {
    if (schedule?.schedule?.daily_schedule && Array.isArray(schedule.schedule.daily_schedule)) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      schedule.schedule.daily_schedule.forEach(slot => {
          if (!slot.time || !slot.medicines) return;
          const timeParts = slot.time.split(':');
          if (timeParts.length < 2) return;
          
          const [h, m] = timeParts.map(Number);
          const slotMinutes = h * 60 + m;
          
          if (slotMinutes <= currentMinutes) {
              slot.medicines.forEach(med => {
                  const key = `${slot.time}-${med}`;
                  const isTaken = takenDoses && takenDoses[key];
                  timeline.push({
                      time: slot.time,
                      medicine: med,
                      status: isTaken ? 'COMPLETED' : 'MISSED'
                  });
              });
          }
      });
    }
  } catch (err) {
    console.error('Timeline processing error:', err);
  }
  const recentTimeline = timeline.reverse().slice(0, 4);

  return (
    <div>
      {/* Status banner */}
      <div
        className="card"
        style={{
          background: 'var(--gradient-bg)',
          color: '#fff',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ opacity: 0.75, fontSize: '0.8rem', marginBottom: 2 }}>PATIENT ADHERENCE</p>
            <h2>Live Stability Report</h2>
            <p style={{ opacity: 0.75, fontSize: '0.82rem', marginTop: 4 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{adherencePct}%</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>Daily Success Rate</div>
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

      {/* Recent Activity Timeline */}
      <p className="section-label">Recent Activity (Last {recentTimeline.length} events)</p>
      <div className="card" style={{ padding: '15px 20px', marginBottom: 20 }}>
          {recentTimeline.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No activities recorded yet for today.</p>
          ) : (
            recentTimeline.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: idx < recentTimeline.length -1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>{item.time}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{item.medicine}</span>
                    </div>
                    <span className={`badge badge-${item.status === 'COMPLETED' ? 'success' : 'danger'}`}>
                        {item.status}
                    </span>
                </div>
            ))
          )}
      </div>

      {/* Active medicines */}
      <p className="section-label">Active Medicines Inventory</p>
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
              </div>
            </div>
          </div>
        ))
      )}

      {/* Re-registration Button */}
      <div style={{ textAlign: 'center', marginTop: 30, opacity: 0.6 }}>
        <button
          className="btn btn-outline btn-sm"
          style={{ width: 'auto' }}
          onClick={onShowSetup}
        >
          📷 Re-calibrate Face ID
        </button>
      </div>
    </div>
  );
}

// Session-persistent storage for face descriptor (lasts until refresh)
let sessionFaceDescriptor = null;

export default function CaregiverDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [faceMode, setFaceMode] = useState('REGISTER'); 

  const handleFaceComplete = (descriptor) => {
    if (faceMode === 'REGISTER') {
      sessionFaceDescriptor = descriptor;
      setUnlocked(true);
    } else {
      setUnlocked(true);
    }
    setShowFaceAuth(false);
  };

  const startRegistration = () => {
    setFaceMode('REGISTER');
    setShowFaceAuth(true);
  };

  // If locked and registered, show VERIFY. If locked and not registered, show REGISTER.
  if (!unlocked) {
    const currentMode = sessionFaceDescriptor ? 'VERIFY' : 'REGISTER';
    return (
      <BiometricAuth 
        mode={currentMode} 
        onComplete={handleFaceComplete} 
        onCancel={() => {}} // No cancel, it's mandatory
        registeredDescriptor={sessionFaceDescriptor}
      />
    );
  }

  // If triggered re-calibration from inside dashboard
  if (showFaceAuth) {
    return (
        <BiometricAuth 
          mode="REGISTER" 
          onComplete={handleFaceComplete} 
          onCancel={() => setShowFaceAuth(false)} 
          registeredDescriptor={null}
        />
      );
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
          Caregiver Session Active
        </span>
        <button
          className="btn btn-outline btn-sm"
          style={{ width: 'auto' }}
          onClick={() => setUnlocked(false)}
        >
          🔒 Lock Dashboard
        </button>
      </div>
      <Dashboard onShowSetup={startRegistration} />
    </div>
  );
}
