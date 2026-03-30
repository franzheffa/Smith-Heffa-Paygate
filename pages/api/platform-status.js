function boolEnv(name, fallback = false) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(String(raw).toLowerCase());
}

function hasEnv(name) {
  return Boolean(process.env[name] && String(process.env[name]).trim() !== '');
}

function railStatus() {
  const stripe = hasEnv('STRIPE_SECRET_KEY');
  const paypalEnabled = boolEnv('PAYPAL_ENABLED', false);
  const applePayDomainReady = boolEnv('STRIPE_APPLE_PAY_DOMAIN_VERIFIED', false);
  const mtnReady =
    hasEnv('MTN_MOMO_API_USER_ID') &&
    hasEnv('MTN_MOMO_API_KEY') &&
    hasEnv('MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY');
  const orangeReady =
    hasEnv('ORANGE_CLIENT_ID') &&
    hasEnv('ORANGE_CLIENT_SECRET') &&
    hasEnv('ORANGE_API_KEY');

  return {
    stripe: stripe ? 'active' : 'missing_credentials',
    paypal: stripe ? (paypalEnabled ? 'active' : 'card_fallback') : 'blocked',
    apple_pay: stripe ? (applePayDomainReady ? 'active' : 'requires_domain_verification') : 'blocked',
    mtn_momo: mtnReady ? 'sandbox_or_live_ready' : 'simulation',
    orange_money: orangeReady ? 'sandbox_or_live_ready' : 'simulation'
  };
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authEnabled = boolEnv('AUTH_ENABLED', hasEnv('DATABASE_URL'));
  const twoFactorEnabled = boolEnv('AUTH_2FA_ENABLED', false);
  const biometricEnabled = boolEnv('AUTH_BIOMETRIC_ENABLED', false);

  const modules = {
    viize_parking: boolEnv('VIIZE_ENABLED', true) ? 'active' : 'pending',
    buttertech_academy: boolEnv('ACADEMY_ENABLED', false) ? 'active' : 'pending',
    paygate_orchestrator: hasEnv('STRIPE_SECRET_KEY') ? 'active' : 'setup_required',
    ai_multimodal_studio: boolEnv('AI_STUDIO_ENABLED', false) ? 'active' : 'pending'
  };

  const security = {
    auth: authEnabled ? 'enabled' : 'pending',
    two_factor: twoFactorEnabled ? 'enabled' : (authEnabled ? 'available' : 'planned'),
    biometric_unlock: biometricEnabled ? 'enabled' : 'planned',
    session_hardening: boolEnv('SESSION_HARDENING_ENABLED', hasEnv('AUTH_SESSION_TTL_SECONDS')) ? 'enabled' : 'planned'
  };

  return res.status(200).json({
    system: 'Buttertech Platform Orchestrator',
    mode: process.env.NODE_ENV || 'development',
    modules,
    rails: railStatus(),
    security
  });
}
