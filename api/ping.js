import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      hint: 'Kirim lewat header x-api-key atau query ?api_key='
    });
  }

  try {
    const decoded = jwt.verify(key, process.env.JWT_SECRET);

    res.json({
      success: true,
      message: 'Pong! Key lu valid 🚀',
      data: {
        owner: decoded.owner,
        plan: decoded.plan,
        issued_at: new Date(decoded.iat * 1000).toISOString(),
        expires_at: new Date(decoded.exp * 1000).toISOString(),
        remaining_seconds: decoded.exp - Math.floor(Date.now() / 1000)
      },
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Key expired' : 'Invalid key';
    res.status(403).json({ success: false, error: msg });
  }
}
