const firebaseMobileOrigin = /^https:\/\/smith-heffa-paygate-mobile(?:--flutter-mobile-rebuild(?:-[a-z0-9]+)?)?\.(?:web\.app|firebaseapp\.com)$/i;

export function handleMobileReadCors(req, res, methods = 'GET') {
  const origin = String(req.headers.origin || '');
  if (firebaseMobileOrigin.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
    res.setHeader('Access-Control-Max-Age', '600');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
