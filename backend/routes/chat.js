require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { medicines } = require('../data/store');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

function getGeminiModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') return null;
  const genAI = new GoogleGenerativeAI(key);

  const addMedicineTool = {
    name: "addMedicine",
    description: "Adds a new medicine to the backend database. Call this ONLY after you have interactively gathered ALL 4 required pieces of information from the user: name, dosage, timing, and duration.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: "Name of the medicine" },
        dosage: { type: SchemaType.STRING, description: "Dosage (e.g. 500mg, 2 pills)" },
        timing: { type: SchemaType.STRING, description: "Strictly one of: Morning, Afternoon, Evening, Night" },
        duration: { type: SchemaType.STRING, description: "How long to take it (e.g. 30 days, 1 week)" }
      },
      required: ["name", "dosage", "timing", "duration"]
    }
  };

  const deleteMedicineTool = {
    name: "deleteMedicine",
    description: "Removes a specific medicine from the active database. Automatically call this if the user asks to delete, remove, or stop taking a specific named medicine.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: { name: { type: SchemaType.STRING, description: "Exact name of the medicine to remove" } },
      required: ["name"]
    }
  };

  const generateScheduleTool = {
    name: "generateSchedule",
    description: "Generates a full daily schedule timeline and sets up patient reminders based on their active medicines. Call this when the user asks to build, create, or update their medication schedule or reminders.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  };

  return genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    tools: [{ functionDeclarations: [addMedicineTool, deleteMedicineTool, generateScheduleTool] }]
  });
}

router.post('/', async (req, res) => {
  try {
    const { message, chatHistory = [], schedule, takenDoses, currentTime } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const model = getGeminiModel();
    if (!model) {
      return res.json({
        success: true,
        reply: "I'm sorry, my AI brain goes offline without a valid Gemini API key. Please add it to the .env file!"
      });
    }

    // Context Loading: Medicine Database
    let medicineContext = "The user currently has no medicines recorded in the app.";
    if (medicines && medicines.length > 0) {
      medicineContext = "The user is actively taking the following medications:\n";
      medicines.forEach(m => {
        medicineContext += `- ${m.name} (${m.dosage}), scheduled for ${m.timing} for ${m.duration}.\n`;
      });
    }

    // Helper to calculate status in JS
    function getDoseStatus(slotTime, isTaken, currentISO) {
      if (isTaken) return 'TAKEN';
      try {
        const match = slotTime.match(/\((\d+):00 (AM|PM)\)/);
        if (!match) return 'PENDING';
        let hour = parseInt(match[1]);
        const ampm = match[2];
        if (ampm === 'PM' && hour !== 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        
        const now = new Date(currentISO || new Date());
        const currentHour = now.getHours();
        return hour < currentHour ? 'MISSED' : 'UPCOMING';
      } catch {
        return 'PENDING';
      }
    }

    // Context Loading: Daily Adherence Status
    let adherenceContext = "No daily schedule has been generated yet.";
    const nowTime = currentTime || new Date().toISOString();
    
    if (schedule && schedule.schedule) {
      adherenceContext = `CURRENT SYSTEM TIME: ${nowTime}\n`;
      adherenceContext += "PATIENT'S DAILY ADHERENCE REPORT (LIVE):\n";
      
      const dosesToday = schedule.schedule.daily_schedule || [];
      const marked = (takenDoses && takenDoses.doses) ? takenDoses.doses : {};
      
      dosesToday.forEach(slot => {
        slot.medicines.forEach(m => {
          const doseId = `${slot.time_slot}-${m.name}`;
          const isTaken = !!marked[doseId];
          const status = getDoseStatus(slot.time_slot, isTaken, nowTime);
          adherenceContext += `- [${status}] ${m.name} (${m.dosage}) scheduled for ${slot.time_slot}.\n`;
        });
      });
    }

    const systemPrompt = `You are a conversational Agentic AI for the 'MediCare Assistant' application. Keep answers simple, warm, and appropriate for elderly users. 

YOUR DATABASE CONTEXT (Read-Only State):
${medicineContext}

YOUR DAILY ADHERENCE LOG (Real-time Status):
${adherenceContext}

YOUR AGENT TOOLS:
1. 'addMedicine': If the user indicates they want to add a medicine, politely ask for name, dosage, timing, and duration. ONLY invoke when you have all 4.
2. 'deleteMedicine': If the user wants to remove/stop a medicine, invoke this tool immediately with the medicine's name.
3. 'generateSchedule': If the user asks you to build, create, or update their daily schedule or their reminders, invoke this tool immediately!

STRICT INSTRUCTIONS FOR STATUS:
- If a medicine is marked as [MISSED], emphasize to the patient that they should check if it's safe to take it now or wait for the next dose.
- If a medicine is [TAKEN], praise them for being on track.
- If a medicine is [UPCOMING], remind them of the next time slot.

CONVERSATION HISTORY:
${chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')}

New Question from User: ${message}
Assistant Response:`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response;

    const calls = typeof response.functionCalls === 'function' ? response.functionCalls() : response.functionCalls;
    if (calls && calls.length > 0) {
      const call = calls[0];
      
      if (call.name === "addMedicine") {
        const { name, dosage, timing, duration } = call.args;
        const newMedicine = {
          id: uuidv4(),
          name, dosage, timing, duration,
          addedAt: new Date().toISOString()
        };
        medicines.push(newMedicine);
        console.log(`🤖 [Agent Action] Added: ${name} via Chatbot`);

        return res.json({ 
          success: true, 
          reply: `✅ Success! I have just added **${name} (${dosage})** to your active database for **${timing}**. It will now appear on your Home and Schedule screens, and I will track it for potential conflicts!` 
        });
      }

      if (call.name === "deleteMedicine") {
        const { name } = call.args;
        const index = medicines.findIndex(m => m.name.toLowerCase().includes(name.toLowerCase()));
        if (index > -1) {
          const removed = medicines.splice(index, 1)[0];
          console.log(`🤖 [Agent Action] Deleted: ${removed.name} via Chatbot`);
          return res.json({ 
            success: true, 
            reply: `🗑️ I have successfully removed **${removed.name}** from your active prescriptions.` 
          });
        } else {
          return res.json({ 
            success: true, 
            reply: `I could not find a medicine named **${name}** in your active list.` 
          });
        }
      }

      if (call.name === "generateSchedule") {
        console.log(`🤖 [Agent Action] Triggering Schedule Generator via Chatbot`);
        try {
          const scheduleRes = await fetch('http://localhost:5000/api/schedule', { method: 'POST' });
          const scheduleData = await scheduleRes.json();
          if (scheduleData.success) {
            return res.json({ 
              success: true, 
              action: "UPDATE_SCHEDULE",
              scheduleData: scheduleData,
              reply: `✅ I have successfully analyzed your active medicines and generated a safe, conflict-free daily routine! Your Reminders tab has been completely updated behind the scenes.` 
            });
          }
        } catch(e) {
          return res.json({ success: true, reply: "I tried to generate your schedule but the backend algorithm threw an error." });
        }
      }
    }

    const reply = response.text().trim();
    res.json({ success: true, reply });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate AI response' });
  }
});

module.exports = router;
