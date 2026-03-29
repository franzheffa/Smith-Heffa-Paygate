export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('AI Orchestrator Only');
  }

  const prompt = String(req.body?.prompt || '').trim();
  const type = String(req.body?.type || '').toLowerCase();
  const allowedTypes = new Set(['voice', 'image', 'text']);

  if (!allowedTypes.has(type)) {
    return res.status(400).json({ error: 'Invalid type. Expected voice, image or text.' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Simulation de l'orchestrateur Gemini
  return res.status(200).json({
    action: 'PAYMENT_INITIATED',
    confidence: 0.98,
    summary: "Préparation d'un virement de 25$ via Mobile Money",
    multimodal_status: `${type.toUpperCase()} processed via AI`,
    prompt_length: prompt.length
  });
}
