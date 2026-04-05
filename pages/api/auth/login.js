const bcrypt = require("bcryptjs");
const { prisma } = require("../../../lib/prisma");

function normalizeValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }

  return {};
}

function wantsJson(req) {
  const accept = String(req.headers.accept || "").toLowerCase();
  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  const requestedWith = String(req.headers["x-requested-with"] || "").toLowerCase();
  const mode = String((req.query && req.query.responseMode) || "").toLowerCase();

  return (
    mode === "json" ||
    requestedWith === "xmlhttprequest" ||
    accept.includes("application/json") ||
    contentType.includes("application/json")
  );
}

function safeRedirect(target) {
  const value = normalizeValue(target);
  if (!value) return "/dashboard";
  if (!value.startsWith("/")) return "/dashboard";
  if (value.startsWith("//")) return "/dashboard";
  return value;
}

function redirectHtml(res, location) {
  return res.redirect(303, safeRedirect(location));
}

function setSessionCookie(res, sessionToken) {
  const maxAge = 60 * 60 * 24 * 14;
  const isProd = process.env.NODE_ENV === "production";
  const cookie = [
    `paygate_session=${encodeURIComponent(sessionToken)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    isProd ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  res.setHeader("Set-Cookie", cookie);
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    if (wantsJson(req)) {
      return res.status(200).json({ ok: true, loginUrl: "/login-classic" });
    }
    return redirectHtml(res, "/login-classic");
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    if (wantsJson(req)) {
      return res.status(405).json({ ok: false, error: "Method not allowed." });
    }
    return redirectHtml(res, "/login-classic?error=method_not_allowed");
  }

  try {
    const body = parseBody(req);
    const email = normalizeValue(body.email).toLowerCase();
    const password = normalizeValue(body.password);
    const redirectTo = safeRedirect(body.redirectTo || "/dashboard");

    if (!email || !password) {
      if (wantsJson(req)) {
        return res.status(400).json({ ok: false, error: "Email et mot de passe requis." });
      }
      return redirectHtml(res, "/login-classic?error=missing_credentials");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      if (wantsJson(req)) {
        return res.status(401).json({ ok: false, error: "Identifiants invalides." });
      }
      return redirectHtml(res, "/login-classic?error=invalid_credentials");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      if (wantsJson(req)) {
        return res.status(401).json({ ok: false, error: "Identifiants invalides." });
      }
      return redirectHtml(res, "/login-classic?error=invalid_credentials");
    }

    const sessionToken = `${user.id}.${Date.now()}`;

    setSessionCookie(res, sessionToken);

    const payload = {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || "",
      },
      redirectTo,
    };

    if (wantsJson(req)) {
      return res.status(200).json(payload);
    }

    return redirectHtml(res, redirectTo);
  } catch (error) {
    if (wantsJson(req)) {
      return res.status(500).json({ ok: false, error: "Erreur interne." });
    }
    return redirectHtml(res, "/login-classic?error=server_error");
  }
};
