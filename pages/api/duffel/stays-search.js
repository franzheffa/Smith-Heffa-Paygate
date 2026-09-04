import {
  buildStayGuests,
  buildStaySearchPayload,
  duffelFetch,
  requireDuffelConfig,
} from '../../../lib/duffel';

function normalizeCoordinate(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const config = requireDuffelConfig();
  if (!config.ready) {
    return res.status(503).json({ ok: false, error: 'Duffel not configured', missing: config.missing });
  }

  const body = req.body || {};
  const latitude = normalizeCoordinate(body.latitude);
  const longitude = normalizeCoordinate(body.longitude);

  if (!body.check_in_date || !body.check_out_date) {
    return res.status(400).json({ ok: false, error: 'check_in_date and check_out_date are required' });
  }

  if (latitude === null || longitude === null) {
    return res.status(400).json({ ok: false, error: 'Valid latitude and longitude are required' });
  }

  const payload = buildStaySearchPayload({
    check_in_date: body.check_in_date,
    check_out_date: body.check_out_date,
    rooms: body.rooms,
    adults: body.adults,
    guests: Array.isArray(body.guests) && body.guests.length ? body.guests : buildStayGuests(body.adults || 1),
    latitude,
    longitude,
    radius: body.radius,
    free_cancellation_only: typeof body.free_cancellation_only === 'boolean' ? body.free_cancellation_only : false,
    instant_payment: typeof body.instant_payment === 'boolean' ? body.instant_payment : false,
    mobile: typeof body.mobile === 'boolean' ? body.mobile : true,
  });

  const response = await duffelFetch('/stays/search', {
    method: 'POST',
    body: payload,
    reqHeaders: req.headers,
  });

  return res.status(response.status).json({
    ok: response.ok,
    searchType: 'stays',
    ...response.data,
  });
}
