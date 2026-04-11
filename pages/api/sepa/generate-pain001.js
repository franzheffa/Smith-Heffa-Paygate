/**
 * POST /api/sepa/generate-pain001
 * Génère SEPA PAIN.001 ISO 20022 Credit Transfer
 * BUTTERTECH INC — Smith-Heffa-Paygate
 */
import { generatePain001, validateIban, validateBic } from '../../../lib/sepa-pain001';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { debtorName, debtorIban, debtorBic, creditorName, creditorIban, creditorBic, amount, remittanceInfo, endToEndId, download = false } = req.body || {};

  const errors = [];
  if (!debtorName)   errors.push('debtorName requis');
  if (!debtorIban)   errors.push('debtorIban requis');
  if (!debtorBic)    errors.push('debtorBic requis');
  if (!creditorName) errors.push('creditorName requis');
  if (!creditorIban) errors.push('creditorIban requis');
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) errors.push('amount > 0 requis');
  if (debtorIban   && !validateIban(debtorIban))   errors.push(`IBAN débiteur invalide`);
  if (creditorIban && !validateIban(creditorIban)) errors.push(`IBAN créditeur invalide`);
  if (debtorBic    && !validateBic(debtorBic))     errors.push(`BIC débiteur invalide`);

  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  const msgId = `BUTTERTECH-${Date.now()}`;
  try {
    const xml = generatePain001({ msgId, debtorName, debtorIban, debtorBic, creditorName, creditorIban, creditorBic, amount: Number(amount), remittanceInfo, endToEndId });

    if (download) {
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="pain001-${msgId}.xml"`);
      return res.status(200).send(xml);
    }
    return res.status(200).json({ ok: true, msgId, format: 'SEPA_PAIN_001_001_03', xml });
  } catch (err) {
    return res.status(500).json({ error: 'PAIN.001 generation failed', details: err.message });
  }
}
