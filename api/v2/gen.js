import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Support GET & POST
  let body = {};
  if (req.method === 'POST') {
    body = req.body || {};
  } else if (req.method === 'GET') {
    body = req.query || {};
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Auth: header OR query
  const token = req.headers['x-admin-token'] || req.query.admin_token;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { owner = 'unknown', plan = 'free', days = 30 } = body;

  if (days > 365) {
    return res.status(400).json({ success: false, error: 'Max 365 days' });
  }

  const apiKey = jwt.sign(
    {
      owner,
      plan,
      type: 'api_key',
      version: 'v2'
    },
    process.env.JWT_SECRET,
    { expiresIn: `${days}d` }
  );

  res.json({
    success: true,
    api_key: apiKey,
    owner,
    plan,
    expires_in_days: Number(days),
    issued_at: new Date().toISOString(),
    version: 'v2',
    warning: 'Simpan key ini. Kalau ilang, gak bisa recover!'
  });
}
