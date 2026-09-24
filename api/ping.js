import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

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
}
