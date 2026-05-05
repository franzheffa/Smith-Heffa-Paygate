function detectIntent(text = '') {
  const value = String(text || '').toLowerCase();

  if (value.includes('yango') || value.includes('bolt') || value.includes('taxi') || value.includes('course')) {
    return { type: 'RIDE', provider: value.includes('bolt') ? 'BOLT' : 'YANGO' };
  }

  if (value.includes('billet') || value.includes('avion') || value.includes('flight')) {
    return { type: 'FLIGHT', provider: 'AIR_TRAVEL' };
  }

  if (value.includes('hôtel') || value.includes('hotel')) {
    return { type: 'HOTEL', provider: 'HOSPITALITY' };
  }

  if (value.includes('academy') || value.includes('formation')) {
    return { type: 'ACADEMY', provider: 'BUTTERTECH_ACADEMY' };
  }

  if (value.includes('envoyer') || value.includes('transfert') || value.includes('transfer')) {
    return { type: 'TRANSFER', provider: 'PERSON_TO_PERSON' };
  }

  return { type: 'MERCHANT', provider: 'GENERAL_CHECKOUT' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const text = req.body?.text || '';
    const intent = detectIntent(text);
    return res.status(200).json({
      ok: true,
      transcript: text,
      intent,
      nextStep: 'SHOW_CHECKOUT',
      message: 'Intent détecté. Smith-Heffa prépare le checkout sans exécuter de transaction.'
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || 'Voice intent parsing failed'
    });
  }
}
