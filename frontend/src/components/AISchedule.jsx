const TIME_ICONS = {
  Morning: '🌅',
  Afternoon: '☀️',
  Evening: '🌆',
  Night: '🌙',
};

function getTimeIcon(timeSlot) {
  for (const [key, icon] of Object.entries(TIME_ICONS)) {
    if (timeSlot.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '⏰';
}

export default function AISchedule({ scheduleData }) {
  if (!scheduleData) return null;

  const { schedule, generatedAt, cachedAt, fromCache } = scheduleData;
  if (!schedule) return null;

  const {
    daily_schedule = [],
    precautions = [],
    conflicts = [],
    general_tips = [],
    disclaimer = '',
  } = schedule;

  const displayTime = cachedAt || generatedAt;
  const timeLabel = displayTime
    ? new Date(displayTime).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div aria-label="Generated medication schedule">
      {/* Generated timestamp */}
      {timeLabel && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          <span className="live-dot" aria-hidden="true" />
          {fromCache ? 'Cached' : 'Generated'} on {timeLabel}
        </p>
      )}

      {/* ── Daily Schedule ── */}
      <p className="section-label">Daily Schedule</p>
      {daily_schedule.length > 0 ? (
        daily_schedule.map((slot, i) => (
          <div key={i} className="schedule-slot" role="region" aria-label={slot.time_slot}>
            <div className="schedule-slot-header">
              <span className="slot-time-icon" aria-hidden="true">
                {getTimeIcon(slot.time_slot)}
              </span>
              <h3>{slot.time_slot}</h3>
            </div>
            <div className="schedule-slot-body">
              {slot.medicines.map((med, j) => (
                <div key={j} className="schedule-med-item">
                  <div className="sched-bullet" aria-hidden="true" />
                  <div>
                    <div className="sched-med-name">{med.name}</div>
                    <div className="sched-dosage">{med.dosage}</div>
                    {med.instructions && (
                      <div className="sched-instructions">📌 {med.instructions}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No schedule generated.</p>
      )}

      {/* ── Precautions ── */}
      {precautions.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop: 8 }}>Precautions</p>
          <div className="card card-success" role="region" aria-label="Precautions">
            {precautions.map((p, i) => (
              <div key={i} className="precaution-item">{p}</div>
            ))}
          </div>
        </>
      )}

      {/* ── Conflicts ── */}
      {conflicts.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop: 8 }}>⚠️ Drug Interactions</p>
          <div role="region" aria-label="Drug interactions">
            {conflicts.map((c, i) => (
              <div key={i} className="conflict-item">
                <div className="conflict-meds">
                  {c.medicines?.join(' + ')}
                  {c.severity && (
                    <span className={`severity-badge severity-${c.severity}`}>
                      {c.severity}
                    </span>
                  )}
                </div>
                <div className="conflict-desc">{c.description}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── General Tips ── */}
      {general_tips.length > 0 && (
        <>
          <p className="section-label" style={{ marginTop: 8 }}>💡 General Tips</p>
          <div className="card card-warning" role="region" aria-label="General tips">
            {general_tips.map((tip, i) => (
              <div key={i} className="precaution-item" style={{ '--accent': 'var(--warning)' }}>
                {tip}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── No Conflicts ── */}
      {conflicts.length === 0 && (
        <div className="card card-success" style={{ textAlign: 'center', padding: '14px' }}>
          <strong style={{ color: 'var(--accent)' }}>✅ No drug interactions detected</strong>
        </div>
      )}

      {/* ── Disclaimer ── */}
      {disclaimer && (
        <div className="disclaimer-box" role="note" aria-label="Medical disclaimer" style={{ marginTop: 16 }}>
          <span aria-hidden="true" style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚕️</span>
          <span>{disclaimer}</span>
        </div>
      )}
    </div>
  );
}
