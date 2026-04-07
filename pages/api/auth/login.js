import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../../lib/prisma';
import { sha256, setSessionCookie, sessionExpiresAt, getClientIp } from '../../../lib/auth';

function normalize(v) { return typeof v === 'string' ? v.trim() : ''; }

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch { return {}; }
}

function wantsJson(req) {
  const accept = String(req.headers.accept || '').toLowerCase();
  const xrw    = String(req.headers['x-requested-with'] || '').toLowerCase();
  const mode   = String((req.query && req.query.responseMode) || '').toLowerCase();
  return mode === 'json' || xrw === 'xmlhttprequest' || accept.includes('application/json');
}

function safeRedirect(target) {
  const v = normalize(target);
  if (!v || !v.startsWith('/') || v.startsWith('//')) return '/dashboard';
  return v;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (wantsJson(req)) return res.status(200).json({ ok: true, loginUrl: '/login-classic' });
    return res.redirect(303, '/login-classic');
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    if (wantsJson(req)) return res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return res.redirect(303, '/login-classic?error=method_not_allowed');
  }

  try {
    const body       = parseBody(req);
    const email      = normalize(body.email).toLowerCase();
    const password   = normalize(body.password);
    const redirectTo = safeRedirect(body.redirectTo || '/dashboard');

    if (!email || !password) {
      if (wantsJson(req)) return res.status(400).json({ ok: false, error: 'Email et mot de passe requis.' });
      return res.redirect(303, '/login-classic?error=missing_credentials');
    }

    const authAccount = await prisma.authAccount.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!authAccount?.passwordHash) {
      if (wantsJson(req)) return res.status(401).json({ ok: false, error: 'Identifiants invalides.' });
      return res.redirect(303, '/login-classic?error=invalid_credentials');
    }

    const valid = await bcrypt.compare(password, authAccount.passwordHash);
    if (!valid) {
      if (wantsJson(req)) return res.status(401).json({ ok: false, error: 'Identifiants invalides.' });
      return res.redirect(303, '/login-classic?error=invalid_credentials');
    }

    // Token aléatoire + session en base avec bt_session (lib/auth standard)
    const rawToken = crypto.randomBytes(32).toString('hex');

    await prisma.authSession.create({
      data: {
        accountId: authAccount.id,
        tokenHash: sha256(rawToken),
        expiresAt: sessionExpiresAt(),
        userAgent: req.headers['user-agent'] || null,
        ipAddress: getClientIp(req) || null,
      },
    });

    // Pose le cookie bt_session (même nom que lib/auth → compatible me.js + logout.js)
    setSessionCookie(res, rawToken);

    const user = authAccount.user;
    if (wantsJson(req)) {
      return res.status(200).json({
        ok: true, redirectTo,
        user: { id: user.id, email: user.email, name: user.name || '' },
      });
    }
    return res.redirect(303, redirectTo);

  } catch (error) {
    console.error('[auth/login] Exception:', error.message);
    if (wantsJson(req)) return res.status(500).json({ ok: false, error: 'Erreur interne.' });
    return res.redirect(303, '/login-classic?error=server_error');
  }
}
