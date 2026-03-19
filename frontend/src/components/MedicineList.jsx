const TIMING_EMOJIS = {
  Morning: '🌅',
  Afternoon: '☀️',
  Evening: '🌆',
  Night: '🌙',
  'Morning & Night': '🌅🌙',
  'Morning, Afternoon & Night': '🌅☀️🌙',
};

export default function MedicineList({ medicines, onDelete, loading }) {
  if (loading) {
    return (
      <div className="loading-state" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>Loading medicines…</p>
      </div>
    );
  }

  if (!medicines || medicines.length === 0) {
    return (
      <div className="empty-state" role="status">
        <span className="empty-icon">💊</span>
        <h3>No Medicines Yet</h3>
        <p>Add your first medicine using the form above.</p>
      </div>
    );
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Remove ${name} from your medicines?`)) {
      try {
        await onDelete(id);
      } catch {
        alert('Failed to remove medicine. Please try again.');
      }
    }
  };

  return (
    <section aria-label="Active medicines list">
      {medicines.map((med) => (
        <article key={med.id} className="medicine-card" aria-label={`${med.name} ${med.dosage}`}>
          <div className="med-icon" aria-hidden="true">
            {TIMING_EMOJIS[med.timing] || '💊'}
          </div>
          <div className="med-info">
            <h3>{med.name}</h3>
            <div className="med-meta">
              <span className="med-tag">💊 {med.dosage}</span>
              <span className="med-tag">⏰ {med.timing}</span>
              <span className="med-tag">📅 {med.duration}</span>
            </div>
          </div>
          <button
            className="med-delete-btn"
            onClick={() => handleDelete(med.id, med.name)}
            aria-label={`Remove ${med.name}`}
            title="Remove medicine"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </article>
      ))}
    </section>
  );
}
