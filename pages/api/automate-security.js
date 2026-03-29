export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Automate Only');
  }

  const amount = Number(req.body?.amount);
  const currency = String(req.body?.currency || 'USD').toUpperCase();
  const userId = String(req.body?.userId || 'anonymous');

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const threshold = 1000;
  let aiResponse = { status: 'NORMAL_ACTIVITY' };

  if (amount >= threshold) {
    aiResponse = {
      status: 'HIGH_VALUE_DETECTION',
      protocol: 'NVIDIA_INCEPTION_MONITORING',
      log: `Alerte: Transaction de ${amount} ${currency} détectée pour l'utilisateur ${userId}`,
      action: 'AUTO_FIX_BRIDGE_PRIORITY',
      timestamp: new Date().toISOString()
    };

    console.log('--- NVIDIA AI SECURITY LOG ---', aiResponse);
  }

  return res.status(200).json(aiResponse);
}
