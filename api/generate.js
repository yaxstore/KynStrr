import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST only' });
  }

  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { owner = 'unknown', plan = 'free', days = 30 } = req.body || {};

  if (days > 365) {
    return res.status(400).json({ success: false, error: 'Max 365 days' });
  }

  const apiKey = jwt.sign(
    {
      owner,
      plan,
      type: 'api_key'
    },
    process.env.JWT_SECRET,
    { expiresIn: `${days}d` }
  );

  res.json({
    success: true,
    api_key: apiKey,
    owner,
    plan,
    expires_in_days: days,
    warning: 'Simpan key ini. Kalau ilang, gak bisa recover!'
  });
    }
