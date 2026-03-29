# Smith-Heffa-PayGate

Plateforme Next.js + API routes pour orchestration paiement (Stripe, Interac, Mobile Money, SWIFT/SEPA en mode simulation).

## 1) Préparation locale

```bash
npm install
cp .env.example .env.local
```

## 2) Variables d'environnement (local)

Commande `cat` prête à remplir:

```bash
cat > .env.local <<'EOF'
STRIPE_SECRET_KEY=sk_live_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_replace_me
NEXT_PUBLIC_APP_URL=https://smith-heffa-paygate.vercel.app
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
MOBILE_MONEY_API_KEY=replace_me
ORANGE_MONEY_API_BASE_URL=https://api.orange-money.example
ORANGE_MONEY_CLIENT_ID=replace_me
ORANGE_MONEY_CLIENT_SECRET=replace_me
INTERAC_API_BASE_URL=https://api.interac.example
INTERAC_API_KEY=replace_me
ORANGE_ORDERING_BASE_URL=https://api.orange.com/ordering/b2b/v3
ORANGE_OAUTH_TOKEN_URL=https://api.orange.com/oauth/v3/token
ORANGE_OIDC_TOKEN_URL=https://api.orange.com/oauth/v3/token
ORANGE_OIDC_AUTHORIZE_URL=https://api.orange.com/oauth/v3/authorize
ORANGE_OIDC_REDIRECT_URI=https://smith-heffa-paygate.vercel.app/api/oidc/callback
ORANGE_OIDC_SCOPE=openid dpv:FraudPreventionAndDetection number-verification:verify
ORANGE_ORDERING_SCOPE=b2b:ordering
ORANGE_ACCEPT_LANGUAGE=fr
ORANGE_CLIENT_ID=replace_me
ORANGE_CLIENT_SECRET=replace_me
ORANGE_API_KEY=replace_me
EOF
```

## 3) Build et validation

```bash
npm run build
```

## 4) Déploiement Vercel Production

```bash
vercel whoami
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add DATABASE_URL production
vercel env add MOBILE_MONEY_API_KEY production
vercel env add ORANGE_MONEY_API_BASE_URL production
vercel env add ORANGE_MONEY_CLIENT_ID production
vercel env add ORANGE_MONEY_CLIENT_SECRET production
vercel env add ORANGE_MONEY_API_KEY production
vercel env add ORANGE_MONEY_PAYOUT_PATH production
vercel env add MTN_MOMO_API_BASE_URL production
vercel env add MTN_MOMO_API_KEY production
vercel env add MTN_MOMO_PAYOUT_PATH production
vercel env add MPESA_API_BASE_URL production
vercel env add MPESA_API_KEY production
vercel env add MPESA_PAYOUT_PATH production
vercel env add SWIFT_API_BASE_URL production
vercel env add SWIFT_API_KEY production
vercel env add SWIFT_PAYOUT_PATH production
vercel env add SEPA_API_BASE_URL production
vercel env add SEPA_API_KEY production
vercel env add SEPA_PAYOUT_PATH production
vercel env add INTERAC_API_BASE_URL production
vercel env add INTERAC_API_KEY production
vercel env add ORANGE_ORDERING_BASE_URL production
vercel env add ORANGE_OAUTH_TOKEN_URL production
vercel env add ORANGE_OIDC_TOKEN_URL production
vercel env add ORANGE_OIDC_AUTHORIZE_URL production
vercel env add ORANGE_OIDC_REDIRECT_URI production
vercel env add ORANGE_OIDC_SCOPE production
vercel env add ORANGE_ORDERING_SCOPE production
vercel env add ORANGE_ACCEPT_LANGUAGE production
vercel env add ORANGE_CLIENT_ID production
vercel env add ORANGE_CLIENT_SECRET production
vercel env add ORANGE_API_KEY production
vercel --prod --yes
```

## 5) GitHub push

```bash
git add .
git commit -m "chore: harden APIs and prepare production env/deploy"
git push origin main
```

## 6) Passage en flux réel Interac -> Orange Money (important)

Le code actuel expose des flux de simulation pour plusieurs rails. Pour envoyer de l'argent réel aujourd'hui, il faut:

1. Activer des comptes marchands Interac et Orange Money Business.
2. Obtenir les credentials API de production.
3. Implémenter les endpoints serveur signés (auth OAuth/HMAC selon fournisseur).
4. Ajouter KYC/AML, journalisation et webhooks de confirmation.
5. Exécuter des tests de bout en bout en environnement sandbox avant production.

Sans ces credentials et contrats opérateurs, l'application reste une simulation UX/API pour les rails non Stripe.

## 7) Endpoint intégré: Orange Ordering v3.1

Route serverless ajoutée: `POST /api/orange-ordering`

Actions supportées dans le body JSON:

- `status`
- `version`
- `me`
- `listRequests` (avec `query`)
- `getRequest` (avec `id`)
- `createRequest` (avec `payload`)
- `listCatalogItems` (avec `query`)
- `getCatalogItem` (avec `id`)

Exemple `cat` prêt à tester:

```bash
cat > /tmp/orange-ordering-status.json <<'EOF'
{
  "action": "status"
}
EOF

curl -sS -X POST "https://smith-heffa-paygate.vercel.app/api/orange-ordering" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/orange-ordering-status.json
```

## 8) Endpoints intégrés: Stripe, Apple Pay, MTN, M-PESA, SWIFT, SEPA

Routes serverless ajoutées:

- `POST /api/stripe-payment-intent`
- `POST /api/applepay-intent`
- `POST /api/mobile-money-payout`
- `POST /api/bank-transfer-payout`

Exemples `cat` prêts:

```bash
cat > /tmp/stripe-intent.json <<'EOF'
{"amount":5000,"currency":"usd","reference":"ORDER-001"}
EOF

cat > /tmp/applepay-intent.json <<'EOF'
{"amount":2500,"currency":"cad","reference":"APPLE-001"}
EOF

cat > /tmp/mtn-payout.json <<'EOF'
{"provider":"mtn","amount":1000,"currency":"XAF","phone":"+237690000000","country":"CM","reference":"MTN-001","dryRun":true}
EOF

cat > /tmp/mpesa-payout.json <<'EOF'
{"provider":"mpesa","amount":1500,"currency":"KES","phone":"+254700000000","country":"KE","reference":"MPESA-001","dryRun":true}
EOF

cat > /tmp/swift-payout.json <<'EOF'
{"rail":"swift","amount":2500,"currency":"USD","beneficiaryName":"Franz Heffa","accountNumber":"123456789","bic":"CITIUS33XXX","reference":"SWIFT-001","dryRun":true}
EOF

cat > /tmp/sepa-payout.json <<'EOF'
{"rail":"sepa","amount":1200,"currency":"EUR","beneficiaryName":"Franz Heffa","iban":"FR7630006000011234567890189","reference":"SEPA-001","dryRun":true}
EOF

curl -sS -X POST "https://smith-heffa-paygate.vercel.app/api/stripe-payment-intent" -H "Content-Type: application/json" --data-binary @/tmp/stripe-intent.json
curl -sS -X POST "https://smith-heffa-paygate.vercel.app/api/applepay-intent" -H "Content-Type: application/json" --data-binary @/tmp/applepay-intent.json
curl -sS -X POST "https://smith-heffa-paygate.vercel.app/api/mobile-money-payout" -H "Content-Type: application/json" --data-binary @/tmp/mtn-payout.json
curl -sS -X POST "https://smith-heffa-paygate.vercel.app/api/mobile-money-payout" -H "Content-Type: application/json" --data-binary @/tmp/mpesa-payout.json
curl -sS -X POST "https://smith-heffa-paygate.vercel.app/api/bank-transfer-payout" -H "Content-Type: application/json" --data-binary @/tmp/swift-payout.json
curl -sS -X POST "https://smith-heffa-paygate.vercel.app/api/bank-transfer-payout" -H "Content-Type: application/json" --data-binary @/tmp/sepa-payout.json
```

## 9) Flux OIDC Frontend + PKCE (visible)

Page de validation:

- `GET /oidc-debug`

Endpoints:

- `POST /api/oidc/init` (génère state + code_verifier + code_challenge + authorize URL)
- `GET /api/oidc/callback` (échange le code authorization contre access token)

Test `cat` prêt:

```bash
cat > /tmp/oidc-init.json <<'EOF'
{
  "scope": "openid dpv:FraudPreventionAndDetection number-verification:verify"
}
EOF

curl -sS -X POST "https://smith-heffa-paygate.vercel.app/api/oidc/init" \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/oidc-init.json
```
