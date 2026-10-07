// ══════════════════════════════════════════════════════════════════════════
//   IyanXd API  //  NODE.JS EDITION  //  v1.2 (FINAL FIX)
//   Owner  : IyanXd
//   Deploy : Render / Railway
// ══════════════════════════════════════════════════════════════════════════

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// ── HTTPS agent untuk bypass SSL verification (kalau perlu) ──
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// ── CONFIG ──
const CONFIG = {
  AES_KEY: Buffer.from([89,103,38,116,99,37,68,69,117,104,54,37,90,99,94,56]),
  AES_IV:  Buffer.from([54,111,121,90,68,114,50,50,69,51,121,99,104,106,77,37]),
  HEX_KEY_HEX: "2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3",
  HEX_KEY: Buffer.from(
    "2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3",
    "hex"
  ),
  APP_ID: 100067,
  RELEASE_VER: "OB55",
  GAME_VERSION: "2.132.4",
  HTTP_TIMEOUT: 15000,

  // Endpoint register (dari code Python yang jalan)
  URL_GUEST_REGISTER: "https://100067.connect.garena.com/api/v2/oauth/guest:register",
  URL_TOKEN_GRANT:    "https://100067.connect.garena.com/oauth/guest/token/grant",

  REGION_LANG: {
    ME: "ar", IND: "hi", ID: "id", VN: "vi", TH: "th",
    BD: "bn", PK: "ur", TW: "zh", CIS: "ru", SAC: "es", BR: "pt"
  },

  REGION_ENDPOINTS: {
    ME:  "https://loginbp.common.ggbluefox.com",
    TH:  "https://loginbp.common.ggbluefox.com",
    ID:  "https://loginbp.ppmainecoonghj.com",
    IND: "https://loginbp.ppmainecoonghj.com",
    BD:  "https://loginbp.ppmainecoonghj.com",
    PK:  "https://loginbp.ppmainecoonghj.com",
    VN:  "https://loginbp.ppmainecoonghj.com",
  }
};

// ── FIELD_22 ──
const FIELD_22 = Buffer.from(
  "4747524501010100620200001052aa0d669c6a368f08338060d2ee0690053af84a41edcd3558556ec10f24f4" +
  "6c93ac64ca41a16732c46a2cb071246a79b8929032f9e1b6f4ef331bd53cabf29b09b97349a46e9863c0314e" +
  "1a0d80819fef8aabf03876b3d037db354a7ccb5c1bce96411fb3753f6f50e44c69c4ed617fa30efb8ffc0517" +
  "ff2f636739be1f304d999cfd6fd48bf69454199794c3dc88f55a4bdbd66534d5a061359cdfd1fb680cd37918" +
  "df9fdb3cf7d80067b0a3506c90063cf62b2ccec11e23913a2fd7c4ef091331967bb518a5ad1e551146b90821" +
  "be800883abadde39d6c80a5d798611466c748f075481806c5842ce45e6bd4e3368ec08fe2ec41ceb880cd862" +
  "49eb71693f79f0bccf9e590c3fae12519fe08c7a1905d0927690109e0df28574bb14847225db1a59230e6662" +
  "ed7730e15ff9a6c815cb41b420edeada735a4b03e181037c37c2c850257311df2f07b0a56e759372cbd0268e" +
  "3f13a292ee4373e38ab5096e0342a5e0d7fec6da2bbc265d74baadd2b24ee4f74862f82c21d6694bac53f8ce" +
  "80312a30068a6276a641c19b11d0305c6fe2f531ac7de578b29f543697f5c73663e6f23aa15277b6122dcd4d" +
  "4171e38f9ac0b173f39c58416a16c5c1f4a35acd065ce78f449cf538a249339e763272d458e4ed86c976591a" +
  "9c066b3a37111e44091eb6b5a795249f3e5145db022a6055f2cc675936391312f688f89627845df222a91156" +
  "555225be36f9714a0ba50246d0f003bda3c9c1292ab73b4f79635ddd023218eda93a302d79e023404c143965" +
  "44a930b98ed54771aca7fec10d095587685b473e81a9619764fad9256529dcd6e911f4f4629612287d4ee3ec" +
  "5389f6ec4ec020b0e2aac017232a9197be9e46239ce690fe5d4872b2e98e651510c971667f3aca8b59f3e9d5" +
  "0e43",
  "hex"
);

const DEVICES = [
  ["Asus ASUS_AI2501_B", "Android OS 12 / API-31 (SP1A.210812.016.C2)", "Adreno (TM) 640"],
  ["Redmi Note 12 Pro",  "Android OS 13 / API-33 (TP1A.220624.014)",   "Adreno (TM) 618"],
  ["Samsung SM-M135F",   "Android OS 13 / API-33 (TP1A.220624.014)",   "Mali-G68"],
  ["Realme RMX3630",     "Android OS 12 / API-31 (SP1A.210812.016)",   "Adreno (TM) 610"],
  ["Vivo V2149",         "Android OS 13 / API-33 (TP1A.220624.014)",   "Adreno (TM) 642L"],
  ["OnePlus CPH2411",    "Android OS 13 / API-33 (TP1A.220624.014)",   "Adreno (TM) 730"],
];

const UAS = [
  "GarenaMSDK/4.0.44(25028RN03A ;Android 15;ar;EG;app 1.132.1 2019121229;)",
  "GarenaMSDK/4.0.43(25028RN03A ;Android 14;en;IN;app 1.131.1 2019121229;)",
  "GarenaMSDK/4.0.45(25028RN03A ;Android 13;hi;IN;app 1.133.1 2019121229;)",
];

// ── HELPERS ──
function randomUA() {
  return UAS[Math.floor(Math.random() * UAS.length)];
}

function randomUUID() {
  return crypto.randomUUID();
}

function genPassword(prefix = "IYAN") {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let tail = "";
  for (let i = 0; i < 16; i++) tail += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${tail}`;
}

function genNickname(prefix = "IYAN", maxLen = 12) {
  const avail = maxLen - prefix.length;
  let digits = "";
  for (let i = 0; i < avail; i++) digits += Math.floor(Math.random() * 10);
  return `${prefix}${digits}`;
}

// ── PROTOBUF ──
function encodeVarint(n) {
  if (n < 0) return Buffer.alloc(0);
  const out = [];
  while (true) {
    let b = n & 0x7F;
    n = Math.floor(n / 128);
    if (n) b |= 0x80;
    out.push(b);
    if (!n) break;
  }
  return Buffer.from(out);
}

function buildProto(fields) {
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    const key = parseInt(k);
    if (typeof v === "number") {
      parts.push(encodeVarint((key << 3) | 0));
      parts.push(encodeVarint(v));
    } else if (typeof v === "string" || Buffer.isBuffer(v)) {
      const ev = Buffer.isBuffer(v) ? v : Buffer.from(v, "utf8");
      parts.push(encodeVarint((key << 3) | 2));
      parts.push(encodeVarint(ev.length));
      parts.push(ev);
    }
  }
  return Buffer.concat(parts);
}

// ── AES ENCRYPT (PKCS7 manual) ──
function encryptApi(plainHex) {
  const cipher = crypto.createCipheriv("aes-128-cbc", CONFIG.AES_KEY, CONFIG.AES_IV);
  const data = Buffer.from(plainHex, "hex");
  const padLen = 16 - (data.length % 16);
  const padded = Buffer.concat([data, Buffer.alloc(padLen, padLen)]);
  return Buffer.concat([cipher.update(padded), cipher.final()]).toString("hex");
}

// ── RARITY ──
function analyzePattern(accountId) {
  if (!accountId || accountId === "N/A" || !/^\d+$/.test(accountId)) return ["", 0];
  const freq = {};
  for (const d of accountId) freq[d] = (freq[d] || 0) + 1;
  let bestDigit = null, bestCount = 0;
  for (const [digit, count] of Object.entries(freq)) {
    if (count > bestCount) { bestCount = count; bestDigit = digit; }
  }
  if (bestCount >= 4) return [`${bestDigit}x${bestCount}`, bestCount * 3];
  return ["", 0];
}

function getTierName(score) {
  if (score >= 30) return "MYTHIC";
  if (score >= 21) return "LEGENDARY";
  if (score >= 15) return "EPIC";
  if (score >= 12) return "RARE";
  return "COMMON";
}

function checkRarity(accountId) {
  const [detail, score] = analyzePattern(accountId);
  const tier = getTierName(score);
  return { is_rare: score >= 12, score, tier, detail: detail || "-" };
}

// ══════════════════════════════════════════════════════════════════════════
//  REGISTER — MULTI VARIANT (biar tahan kalau 1 variant error)
// ══════════════════════════════════════════════════════════════════════════
async function registerGuest(password) {
  const variants = [
    // V1: original
    async () => {
      const payload = { app_id: 100067, client_type: 2, password, source: 2 };
      const bodyJson = JSON.stringify(payload);
      const sig = crypto.createHmac("sha256", CONFIG.HEX_KEY).update(bodyJson).digest("hex");
      const r = await axios.post(CONFIG.URL_GUEST_REGISTER, bodyJson, {
        headers: {
          "User-Agent": randomUA(),
          "Connection": "Keep-Alive",
          "Accept": "application/json",
          "Accept-Encoding": "gzip",
          "Authorization": `Signature ${sig}`,
          "Content-Type": "application/json; charset=utf-8",
          "Host": "100067.connect.garena.com",
        },
        timeout: CONFIG.HTTP_TIMEOUT, validateStatus: () => true, responseType: "text",
        httpsAgent,
      });
      return { status: r.status, data: r.data };
    },
    // V2: tanp Accept-Encoding
    async () => {
      const payload = { app_id: 100067, client_type: 2, password, source: 2 };
      const bodyJson = JSON.stringify(payload);
      const sig = crypto.createHmac("sha256", CONFIG.HEX_KEY).update(bodyJson).digest("hex");
      const r = await axios.post(CONFIG.URL_GUEST_REGISTER, bodyJson, {
        headers: {
          "User-Agent": randomUA(),
          "Authorization": `Signature ${sig}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        timeout: CONFIG.HTTP_TIMEOUT, validateStatus: () => true, responseType: "text",
        httpsAgent,
      });
      return { status: r.status, data: r.data };
    },
    // V3: source=1
    async () => {
      const payload = { app_id: 100067, client_type: 2, password, source: 1 };
      const bodyJson = JSON.stringify(payload);
      const sig = crypto.createHmac("sha256", CONFIG.HEX_KEY).update(bodyJson).digest("hex");
      const r = await axios.post(CONFIG.URL_GUEST_REGISTER, bodyJson, {
        headers: {
          "User-Agent": randomUA(),
          "Authorization": `Signature ${sig}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        timeout: CONFIG.HTTP_TIMEOUT, validateStatus: () => true, responseType: "text",
        httpsAgent,
      });
      return { status: r.status, data: r.data };
    },
    // V4: pakai x-www-form-urlencoded
    async () => {
      const body = `app_id=100067&client_type=2&password=${password}&source=2`;
      const sig = crypto.createHmac("sha256", CONFIG.HEX_KEY).update(body).digest("hex");
      const r = await axios.post(CONFIG.URL_GUEST_REGISTER, body, {
        headers: {
          "User-Agent": randomUA(),
          "Authorization": `Signature ${sig}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: CONFIG.HTTP_TIMEOUT, validateStatus: () => true, responseType: "text",
        httpsAgent,
      });
      return { status: r.status, data: r.data };
    },
    // V5: JSON tanpa spasi persis (kadang penting)
    async () => {
      const bodyJson = `{"app_id":100067,"client_type":2,"password":"${password}","source":2}`;
      const sig = crypto.createHmac("sha256", CONFIG.HEX_KEY).update(bodyJson).digest("hex");
      const r = await axios.post(CONFIG.URL_GUEST_REGISTER, bodyJson, {
        headers: {
          "User-Agent": randomUA(),
          "Authorization": `Signature ${sig}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        timeout: CONFIG.HTTP_TIMEOUT, validateStatus: () => true, responseType: "text",
        httpsAgent,
      });
      return { status: r.status, data: r.data };
    },
  ];

  for (let i = 0; i < variants.length; i++) {
    try {
      const r = await variants[i]();
      // cek berhasil
      if (r.status === 200) {
        try {
          const j = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
          if (j.code === 0 && j.data && j.data.uid) {
            return { uid: String(j.data.uid), variant: `V${i + 1}` };
          }
        } catch (e) {}
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════════
//  GRANT TOKEN
// ══════════════════════════════════════════════════════════════════════════
async function grantToken(uid, password) {
  try {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": randomUA(),
    };
    const body = new URLSearchParams({
      uid, password,
      response_type: "token",
      client_type: "2",
      client_secret: CONFIG.HEX_KEY_HEX,
      client_id: "100067",
    }).toString();

    const r = await axios.post(CONFIG.URL_TOKEN_GRANT, body, {
      headers, timeout: CONFIG.HTTP_TIMEOUT,
      validateStatus: () => true, httpsAgent,
    });
    if (r.status === 200 && r.data.open_id && r.data.access_token) {
      return { open_id: r.data.open_id, access_token: r.data.access_token };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  MAJOR REGISTER
// ══════════════════════════════════════════════════════════════════════════
async function majorRegister(access_token, open_id, uid, password, region, nick) {
  try {
    const lang = CONFIG.REGION_LANG[region.toUpperCase()] || "id";

    const keystream = [
      0x30,0x30,0x30,0x32,0x30,0x31,0x37,0x30,
      0x30,0x30,0x30,0x30,0x32,0x30,0x31,0x37,
      0x30,0x30,0x30,0x30,0x30,0x32,0x30,0x31,
      0x37,0x30,0x30,0x30,0x30,0x30,0x32,0x30,
    ];
    const fieldF14 = Buffer.alloc(open_id.length);
    for (let i = 0; i < open_id.length; i++) {
      fieldF14[i] = open_id.charCodeAt(i) ^ keystream[i % keystream.length];
    }

    const regMsg = {
      1: nick, 2: access_token, 3: open_id,
      5: 102000007, 6: 4, 7: 1, 13: 1,
      14: fieldF14, 15: lang, 16: 2,
      20: CONFIG.GAME_VERSION, 21: 1, 22: FIELD_22,
    };
    const data = buildProto(regMsg);
    const encHex = encryptApi(data.toString("hex"));
    const encBuffer = Buffer.from(encHex, "hex");

    const base = CONFIG.REGION_ENDPOINTS[region.toUpperCase()] || "https://loginbp.ppmainecoonghj.com";
    const url = `${base}/MajorRegister`;

    const headers = {
      "Host": base.replace("https://", ""),
      "User-Agent": "UnityPlayer/2018.4.12f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)",
      "Accept": "*/*",
      "Accept-Encoding": "deflate, gzip",
      "Authorization": "Bearer",
      "X-GA": "v1 1",
      "ReleaseVersion": CONFIG.RELEASE_VER,
      "Content-Type": "application/octet-stream",
      "X-Unity-Version": "2018.4.12f1",
      "Content-Length": encBuffer.length.toString(),
    };

    const r = await axios.post(url, encBuffer, {
      headers, timeout: CONFIG.HTTP_TIMEOUT,
      responseType: "text", validateStatus: () => true, httpsAgent,
    });
    return { status: r.status, body: String(r.data).slice(0, 300) };
  } catch (e) {
    return { status: null, body: e.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  MAJOR LOGIN
// ══════════════════════════════════════════════════════════════════════════
async function majorLogin(access_token, open_id, region) {
  try {
    const lang = CONFIG.REGION_LANG[region.toUpperCase()] || "id";
    const [model, osStr, gpu] = DEVICES[Math.floor(Math.random() * DEVICES.length)];
    const deviceUUID = randomUUID();
    const ipAddr = `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;

    const payload = {
      3: new Date().toISOString().slice(0, 19).replace("T", " "),
      4: "free fire", 5: 1, 7: CONFIG.GAME_VERSION, 8: osStr,
      9: "Handheld", 10: "Telkomsel", 11: "WIFI",
      12: 1280, 13: 720, 14: "240",
      15: "ARMv8 VFPv4 NEON VMH | 2200 | 8",
      16: 5951, 17: gpu, 18: `${gpu}|OpenGL ES 3.2`,
      19: `Google|${deviceUUID}`, 20: ipAddr, 21: lang,
      22: open_id, 23: "4", 24: "Handheld",
      25: model, 26: lang, 29: access_token, 30: 1,
      41: "Telkomsel", 42: "WIFI",
      57: Buffer.from("1ac4b80ecf0478a44203bf8fac6120f5", "utf8"),
      60: 30000, 61: 30000, 62: 2519, 63: 243,
      64: 32357, 65: 34308, 66: 32357, 67: 34308, 73: 1,
      76: 2, 78: 2, 79: 1,
      81: "32", 83: "2019118525", 85: 3,
      86: "OpenGLES3", 87: 4095, 88: 4,
      92: 19788, 93: "android_max",
      97: 1, 98: 1, 99: "4", 100: "4",
      104: 77149, 105: 1,
    };
    const data = buildProto(payload);
    const encHex = encryptApi(data.toString("hex"));
    const encBuffer = Buffer.from(encHex, "hex");

    const base = CONFIG.REGION_ENDPOINTS[region.toUpperCase()] || "https://loginbp.ppmainecoonghj.com";
    const url = `${base}/MajorLogin`;

    const headers = {
      "Host": base.replace("https://", ""),
      "User-Agent": "UnityPlayer/2018.4.12f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)",
      "Accept": "*/*",
      "Accept-Encoding": "deflate, gzip",
      "Authorization": "Bearer",
      "X-GA": "v1 1",
      "X-Ga-Sv": "1789534056",
      "ReleaseVersion": CONFIG.RELEASE_VER,
      "Content-Type": "application/octet-stream",
      "X-Unity-Version": "2018.4.12f1",
      "Content-Length": encBuffer.length.toString(),
    };

    const r = await axios.post(url, encBuffer, {
      headers, timeout: CONFIG.HTTP_TIMEOUT,
      responseType: "text", validateStatus: () => true, httpsAgent,
    });

    const text = String(r.data);
    if (r.status === 200 && text.length > 10) {
      const jwtStart = text.indexOf("eyJ");
      if (jwtStart !== -1) {
        let jwt = text.slice(jwtStart);
        const secondDot = jwt.indexOf(".", jwt.indexOf(".") + 1);
        if (secondDot !== -1) jwt = jwt.slice(0, secondDot + 44);

        try {
          const parts = jwt.split(".");
          if (parts.length >= 2) {
            let pp = parts[1];
            const pad = 4 - (pp.length % 4);
            if (pad !== 4) pp += "=".repeat(pad);
            const decoded = JSON.parse(Buffer.from(pp, "base64").toString());
            const accountId = decoded.account_id || decoded.external_id;
            if (accountId) {
              return { account_id: String(accountId), jwt_token: jwt };
            }
          }
        } catch (e) {}
      }
    }
    return { error: true, status: r.status, body: text.slice(0, 200) };
  } catch (e) {
    return { error: true, status: null, body: e.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  FULL PIPELINE
// ══════════════════════════════════════════════════════════════════════════
async function generateOne(region = "ID", namePrefix = "IYAN", passPrefix = "IYAN", minScore = 0, tierFilter = null) {
  try {
    const password = genPassword(passPrefix);

    const regResult = await registerGuest(password);
    if (!regResult) return null;
    const uid = regResult.uid;

    const tok = await grantToken(uid, password);
    if (!tok) return null;

    const nick = genNickname(namePrefix);

    // MajorRegister — WAJIB
    await majorRegister(tok.access_token, tok.open_id, uid, password, region, nick);

    // MajorLogin
    const login = await majorLogin(tok.access_token, tok.open_id, region);
    if (!login || login.error) return null;

    const rarity = checkRarity(login.account_id);
    if (rarity.score < minScore) return null;
    if (tierFilter) {
      const allowed = tierFilter.split(",").map(t => t.trim().toUpperCase());
      if (!allowed.includes(rarity.tier)) return null;
    }

    return {
      uid: String(uid),
      password,
      name: nick,
      region: region.toUpperCase(),
      account_id: String(login.account_id),
      jwt_token: login.jwt_token,
      score: rarity.score,
      tier: rarity.tier,
      detail: rarity.detail,
      is_rare: rarity.is_rare,
      open_id: tok.open_id,
      access_token: tok.access_token,
      register_variant: regResult.variant,
      created_at: new Date().toISOString(),
    };
  } catch (e) {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════════════════════════════════════════
app.get("/", (req, res) => {
  res.json({
    status: true,
    brand: "IyanXd",
    version: "1.2.0",
    owner: "IyanXd",
    endpoints: {
      "/gen":          "GET — generate akun",
      "/gen_batch":    "GET — generate batch",
      "/debug_gen":    "GET — debug step-by-step",
      "/test_register":"GET — test variasi register",
      "/rarity_check": "GET — cek rarity account_id",
      "/health":       "GET — health check",
    },
    example: "/gen?region=ID&count=1&name=IYAN",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: true, time: new Date().toISOString() });
});

app.get("/gen", async (req, res) => {
  const region = (req.query.region || "ID").toUpperCase();
  const count = Math.min(Math.max(parseInt(req.query.count) || 1, 1), 50);
  const name = req.query.name || "IYAN";
  const passwordPrefix = req.query.password_prefix || "IYAN";
  const minScore = parseInt(req.query.min_score) || 0;
  const tier = req.query.tier || null;

  const results = [];
  let errors = 0;

  for (let i = 0; i < count; i++) {
    const acc = await generateOne(region, name, passwordPrefix, minScore, tier);
    if (acc) results.push(acc);
    else errors++;
  }

  res.json({
    status: results.length > 0,
    region,
    requested: count,
    success: results.length,
    failed: errors,
    results,
  });
});

app.get("/gen_batch", async (req, res) => {
  const region = (req.query.region || "ID").toUpperCase();
  const count = Math.min(Math.max(parseInt(req.query.count) || 10, 1), 100);
  const name = req.query.name || "IYAN";
  const passwordPrefix = req.query.password_prefix || "IYAN";
  const minScore = parseInt(req.query.min_score) || 0;
  const tier = req.query.tier || null;
  const workers = Math.min(Math.max(parseInt(req.query.workers) || 4, 1), 20);

  const results = [];
  const queue = [...Array(count).keys()];

  const tasks = Array(workers).fill(0).map(async () => {
    while (queue.length > 0) {
      const idx = queue.shift();
      if (idx === undefined) break;
      const acc = await generateOne(region, name, passwordPrefix, minScore, tier);
      if (acc) results.push(acc);
    }
  });

  await Promise.all(tasks);

  res.json({
    status: results.length > 0,
    region,
    requested: count,
    success: results.length,
    failed: count - results.length,
    results,
  });
});

app.get("/rarity_check", (req, res) => {
  const accountId = req.query.account_id;
  if (!accountId) return res.status(400).json({ status: false, error: "account_id required" });
  const rarity = checkRarity(accountId);
  res.json({ status: true, account_id: accountId, ...rarity });
});

// ── TEST REGISTER VARIANTS ──
app.get("/test_register", async (req, res) => {
  const password = genPassword("IYAN");
  const log = [];

  const variants = [
    { name: "V1_original_json", ct: "application/json; charset=utf-8", body: null },
    { name: "V2_no_accept", ct: "application/json; charset=utf-8", body: null },
    { name: "V3_source_1", ct: "application/json; charset=utf-8", body: null },
    { name: "V4_urlencoded", ct: "application/x-www-form-urlencoded", body: null },
    { name: "V5_json_tight", ct: "application/json; charset=utf-8", body: null },
  ];

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    let bodyJson;
    if (i === 2) {
      bodyJson = JSON.stringify({ app_id: 100067, client_type: 2, password, source: 1 });
    } else if (i === 3) {
      bodyJson = `app_id=100067&client_type=2&password=${password}&source=2`;
    } else if (i === 4) {
      bodyJson = `{"app_id":100067,"client_type":2,"password":"${password}","source":2}`;
    } else {
      bodyJson = JSON.stringify({ app_id: 100067, client_type: 2, password, source: 2 });
    }

    const sig = crypto.createHmac("sha256", CONFIG.HEX_KEY).update(bodyJson).digest("hex");

    const headers = {
      "User-Agent": randomUA(),
      "Authorization": `Signature ${sig}`,
      "Content-Type": v.ct,
    };
    if (i === 0) {
      headers["Connection"] = "Keep-Alive";
      headers["Accept"] = "application/json";
      headers["Accept-Encoding"] = "gzip";
      headers["Host"] = "100067.connect.garena.com";
    }

    try {
      const r = await axios.post(CONFIG.URL_GUEST_REGISTER, bodyJson, {
        headers, timeout: 10000, validateStatus: () => true,
        responseType: "text", httpsAgent,
      });
      log.push({
        variant: v.name,
        status: r.status,
        body: String(r.data).slice(0, 200),
      });
    } catch (e) {
      log.push({ variant: v.name, error: e.message });
    }
  }

  res.json({ status: true, password, results: log });
});

// ── DEBUG GEN ──
app.get("/debug_gen", async (req, res) => {
  const region = (req.query.region || "ID").toUpperCase();
  const log = [];

  const password = genPassword("IYAN");
  log.push(`[1] password: ${password}`);

  // Step 1: register (pakai multi-variant)
  const regResult = await registerGuest(password);
  if (!regResult) {
    log.push(`[1] ❌ register gagal di semua variant`);
    return res.json({ status: false, step: "register_all_failed", log });
  }
  const uid = regResult.uid;
  log.push(`[1] ✅ uid=${uid} (variant: ${regResult.variant})`);

  // Step 2: grant
  let openId, accessToken;
  try {
    const tok = await grantToken(uid, password);
    if (!tok) {
      log.push(`[2] ❌ grant gagal`);
      return res.json({ status: false, step: "grant_fail", log });
    }
    openId = tok.open_id;
    accessToken = tok.access_token;
    log.push(`[2] ✅ open_id=${openId.slice(0, 30)}...`);
  } catch (e) {
    log.push(`[2] EXC: ${e.message}`);
    return res.json({ status: false, step: "grant_exc", log });
  }

  // Step 2.5: MajorRegister
  const nick = genNickname("IYAN");
  const regResp = await majorRegister(accessToken, openId, uid, password, region, nick);
  log.push(`[2.5] MajorRegister HTTP ${regResp.status}`);
  log.push(`[2.5] body: ${regResp.body}`);

  // Step 3: MajorLogin
  const login = await majorLogin(accessToken, openId, region);
  if (login && !login.error) {
    log.push(`[3] ✅ account_id=${login.account_id}`);
    const rarity = checkRarity(login.account_id);
    return res.json({
      status: true,
      step: "done",
      uid, password,
      open_id: openId,
      account_id: login.account_id,
      jwt_token: login.jwt_token.slice(0, 60) + "...",
      tier: rarity.tier,
      score: rarity.score,
      log,
    });
  }

  log.push(`[3] ❌ MajorLogin failed: ${login ? login.body : "unknown"}`);
  return res.json({ status: false, step: "major_fail", log });
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ status: false, error: "endpoint not found", path: req.path });
});

// ── START ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   IyanXd API SERVER — Node.js v1.2           ║
  ║   Port: ${PORT}                                  
  ╚══════════════════════════════════════════════╝
  `);
});
