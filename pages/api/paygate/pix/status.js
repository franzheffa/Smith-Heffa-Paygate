import Stripe from 'stripe';
import { appendPaymentAudit, upsertPaymentLedger } from '../../../../lib/paygate/ledger';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
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

  const providerIntentId = String(req.body?.providerIntentId || '').trim();
  if (!providerIntentId) {
    return res.status(400).json({ ok: false, error: 'Missing providerIntentId' });
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(providerIntentId);
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
        action: 'PIX_STATUS_SYNC',
        resourceId: intent.id,
        providerIntentId: intent.id,
        payload: {
          rail: 'PIX_BR',
          provider: 'stripe',
          status: intent.status,
          amountCents: intent.amount,
          currency: intent.currency
        }
      });
    } catch (ledgerError) {
      console.warn('[pix][ledger][status]', ledgerError?.message || ledgerError);
    }
    return res.status(200).json({
      ok: true,
      rail: 'PIX_BR',
      provider: 'stripe',
      providerIntentId: intent.id,
      status: intent.status,
      amountCents: intent.amount,
      currency: intent.currency,
      ...pix
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'Pix status lookup failed',
      message: error?.message || undefined
    });
  }
}
