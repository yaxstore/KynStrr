require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');

const app = express();

// Security
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Rate limit global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 200,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti' }
}));

// Rate limit khusus auth (lebih ketat)
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak percobaan login' }
}));

// Health check
app.get('/', (req, res) => res.json({ success: true, message: 'Yax API running 🚀' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Endpoint tidak ada' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Server error' });
});

// Start
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
});
