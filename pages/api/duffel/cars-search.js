import {
  buildCarsSearchPayload,
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
  const pickupLatitude = normalizeCoordinate(body.pickup_latitude);
  const pickupLongitude = normalizeCoordinate(body.pickup_longitude);
  const dropoffLatitude = normalizeCoordinate(body.dropoff_latitude);
  const dropoffLongitude = normalizeCoordinate(body.dropoff_longitude);
  const driverResidenceCountryCode = String(body.driver_residence_country_code || '').trim().toUpperCase();

  if (!body.pickup_date || !body.pickup_time || !body.dropoff_date || !body.dropoff_time) {
    return res.status(400).json({ ok: false, error: 'pickup/dropoff dates and times are required' });
  }

  if ([pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude].some((value) => value === null)) {
    return res.status(400).json({ ok: false, error: 'Valid pickup and dropoff coordinates are required' });
  }

  if (!driverResidenceCountryCode) {
    return res.status(400).json({ ok: false, error: 'driver_residence_country_code is required' });
  }

  const payload = buildCarsSearchPayload({
    pickup_date: body.pickup_date,
    pickup_time: body.pickup_time,
    dropoff_date: body.dropoff_date,
    dropoff_time: body.dropoff_time,
    pickup_latitude: pickupLatitude,
    pickup_longitude: pickupLongitude,
    pickup_radius: body.pickup_radius,
    dropoff_latitude: dropoffLatitude,
    dropoff_longitude: dropoffLongitude,
    dropoff_radius: body.dropoff_radius,
    driver_age: body.driver_age,
    driver_residence_country_code: driverResidenceCountryCode,
  });

  const response = await duffelFetch('/cars/search', {
    method: 'POST',
    body: payload,
    reqHeaders: req.headers,
  });

  return res.status(response.status).json({
    ok: response.ok,
    searchType: 'cars',
    ...response.data,
  });
}
