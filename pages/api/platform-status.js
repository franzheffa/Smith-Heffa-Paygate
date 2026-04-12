const { boolEnv, fdxReadiness, hasEnv, railStatuses } = require('../../lib/fdx');

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
    rails: railStatuses(),
    security,
    compliance: {
      fdx: {
        participant_level: fdxReadiness().participant.level,
        role: fdxReadiness().participant.role,
        readiness_endpoint: '/api/fdx/readiness',
        discovery_endpoint: '/.well-known/fdx-configuration'
      }
    }
  });
}
