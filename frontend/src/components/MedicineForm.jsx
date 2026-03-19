import { useState } from 'react';

const KNOWN_MEDICINES = [
  'Amlodipine', 'Metformin', 'Paracetamol', 'Atorvastatin', 'Losartan',
  'Aspirin', 'Lisinopril', 'Omeprazole', 'Warfarin', 'Clopidogrel',
];

const TIMINGS = [
  'Morning',
  'Afternoon',
  'Evening',
  'Night',
  'Morning & Night',
  'Morning, Afternoon & Night',
];

export default function MedicineForm({ onAdd }) {
  const [form, setForm] = useState({ name: '', dosage: '', timing: 'Morning', duration: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.dosage || !form.duration) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      setLoading(true);
      await onAdd(form);
      setForm({ name: '', dosage: '', timing: 'Morning', duration: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to add medicine. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="add-med-title">
      <p className="section-label" id="add-med-title">Add Medicine</p>
      <div className="card card-accent">
        {success && (
          <div
            role="status"
            aria-live="polite"
            style={{
              background: 'var(--accent-light)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              padding: '10px 14px',
              color: 'var(--accent)',
              fontWeight: 700,
              marginBottom: 14,
              fontSize: '0.9rem',
            }}
          >
            ✅ Medicine added successfully!
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              background: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              borderRadius: 8,
              padding: '10px 14px',
              color: 'var(--danger)',
              fontWeight: 600,
              marginBottom: 14,
              fontSize: '0.9rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="med-name">Medicine Name</label>
            <input
              id="med-name"
              name="name"
              className="form-control"
              list="medicine-suggestions"
              placeholder="e.g. Metformin"
              value={form.name}
              onChange={handleChange}
              autoComplete="off"
              required
            />
            <datalist id="medicine-suggestions">
              {KNOWN_MEDICINES.map((m) => <option key={m} value={m} />)}
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="med-dosage">Dosage</label>
            <input
              id="med-dosage"
              name="dosage"
              className="form-control"
              placeholder="e.g. 500mg or 1 tablet"
              value={form.dosage}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="med-timing">Timing</label>
            <select
              id="med-timing"
              name="timing"
              className="form-control"
              value={form.timing}
              onChange={handleChange}
            >
              {TIMINGS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="med-duration">Duration</label>
            <input
              id="med-duration"
              name="duration"
              className="form-control"
              placeholder="e.g. 30 days or Ongoing"
              value={form.duration}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? '⏳ Adding…' : '➕ Add Medicine'}
          </button>
        </form>
      </div>
    </section>
  );
}
