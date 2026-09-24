import express from 'express';
import { generateGarenaAccount } from './lib/garena.js';
import { checkRarity } from './lib/rarity.js';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json());

// CORS + Anti-cache
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token, x-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============================================================
// ROOT
// ============================================================
app.get('/', (req, res) => {
  res.json({
    name: 'LAYZ API Gen — Render Edition',
    version: '3.0.0',
    status: 'online',
    platform: 'render.com',
    endpoints: {
      garena: [
        'GET /api/v2/gen?count=1&region=ID&name=Yax'
      ],
      apikey: [
        'POST /api/generate  (header: x-admin-token)',
        'GET  /api/ping      (header: x-api-key)'
      ]
    }
  });
});

// ============================================================
// ENDPOINT 1 — GARENA ACCOUNT GEN (kayak grenanew-owve)
// ============================================================
app.get('/api/v2/gen', async (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 1, 5);
  const prefix = req.query.name || 'Yax';
  const region = (req.query.region || 'ID').toUpperCase();
  const rarityThreshold = parseInt(req.query.rarity_threshold) || 6;

  console.log(`[GEN] count=${count} region=${region} prefix=${prefix}`);

  const accounts = [];
  let attempts = 0;
  const maxAttempts = count * 4;

  while (accounts.length < count && attempts < maxAttempts) {
    attempts++;
    const acc = await generateGarenaAccount(region, prefix);
    if (!acc) continue;

    const rarity = checkRarity(acc.account_id, rarityThreshold);
    accounts.push({
      account_id: acc.account_id,
      created_at: acc.created_at,
      jwt_token: acc.jwt_token,
      name: acc.name,
      password: acc.password,
      patterns: rarity.patterns,
      rarity: rarity.level || 'NORMAL',
      rarity_reason: rarity.reason,
      rarity_score: rarity.score,
      region: acc.region,
      uid: acc.uid,
    });
  }

  res.json({
    accounts,
    attempts_made: attempts,
    success: accounts.length > 0,
    total_created: accounts.length,
    total_requested: count,
  });
});

// ============================================================
// ENDPOINT 2 — API KEY GEN (yang lama, tetep ada)
// ============================================================
app.post('/api/generate', (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.admin_token;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { owner = 'unknown', plan = 'free', days = 30 } = req.body || {};
  if (days > 365) return res.status(400).json({ success: false, error: 'Max 365 days' });

  const apiKey = jwt.sign(
    { owner, plan, type: 'api_key' },
    process.env.JWT_SECRET,
    { expiresIn: `${days}d` }
  );

  res.json({
    success: true,
    api_key: apiKey,
    owner,
    plan,
    expires_in_days: Number(days),
    version: 'v2'
  });
});

// ============================================================
// ENDPOINT 3 — PING
// ============================================================
app.get('/api/ping', (req, res) => {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) return res.status(401).json({ success: false, error: 'API key required' });

  try {
    const decoded = jwt.verify(key, process.env.JWT_SECRET);
    res.json({
      success: true,
      message: 'Pong! Key lu valid 🚀',
      data: {
        owner: decoded.owner,
        plan: decoded.plan,
        expires_at: new Date(decoded.exp * 1000).toISOString()
      }
    });
  } catch (e) {
    res.status(403).json({
      success: false,
      error: e.name === 'TokenExpiredError' ? 'Key expired' : 'Invalid key'
    });
  }
});

// ============================================================
// 404 + ERROR HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ success: false, error: err.message });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🔥 LAYZ API — RENDER EDITION 🔥        ║
║   Port: ${PORT}                          ║
║   Ready: http://localhost:${PORT}         ║
╚══════════════════════════════════════════╝
  `);
});
