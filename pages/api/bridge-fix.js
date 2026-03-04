export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Simulation du handshake FIX 4.4
    return res.status(200).json({ 
      status: "CONNECTED", 
      protocol: "FIX.4.4",
      sender: "BUTTERTECH_UI",
      target: "GOLD_ENGINE_2016"
    });
  }
  res.status(405).end();
}
