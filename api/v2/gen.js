import crypto from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ganti-secret-ini-di-env";

// utils
function randDigits(len) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function randHex(len) {
  return crypto.randomBytes(len).toString("hex").slice(0, len);
}

function randName(len = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let s = "User";
  for (let i = 0; i < len; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function randPassword() {
  return "Pass_" + randHex(16).toUpperCase();
}

function makeNicknameB64(name) {
  // nickname di JWT contohmu di-base64
  return Buffer.from(name).toString("base64");
}

function buildJwt({ accountId, name, region, externalUid }) {
  const payload = {
    account_id: Number(accountId),
    nickname: makeNicknameB64(name),
    noti_region: region,
    lock_region: "",
    external_id: randHex(32),
    external_type: 4,
    plat_id: 1,
    client_version: "1.114.13",
    client_version_code: "2019118692",
    emulator_score: 100,
    is_emulator: true,
    country_code: "US",
    external_uid: Number(externalUid),
    reg_avatar: 102000007,
    source: 0,
    lock_region_time: 0,
    client_type: 2,
    signature_md5: randHex(32),
    using_version: 1,
    release_channel: "android",
    release_version: "OB55",
    exp: Math.floor(Date.now() / 1000) + 31536000 // 1 tahun
  };
  return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256" });
}

function generateGuest({ region = "ID" } = {}) {
  const accountId = randDigits(11);        // 11 digit, mirip contohmu
  const externalUid = randDigits(10);      // 10 digit
  const name = randName(6);
  const password = randPassword();
  const createdAt = new Date().toISOString();

  const jwtToken = buildJwt({
    accountId,
    name,
    region,
    externalUid
  });

  return {
    account_id: accountId,
    created_at: createdAt,
    jwt_token: jwtToken,
    name,
    password,
    patterns: [],
    rarity: "NORMAL",
    rarity_reason: "",
    rarity_score: 0,
    region,
    uid: Number(externalUid)
  };
}

export default async function handler(req, res) {
  // CORS biar bisa dipanggil dari mana aja
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Ambil param dari query atau body
    const src = req.method === "POST" ? req.body : req.query;
    const total = Math.min(parseInt(src.total || src.count || "1", 10), 50);
    const region = (src.region || "ID").toUpperCase();

    const accounts = [];
    let attempts = 0;
    const maxAttempts = total * 5;

    while (accounts.length < total && attempts < maxAttempts) {
      attempts++;
      try {
        const acc = generateGuest({ region });
        accounts.push(acc);
      } catch (e) {
        // kalau gagal, coba lagi
      }
    }

    return res.status(200).json({
      accounts,
      attempts_made: attempts,
      success: accounts.length > 0,
      total_created: accounts.length,
      total_requested: total
    });
  } catch (err) {
    return res.status(500).json({
      accounts: [],
      attempts_made: 0,
      success: false,
      total_created: 0,
      total_requested: 0,
      error: err.message
    });
  }
    }
