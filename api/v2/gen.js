import { generateGarenaAccount } from '../../lib/garena.js';
import { checkRarity } from '../../lib/rarity.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let body = req.method === 'POST' ? (req.body || {}) : (req.query || {});

  const count = Math.min(parseInt(body.count) || 1, 5);
  const prefix = body.name || 'Yax';
  const region = (body.region || 'ID').toUpperCase();
  const rarityThreshold = parseInt(body.rarity_threshold) || 6;

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
}
