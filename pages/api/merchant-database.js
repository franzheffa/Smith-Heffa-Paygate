export default async function handler(req, res) {
  const merchants = [
    { id: 'orange', name: 'ORANGE MONEY', color: '#FF7900', brand: 'Orange' },
    { id: 'mtn', name: 'MTN MOMO', color: '#FFCC00', brand: 'MTN' },
    { id: 'camtel', name: 'BLUE MONEY', color: '#0055A4', brand: 'Camtel' }
  ];

  if (req.method === 'GET') {
    return res.status(200).json(merchants);
  }

  if (req.method === 'POST') {
    const detectedColor = String(req.body?.detectedColor || '').toUpperCase();

    if (!detectedColor) {
      return res.status(400).json({ error: 'detectedColor is required' });
    }

    // Simulation de matching de logo par couleur
    const match = merchants.find(m => m.color === detectedColor) || merchants[0];
    return res.status(200).json({ success: true, merchant: match });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
