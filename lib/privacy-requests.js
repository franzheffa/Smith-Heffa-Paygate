import { prisma } from "./prisma";
import { recordAuditEvent } from "./audit";
import { getCanonicalOrigin } from "./public-url";
import { getRequestOrigin } from "./request-origin";

const EMAIL_MAX = 160;
const NAME_MAX = 120;
const PHONE_MAX = 40;
const TEXT_MAX = 1500;
const REQUEST_MIN_AGE_MS = 1500;
const REQUEST_MAX_AGE_MS = 1000 * 60 * 60 * 24;

function normalizeString(value, maxLength = TEXT_MAX) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeMultiline(value, maxLength = TEXT_MAX) {
  return String(value || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, maxLength);
}

function normalizeEmail(value) {
  return normalizeString(value, EMAIL_MAX).toLowerCase();
}

function normalizePhone(value) {
  return String(value || "").trim().replace(/[^\d+\-().\s]/g, "").slice(0, PHONE_MAX);
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
}

function sameOriginGuard(req) {
  const originHeader = normalizeString(req.headers.origin, 300);
  const refererHeader = normalizeString(req.headers.referer, 500);
  const requestOrigin = getRequestOrigin(req);
  const allowedOrigin = getCanonicalOrigin(requestOrigin);
  const acceptedOrigins = new Set([allowedOrigin]);

  if (requestOrigin) acceptedOrigins.add(getCanonicalOrigin(requestOrigin));

  if (originHeader && !acceptedOrigins.has(originHeader)) return false;
  if (refererHeader) {
    try {
      const refererOrigin = new URL(refererHeader).origin;
      if (!acceptedOrigins.has(refererOrigin)) return false;
    } catch {
      return false;
    }
  }

  return true;
}

function validateStartedAt(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return false;
  const age = Date.now() - timestamp;
  return age >= REQUEST_MIN_AGE_MS && age <= REQUEST_MAX_AGE_MS;
}

function mapDataCategories(input) {
  const allowed = new Set([
    "profileData",
    "contactData",
    "authData",
    "activityData",
    "otherPersonalData",
  ]);

  if (!Array.isArray(input)) return [];
  return input
    .map((value) => normalizeString(value, 50))
    .filter((value) => allowed.has(value));
}

async function findUserIdByEmail(email) {
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return user?.id || null;
}

export function rejectNonPost(req, res) {
  if (req.method === "POST") return false;
  res.setHeader("Allow", "POST");
  res.status(405).json({ ok: false, error: "Method not allowed." });
  return true;
}

export function validateAccountDeletionRequest(req) {
  const body = parseBody(req);
  const fullName = normalizeString(body.fullName, NAME_MAX);
  const accountEmail = normalizeEmail(body.accountEmail);
  const phoneNumber = normalizePhone(body.phoneNumber);
  const reason = normalizeMultiline(body.reason, 1200);
  const confirmationChecked = body.confirmationChecked === true;
  const website = normalizeString(body.website, 200);
  const startedAt = body.startedAt;

  if (!sameOriginGuard(req)) return { error: "Invalid request origin." };
  if (website) return { error: "Invalid request payload." };
  if (!validateStartedAt(startedAt)) return { error: "Request verification failed." };
  if (!fullName) return { error: "Full name is required." };
  if (!accountEmail || !accountEmail.includes("@")) return { error: "Valid account email is required." };
  if (!confirmationChecked) return { error: "Confirmation is required." };

  return {
    data: { fullName, accountEmail, phoneNumber, reason, confirmationChecked },
  };
}

export function validateDataDeletionRequest(req) {
  const body = parseBody(req);
  const fullName = normalizeString(body.fullName, NAME_MAX);
  const accountEmail = normalizeEmail(body.accountEmail);
  const phoneNumber = normalizePhone(body.phoneNumber);
  const notes = normalizeMultiline(body.notes, 1500);
  const dataCategories = mapDataCategories(body.dataCategories);
  const confirmationChecked = body.confirmationChecked === true;
  const website = normalizeString(body.website, 200);
  const startedAt = body.startedAt;

  if (!sameOriginGuard(req)) return { error: "Invalid request origin." };
  if (website) return { error: "Invalid request payload." };
  if (!validateStartedAt(startedAt)) return { error: "Request verification failed." };
  if (!fullName) return { error: "Full name is required." };
  if (!accountEmail || !accountEmail.includes("@")) return { error: "Valid account email is required." };
  if (!confirmationChecked) return { error: "Confirmation is required." };
  if (dataCategories.length === 0) return { error: "Select at least one data category." };

  return {
    data: {
      fullName,
      accountEmail,
      phoneNumber,
      notes,
      dataCategories,
      confirmationChecked,
    },
  };
}

export async function storePrivacyRequest(req, details) {
  const userId = await findUserIdByEmail(details.accountEmail);

  await recordAuditEvent({
    userId,
    category: "PRIVACY",
    action: details.action,
    actorType: "CUSTOMER",
    resourceType: "PRIVACY_REQUEST",
    resourceId: details.accountEmail,
    ipAddress: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null,
    userAgent: req.headers["user-agent"],
    payload: details.payload,
  });
}
