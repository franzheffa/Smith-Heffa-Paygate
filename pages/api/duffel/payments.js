export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  // This route deliberately cannot execute provider payments until an authenticated,
  // authorized payment-confirmation workflow with order ownership is implemented.
  return res.status(503).json({
    ok: false,
    code: 'DUFFEL_PAYMENT_EXECUTION_DISABLED',
    error: 'Duffel payment execution is not enabled in this deployment.',
  });
}
