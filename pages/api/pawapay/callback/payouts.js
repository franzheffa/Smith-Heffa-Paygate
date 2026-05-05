import { callbackOk } from '../../../../lib/pawapay';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.info('[pawapay][callback][payout]', req.body);
  return callbackOk(res, 'payout', req.body);
}
