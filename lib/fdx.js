function boolEnv(name, fallback = false) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(String(raw).toLowerCase());
}

function hasEnv(name) {
  return Boolean(process.env[name] && String(process.env[name]).trim() !== '');
}

function envValue(name, fallback = null) {
  const raw = process.env[name];
  return raw == null || raw === '' ? fallback : raw;
}

function railStatuses() {
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
  const interacIdentityReady =
    hasEnv('INTERAC_CLIENT_ID') &&
    hasEnv('INTERAC_PRIVATE_KEY_PEM') &&
    hasEnv('INTERAC_REDIRECT_URI') &&
    hasEnv('INTERAC_KID');
  const interacTransferReady = hasEnv('INTERAC_ETRANSFER_API_KEY');
  const sepaReady = hasEnv('SEPA_API_BASE_URL') && hasEnv('SEPA_API_KEY');
  const swiftReady = hasEnv('SWIFT_API_BASE_URL') && hasEnv('SWIFT_API_KEY');

  return {
    stripe: stripe ? 'active' : 'missing_credentials',
    paypal: stripe ? (paypalEnabled ? 'active' : 'card_fallback') : 'blocked',
    apple_pay: stripe ? (applePayDomainReady ? 'active' : 'requires_domain_verification') : 'blocked',
    mtn_momo: mtnReady ? 'sandbox_or_live_ready' : 'simulation',
    orange_money: orangeReady ? 'sandbox_or_live_ready' : 'simulation',
    interac_identity: interacIdentityReady ? 'ready' : 'configuration_required',
    interac_etransfer: interacTransferReady ? 'ready' : 'simulation',
    sepa_payouts: sepaReady ? 'ready' : 'configuration_required',
    swift_payouts: swiftReady ? 'ready' : 'configuration_required'
  };
}

function fdxReadiness() {
  const authEnabled = boolEnv('AUTH_ENABLED', hasEnv('DATABASE_URL'));
  const twoFactorEnabled = boolEnv('AUTH_2FA_ENABLED', false);
  const consentUiEnabled = boolEnv('FDX_CONSENT_UI_ENABLED', false);
  const openApiPublished = boolEnv('FDX_OPENAPI_PUBLISHED', true);
  const registryLinked = boolEnv('FDX_REGISTRY_LINKED', false);
  const auditLoggingEnabled = boolEnv('AUDIT_LOGGING_ENABLED', false);
  const webhookSigningEnabled = boolEnv('WEBHOOK_SIGNING_ENABLED', false);

  return {
    profile: 'smith-heffa-paygate-fdx-readiness',
    standard: 'FDX',
    participant: {
      level: envValue('FDX_PARTICIPANT_LEVEL', 'observer'),
      role: envValue('FDX_PARTICIPANT_ROLE', 'provider'),
      organization: envValue('FDX_ORGANIZATION_NAME', 'BUTTERTECH INC'),
      environment: envValue('VERCEL_ENV', process.env.NODE_ENV || 'development')
    },
    security: {
      oauth2_oidc: authEnabled ? 'implemented' : 'planned',
      jwks_endpoint: hasEnv('INTERAC_PUBLIC_KEY_N') && hasEnv('INTERAC_PUBLIC_KEY_E') ? 'implemented' : 'planned',
      step_up_authentication: twoFactorEnabled ? 'implemented' : 'available_not_enforced',
      session_hardening: boolEnv('SESSION_HARDENING_ENABLED', hasEnv('AUTH_SESSION_TTL_SECONDS')) ? 'implemented' : 'planned',
      audit_logging: auditLoggingEnabled ? 'implemented' : 'planned',
      webhook_signing: webhookSigningEnabled ? 'implemented' : 'planned',
      mtls: boolEnv('FDX_MTLS_ENABLED', false) ? 'implemented' : 'planned'
    },
    consent: {
      consent_ui: consentUiEnabled ? 'implemented' : 'planned',
      revocation_api: boolEnv('FDX_CONSENT_REVOCATION_ENABLED', true) ? 'implemented' : 'planned',
      scoped_access: boolEnv('FDX_SCOPED_ACCESS_ENABLED', authEnabled) ? 'implemented' : 'planned'
    },
    api: {
      versioning: boolEnv('FDX_VERSIONED_APIS', true) ? 'implemented' : 'planned',
      openapi_description: openApiPublished ? 'published' : 'pending',
      well_known_discovery: 'implemented',
      registry_linkage: registryLinked ? 'linked' : 'pending'
    },
    data_domains: {
      payments: 'implemented',
      identity_verification: 'implemented',
      accounts: boolEnv('FDX_ACCOUNTS_API_ENABLED', false) ? 'implemented' : 'planned',
      transactions: boolEnv('FDX_TRANSACTIONS_API_ENABLED', false) ? 'implemented' : 'planned'
    },
    rails: railStatuses()
  };
}

function fdxGaps(readiness = fdxReadiness()) {
  const gaps = [];

  if (readiness.participant.level === 'observer') {
    gaps.push('Observer access only: production registry participation and certification workflow still pending.');
  }
  if (readiness.api.openapi_description !== 'published') {
    gaps.push('Publish an OpenAPI description for externally supported provider endpoints.');
  }
  if (readiness.api.registry_linkage !== 'linked') {
    gaps.push('Link the deployment to the FDX registry and publish production metadata.');
  }
  if (readiness.consent.consent_ui !== 'implemented') {
    gaps.push('Add explicit consent capture, review, and revocation UX aligned to FDX data sharing expectations.');
  }
  if (readiness.security.audit_logging !== 'implemented') {
    gaps.push('Enable immutable audit logging for consent, authentication, and payout decision events.');
  }
  if (readiness.data_domains.accounts !== 'implemented' || readiness.data_domains.transactions !== 'implemented') {
    gaps.push('Account and transaction data APIs are not yet exposed under an FDX-aligned contract.');
  }

  return gaps;
}

module.exports = {
  boolEnv,
  envValue,
  fdxGaps,
  fdxReadiness,
  hasEnv,
  railStatuses
};
