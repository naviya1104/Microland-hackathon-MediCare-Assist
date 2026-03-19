require('dotenv').config();
const express = require('express');
const cors = require('cors');

const medicinesRouter = require('./routes/medicines');
const scheduleRouter = require('./routes/schedule');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Medicine Assistant API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/medicines', medicinesRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/chat', chatRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🏥 Smart Medicine Assistant API`);
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📋 Medicines API: http://localhost:${PORT}/api/medicines`);
  console.log(`🤖 Schedule API:  http://localhost:${PORT}/api/schedule`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health\n`);
});
