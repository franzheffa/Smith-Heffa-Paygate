import { parseCookies, sha256 } from './auth';

const ORANGE_OTP_CHALLENGE_COOKIE = 'orange_otp_challenge';
const ORANGE_OTP_VERIFIED_COOKIE = 'orange_otp_verified';

function cookieSecret() {
  return String(
    process.env.ORANGE_OTP_COOKIE_SECRET
    || process.env.AUTH_SESSION_SECRET
    || process.env.NEXTAUTH_SECRET
    || 'orange-otp-dev-secret'
  );
}

function secureCookie() {
  return String(process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://');
}

function baseCookie(maxAge, httpOnly = true) {
  return `Path=/; SameSite=Lax; Max-Age=${maxAge}${httpOnly ? '; HttpOnly' : ''}${secureCookie() ? '; Secure' : ''}`;
}

function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = sha256(`${body}:${cookieSecret()}`);
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sha256(`${body}:${cookieSecret()}`);
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }
}

export function buildOrangeOtpChallenge(phoneNumber, country, otp) {
  const expiresAt = Date.now() + (5 * 60 * 1000);
  return {
    phoneNumber,
    country,
    expiresAt,
    otpHash: sha256(`${otp}:${cookieSecret()}`)
  };
}

export function setOrangeOtpChallenge(res, payload) {
  const cookie = `${ORANGE_OTP_CHALLENGE_COOKIE}=${encodeURIComponent(signPayload(payload))}; ${baseCookie(5 * 60)}`;
  const clearVerified = `${ORANGE_OTP_VERIFIED_COOKIE}=; ${baseCookie(0)}`;
  res.setHeader('Set-Cookie', [cookie, clearVerified]);
}

export function setOrangeOtpVerified(res, payload) {
  const value = signPayload({
    phoneNumber: payload.phoneNumber,
    country: payload.country,
    verifiedAt: Date.now(),
    expiresAt: Date.now() + (15 * 60 * 1000)
  });
  const verifiedCookie = `${ORANGE_OTP_VERIFIED_COOKIE}=${encodeURIComponent(value)}; ${baseCookie(15 * 60)}`;
  const clearChallenge = `${ORANGE_OTP_CHALLENGE_COOKIE}=; ${baseCookie(0)}`;
  res.setHeader('Set-Cookie', [verifiedCookie, clearChallenge]);
}

export function clearOrangeOtp(res) {
  res.setHeader('Set-Cookie', [
    `${ORANGE_OTP_CHALLENGE_COOKIE}=; ${baseCookie(0)}`,
    `${ORANGE_OTP_VERIFIED_COOKIE}=; ${baseCookie(0)}`
  ]);
}

export function getOrangeOtpState(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return {
    challenge: verifyToken(cookies[ORANGE_OTP_CHALLENGE_COOKIE] || ''),
    verified: verifyToken(cookies[ORANGE_OTP_VERIFIED_COOKIE] || '')
  };
}

export function verifyOrangeOtpChallenge(req, { phoneNumber, country, otp }) {
  const { challenge } = getOrangeOtpState(req);
  if (!challenge) {
    return { ok: false, error: 'Aucune demande OTP active. Demandez un nouveau code.' };
  }
  if (challenge.expiresAt < Date.now()) {
    return { ok: false, error: 'Le code OTP a expiré. Demandez un nouveau code.' };
  }
  if (challenge.phoneNumber !== phoneNumber || challenge.country !== country) {
    return { ok: false, error: 'Le code OTP ne correspond pas à ce numéro.' };
  }
  const otpHash = sha256(`${otp}:${cookieSecret()}`);
  if (otpHash !== challenge.otpHash) {
    return { ok: false, error: 'Code OTP invalide.' };
  }
  return { ok: true, challenge };
}

export function isOrangeOtpVerified(req, { phoneNumber, country }) {
  const { verified } = getOrangeOtpState(req);
  if (!verified) {
    return { ok: false, error: 'Vérification OTP Orange requise avant envoi.' };
  }
  if (verified.expiresAt < Date.now()) {
    return { ok: false, error: 'Session OTP expirée. Redemandez un code Orange.' };
  }
  if (verified.phoneNumber !== phoneNumber || verified.country !== country) {
    return { ok: false, error: 'Le numéro vérifié ne correspond pas à cette opération.' };
  }
  return { ok: true, verified };
}
