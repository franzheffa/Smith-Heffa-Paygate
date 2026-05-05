import crypto from 'crypto';

function envValue(key, fallback = '') {
  return String(process.env[key] ?? fallback).trim();
}

export function pawapayBaseUrl() {
  return envValue('PAWAPAY_API_BASE_URL', 'https://api.sandbox.pawapay.io').replace(/\/+$/, '');
}

export function pawapayToken() {
  return envValue('PAWAPAY_API_TOKEN');
}

export function requirePawapayConfig() {
  const missing = ['PAWAPAY_API_TOKEN'].filter((key) => !envValue(key));
  return {
    ready: missing.length === 0,
    missing,
    baseUrl: pawapayBaseUrl()
  };
}

export function buildMetadata(metadata) {
  if (!metadata) return undefined;
  if (Array.isArray(metadata)) return metadata;
  if (typeof metadata === 'object') return [metadata];
  return undefined;
}

export function normalizePhoneNumber(raw, prefix = '') {
  const value = String(raw || '').trim();
  if (!value) return '';
  const compact = value.replace(/\s+/g, '');
  if (compact.startsWith('+')) return compact.slice(1);
  if (/^\d+$/.test(prefix) && compact.startsWith(prefix)) return compact;
  return `${String(prefix || '').replace(/\D/g, '')}${compact.replace(/\D/g, '')}`;
}

export function formatAmount(value) {
  const asString = String(value ?? '').trim();
  if (!asString) return '';
  if (/^\d+(\.\d+)?$/.test(asString)) {
    const amount = Number(asString);
    if (!Number.isFinite(amount) || amount <= 0) return '';
    return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');
  }
  return '';
}

export function createId(explicitId) {
  return String(explicitId || crypto.randomUUID()).trim();
}

function withNoStore(headers = {}) {
  return {
    ...headers,
    'Cache-Control': 'no-store'
  };
}

function parseJsonSafe(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return { raw };
  }
}

export async function pawapayFetch(path, { method = 'GET', query, body, headers } = {}) {
  const token = pawapayToken();
  const url = new URL(`${pawapayBaseUrl()}${path}`);
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url, {
    method,
    headers: withNoStore({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    }),
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const raw = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    data: parseJsonSafe(raw)
  };
}

export function callbackOk(res, operation, body) {
  return res.status(200).json({
    ok: true,
    operation,
    receivedAt: new Date().toISOString(),
    status: body?.status || 'RECEIVED'
  });
}
