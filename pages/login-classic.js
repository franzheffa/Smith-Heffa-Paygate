import { useMemo, useState } from "react";
import Head from "next/head";

const COUNTRY_OPTIONS = [
  { code: "CM", label: "Cameroun", dialCode: "+237", placeholder: "+2376XXXXXXX" },
  { code: "SN", label: "Sénégal", dialCode: "+221", placeholder: "+221771234567" },
  { code: "CI", label: "Côte d'Ivoire", dialCode: "+225", placeholder: "+22507XXXXXXX" },
  { code: "CD", label: "RD Congo", dialCode: "+243", placeholder: "+2438XXXXXXX" },
  { code: "BF", label: "Burkina Faso", dialCode: "+226", placeholder: "+2267XXXXXXX" },
  { code: "GN", label: "Guinée", dialCode: "+224", placeholder: "+2246XXXXXXX" },
];

function getCountryMeta(code) {
  return COUNTRY_OPTIONS.find((item) => item.code === code) || COUNTRY_OPTIONS[0];
}

export default function LoginClassicPage() {
  const [email, setEmail] = useState("franz@buttertech.io");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("CM");
  const [phoneNumber, setPhoneNumber] = useState(getCountryMeta("CM").placeholder);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [otpStatus, setOtpStatus] = useState("");

  const selectedCountry = getCountryMeta(country);

  const shell = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        background: "#f6f3eb",
        color: "#111111",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: "48px 16px",
      },
      wrap: {
        maxWidth: 860,
        margin: "0 auto",
      },
      card: {
        background: "#ffffff",
        border: "1px solid #e7dcc4",
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.08)",
      },
      hero: {
        background: "#0b0b0b",
        color: "#ffffff",
        padding: "28px 28px 24px",
      },
      eyebrow: {
        fontSize: 12,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: "#d4b26a",
        margin: 0,
      },
      title: {
        margin: "14px 0 8px",
        fontSize: 34,
        lineHeight: 1.1,
        fontWeight: 800,
      },
      subtitle: {
        margin: 0,
        color: "rgba(255,255,255,0.72)",
        fontSize: 15,
        lineHeight: 1.6,
      },
      content: {
        padding: 28,
        display: "grid",
        gap: 20,
      },
      panel: {
        borderRadius: 22,
        border: "1px solid #eadfca",
        background: "#fcfaf5",
        padding: 22,
      },
      panelTitle: {
        margin: "0 0 8px",
        fontSize: 22,
        lineHeight: 1.2,
        fontWeight: 800,
      },
      panelText: {
        margin: "0 0 18px",
        color: "#3d3322",
        fontSize: 15,
        lineHeight: 1.6,
      },
      grid: {
        display: "grid",
        gap: 16,
      },
      row2: {
        display: "grid",
        gap: 16,
        gridTemplateColumns: "1fr 1fr",
      },
      label: {
        display: "grid",
        gap: 8,
        fontSize: 15,
        fontWeight: 700,
        color: "#17120b",
      },
      input: {
        width: "100%",
        height: 52,
        borderRadius: 16,
        border: "1px solid #d8c9aa",
        background: "#fffdf8",
        padding: "0 16px",
        fontSize: 16,
        color: "#111111",
        outline: "none",
        boxSizing: "border-box",
      },
      select: {
        width: "100%",
        height: 52,
        borderRadius: 16,
        border: "1px solid #d8c9aa",
        background: "#fffdf8",
        padding: "0 16px",
        fontSize: 16,
        color: "#111111",
        outline: "none",
        boxSizing: "border-box",
      },
      hint: {
        marginTop: -2,
        fontSize: 13,
        lineHeight: 1.5,
        color: "#6a5730",
        fontWeight: 600,
      },
      actions: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
      },
      primary: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 170,
        height: 52,
        borderRadius: 16,
        border: "1px solid #0b0b0b",
        background: "#0b0b0b",
        color: "#d4b26a",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        textDecoration: "none",
        cursor: "pointer",
        padding: "0 20px",
      },
      secondary: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 120,
        height: 52,
        borderRadius: 16,
        border: "1px solid #d8d8d8",
        background: "#ffffff",
        color: "#111111",
        fontWeight: 700,
        textDecoration: "none",
        cursor: "pointer",
        padding: "0 20px",
      },
      status: {
        minHeight: 24,
        fontSize: 14,
        lineHeight: 1.6,
        color: "#5c4a1f",
        fontWeight: 700,
      },
      footerNote: {
        borderRadius: 16,
        background: "#faf7ef",
        border: "1px solid #eadfca",
        padding: 16,
        fontSize: 14,
        lineHeight: 1.6,
        color: "#4a3b22",
      },
    }),
    []
  );

  async function handleClassicLogin(event) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email: String(email || "").trim(),
          password,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || "Connexion impossible.");
      }

      setStatus("Connexion réussie. Redirection vers le dashboard...");
      window.location.assign("/dashboard");
    } catch (error) {
      setStatus(error?.message || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpQuickTest(event) {
    event.preventDefault();
    setOtpLoading(true);
    setOtpStatus("");

    try {
      const response = await fetch("/api/paygate/orange/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country,
          phoneNumber,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || "OTP Orange impossible.");
      }

      const parts = [
        "OTP Orange accepté.",
        payload?.countryCode ? `Pays: ${payload.countryCode}.` : "",
        payload?.mode ? `Mode: ${payload.mode}.` : "",
        payload?.requestId ? `RequestId: ${payload.requestId}.` : "",
        payload?.otpPreview ? `OTP preview: ${payload.otpPreview}.` : "",
      ].filter(Boolean);

      setOtpStatus(parts.join(" "));
    } catch (error) {
      setOtpStatus(error?.message || "OTP Orange impossible.");
    } finally {
      setOtpLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login classique · Smith-Heffa Paygate</title>
      </Head>

      <main style={shell.page}>
        <div style={shell.wrap}>
          <div style={shell.card}>
            <section style={shell.hero}>
              <p style={shell.eyebrow}>Buttertech · Smith-Heffa Paygate</p>
              <h1 style={shell.title}>Login classique</h1>
              <p style={shell.subtitle}>
                Point d’entrée stable pour continuer le déploiement pendant que
                le rail Orange reste prioritaire.
              </p>
            </section>

            <section style={shell.content}>
              <section style={shell.panel}>
                <h2 style={shell.panelTitle}>Connexion email / mot de passe</h2>
                <p style={shell.panelText}>
                  Ce formulaire garde une UX propre avec redirection directe
                  après succès.
                </p>

                <form onSubmit={handleClassicLogin} style={shell.grid}>
                  <label style={shell.label}>
                    Email
                    <input
                      style={shell.input}
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="franz@buttertech.io"
                      required
                    />
                  </label>

                  <label style={shell.label}>
                    Mot de passe
                    <input
                      style={shell.input}
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                      required
                    />
                  </label>

                  <div style={shell.actions}>
                    <button type="submit" style={shell.primary} disabled={loading}>
                      {loading ? "Connexion..." : "Se connecter"}
                    </button>

                    <a href="/auth/login" style={shell.secondary}>
                      Retour
                    </a>
                  </div>

                  <div style={shell.status}>{status}</div>
                </form>
              </section>

              <section style={shell.panel}>
                <h2 style={shell.panelTitle}>Orange OTP quick test</h2>
                <p style={shell.panelText}>
                  Validation rapide du runtime Orange avant branchement transport réel.
                </p>

                <form onSubmit={handleOtpQuickTest} style={shell.grid}>
                  <div style={shell.row2}>
                    <label style={shell.label}>
                      Pays
                      <select
                        style={shell.select}
                        value={country}
                        onChange={(e) => {
                          const nextCode = e.target.value;
                          const nextMeta = getCountryMeta(nextCode);
                          setCountry(nextCode);
                          setPhoneNumber(nextMeta.placeholder);
                        }}
                      >
                        {COUNTRY_OPTIONS.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.code} - {item.label} ({item.dialCode})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={shell.label}>
                      Numéro
                      <input
                        style={shell.input}
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={selectedCountry.placeholder}
                        required
                      />
                      <span style={shell.hint}>
                        Indicatif: {selectedCountry.dialCode} · Exemple: {selectedCountry.placeholder}
                      </span>
                    </label>
                  </div>

                  <div style={shell.actions}>
                    <button type="submit" style={shell.primary} disabled={otpLoading}>
                      {otpLoading ? "Envoi..." : "Envoyer OTP Orange"}
                    </button>
                  </div>

                  <div style={shell.status}>{otpStatus}</div>
                </form>
              </section>

              <div style={shell.footerNote}>
                Pays activés côté UI: Cameroun, Sénégal, Côte d’Ivoire, RD Congo,
                Burkina Faso, Guinée.
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
