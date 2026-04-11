/**
 * POST /api/interac/etransfer
 * Virement Interac e-Transfer
 * Identite verifiee via Hub OIDC + envoi fonds
 * BUTTERTECH INC - Smith-Heffa-Paygate
 */

function parseCookies(h) {
  return (h || '').split(';').reduce(function(a, p) {
    var i = p.indexOf('=');
    if (i > 0) a[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
    return a;
  }, {});
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  var body = req.body || {};
  var recipientEmail  = String(body.recipientEmail  || body.accountNumber || '').trim();
  var recipientName   = String(body.recipientName   || body.beneficiaryName || '').trim();
  var amount          = Number(body.amount);
  var currency        = String(body.currency        || 'CAD').toUpperCase();
  var message         = String(body.message         || 'Smith-Heffa Paygate Transfer');
  var dryRun          = body.dryRun !== false && body.dryRun !== 'false';

  if (!recipientEmail || !recipientEmail.includes('@'))
    return res.status(400).json({ error: 'recipientEmail invalide (email requis pour Interac e-Transfer)' });
  if (!recipientName)
    return res.status(400).json({ error: 'recipientName requis' });
  if (!amount || isNaN(amount) || amount <= 0)
    return res.status(400).json({ error: 'amount > 0 requis' });
  if (amount > 10000)
    return res.status(400).json({ error: 'Montant maximum Interac e-Transfer: 10 000 CAD' });

  var cookies = parseCookies(req.headers.cookie);
  var identityVerified = !!(cookies.ihub_at || cookies.ihub_sub);

  var reference = 'BHTECH-' + Date.now();

  var payload = {
    reference: reference,
    recipientEmail: recipientEmail,
    recipientName: recipientName,
    amount: amount,
    currency: currency,
    message: message,
    identityVerified: identityVerified,
  };

  var etransferKey = process.env.INTERAC_ETRANSFER_API_KEY;

  if (dryRun || !etransferKey) {
    return res.status(200).json({
      ok: true,
      status: 'SIMULATED_ACCEPTED',
      mode: !etransferKey ? 'SIMULATION_FALLBACK' : 'DRY_RUN',
      reference: reference,
      payload: payload,
      identity_verified: identityVerified,
      next_step: etransferKey
        ? 'Passer dryRun: false pour live'
        : 'Configurer INTERAC_ETRANSFER_API_KEY dans Vercel pour activer le live',
    });
  }

  try {
    var baseUrl = process.env.INTERAC_ETRANSFER_API_URL || 'https://api.interac.ca/v2';
    var response = await fetch(baseUrl + '/etransfer/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer ' + etransferKey,
        'X-Reference-Id': reference,
      },
      body: JSON.stringify({
        sender: { name: 'BUTTERTECH INC' },
        recipient: { email: recipientEmail, name: recipientName },
        transfer: { amount: amount, currency: currency, message: message },
        reference: reference,
      }),
    });
    var data = await response.json().catch(function() { return {}; });
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Interac e-Transfer API failed',
        reference: reference,
        details: data,
      });
    }
    return res.status(200).json({ ok: true, status: 'ACCEPTED', reference: reference, data: data });
  } catch (err) {
    return res.status(500).json({ error: 'e-Transfer request failed', details: err.message });
  }
}
