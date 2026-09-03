const DEFAULT_PUBLIC_APP_URL = 'https://smith-heffa-paygate.ca';
const PROJECT_VERCEL_HOST = 'smith-heffa-paygate.vercel.app';
const PROJECT_VERCEL_SUFFIX = '.vercel.app';
const PROJECT_VERCEL_PREFIX = 'smith-heffa-paygate';

function trim(value) {
  return String(value || '').trim();
}

function normalizeOrigin(value) {
  const input = trim(value);
  if (!input) return '';

  try {
    const url = new URL(input.includes('://') ? input : `https://${input}`);
    return url.origin;
  } catch {
    return '';
  }
}

function extractPathname(value, fallbackPathname) {
  const input = trim(value);
  if (!input) return fallbackPathname;

  try {
    const url = new URL(input.includes('://') ? input : `https://${input}`);
    return url.pathname || fallbackPathname;
  } catch {
    return fallbackPathname;
  }
}

function isProjectVercelOrigin(origin) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  try {
    const hostname = new URL(normalized).hostname;
    if (hostname === PROJECT_VERCEL_HOST) return true;
    return hostname.endsWith(PROJECT_VERCEL_SUFFIX) && hostname.startsWith(PROJECT_VERCEL_PREFIX);
  } catch {
    return false;
  }
}

export function getCanonicalOrigin(originOverride) {
  const explicit = normalizeOrigin(process.env.PUBLIC_APP_URL || process.env.APP_BASE_URL);
  if (explicit) return explicit;

  const override = normalizeOrigin(originOverride);
  if (override) {
    if (isProjectVercelOrigin(override)) return DEFAULT_PUBLIC_APP_URL;
    return override;
  }

  const candidates = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    DEFAULT_PUBLIC_APP_URL,
  ];

  for (const candidate of candidates) {
    const origin = normalizeOrigin(candidate);
    if (!origin) continue;
    if (isProjectVercelOrigin(origin)) return DEFAULT_PUBLIC_APP_URL;
    return origin;
  }

  return DEFAULT_PUBLIC_APP_URL;
}

export function buildCanonicalUrl(pathname = '/', originOverride) {
  const base = getCanonicalOrigin(originOverride);
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(path, `${base}/`).toString();
}

export function resolveConfiguredPath(value, fallbackPathname) {
  return extractPathname(value, fallbackPathname);
}
