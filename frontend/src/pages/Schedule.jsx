import { useState, useEffect } from 'react';
import AISchedule from '../components/AISchedule';
import { generateSchedule, getCachedSchedule } from '../api';

export default function Schedule() {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  // Load cached schedule on mount
  useEffect(() => {
    const cached = getCachedSchedule();
    if (cached) {
      setScheduleData(cached);
      setFromCache(true);
    }
  }, []);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await generateSchedule();
      setScheduleData(data);
      setFromCache(!!data.fromCache);
    } catch (err) {
      setError('Failed to generate schedule. Please ensure the backend is running and you have added medicines.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>📋 My Schedule</h1>
        <p>AI-generated daily medication plan</p>
      </div>

      {fromCache && scheduleData && (
        <div className="alert-strip" role="status">
          📦 Showing cached schedule. Tap "Regenerate" to refresh.
        </div>
      )}

      {error && (
        <div className="card card-danger" role="alert">
          <h3 style={{ color: 'var(--danger)', marginBottom: 6 }}>⚠️ Error</h3>
          <p style={{ fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {!scheduleData && !loading && (
        <div className="empty-state">
          <span className="empty-icon">🤖</span>
          <h3>No Schedule Yet</h3>
          <p style={{ marginBottom: 24 }}>
            Tap the button below to let our AI analyze your medicines and generate
            a safe daily schedule.
          </p>
        </div>
      )}

      {loading && (
        <div className="loading-state" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>AI is analyzing your medicines…</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            This may take a few seconds.
          </p>
        </div>
      )}

      {!loading && scheduleData && (
        <AISchedule scheduleData={scheduleData} />
      )}

      <button
        className={`btn ${scheduleData ? 'btn-outline' : 'btn-primary'}`}
        onClick={handleGenerate}
        disabled={loading}
        style={{ marginTop: 16 }}
      >
        {loading ? 'Generating…' : scheduleData ? '🔄 Regenerate Schedule' : '🤖 Generate My Schedule'}
      </button>
    </div>
  );
}
