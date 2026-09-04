import {
  buildBasicPassengers,
  buildFlightOfferRequestPayload,
  duffelFetch,
  requireDuffelConfig,
} from '../../../lib/duffel';

function normalizeSlices(rawSlices = []) {
  return rawSlices
    .map((slice) => ({
      origin: String(slice?.origin || '').trim().toUpperCase(),
      destination: String(slice?.destination || '').trim().toUpperCase(),
      departure_date: String(slice?.departure_date || '').trim(),
    }))
    .filter((slice) => slice.origin && slice.destination && slice.departure_date);
}

function normalizeInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getOfferSlices(offer) {
  return Array.isArray(offer?.slices) ? offer.slices : [];
}

function getOfferCarriers(offer) {
  const names = new Set();
  const codes = new Set();

  getOfferSlices(offer).forEach((slice) => {
    const segments = Array.isArray(slice?.segments) ? slice.segments : [];
    segments.forEach((segment) => {
      [segment?.operating_carrier, segment?.marketing_carrier].forEach((carrier) => {
        const name = String(carrier?.name || '').trim();
        const code = String(carrier?.iata_code || '').trim().toUpperCase();
        if (name) names.add(name);
        if (code) codes.add(code);
      });
    });
  });

  const ownerName = String(offer?.owner?.name || '').trim();
  if (ownerName) names.add(ownerName);

  return {
    names: Array.from(names),
    codes: Array.from(codes),
  };
}

function getOfferConnectionCount(offer) {
  return getOfferSlices(offer).reduce((total, slice) => {
    const segments = Array.isArray(slice?.segments) ? slice.segments.length : 0;
    return total + Math.max(0, segments - 1);
  }, 0);
}

function getOfferSortAmount(offer) {
  const amount = Number.parseFloat(String(offer?.total_amount ?? ''));
  return Number.isFinite(amount) ? amount : Number.POSITIVE_INFINITY;
}

function matchesPreferredAirline(offer, preferredAirline) {
  const target = String(preferredAirline || '').trim().toLowerCase();
  if (!target) return false;

  const carriers = getOfferCarriers(offer);
  return carriers.names.some((name) => name.toLowerCase().includes(target))
    || carriers.codes.some((code) => code.toLowerCase() === target);
}

function enrichOffer(offer, preferredAirline) {
  const carriers = getOfferCarriers(offer);
  return {
    ...offer,
    summary: {
      carrier_names: carriers.names,
      carrier_codes: carriers.codes,
      primary_carrier: carriers.names[0] || String(offer?.owner?.name || '').trim() || 'Carrier',
      connections: getOfferConnectionCount(offer),
      highlighted: matchesPreferredAirline(offer, preferredAirline),
    },
  };
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
  const slices = normalizeSlices(body.slices || []);
  if (!slices.length) {
    return res.status(400).json({ ok: false, error: 'At least one valid slice is required' });
  }

  const passengers = Array.isArray(body.passengers) && body.passengers.length
    ? body.passengers
    : buildBasicPassengers(body.passenger_count || 1);

  const supplierTimeout = clamp(normalizeInteger(body.supplier_timeout, 30000), 2000, 60000);
  const offersLimit = clamp(normalizeInteger(body.limit, 80), 1, 200);
  const sort = String(body.sort || 'total_amount').trim() || 'total_amount';
  const preferredAirline = String(body.preferred_airline || 'Brussels Airlines').trim();

  const payload = buildFlightOfferRequestPayload({
    slices,
    passengers,
    cabin_class: body.cabin_class || 'economy',
    max_connections: body.direct_only ? 0 : body.max_connections,
    supplier_timeout: supplierTimeout,
    private_fares: body.private_fares,
    client_key: body.client_key,
  });

  const createResponse = await duffelFetch('/air/offer_requests', {
    method: 'POST',
    query: {
      return_offers: 'false',
      supplier_timeout: supplierTimeout,
    },
    body: payload,
    reqHeaders: req.headers,
  });

  if (!createResponse.ok) {
    return res.status(createResponse.status).json({
      ok: false,
      searchType: 'flights',
      ...createResponse.data,
    });
  }

  const offerRequest = createResponse.data?.data || {};
  const offerRequestId = String(offerRequest?.id || '').trim();
  if (!offerRequestId) {
    return res.status(502).json({
      ok: false,
      searchType: 'flights',
      error: 'Duffel did not return an offer request id',
      ...createResponse.data,
    });
  }

  const listQuery = {
    offer_request_id: offerRequestId,
    limit: offersLimit,
    sort,
  };

  if (body.direct_only) {
    listQuery.max_connections = 0;
  } else if (Number.isInteger(body.max_connections)) {
    listQuery.max_connections = body.max_connections;
  }

  const listResponse = await duffelFetch('/air/offers', {
    query: listQuery,
    reqHeaders: req.headers,
  });

  const listedOffers = Array.isArray(listResponse.data?.data)
    ? listResponse.data.data
    : Array.isArray(listResponse.data?.offers)
      ? listResponse.data.offers
      : [];

  const offers = listedOffers
    .map((offer) => enrichOffer(offer, preferredAirline))
    .sort((left, right) => {
      if (left.summary?.highlighted && !right.summary?.highlighted) return -1;
      if (!left.summary?.highlighted && right.summary?.highlighted) return 1;
      return getOfferSortAmount(left) - getOfferSortAmount(right);
    });

  return res.status(listResponse.status).json({
    ok: listResponse.ok,
    searchType: 'flights',
    data: {
      ...offerRequest,
      offers,
      offers_meta: {
        offer_request_id: offerRequestId,
        returned: offers.length,
        limit: offersLimit,
        sort,
        supplier_timeout: supplierTimeout,
        preferred_airline: preferredAirline,
        highlighted_offers: offers.filter((offer) => offer.summary?.highlighted).length,
      },
    },
    meta: listResponse.data?.meta,
  });
}
