const { envValue, fdxReadiness } = require('../../lib/fdx');

export async function getServerSideProps({ res }) {
  const readiness = fdxReadiness();
  const appUrl = envValue('NEXT_PUBLIC_APP_URL', 'https://smith-heffa-paygate.vercel.app');

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.write(
    JSON.stringify(
      {
        issuer: appUrl,
        standard: readiness.standard,
        profile: readiness.profile,
        participant: readiness.participant,
        capabilities: {
          identity_verification: readiness.data_domains.identity_verification,
          payments: readiness.data_domains.payments,
          accounts: readiness.data_domains.accounts,
          transactions: readiness.data_domains.transactions,
          consent_management: readiness.consent
        },
        endpoints: {
          platform_status: `${appUrl}/api/platform-status`,
          auth_status: `${appUrl}/api/auth/status`,
          fdx_readiness: `${appUrl}/api/fdx/readiness`,
          capability: `${appUrl}/api/fdx/v6/meta/capability`,
          availability: `${appUrl}/api/fdx/v6/meta/availability`,
          certification_metrics: `${appUrl}/api/fdx/v6/meta/certification-metrics`,
          accounts: `${appUrl}/api/fdx/v6/accounts`,
          audit_events: `${appUrl}/api/fdx/v6/audit/events`,
          openapi: `${appUrl}/openapi/smith-heffa-fdx-provider-v6.5.yaml`,
          interac_init: `${appUrl}/api/interac/init`,
          interac_jwks: `${appUrl}/api/interac/jwks`,
          sepa_pain001: `${appUrl}/api/sepa/generate-pain001`
        },
        note: 'Non-normative discovery document published by Smith-Heffa-Paygate for internal/provider readiness.'
      },
      null,
      2
    )
  );
  res.end();

  return { props: {} };
}

export default function FdxConfiguration() {
  return null;
}
