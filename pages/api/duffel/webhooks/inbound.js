import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const received = String(signatureHeader).replace(/^sha256=/, '').trim();
  if (!received || expected.length !== received.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const rawBody = await readRawBody(req);
  const signatureHeader = req.headers['duffel-signature'] || req.headers['x-duffel-signature'];
  const secret = String(process.env.DUFFEL_WEBHOOK_SECRET || '').trim();
  const verified = verifySignature(rawBody, signatureHeader, secret);

  if (!verified) {
    return res.status(401).json({ ok: false, error: 'Invalid webhook signature' });
  }

  let payload = {};
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON payload' });
  }

  return res.status(200).json({
    ok: true,
    received: true,
    eventId: payload?.id || null,
    eventType: payload?.type || null,
    liveMode: payload?.live_mode ?? null,
    createdAt: payload?.created_at || new Date().toISOString(),
  });
}
