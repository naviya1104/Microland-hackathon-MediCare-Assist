import { useState, useEffect } from 'react';

const TAKEN_KEY = 'medicare_doses_taken';

function buildRemindersFromCache() {
  try {
    const cached = localStorage.getItem('medicare_schedule_cache');
    if (!cached) return null;
    const data = JSON.parse(cached);
    const slots = data?.schedule?.daily_schedule || [];
    const reminders = [];
    slots.forEach((slot) => {
      slot.medicines?.forEach((med) => {
        reminders.push({
          id: `${slot.time_slot}-${med.name}`,
          timeSlot: slot.time_slot,
          name: med.name,
          dosage: med.dosage,
          instructions: med.instructions,
        });
      });
    });
    return reminders;
  } catch {
    return null;
  }
}

const DEMO_REMINDERS = [
  { id: 'morning-metformin', timeSlot: 'Morning (7:00 AM)', name: 'Metformin', dosage: '500mg', instructions: 'Take with food' },
  { id: 'morning-amlodipine', timeSlot: 'Morning (7:00 AM)', name: 'Amlodipine', dosage: '5mg', instructions: 'Take with water' },
  { id: 'night-atorvastatin', timeSlot: 'Night (9:00 PM)', name: 'Atorvastatin', dosage: '10mg', instructions: 'Best taken at night' },
];

const TIME_ICONS = { Morning: '🌅', Afternoon: '☀️', Evening: '🌆', Night: '🌙' };

function getTimeIcon(timeSlot) {
  for (const [key, icon] of Object.entries(TIME_ICONS)) {
    if (timeSlot.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '⏰';
}

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [takenDoses, setTakenDoses] = useState(() => {
    try {
      // Reset taken doses each day
      const saved = JSON.parse(localStorage.getItem(TAKEN_KEY) || '{}');
      const today = new Date().toDateString();
      return saved.date === today ? saved.doses : {};
    } catch {
      return {};
    }
  });
  const [notifStatus, setNotifStatus] = useState('idle'); // idle | granted | denied

  useEffect(() => {
    const fromSchedule = buildRemindersFromCache();
    setReminders(fromSchedule && fromSchedule.length > 0 ? fromSchedule : DEMO_REMINDERS);
  }, []);

  // Persist taken state
  useEffect(() => {
    localStorage.setItem(TAKEN_KEY, JSON.stringify({
      date: new Date().toDateString(),
      doses: takenDoses,
    }));
  }, [takenDoses]);

  const toggleTaken = (id) => {
    setTakenDoses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifStatus(permission);
    if (permission === 'granted') {
      new Notification('MediCare Reminders Enabled ✅', {
        body: 'You will receive medicine reminders at scheduled times.',
        icon: '/vite.svg',
      });
    }
  };

  const taken = Object.values(takenDoses).filter(Boolean).length;
  const total = reminders.length;

  return (
    <div>
      {/* Adherence stats */}
      <div className="card" style={{ marginBottom: 20, textAlign: 'center', background: taken === total && total > 0 ? 'var(--accent-light)' : 'var(--surface)' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--navy)' }}>
          {taken}/{total}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
          Doses taken today
        </div>
        {taken === total && total > 0 && (
          <div style={{ color: 'var(--accent)', fontWeight: 700, marginTop: 8 }}>
            🎉 All doses taken for today!
          </div>
        )}
      </div>

      {/* Push notification registration */}
      <div className="alert-strip" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)' }}>
        <span>🔔</span>
        <div>
          <strong>Enable Push Notifications</strong>
          <p style={{ fontSize: '0.82rem', marginTop: 2 }}>
            Get reminded at scheduled times automatically.
          </p>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginTop: 10, width: 'auto' }}
            onClick={requestNotifications}
            disabled={notifStatus === 'granted'}
          >
            {notifStatus === 'granted' ? '✅ Notifications On' : notifStatus === 'denied' ? '🚫 Permission Denied' : 'Enable Reminders'}
          </button>
        </div>
      </div>

      <div className="section-divider" />
      <p className="section-label">Today's Doses</p>

      {reminders.map((reminder) => {
        const isTaken = !!takenDoses[reminder.id];
        return (
          <div key={reminder.id} className={`reminder-item ${isTaken ? 'taken' : ''}`} role="article" aria-label={`${reminder.name} at ${reminder.timeSlot}`}>
            <div className="reminder-dot" aria-hidden="true">
              {isTaken ? '✅' : getTimeIcon(reminder.timeSlot)}
            </div>
            <div className="reminder-info">
              <div className="reminder-time">{reminder.timeSlot}</div>
              <div className="reminder-name">{reminder.name}</div>
              <div className="reminder-dosage">{reminder.dosage}
                {reminder.instructions && ` · ${reminder.instructions}`}
              </div>
            </div>
            <button
              className={`taken-btn ${isTaken ? 'active' : ''}`}
              onClick={() => toggleTaken(reminder.id)}
              aria-pressed={isTaken}
              aria-label={`Mark ${reminder.name} as ${isTaken ? 'not taken' : 'taken'}`}
            >
              {isTaken ? '✓ Taken' : 'Mark\nTaken'}
            </button>
          </div>
        );
      })}

      {reminders.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🔔</span>
          <h3>No Reminders</h3>
          <p>Generate a schedule first to see your reminders.</p>
        </div>
      )}
    </div>
  );
}
