import { randomUUID } from 'crypto';
import { resolveUniversalRoute } from '../../../lib/paygate/router';

function getNextAction(sourceRail) {
  if (sourceRail === 'PAWAPAY') return 'START_MOBILE_MONEY_COLLECTION';
  if (sourceRail === 'PIX_BR') return 'START_PIX_QR_COLLECTION';
  if (sourceRail === 'CAMPOST') return 'START_CAMPOST_COLLECTION';
  if (sourceRail === 'INTERAC') return 'START_INTERAC_REQUEST_MONEY';
  if (sourceRail === 'STRIPE') return 'START_STRIPE_CHECKOUT';
  if (sourceRail === 'APPLE_PAY') return 'START_APPLE_PAY_SESSION';
  if (sourceRail === 'MASTERCARD') return 'START_MASTERCARD_GATEWAY_SESSION';
  if (sourceRail === 'SEPA') return 'START_SEPA_TRANSFER';
  if (sourceRail === 'SWIFT') return 'START_SWIFT_INSTRUCTION';
  return 'MANUAL_REVIEW';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const intent = {
      useCase: body.useCase || 'MERCHANT',
      merchantId: body.merchantId || 'smith-heffa-demo',
      customerId: body.customerId || '',
      sourceCountry: body.sourceCountry || 'CM',
      sourceCurrency: body.sourceCurrency || 'XAF',
      sourceRail: body.sourceRail || '',
      destinationCountry: body.destinationCountry || body.sourceCountry || 'CM',
      destinationCurrency: body.destinationCurrency || body.sourceCurrency || 'XAF',
      destinationRail: body.destinationRail || '',
      amountSource: body.amountSource || '',
      amountDestination: body.amountDestination || '',
      customerPhone: body.customerPhone || '',
      customerEmail: body.customerEmail || '',
      description: body.description || 'Smith-Heffa Universal Checkout',
      reference: body.reference || randomUUID(),
      metadata: body.metadata || {}
    };

    const route = resolveUniversalRoute(intent);

    return res.status(200).json({
      ok: true,
      product: 'SMITH_HEFFA_UNIVERSAL_CHECKOUT',
      checkoutId: randomUUID(),
      status: 'ROUTED',
      intent,
      route,
      nextAction: getNextAction(route.sourceRail),
      message: 'Intention routée. Une confirmation forte restera requise avant toute exécution.'
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || 'Universal checkout routing failed'
    });
  }
}
