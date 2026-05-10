import Stripe from 'stripe';
import { appendPaymentAudit, upsertPaymentLedger } from '../../../../lib/paygate/ledger';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function looksLikePlaceholder(value) {
  const v = String(value || '').trim().toLowerCase();
  return !v || v.includes('replace_me') || v.includes('example') || v === 'changeme' || v === 'dummy';
}

function extractPixPayload(intent) {
  const pixAction = intent?.next_action?.pix_display_qr_code || {};
  return {
    qrCodeUrl: pixAction.image_url_png || pixAction.image_url_svg || '',
    qrCodeSvg: pixAction.image_url_svg || '',
    copyPasteCode: pixAction.data || '',
    hostedInstructionsUrl: pixAction.hosted_instructions_url || ''
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const action = String(req.body?.action || '').toLowerCase();
  if (action === 'preflight') {
    const secret = String(process.env.STRIPE_SECRET_KEY || '').trim();
    const missing = ['STRIPE_SECRET_KEY'].filter((key) => !process.env[key]);
    const warnings = [];
    if (looksLikePlaceholder(secret)) warnings.push('STRIPE_SECRET_KEY looks like placeholder');
    if (!process.env.STRIPE_PIX_WEBHOOK_SECRET) warnings.push('STRIPE_PIX_WEBHOOK_SECRET missing');
    return res.status(200).json({
      ready: missing.length === 0,
      missing,
      warnings,
      rail: 'PIX_BR',
      provider: 'stripe'
    });
  }

  const amountCents = Number(req.body?.amountCents ?? req.body?.amount);
  const customerEmail = String(req.body?.customerEmail || '').trim() || undefined;
  const orderId = String(req.body?.orderId || req.body?.reference || `PIX-${Date.now()}`);
  const description = String(req.body?.description || 'Smith-Heffa Pix Brazil').trim();

  if (!Number.isFinite(amountCents) || amountCents < 100) {
    return res.status(400).json({ ok: false, error: 'Invalid amount. Minimum is 100 centavos.' });
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountCents),
      currency: 'brl',
      payment_method_types: ['pix'],
      payment_method_data: { type: 'pix' },
      confirm: true,
      receipt_email: customerEmail,
      description,
      metadata: {
        rail: 'PIX_BR',
        provider: 'stripe',
        orderId,
        source: 'smith-heffa-paygate'
      }
    });

    const pix = extractPixPayload(intent);
    try {
      await upsertPaymentLedger(req, {
        traceabilityId: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        type: 'PIX_BR',
        rail: 'PIX_BR'
      });
      await appendPaymentAudit(req, {
        action: 'PIX_INTENT_CREATED',
        resourceId: intent.id,
        providerIntentId: intent.id,
        payload: {
          rail: 'PIX_BR',
          provider: 'stripe',
          orderId,
          status: intent.status,
          amountCents: intent.amount,
          currency: intent.currency
        }
      });
    } catch (ledgerError) {
      console.warn('[pix][ledger][create]', ledgerError?.message || ledgerError);
    }
    return res.status(200).json({
      ok: true,
      rail: 'PIX_BR',
      provider: 'stripe',
      providerIntentId: intent.id,
      status: intent.status,
      clientSecret: intent.client_secret,
      amountCents: intent.amount,
      currency: intent.currency,
      orderId,
      ...pix
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'Pix payment intent failed',
      message: error?.message || undefined,
      stripe_type: error?.type || undefined,
      stripe_code: error?.code || undefined,
      stripe_status: error?.statusCode || undefined
    });
  }
}
