require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const router = express.Router();
const { lookupMedicine } = require('../data/medicineDataset');
const { medicines } = require('../data/store');

// Lazily load Gemini SDK only when a valid API key is found
function getGeminiModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') return null;
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

// POST /api/schedule — generate AI schedule
router.post('/', async (req, res) => {
  try {
    if (!medicines || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active medicines found. Please add medicines first.',
      });
    }

    // Enrich with dataset facts
    const enrichedMedicines = medicines.map((med) => ({
      name: med.name,
      dosage: med.dosage,
      timing: med.timing,
      duration: med.duration,
      datasetInfo: lookupMedicine(med.name) || null,
    }));

    const medicineDetails = enrichedMedicines.map((m) => {
      let detail = `- ${m.name} (${m.dosage}) — Timing: ${m.timing}, Duration: ${m.duration}`;
      if (m.datasetInfo) {
        detail += `\n  Use: ${m.datasetInfo.use}`;
        detail += `\n  Warning: ${m.datasetInfo.warning}`;
        detail += `\n  Side Effects: ${m.datasetInfo.side_effects.join(', ')}`;
      }
      return detail;
    }).join('\n\n');

    const prompt = `You are a medical AI assistant helping an elderly patient manage their medications safely.

The patient is currently taking the following medications:

${medicineDetails}

Based on this information, generate a comprehensive and safe daily medication schedule. You MUST respond with ONLY valid JSON (no markdown, no code blocks, just raw JSON) matching this exact structure:

{
  "daily_schedule": [
    {
      "time_slot": "Morning (7:00 AM)",
      "medicines": [
        {
          "name": "MedicineName",
          "dosage": "Xmg",
          "instructions": "Specific instruction for this medicine at this time"
        }
      ]
    }
  ],
  "precautions": [
    "Plain-English precaution 1"
  ],
  "conflicts": [
    {
      "medicines": ["Medicine A", "Medicine B"],
      "description": "Description of potential interaction",
      "severity": "mild | moderate | severe"
    }
  ],
  "general_tips": [
    "General tip 1 for elderly patients"
  ],
  "disclaimer": "This schedule is for guidance only. Always consult your doctor or pharmacist before making any changes to your medication routine."
}

Rules:
1. Organize medicines chronologically (Morning → Afternoon → Evening → Night).
2. For each medicine, provide specific plain-English instructions.
3. Flag real pharmacological interactions in conflicts. If none, return [].
4. Keep all language simple and warm — suitable for elderly patients.
5. Return ONLY the JSON object. No additional text, no markdown.`;

    let scheduleData;
    const model = getGeminiModel();
    const hasKey = model !== null;

    if (!hasKey) {
      console.log('⚠️  No Gemini API key — using mock schedule');
      scheduleData = generateMockSchedule(enrichedMedicines);
    } else {
      console.log('🤖 Calling Gemini AI for schedule generation…');
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      scheduleData = JSON.parse(cleaned);
    }


    console.log('✅ Schedule generated successfully');
    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      medicinesAnalyzed: medicines.length,
      schedule: scheduleData,
    });

  } catch (err) {
    console.error('❌ Schedule generation error:', err.message);
    if (err instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        error: 'AI returned invalid JSON. Please try again.',
        details: err.message,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to generate schedule',
      details: err.message,
    });
  }
});

function generateMockSchedule(enrichedMedicines) {
  const timeSlotMap = {
    Morning: 'Morning (7:00 AM)',
    Afternoon: 'Afternoon (1:00 PM)',
    Evening: 'Evening (6:00 PM)',
    Night: 'Night (9:00 PM)',
  };

  const grouped = {};
  enrichedMedicines.forEach((m) => {
    const timings = m.timing.split(/[,&]+/).map((t) => t.trim());
    timings.forEach((t) => {
      const label = timeSlotMap[t] || `${t} (Daily)`;
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push({
        name: m.name,
        dosage: m.dosage,
        instructions: m.datasetInfo?.warning?.split('.')[0] || 'Take as prescribed',
      });
    });
  });

  const ORDER = ['Morning (7:00 AM)', 'Afternoon (1:00 PM)', 'Evening (6:00 PM)', 'Night (9:00 PM)'];
  const daily_schedule = ORDER
    .filter((slot) => grouped[slot])
    .map((slot) => ({ time_slot: slot, medicines: grouped[slot] }));

  // Add any non-standard slots
  Object.keys(grouped)
    .filter((k) => !ORDER.includes(k))
    .forEach((k) => daily_schedule.push({ time_slot: k, medicines: grouped[k] }));

  return {
    daily_schedule,
    precautions: [
      'Take all medicines with a full glass of water unless instructed otherwise.',
      'Do not skip doses. If you miss one, take it as soon as you remember (but not if it is nearly time for the next dose).',
      'Store all medicines away from heat, light, and moisture.',
      'Carry your medicine list when visiting a doctor or hospital.',
    ],
    conflicts: [],
    general_tips: [
      'Use a weekly pill organizer to avoid confusion about whether you have taken a dose.',
      'Take medicines at the same time each day to build a routine.',
      'Inform your doctor of any new symptoms after starting or changing a medicine.',
      'Never share your prescription medicines with others.',
    ],
    disclaimer:
      'This schedule is for guidance only. Always consult your doctor or pharmacist before making any changes to your medication routine.',
  };
}

module.exports = router;
