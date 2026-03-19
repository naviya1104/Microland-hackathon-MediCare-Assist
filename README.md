# 💊 MediCare Assistant (Smart Medicine Assistant for the Elderly)

A full-stack, AI-powered medication management application designed specifically for elderly users. It features an accessible UI, smart AI scheduling, medication conflict detection, offline support, and a caregiver monitoring dashboard.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React.js (Vite 5)
- **Backend**: Node.js + Express
- **AI Integration**: Google Gemini (`@google/generative-ai`)
- **Storage**: In-memory array (extensible to MongoDB) + `localStorage` for offline frontend access.

## 🚀 Features

1. **Elderly-Friendly UI**: High-contrast, large fonts (18px base), and clear, accessible touch targets.
2. **AI Scheduling Agent**: Evaluates active medications against a curated database to generate a safe, chronological daily schedule.
3. **Conflict Detection**: The AI automatically flags harmful drug interactions and provides plain-English precautions.
4. **Smart Reminders**: Track daily doses with visual indicators and a daily reset mechanism.
5. **Caregiver Dashboard**: A PIN-protected (Demo PIN: `1234`) dashboard for caregivers to monitor adherence stats and active medications.
6. **Offline Support**: The frontend caches the latest AI schedule and active medicines to remain functional even without an internet connection.

---

## 🛠️ Project Setup & Installation

Follow these steps to get the project running locally.

### Prerequisites
- Node.js (v18+ recommended)
- A valid Google Gemini API Key. (Get one at [Google AI Studio](https://aistudio.google.com/))

### 1. Clone/Setup the Repository
Navigate to the root directory `d:\Microland hackathon` where both `frontend` and `backend` folders reside.

### 2. Setup the Backend
Open a terminal and run:
```bash
cd "d:\Microland hackathon\backend"
npm install
```

Configure Environment Variables:
Inside the `backend` folder, you will find a `.env` file (or create one if missing). Add your Gemini API Key:
```env
PORT=5000
GEMINI_API_KEY=your_actual_api_key_here
```
*(Note: If the key is missing or invalid, the backend will gracefully fallback to a hardcoded mock schedule for testing).*

### 3. Setup the Frontend
Open a **new** terminal window and run:
```bash
cd "d:\Microland hackathon\frontend"
npm install
```

---

## 🏃‍♂️ Running the Application

You need to run both the backend and frontend servers simultaneously.

### Terminal 1: Start the Backend (API)
```bash
cd "d:\Microland hackathon\backend"
npm start
# Server will run on http://localhost:5000
```
*(⚠️ **Important**: Leave this terminal window open! If you close it or press `Ctrl + C`, the backend API will stop working.)*

### Terminal 2: Start the Frontend (React App)
```bash
cd "d:\Microland hackathon\frontend"
npm run dev
# The app will automatically open in your browser at http://localhost:5173
```
*(⚠️ **Important**: Leave this terminal window open as well! Stopping this process will cause the "Site cannot be reached" error.)*

---

## 🧪 Testing Workflow (How to Demo)

1. **Add Medicines**: Go to `http://localhost:5173`. Scroll down and add a medicine (e.g., "Metformin", "500mg", "Morning", "30 days").
2. **Generate AI Schedule**: Click the **Schedule** tab at the bottom. Click "Generate My Schedule". The AI will analyze the medicines, check for interactions, and build a timeline.
3. **Mark Reminders**: Click the **Reminders** tab. Mark your doses as "Taken" to see the adherence stats update.
4. **Caregiver View**: Click the **Caregiver** tab. Enter the demo PIN (`1234`) to view patient adherence and total active medications.
5. **Offline Mode Test**: Stop the backend server (`Ctrl + C`). Refresh the frontend and notice that the schedule and medicines still load perfectly from the local cache.

---

## 📁 Directory Structure Overview
```text
d:\Microland hackathon\
├── backend\
│   ├── data\             # Medicine dataset and shared in-memory store
│   ├── routes\           # API routes (medicines.js, schedule.js)
│   ├── server.js         # Entry point for Express wrapper
│   └── .env              # Environment configurations
│
└── frontend\
    ├── src\
    │   ├── api.js         # Axios HTTP client with localStorage caching logic
    │   ├── App.jsx        # React Router mapping and Layout wrapper
    │   ├── index.css      # Custom global CSS (Elderly-Friendly Design System)
    │   ├── components\    # Reusable UI elements (Forms, Cards, Dashboards)
    │   └── pages\         # Route-level wrapper components
    └── vite.config.js     # React/Vite proxy configs (routes /api to :5000)
```
