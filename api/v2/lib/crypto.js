import crypto from 'crypto';

// ============================================================
// KONFIGURASI AES (dari cv.py lu)
// ============================================================
const AES_KEY = Buffer.from([89, 103, 38, 116, 99, 37, 68, 69, 117, 104, 54, 37, 90, 99, 94, 56]);
const AES_IV  = Buffer.from([54, 111, 121, 90, 68, 114, 50, 50, 69, 51, 121, 99, 104, 106, 77, 37]);
const API_SECRET_KEY = "2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3";

// ============================================================
// AES ENCRYPT (CBC + PKCS7 padding)
// ============================================================
export function encryptApiPayload(hexString) {
  const cipher = crypto.createCipheriv('aes-128-cbc', AES_KEY, AES_IV);
  const data = Buffer.from(hexString, 'hex');
  const padded = padPKCS7(data, 16);
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
  return encrypted.toString('hex');
}

function padPKCS7(buf, blockSize) {
  const padLen = blockSize - (buf.length % blockSize);
  const pad = Buffer.alloc(padLen, padLen);
  return Buffer.concat([buf, pad]);
}

// ============================================================
// HMAC-SHA256 SIGNATURE
// ============================================================
export function generateSignature(payload) {
  return crypto
    .createHmac('sha256', API_SECRET_KEY)
    .update(payload)
    .digest('hex');
}

// ============================================================
// PASSWORD GENERATOR
// ============================================================
export function generateUltraSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) {
    s += chars[bytes[i] % chars.length];
  }
  return `Yax_${s}`;
}
