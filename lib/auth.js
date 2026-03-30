import crypto from 'crypto';

const SESSION_COOKIE = 'bt_session';
const SESSION_TTL_SECONDS = Number(process.env.AUTH_SESSION_TTL_SECONDS || 60 * 60 * 24 * 7);
const TWO_FA_WINDOW = Number(process.env.AUTH_2FA_WINDOW || 1);

function b64url(buf) {
  return buf.toString('base64url');
}

export function randomToken(size = 32) {
  return b64url(crypto.randomBytes(size));
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return acc;
      const key = pair.slice(0, idx);
      const value = decodeURIComponent(pair.slice(idx + 1));
      acc[key] = value;
      return acc;
    }, {});
}

export function setSessionCookie(res, token, maxAge = SESSION_TTL_SECONDS) {
  const secure = (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://');
  const cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  const secure = (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://');
  const cookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookie);
}

export function getSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[SESSION_COOKIE] || null;
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) return reject(err);
      resolve(key);
    });
  });
  return `scrypt$${salt.toString('hex')}$${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  if (!encoded || !encoded.startsWith('scrypt$')) return false;
  const [, saltHex, hashHex] = encoded.split('$');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, expected.length, (err, key) => {
      if (err) return reject(err);
      resolve(Buffer.from(key));
    });
  });
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function base32Encode(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const b of buffer) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    if (!chunk) break;
    out += alphabet[parseInt(chunk.padEnd(5, '0'), 2)];
  }
  return out;
}

function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = String(input || '').toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secretB32, counter) {
  const key = base32Decode(secretB32);
  const ctr = Buffer.alloc(8);
  ctr.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  ctr.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac('sha1', key).update(ctr).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, '0');
}

export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

export function buildOtpauthUri(email, secret) {
  const issuer = encodeURIComponent(process.env.AUTH_2FA_ISSUER || 'Buttertech');
  const account = encodeURIComponent(email);
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotp(code, secret) {
  const normalized = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized) || !secret) return false;
  const step = Math.floor(Date.now() / 1000 / 30);
  for (let i = -TWO_FA_WINDOW; i <= TWO_FA_WINDOW; i += 1) {
    if (hotp(secret, step + i) === normalized) return true;
  }
  return false;
}

export function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
}

export function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}
