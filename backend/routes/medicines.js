const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { medicines } = require('../data/store');

const VALID_TIMINGS = [
  'Morning', 'Afternoon', 'Evening', 'Night',
  'Morning & Night', 'Morning, Afternoon & Night',
];

// GET /api/medicines
router.get('/', (req, res) => {
  res.json({ success: true, medicines, count: medicines.length });
});

// POST /api/medicines
router.post('/', (req, res) => {
  const { name, dosage, timing, duration } = req.body;

  if (!name || !dosage || !timing || !duration) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required: name, dosage, timing, duration',
    });
  }

  if (!VALID_TIMINGS.includes(timing)) {
    return res.status(400).json({
      success: false,
      error: `Invalid timing. Must be one of: ${VALID_TIMINGS.join(', ')}`,
    });
  }

  const newMedicine = {
    id: uuidv4(),
    name: name.trim(),
    dosage: dosage.trim(),
    timing,
    duration: duration.trim(),
    addedAt: new Date().toISOString(),
  };

  medicines.push(newMedicine);
  console.log(`✅ Added: ${newMedicine.name} (${newMedicine.dosage})`);
  res.status(201).json({ success: true, medicine: newMedicine });
});

// DELETE /api/medicines/:id
router.delete('/:id', (req, res) => {
  const index = medicines.findIndex((m) => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Medicine not found' });
  }
  const removed = medicines.splice(index, 1)[0];
  console.log(`🗑️  Removed: ${removed.name}`);
  res.json({ success: true, removed });
});

// GET /api/medicines/:id
router.get('/:id', (req, res) => {
  const medicine = medicines.find((m) => m.id === req.params.id);
  if (!medicine) {
    return res.status(404).json({ success: false, error: 'Medicine not found' });
  }
  res.json({ success: true, medicine });
});

module.exports = router;
