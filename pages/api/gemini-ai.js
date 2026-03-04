export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { prompt, type } = req.body; // type: 'voice' | 'image' | 'text'
    
    // Simulation de l'orchestrateur Gemini 1.5 Pro
    return res.status(200).json({ 
      action: "PAYMENT_INITIATED",
      confidence: 0.98,
      summary: "Préparation d'un virement de 25$ via Mobile Money",
      multimodal_status: "Voice processed via Gemini AI"
    });
  }
  res.status(405).send('AI Orchestrator Only');
}
