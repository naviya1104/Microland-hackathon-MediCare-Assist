import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
const SCHEDULE_CACHE_KEY = 'medicare_schedule_cache';
const MEDICINES_CACHE_KEY = 'medicare_medicines_cache';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ── Medicines ──────────────────────────────────────
export async function getMedicines() {
  try {
    const { data } = await api.get('/medicines');
    if (data.medicines) {
      localStorage.setItem(MEDICINES_CACHE_KEY, JSON.stringify(data.medicines));
    }
    return data.medicines;
  } catch (err) {
    console.warn('Offline: loading medicines from cache');
    const cached = localStorage.getItem(MEDICINES_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function addMedicine(medicine) {
  const { data } = await api.post('/medicines', medicine);
  return data.medicine;
}

export async function deleteMedicine(id) {
  await api.delete(`/medicines/${id}`);
}

// ── Schedule (AI) ──────────────────────────────────
export async function generateSchedule() {
  try {
    const { data } = await api.post('/schedule');
    if (data.schedule) {
      localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify({
        schedule: data.schedule,
        generatedAt: data.generatedAt,
        cachedAt: new Date().toISOString(),
      }));
    }
    return data;
  } catch (err) {
    console.warn('Offline: loading schedule from cache');
    const cached = localStorage.getItem(SCHEDULE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, fromCache: true };
    }
    throw err;
  }
}

export function getCachedSchedule() {
  const cached = localStorage.getItem(SCHEDULE_CACHE_KEY);
  return cached ? JSON.parse(cached) : null;
}

export function clearCache() {
  localStorage.removeItem(SCHEDULE_CACHE_KEY);
  localStorage.removeItem(MEDICINES_CACHE_KEY);
}
