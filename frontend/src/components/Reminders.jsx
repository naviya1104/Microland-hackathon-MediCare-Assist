import { useState, useEffect, useRef } from 'react';

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
          missedCount: 0,
        });
      });
    });
    return reminders;
  } catch {
    return null;
  }
}

const DEMO_REMINDERS = [
  { id: 'morning-metformin', timeSlot: 'Morning (3:10 AM)', name: 'Metformin', dosage: '500mg', instructions: 'Take with food' },
  { 
    id: 'demo-med', 
    timeSlot: 'Demo (5:13 AM)', // 👈 Put your "1 minute from now" string here
    name: 'Metformin', 
    dosage: '500mg', 
    instructions: 'Test Dose' 
  },
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

// Helper to check if a scheduled time slot is in the past
function isPast(timeSlot) {
  try {
    const match = timeSlot.match(/\((\d+):(\d+)\s(AM|PM)\)/);
    if (!match) return false;
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const ampm = match[3];
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0); // Set specific time

    return now > scheduledTime;
  } catch {
    return false;
  }
}

export default function Reminders() {
  const [showSOS, setShowSOS] = useState(false);
  const [sosMed, setSosMed] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [reminders, setReminders] = useState([]);
  const [firedNotifications, setFiredNotifications] = useState({});
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

  // src/components/Reminders.jsx

const lastNotifiedRef = useRef("");

useEffect(() => {
  const timer = setInterval(() => {
    const now = new Date();
    const curH = now.getHours();
    const curM = now.getMinutes();
    const currentTimeStr = `${curH}:${curM}`;

    reminders.forEach((r) => {
      const match = r.timeSlot.match(/\((\d+):(\d+)\s?(AM|PM)\)/i);
      if (!match) return;
      
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      
      // UNIQUE ID for this specific minute/med combo
      const lockKey = `${r.id}-${currentTimeStr}`;
      
      // NEW CONDITION: !firedNotifications[notificationKey]
      if (h === curH && m === curM && !takenDoses[r.id]) {
        
        if (lastNotifiedRef.current !== lockKey) {
          console.log("🔔 TRIGGERING ONCE:", r.name, "at", currentTimeStr);
          triggerNotification(r);
          lastNotifiedRef.current = lockKey; // SET THE LOCK
        }
      }

      // Check for escalation if the dose was due 15, 30, or 45 mins ago
      const scheduledTotalMins = (h * 60) + m;
      const currentTotalMins = (curH * 60) + curM;
      const minsLate = currentTotalMins - scheduledTotalMins;

      if (!takenDoses[r.id] && minsLate > 0) {

        // STRIKE 1: 15 minutes late
        if (minsLate === 15 && lastNotifiedRef.current !== `${r.id}-strike1`) {
          triggerNotification({...r, name: `⚠️ URGENT: ${r.name}`});
          lastNotifiedRef.current = `${r.id}-strike1`;
        }

        // STRIKE 2: 30 minutes late
        if (minsLate === 30 && lastNotifiedRef.current !== `${r.id}-strike2`) {
          triggerNotification({...r, name: `⚠️ URGENT: ${r.name}`});
          lastNotifiedRef.current = `${r.id}-strike2`;
        }

        // STRIKE 3: 45 minutes late -> THE SOS
        if (minsLate === 45 && lastNotifiedRef.current !== `${r.id}-SOS`) {
          handleEmergencySOS(r);
          lastNotifiedRef.current = `${r.id}-SOS`;
        }
      }

    });
  }, 10000); // Check every 10 seconds for the demo (more aggressive)

  return () => clearInterval(timer);
}, [reminders, takenDoses]);

  // Persist taken state
  useEffect(() => {
    localStorage.setItem(TAKEN_KEY, JSON.stringify({
      date: new Date().toDateString(),
      doses: takenDoses,
    }));
  }, [takenDoses]);

  const toggleTaken = (id) => {
    setTakenDoses((prev) => {
      const newState = { ...prev, [id]: !prev[id] };
      // If marking as taken, you can also trigger a "Success" sound or haptic feedback
      return newState;
    });
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

  const triggerNotification = (reminder) => {
  if (Notification.permission === 'granted') {
    new Notification(`💊 Time for ${reminder.name}`, {
      body: `${reminder.dosage} - ${reminder.instructions}`,
      requireInteraction: true, // Keeps it on screen until they act
    });
  } else {
    // FALLBACK: Use a standard alert if notifications are blocked
    alert(`💊 REMINDER: Take ${reminder.dosage} of ${reminder.name}`);
  }
};

  const missedList = reminders.filter(r => isPast(r.timeSlot) && !takenDoses[r.id]);
  const currentList = reminders.filter(r => !isPast(r.timeSlot) || takenDoses[r.id]);
  const displayList = activeTab === 'current' ? currentList : missedList;

  const checkEscalation = (reminder, scheduledHour, scheduledMin, currHour, currMin) => {
  // If already taken, do nothing
  if (takenDoses[reminder.id]) return;

  // Calculate minutes passed since scheduled time
  const minutesPassed = (currHour * 60 + currMin) - (scheduledHour * 60 + scheduledMin);

  // Strike 1: 15 mins late
  // Strike 2: 30 mins late
  // Strike 3: 45 mins late -> SOS
  if (minutesPassed === 45) {
    handleEmergencySOS(reminder);
  }
};

const handleEmergencySOS = (reminder) => {
  console.log("🚨 SOS TRIGGERED");
  setSosMed(reminder);
  setShowSOS(true);

  // 1. Show Local UI Alert
  alert(`CRITICAL: Alerting caregiver about missed ${reminder.name} dose.`);

  // 2. This is where your "Agentic AI" comes in
  // Send a signal to your AI backend to draft a summary for the caregiver
  // triggerCaregiverAlert(reminder.name); 
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

      {/* Tab Switcher */}
      <div className="tab-container" style={{ marginBottom: 20 }}>
        <button 
          className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
          onClick={() => setActiveTab('current')}
        >
          Daily Schedule
        </button>
        <button 
          className={`tab-btn ${activeTab === 'missed' ? 'active' : ''}`}
          onClick={() => setActiveTab('missed')}
        >
          {missedList.length > 0 && <span className="tab-badge">{missedList.length}</span>}
          Missed Doses
        </button>
      </div>

      {activeTab === 'current' ? (
        <>
          {/* Push notification registration */}
          <div className="alert-strip" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', marginBottom: 20 }}>
            <span>🔔</span>
            <div style={{ flex: 1 }}>
              <strong>Enable Reminders</strong>
              <p style={{ fontSize: '0.82rem', marginTop: 2 }}>Get alerts exactly when it's time.</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ width: 'auto' }}
              onClick={requestNotifications}
              disabled={notifStatus === 'granted'}
            >
              {notifStatus === 'granted' ? '✅ On' : 'Enable'}
            </button>
          </div>

          <p className="section-label">Today's Routine</p>
          {currentList.map((reminder) => {
            const isTaken = !!takenDoses[reminder.id];
            return (
              <div key={reminder.id} className={`reminder-item ${isTaken ? 'taken' : ''}`} role="article">
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
                >
                  {isTaken ? '✓ Taken' : 'Mark\nTaken'}
                </button>
              </div>
            );
          })}
          {currentList.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">⭐</span>
              <h3>All caught up!</h3>
              <p>Nothing else on the schedule for now.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="section-label" style={{ color: 'var(--danger)' }}>Missed Doses</p>
          {missedList.map((reminder) => (
            <div key={reminder.id} className="reminder-item missed" role="article">
              <div className="reminder-dot" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>⚠️</div>
              <div className="reminder-info">
                <div className="reminder-time" style={{ color: 'var(--danger)', fontWeight: 700 }}>{reminder.timeSlot} (EXPIRED)</div>
                <div className="reminder-name">{reminder.name}</div>
                <div className="reminder-dosage">{reminder.dosage}</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  You missed this dose. Please contact your doctor if you're unsure about taking it late.
                </p>
              </div>
            </div>
          ))}
          {missedList.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">✅</span>
              <h3>No Missed Doses</h3>
              <p>Excellent! You have stayed on track today.</p>
            </div>
          )}
        </>
      )}

      {reminders.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🔔</span>
          <h3>No Data</h3>
          <p>Generate a schedule first to see items here.</p>
        </div>
      )}
      {showSOS && (
        <div className="sos-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(220, 38, 38, 0.95)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', textAlign: 'center', padding: 20
        }}>
          <div style={{ fontSize: '5rem' }}>⚠️</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>EMERGENCY ALERT</h1>
          <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>
            <b>{sosMed?.name}</b> was missed 45 minutes ago.
          </p>
          <div className="card" style={{ color: 'var(--navy)', padding: '15px', maxWidth: '300px' }}>
            <strong>Agentic AI Action:</strong>
            <p style={{ fontSize: '0.9rem', marginTop: 5 }}>
              "I am now notifying the caregiver and drafting a safety report..."
            </p>
          </div>
          <button
          className="btn"
          style={{ marginTop: 30, background: 'white', color: 'red', fontWeight: 'bold' }}
          onClick={() => setShowSOS(false)}
          >
            I AM SAFE (DISMISS)
          </button>
        </div>
      )}
    </div>
  );
}
