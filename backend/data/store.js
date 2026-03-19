// Shared in-memory medicines store
// Extracted to avoid circular dependency between medicines.js and schedule.js routes

const { v4: uuidv4 } = require('uuid');

// Pre-seeded demo data for immediate testing
const medicines = [
  {
    id: uuidv4(),
    name: 'Metformin',
    dosage: '500mg',
    timing: 'Morning',
    duration: '30 days',
    addedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Amlodipine',
    dosage: '5mg',
    timing: 'Evening',
    duration: '60 days',
    addedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: 'Atorvastatin',
    dosage: '10mg',
    timing: 'Night',
    duration: '90 days',
    addedAt: new Date().toISOString(),
  },
];

module.exports = { medicines };
