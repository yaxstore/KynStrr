import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) return res.status(401).json({ valid: false, error: 'No key' });

  try {
    const decoded = jwt.verify(key, process.env.JWT_SECRET);
    res.json({
      valid: true,
      owner: decoded.owner,
      plan: decoded.plan,
      expires_at: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (e) {
    res.status(200).json({
      valid: false,
      reason: e.name === 'TokenExpiredError' ? 'expired' : 'invalid_signature'
    });
  }
}
