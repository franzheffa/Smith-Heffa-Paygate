# Smith-Heffa-Paygate FDX Readiness

This document aligns the current deployment with the FDX onboarding material provided to the team and converts it into an enterprise implementation checklist for Smith-Heffa-Paygate.

## Current position

- Participant level: `Observer`
- Provider posture: `Provider readiness`, not formal certification
- Deployment target: Vercel production with Prisma-backed auth/session controls
- Core live domains in platform scope today:
  - Identity verification via Interac Hub OIDC
  - Payment orchestration rails via Stripe, PayPal, Orange Money, MTN MoMo
  - Bank payout rails via Interac e-Transfer, SEPA, and SWIFT

## FDX-aligned principles adopted in this repo

- Versioned APIs and explicit status endpoints
- Strong authentication with OIDC/OAuth-compatible flows
- JWKS-based public key discovery for relying parties
- Consent-aware design direction instead of screen scraping patterns
- Clear separation between implemented capabilities and planned capabilities
- Environment-driven production hardening for Vercel rollouts

## What is implemented now

- `GET /.well-known/fdx-configuration`
  - Internal discovery metadata for provider readiness
- `GET /api/fdx/readiness`
  - Machine-readable readiness report for operations, GitHub reviews, and Vercel smoke checks
- `GET /openapi/smith-heffa-fdx-provider-v6.5.yaml`
  - Local provider OpenAPI document aligned to the implemented FDX subset
- `GET /api/fdx/v6/meta/availability`
- `GET /api/fdx/v6/meta/capability`
- `GET /api/fdx/v6/meta/certification-metrics`
- `GET /api/fdx/v6/accounts`
- `GET /api/fdx/v6/accounts/{accountId}`
- `GET /api/fdx/v6/accounts/{accountId}/transactions`
- `GET /api/fdx/v6/audit/events`
- `GET|POST /api/fdx/v6/consents`
- `GET /api/fdx/v6/consents/{consentId}`
- `GET|PUT /api/fdx/v6/consents/{consentId}/revocation`
- `GET /api/platform-status`
  - Expanded rail visibility for Interac, SEPA, and SWIFT
- Existing payment/identity endpoints remain unchanged
  - `/api/interac/init`
  - `/api/interac/callback`
  - `/api/interac/jwks`
  - `/api/interac/etransfer`
  - `/api/sepa/generate-pain001`
  - `/api/bank-transfer-payout`

## Remaining gaps before claiming broader FDX-grade provider posture

- Publish a formal OpenAPI contract for external provider-facing APIs
- Add first-class consent capture, review, and revocation endpoints/UI
- Link production metadata to the FDX registry once membership/eligibility allows
- Expose account and transaction resources under an FDX-aligned contract
- Enable immutable audit logging for auth, consent, and payout decisions
- Consider mTLS and signed webhook policies for higher-assurance counterparties

## Suggested Vercel environment flags

```bash
FDX_PARTICIPANT_LEVEL=observer
FDX_PARTICIPANT_ROLE=provider
FDX_ORGANIZATION_NAME=BUTTERTECH INC
FDX_VERSIONED_APIS=true
FDX_OPENAPI_PUBLISHED=false
FDX_REGISTRY_LINKED=false
FDX_CONSENT_UI_ENABLED=false
FDX_CONSENT_REVOCATION_ENABLED=false
FDX_SCOPED_ACCESS_ENABLED=true
AUDIT_LOGGING_ENABLED=false
WEBHOOK_SIGNING_ENABLED=false
FDX_ACCOUNTS_API_ENABLED=false
FDX_TRANSACTIONS_API_ENABLED=false
```

## Deployment note

These changes are intentionally non-breaking. They add discovery, readiness, and reporting surfaces around the existing paygate without altering the current auth, payout, or checkout request paths.
