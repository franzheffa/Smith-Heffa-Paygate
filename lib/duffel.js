import crypto from 'crypto';
import { buildCanonicalUrl, getCanonicalOrigin } from './public-url';

function envValue(key, fallback = '') {
  return String(process.env[key] ?? fallback).trim();
}

function normalizeBaseUrl(value, fallback) {
  return envValue(value, fallback).replace(/\/+$/, '');
}

function parseJsonSafe(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { raw };
  }
}

function pickDeviceIp(headers = {}) {
  const forwardedFor = String(headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (forwardedFor) return forwardedFor;
  return String(headers['x-real-ip'] || '').trim();
}

export function duffelToken() {
  return envValue('DUFFEL_API_TOKEN') || envValue('DUFFEL_ACCESS_TOKEN');
}

export function duffelVersion() {
  return envValue('DUFFEL_VERSION', 'v2');
}

export function duffelBaseUrl() {
  return normalizeBaseUrl('DUFFEL_API_BASE_URL', 'https://api.duffel.com');
}

export function duffelCardsBaseUrl() {
  return normalizeBaseUrl('DUFFEL_CARDS_BASE_URL', 'https://api.duffel.cards');
}

export function duffelEnvironment() {
  const configuredMode = envValue('DUFFEL_MODE').toLowerCase();
  if (configuredMode === 'test' || configuredMode === 'live') return configuredMode;
  const token = duffelToken();
  if (token.startsWith('duffel_live_')) return 'live';
  if (token.startsWith('duffel_test_')) return 'test';
  return token ? 'custom' : 'unconfigured';
}

export function duffelLiveBookingEnabled() {
  return envValue('DUFFEL_LIVE_BOOKING_ENABLED').toLowerCase() === 'true';
}

export function duffelWebhookUrl(originOverride) {
  return buildCanonicalUrl('/api/duffel/webhooks/inbound', originOverride);
}

export function requireDuffelConfig() {
  const token = duffelToken();
  const mode = duffelEnvironment();
  const missing = token ? [] : ['DUFFEL_API_TOKEN'];
  const tokenMatchesMode = mode === 'test'
    ? token.startsWith('duffel_test_')
    : mode === 'live'
      ? token.startsWith('duffel_live_')
      : false;

  return {
    ready: missing.length === 0 && tokenMatchesMode,
    missing,
    environment: mode,
    modeConfigured: mode === 'test' || mode === 'live',
    tokenMatchesMode,
    liveBookingEnabled: mode === 'live' ? duffelLiveBookingEnabled() : false,
    version: duffelVersion(),
    baseUrl: duffelBaseUrl(),
    cardsBaseUrl: duffelCardsBaseUrl(),
  };
}

export function duffelReadiness(originOverride) {
  const config = requireDuffelConfig();

  return {
    ...config,
    origin: getCanonicalOrigin(originOverride),
    webhookUrl: duffelWebhookUrl(originOverride),
    webhookSecretConfigured: Boolean(envValue('DUFFEL_WEBHOOK_SECRET')),
    modules: {
      flights: config.ready ? 'active' : 'setup_required',
      stays: config.ready ? 'active' : 'setup_required',
      cars: config.ready ? 'active' : 'setup_required',
      payments: config.ready ? 'active' : 'setup_required',
      orders: config.ready && (config.environment === 'test' || config.liveBookingEnabled)
        ? 'hold_enabled'
        : config.ready ? 'live_booking_disabled' : 'setup_required',
    },
  };
}

export async function duffelFetch(path, { method = 'GET', query, body, headers = {}, reqHeaders = {} } = {}) {
  const url = new URL(`${duffelBaseUrl()}${path}`);
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const deviceIp = pickDeviceIp(reqHeaders);
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      Authorization: `Bearer ${duffelToken()}`,
      'Duffel-Version': duffelVersion(),
      'Cache-Control': 'no-store',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(deviceIp ? { 'x-duffel-device-ip': deviceIp } : {}),
      ...(reqHeaders['user-agent'] ? { 'x-duffel-device-user-agent': String(reqHeaders['user-agent']) } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const raw = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data: parseJsonSafe(raw),
  };
}

export async function duffelCardsFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${duffelCardsBaseUrl()}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      Authorization: `Bearer ${duffelToken()}`,
      'Duffel-Version': duffelVersion(),
      'Cache-Control': 'no-store',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const raw = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data: parseJsonSafe(raw),
  };
}

export function buildFlightOfferRequestPayload(input = {}) {
  const slices = Array.isArray(input.slices) ? input.slices : [];
  const passengers = Array.isArray(input.passengers) ? input.passengers : [];

  return {
    data: {
      slices,
      passengers,
      ...(input.cabin_class ? { cabin_class: input.cabin_class } : {}),
      ...(Number.isInteger(input.max_connections) ? { max_connections: input.max_connections } : {}),
      ...(typeof input.direct_only === 'boolean' ? { max_connections: input.direct_only ? 0 : input.max_connections } : {}),
      ...(input.private_fares ? { private_fares: input.private_fares } : {}),
      ...(input.supplier_timeout ? { supplier_timeout: input.supplier_timeout } : {}),
      ...(input.client_key ? { client_key: input.client_key } : {}),
    },
  };
}

export function buildBasicPassengers(total = 1) {
  const count = Math.max(1, Number(total) || 1);
  return Array.from({ length: count }, (_, index) => ({
    id: `passenger_${index + 1}`,
    type: 'adult',
  }));
}

export function buildStayGuests(totalAdults = 1) {
  const count = Math.max(1, Number(totalAdults) || 1);
  return Array.from({ length: count }, () => ({ type: 'adult' }));
}

export function buildStaySearchPayload(input = {}) {
  return {
    data: {
      check_in_date: String(input.check_in_date || '').trim(),
      check_out_date: String(input.check_out_date || '').trim(),
      rooms: Math.max(1, Number(input.rooms) || 1),
      guests: Array.isArray(input.guests) && input.guests.length ? input.guests : buildStayGuests(input.adults || 1),
      location: {
        radius: Number(input.radius) || 5,
        geographic_coordinates: {
          latitude: Number(input.latitude),
          longitude: Number(input.longitude),
        },
      },
      ...(typeof input.free_cancellation_only === 'boolean' ? { free_cancellation_only: input.free_cancellation_only } : {}),
      ...(typeof input.instant_payment === 'boolean' ? { instant_payment: input.instant_payment } : {}),
      ...(typeof input.mobile === 'boolean' ? { mobile: input.mobile } : {}),
    },
  };
}

export function buildCarsSearchPayload(input = {}) {
  return {
    data: {
      pickup_date: String(input.pickup_date || '').trim(),
      pickup_time: String(input.pickup_time || '').trim(),
      dropoff_date: String(input.dropoff_date || '').trim(),
      dropoff_time: String(input.dropoff_time || '').trim(),
      pickup_location: {
        radius: Number(input.pickup_radius) || 5,
        geographic_coordinates: {
          latitude: Number(input.pickup_latitude),
          longitude: Number(input.pickup_longitude),
        },
      },
      dropoff_location: {
        radius: Number(input.dropoff_radius) || Number(input.pickup_radius) || 5,
        geographic_coordinates: {
          latitude: Number(input.dropoff_latitude),
          longitude: Number(input.dropoff_longitude),
        },
      },
      driver: {
        age: Math.max(18, Number(input.driver_age) || 30),
        residence_country_code: String(input.driver_residence_country_code || '').trim().toUpperCase(),
      },
    },
  };
}

export function makeDuffelClientReference(prefix = 'smith-heffa') {
  return `${prefix}-${crypto.randomUUID()}`;
}
