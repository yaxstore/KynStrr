// ============================================================
// KynSt API — SYNT∆X — Render Express Server
// ============================================================

import express from "express";
import crypto from "node:crypto";

const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = "v11.2-syntax";

// ── CORS ──
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── CONSTANTS ──
const AES_KEY = Buffer.from([89,103,38,116,99,37,68,69,117,104,54,37,90,99,94,56]);
const AES_IV  = Buffer.from([54,111,121,90,68,114,50,50,69,51,121,99,104,106,77,37]);
const HEX_KEY = Buffer.from("32656534343831396539623435393838343531343130363762323831363231383734643064356437616639643866376530306331653534373135623764316533", "hex");
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
  "0e43", "hex");

const XOR_KEYS = [
  0x30,0x30,0x30,0x32,0x30,0x31,0x37,0x30,0x30,0x30,0x30,0x30,0x32,0x30,0x31,0x37,
  0x30,0x30,0x30,0x30,0x30,0x32,0x30,0x31,0x37,0x30,0x30,0x30,0x30,0x30,0x32,0x30,
];

const REGION_LANG = { ME:"ar", IND:"hi", ID:"id", VN:"vi", TH:"th", BD:"bn", PK:"ur", TW:"zh", CIS:"ru", SAC:"es", BR:"pt" };
const VALID_REGIONS = Object.keys(REGION_LANG);

const REGION_IP_PREFIX = {
  ID:["103.","114.","118.","125.","180."], IND:["49.","103.","106.","115.","182."],
  VN:["113.","115.","171.","203.","210."], TH:["49.","101.","110.","171.","202."],
  BD:["103.","114.","119.","202.","203."], PK:["39.","111.","119.","175.","202."],
  TW:["36.","39.","61.","111.","114."], ME:["5.","37.","46.","94.","176."],
  CIS:["5.","31.","37.","46.","95."], SAC:["177.","179.","181.","186.","189."],
  BR:["177.","179.","181.","186.","189."],
};

const RELEASE_VERSION = "OB55";
const GAME_VERSION = "2.132.4";
const APP_ID = 100067;
const CLIENT_SECRET = "2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3";

// ── CRYPTO ──
function pkcs7Pad(data) {
  const bs = 16;
  const padLen = bs - (data.length % bs);
  return Buffer.concat([data, Buffer.alloc(padLen, padLen)]);
}
function aesEncrypt(buf) {
  const cipher = crypto.createCipheriv("aes-128-cbc", AES_KEY, AES_IV);
  return Buffer.concat([cipher.update(pkcs7Pad(buf)), cipher.final()]);
}
function hmacSign(body) {
  return crypto.createHmac("sha256", HEX_KEY).update(body).digest("hex");
}
function encodeVarint(n) {
  const out = [];
  while (true) {
    let b = n & 0x7f;
    n >>>= 7;
    if (n) b |= 0x80;
    out.push(b);
    if (!n) break;
  }
  return Buffer.from(out);
}
function buildProto(fields) {
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    const key = Number(k);
    if (v && typeof v === "object" && !Buffer.isBuffer(v)) {
      const nested = buildProto(v);
      parts.push(encodeVarint((key << 3) | 2), encodeVarint(nested.length), nested);
    } else if (typeof v === "number") {
      parts.push(encodeVarint((key << 3) | 0), encodeVarint(v));
    } else {
      const buf = Buffer.isBuffer(v) ? v : Buffer.from(String(v));
      parts.push(encodeVarint((key << 3) | 2), encodeVarint(buf.length), buf);
    }
  }
  return Buffer.concat(parts);
}
function encodeF14(openId) {
  const buf = Buffer.from(openId, "latin1");
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ XOR_KEYS[i % XOR_KEYS.length];
  return out;
}
function b64urlDecode(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

// ── DEVICE ──
const DEVICE_MODELS = [
  ["SM-A525F","ARMv8 VFPv4 NEON VMH | 2200 | 8","Adreno (TM) 618"],
  ["Redmi Note 10","ARMv8 VFPv4 NEON VMH | 2200 | 8","Adreno (TM) 619"],
  ["Poco X3","ARMv8 VFPv4 NEON VMH | 2300 | 8","Adreno (TM) 618"],
  ["Pixel 7 Pro","ARMv8 VFPv4 NEON VMH | 2800 | 8","Mali-G710"],
  ["OnePlus 11","ARMv8 VFPv4 NEON VMH | 3200 | 8","Adreno (TM) 740"],
  ["Infinix X6819","ARMv8 VFPv4 NEON VMH | 2400 | 8","Mali-G57"],
  ["vivo 1906","ARMv8 VFPv4 NEON VMH | 2000 | 8","Adreno (TM) 610"],
];
const ANDROID_VERSIONS = [
  ["Android OS 11 / API-30 (RP1A.201005.001)","11","30"],
  ["Android OS 12 / API-31 (SP1A.210812.016)","12","31"],
  ["Android OS 13 / API-33 (TQ3A.230805.001)","13","33"],
  ["Android OS 14 / API-34 (UP1A.231005.007)","14","34"],
];
const UAS = [
  "GarenaMSDK/4.0.42(SM-A525F ;Android)",
  "GarenaMSDK/4.0.39(SM-A325M;Android 13;en;HK;)",
  "GarenaMSDK/4.0.41(SM-S918B;Android 14;en;IN;)",
  "GarenaMSDK/4.0.42(Pixel 7 Pro;Android 14;en;US;)",
];
const NETWORKS  = ["WIFI","4G","5G"];
const OPERATORS = ["Telkomsel","Indosat","XL Axiata","Airtel","Jio","Vodafone"];
const SDK_VER   = ["4.0.38","4.0.39","4.0.40","4.0.41","4.0.42"];
const LANGS     = ["en","in","id","hi","vi","th","pt"];
const HEXCHARS  = "0123456789abcdef";

const rh = n => { let s=""; for(let i=0;i<n;i++) s += HEXCHARS[(Math.random()*16)|0]; return s; };
const pick = a => a[(Math.random()*a.length)|0];

function randDevice() {
  const [model, cpu, gpu] = pick(DEVICE_MODELS);
  const [androidFull, androidVer, apiLevel] = pick(ANDROID_VERSIONS);
  return {
    model, brand: model.split(" ")[0], cpu, gpu,
    android_full: androidFull, android_version: androidVer, api_level: apiLevel,
    operator: pick(OPERATORS), network: pick(NETWORKS), sdk: pick(SDK_VER),
    mac: "02:" + Array.from({length:5}, () => rh(2)).join(":"),
    device_id: rh(32), android_id: rh(16),
    uuid: `${rh(8)}-${rh(4)}-${rh(4)}-${rh(4)}-${rh(12)}`,
    imei: rh(15), lang_code: pick(LANGS),
  };
}
const randUA = () => pick(UAS);
function randIP(region = "ID") {
  const prefixes = REGION_IP_PREFIX[region.toUpperCase()] || REGION_IP_PREFIX.ID;
  const p = pick(prefixes);
  return `${p}${(Math.random()*255)|0}.${(Math.random()*255)|0}.${(Math.random()*254)+1|0}`;
}
function deviceHeaders(dev, region) {
  return {
    "X-Device-Id": dev.device_id, "X-Android-Id": dev.android_id,
    "X-Device-Model": dev.model, "X-Device-Brand": dev.brand,
    "X-OS-Version": dev.android_version, "X-API-Level": dev.api_level,
    "X-SDK-Version": dev.sdk, "X-Network-Type": dev.network,
    "X-Operator": dev.operator, "X-IMEI": dev.imei, "X-Mac": dev.mac,
    "X-Client-Uuid": dev.uuid,
    "X-Forwarded-For": randIP(region), "X-Real-IP": randIP(region),
    "X-Client-IP": randIP(region), "CF-Connecting-IP": randIP(region),
    "True-Client-IP": randIP(region), "Forwarded": `for=${randIP(region)}`,
  };
}

// ── GARENA ──
async function fetchTimeout(url, opts = {}, ms = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  finally { clearTimeout(timer); }
}
const randDelay = (min=50, max=300) => new Promise(r => setTimeout(r, min + Math.random()*(max-min)));

async function registerGuest(region) {
  const dev = randDevice();
  const ua = randUA();
  const password = `KynSt_${Array.from({length:16}, () => "0123456789ABCDEF"[(Math.random()*16)|0]).join("")}`;
  const bodyJson = JSON.stringify({ app_id: APP_ID, client_type: 2, password, source: 2 });
  const signature = hmacSign(bodyJson);

  await randDelay();

  const res = await fetchTimeout("https://100067.connect.garena.com/api/v2/oauth/guest:register", {
    method: "POST",
    headers: {
      ...deviceHeaders(dev, region),
      "User-Agent": ua,
      "Authorization": `Signature ${signature}`,
      "Content-Type": "application/json; charset=utf-8",
      "Host": "100067.connect.garena.com",
    },
    body: bodyJson,
  });
  if (!res.ok) return null;
  const j = await res.json();
  const uid = j?.data?.uid;
  if (!uid) return null;
  return getToken(uid, password, region, dev, ua);
}

async function getToken(uid, password, region, dev, ua) {
  const body = new URLSearchParams({
    uid: String(uid), password,
    response_type: "token", client_type: "2",
    client_secret: CLIENT_SECRET, client_id: String(APP_ID),
  }).toString();

  await randDelay();

  const res = await fetchTimeout("https://100067.connect.garena.com/oauth/guest/token/grant", {
    method: "POST",
    headers: { ...deviceHeaders(dev, region), "User-Agent": ua, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const j = await res.json();
  if (!j.open_id || !j.access_token) return null;

  return majorRegister(j.access_token, j.open_id, encodeF14(j.open_id), uid, password, region, dev, ua);
}

async function majorRegister(accessToken, openId, field, uid, password, region, dev, ua) {
  const isME = ["ME","TH"].includes(region.toUpperCase());
  const url = isME ? "https://loginbp.common.ggbluefox.com/MajorRegister" : "https://loginbp.ppmainecoonghj.com/MajorRegister";
  const name = "KynSt" + Array.from({length:6}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[(Math.random()*36)|0]).join("");
  const lang = REGION_LANG[region.toUpperCase()] || "en";

  const proto = buildProto({
    1: name, 2: accessToken, 3: openId, 5: 102000007, 6: 4, 7: 1, 13: 1,
    14: field, 15: lang, 16: 2, 20: GAME_VERSION, 21: 1, 22: FIELD_22,
  });
  const encrypted = aesEncrypt(proto);

  await randDelay();

  await fetchTimeout(url, {
    method: "POST",
    headers: {
      "Host": isME ? "loginbp.common.ggbluefox.com" : "loginbp.ppmainecoonghj.com",
      "User-Agent": "UnityPlayer/2018.4.12f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)",
      "Authorization": "Bearer", "X-GA": "v1 1",
      "ReleaseVersion": RELEASE_VERSION,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Unity-Version": "2018.4.12f1",
    },
    body: encrypted,
  });

  return majorLogin(uid, password, accessToken, openId, region, dev, name);
}

async function majorLogin(uid, password, accessToken, openId, region, dev, name) {
  const lang = REGION_LANG[region.toUpperCase()] || "en";
  const isME = ["ME","TH"].includes(region.toUpperCase());
  const url = isME ? "https://loginbp.common.ggbluefox.com/MajorLogin" : "https://loginbp.ppmainecoonghj.com/MajorLogin";
  const ts = new Date().toISOString().slice(0,19).replace("T"," ");

  const payload = {
    3: ts, 4: "free fire", 5: 1, 7: GAME_VERSION,
    8: dev.android_full, 9: "Handheld", 10: dev.operator, 11: dev.network,
    12: 1280, 13: 720, 14: "240", 15: dev.cpu, 16: 5951, 17: dev.gpu,
    18: `${dev.gpu}|OpenGL ES 3.2`, 19: `Google|${dev.uuid}`,
    20: randIP(region), 21: lang, 22: Buffer.from(openId, "latin1"),
    23: "4", 24: "Handheld", 25: dev.model, 26: lang,
    29: Buffer.from(accessToken), 30: 1, 41: dev.operator, 42: dev.network,
    57: "1ac4b80ecf0478a44203bf8fac6120f5",
    60: 30000, 61: 30000, 62: 2519, 63: 243, 64: 32357, 65: 34308, 66: 32357, 67: 34308, 73: 1,
    76: 2, 78: 2, 79: 1, 81: "32", 83: "2019118525", 85: 3,
    86: "OpenGLES3", 87: 4095, 88: 4, 92: 19788, 93: "android_max",
    97: 1, 98: 1, 99: "4", 100: "4", 104: 77149, 105: 1,
  };

  const data = buildProto(payload);
  const encHex = aesEncrypt(data).toString("hex");

  await randDelay();

  const res = await fetchTimeout(url, {
    method: "POST",
    headers: {
      "Host": isME ? "loginbp.common.ggbluefox.com" : "loginbp.ppmainecoonghj.com",
      "User-Agent": "UnityPlayer/2018.4.12f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)",
      "Authorization": "Bearer", "X-GA": "v1 1", "X-Ga-Sv": "1789534056",
      "ReleaseVersion": RELEASE_VERSION,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Unity-Version": "2018.4.12f1",
    },
    body: Buffer.from(encHex, "hex"),
  });

  if (!res.ok) return null;
  const text = await res.text();
  const jwtIdx = text.indexOf("eyJ");
  if (jwtIdx === -1) return null;

  let jwt = text.slice(jwtIdx);
  const secondDot = jwt.indexOf(".", jwt.indexOf(".") + 1);
  if (secondDot !== -1) jwt = jwt.slice(0, secondDot + 44);

  let account_id = "N/A";
  try {
    const parts = jwt.split(".");
    const claims = JSON.parse(b64urlDecode(parts[1]).toString());
    account_id = claims.account_id || claims.external_id || "N/A";
  } catch {}

  return {
    uid: String(uid), password, name,
    account_id: String(account_id), jwt_token: jwt,
    region: region.toUpperCase(),
    device_model: dev.model, device_id: dev.device_id,
    created_at: new Date().toISOString(),
  };
}

// ── ROUTES ──
app.get("/", (req, res) => {
  res.json({
    status: true, service: "KynSt API", version: VERSION, team: "SYNT∆X",
    endpoints: { health:"/health", gen:"/gen?region=ID&count=1", bulk:"/bulk?region=ID&count=5", regions:"/regions" },
  });
});

app.get("/health", (req, res) => {
  res.json({ status: true, alive: true, version: VERSION, ts: Date.now(), src: "render" });
});

app.get("/regions", (req, res) => {
  res.json({ status: true, regions: VALID_REGIONS });
});

app.get(["/gen", "/api/gen", "/bulk"], async (req, res) => {
  const region = (req.query.region || "ID").toUpperCase();
  let count = parseInt(req.query.count || "1", 10);
  if (isNaN(count) || count < 1) count = 1;
  const maxCount = req.path === "/bulk" ? 20 : 10;
  count = Math.min(count, maxCount);

  if (!VALID_REGIONS.includes(region)) {
    return res.status(400).json({ status: false, error: "invalid region", valid: VALID_REGIONS });
  }

  const t0 = Date.now();
  const results = [];
  const errors = [];

  const tasks = Array.from({ length: count }, (_, i) =>
    registerGuest(region)
      .then(acc => {
        if (acc && acc.account_id && acc.account_id !== "N/A") results.push(acc);
        else errors.push({ idx: i, reason: "invalid_account" });
      })
      .catch(e => errors.push({ idx: i, reason: String(e).slice(0, 100) }))
  );
  await Promise.all(tasks);

  res.json({
    status: results.length > 0,
    region, requested: count, count: results.length, failed: errors.length,
    results, errors: errors.slice(0, 5),
    elapsed_ms: Date.now() - t0, ts: Date.now(),
    src: "render",
  });
});

// ── LISTEN ──
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[KynSt] Render server running on port ${PORT}`);
});