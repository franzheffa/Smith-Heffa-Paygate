import Stripe from 'stripe';
import { appendPaymentAudit, upsertPaymentLedger } from '../../../../lib/paygate/ledger';
import { beginProviderWebhookEvent, finishProviderWebhookEvent, webhookPayloadHash } from '../../../../lib/provider-webhook-events';

export const config = {
  api: {
    bodyParser: false
  }
};

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  if (!process.env.STRIPE_PIX_WEBHOOK_SECRET) {
    return res.status(503).json({ ok: false, error: 'Missing STRIPE_PIX_WEBHOOK_SECRET' });
  }

  try {
    const stripe = getStripe();
    const payload = await readRawBody(req);
    const signature = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_PIX_WEBHOOK_SECRET);
    const intent = event.data?.object;
    const accepted = await beginProviderWebhookEvent({
      provider: 'STRIPE', providerEventId: event.id, providerTransactionId: intent?.id || null,
      internalTransactionId: intent?.metadata?.checkoutId || null, eventType: event.type,
      payloadHash: webhookPayloadHash(payload),
    });
    if (accepted.duplicate) return res.status(200).json({ received: true, duplicate: true });

    if (event.type === 'payment_intent.succeeded') {
      try {
        await upsertPaymentLedger(req, {
          traceabilityId: intent.id,
          amount: intent.amount,
          currency: intent.currency,
          status: 'PAID',
          type: 'PIX_BR',
          rail: 'PIX_BR'
        });
        await appendPaymentAudit(req, {
          action: 'PIX_WEBHOOK_SUCCEEDED',
          resourceId: intent.id,
          providerIntentId: intent.id,
          payload: {
            eventType: event.type,
            rail: 'PIX_BR',
            provider: 'stripe',
            status: intent.status,
            amountCents: intent.amount,
            currency: intent.currency,
            metadata: intent.metadata
          }
        });
      } catch (ledgerError) {
        console.warn('[pix][ledger][webhook][succeeded]', ledgerError?.message || ledgerError);
      }
      console.log('[pix][webhook][succeeded]', {
        intentId: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        metadata: intent.metadata
      });
    }

    if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      try {
        await upsertPaymentLedger(req, {
          traceabilityId: intent.id,
          amount: intent.amount,
          currency: intent.currency,
          status: event.type === 'payment_intent.canceled' ? 'EXPIRED' : 'FAILED',
          type: 'PIX_BR',
          rail: 'PIX_BR'
        });
        await appendPaymentAudit(req, {
          action: event.type === 'payment_intent.canceled' ? 'PIX_WEBHOOK_CANCELED' : 'PIX_WEBHOOK_FAILED',
          resourceId: intent.id,
          providerIntentId: intent.id,
          payload: {
            eventType: event.type,
            rail: 'PIX_BR',
            provider: 'stripe',
            status: intent.status,
            amountCents: intent.amount,
            currency: intent.currency,
            metadata: intent.metadata
          }
        });
      } catch (ledgerError) {
        console.warn('[pix][ledger][webhook][failed]', ledgerError?.message || ledgerError);
      }
      console.log('[pix][webhook][failed]', {
        intentId: intent.id,
        status: intent.status,
        metadata: intent.metadata
      });
    }

    await finishProviderWebhookEvent(accepted.event.id);
    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid Stripe Pix webhook',
      code: 'INVALID_WEBHOOK'
    });
  }
}
