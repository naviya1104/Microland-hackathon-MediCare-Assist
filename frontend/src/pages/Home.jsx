import { useState, useEffect } from 'react';
import MedicineForm from '../components/MedicineForm';
import MedicineList from '../components/MedicineList';
import { getMedicines, addMedicine, deleteMedicine } from '../api';

export default function Home() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const data = await getMedicines();
      setMedicines(data);
      setError(null);
    } catch (err) {
      setError('Could not load medicines. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedicines(); }, []);

  const handleAdd = async (medicine) => {
    const added = await addMedicine(medicine);
    setMedicines((prev) => [...prev, added]);
  };

  const handleDelete = async (id) => {
    await deleteMedicine(id);
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="page">
      <div className="hero-banner">
        <h2>Good Morning! 👋</h2>
        <p>Manage your medicines safely and easily.</p>
      </div>

      {error && (
        <div className="alert-strip" role="alert">
          ⚠️ {error}
        </div>
      )}

      <MedicineForm onAdd={handleAdd} />

      <div className="section-divider" />

      <p className="section-label">Active Medicines ({medicines.length})</p>
      <MedicineList medicines={medicines} onDelete={handleDelete} loading={loading} />
    </div>
  );
}
