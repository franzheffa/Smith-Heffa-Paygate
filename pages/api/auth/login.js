const bcrypt = require("bcryptjs");
const { prisma } = require("../../../lib/prisma");

function normalize(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}

function wantsJson(req) {
  const accept = String(req.headers.accept || "").toLowerCase();
  const requestedWith = String(req.headers["x-requested-with"] || "").toLowerCase();
  const responseMode = String((req.query && req.query.responseMode) || "").toLowerCase();
  return responseMode === "json" || requestedWith === "xmlhttprequest" || accept.includes("application/json");
}

function safeRedirect(target) {
  const value = normalize(target);
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

function setSessionCookie(res, token) {
  const parts = [
    `paygate_session=${encodeURIComponent(token)}`,
    "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=1209600",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    if (wantsJson(req)) return res.status(200).json({ ok: true, loginUrl: "/login-classic" });
    return res.redirect(303, "/login-classic");
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    if (wantsJson(req)) return res.status(405).json({ ok: false, error: "Method not allowed." });
    return res.redirect(303, "/login-classic?error=method_not_allowed");
  }

  try {
    const body = parseBody(req);
    const email = normalize(body.email).toLowerCase();
    const password = normalize(body.password);
    const redirectTo = safeRedirect(body.redirectTo || "/dashboard");

    if (!email || !password) {
      if (wantsJson(req)) return res.status(400).json({ ok: false, error: "Email et mot de passe requis." });
      return res.redirect(303, "/login-classic?error=missing_credentials");
    }

    // AuthAccount contient passwordHash — on joint via User
    const authAccount = await prisma.authAccount.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!authAccount || !authAccount.passwordHash) {
      if (wantsJson(req)) return res.status(401).json({ ok: false, error: "Identifiants invalides." });
      return res.redirect(303, "/login-classic?error=invalid_credentials");
    }

    const ok = await bcrypt.compare(password, authAccount.passwordHash);
    if (!ok) {
      if (wantsJson(req)) return res.status(401).json({ ok: false, error: "Identifiants invalides." });
      return res.redirect(303, "/login-classic?error=invalid_credentials");
    }

    const user = authAccount.user;
    setSessionCookie(res, `${user.id}.${Date.now()}`);

    if (wantsJson(req)) {
      return res.status(200).json({
        ok: true,
        redirectTo,
        user: { id: user.id, email: user.email, name: user.name || "" },
      });
    }
    return res.redirect(303, redirectTo);

  } catch (error) {
    console.error("[auth/login] Exception:", error.message);
    if (wantsJson(req)) return res.status(500).json({ ok: false, error: "Erreur interne." });
    return res.redirect(303, "/login-classic?error=server_error");
  }
};
