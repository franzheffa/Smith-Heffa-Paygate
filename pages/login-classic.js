import { useState } from "react";

export default function LoginClassicPage() {
  const [email, setEmail] = useState("franz@buttertech.io");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("CM");
  const [phoneNumber, setPhoneNumber] = useState("+2376XXXXXXX");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleOrangeOtp(event) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Orange OTP failed");
      }

      setStatus(`OTP ${data.countryCode} initialisé (${data.mode}).`);
    } catch (error) {
      setStatus(error?.message || "Erreur Orange OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f3eb",
        color: "#111111",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: "48px 16px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e7dcc4",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 24px 80px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              background: "#0b0b0b",
              color: "#ffffff",
              padding: "28px 28px 24px",
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#d4b26a",
              }}
            >
              Buttertech · Smith-Heffa Paygate
            </div>
            <h1
              style={{
                margin: "14px 0 8px",
                fontSize: 34,
                lineHeight: 1.1,
                fontWeight: 800,
              }}
            >
              Login classique
            </h1>
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.72)",
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              Point d’entrée stable pour continuer le déploiement pendant que le
              rail Orange reste prioritaire.
            </p>
          </div>

          <div style={{ padding: 28, display: "grid", gap: 20 }}>
            <section
              style={{
                border: "1px solid #eadfca",
                borderRadius: 18,
                padding: 20,
                background: "#fffdfa",
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>
                Connexion email / mot de passe
              </h2>
              <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6 }}>
                Ce formulaire conserve le point d’entrée legacy sans dépendre de
                Google.
              </p>

              <form method="POST" action="/api/auth/login" style={{ display: "grid", gap: 14 }}>
                <div>
                  <label htmlFor="email" style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 14,
                      border: "1px solid #d8d2c4",
                      padding: "0 14px",
                      fontSize: 15,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="password" style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      height: 48,
                      borderRadius: 14,
                      border: "1px solid #d8d2c4",
                      padding: "0 14px",
                      fontSize: 15,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    style={{
                      borderRadius: 14,
                      background: "#0b0b0b",
                      color: "#d4b26a",
                      padding: "14px 18px",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      border: "1px solid #0b0b0b",
                      cursor: "pointer",
                    }}
                  >
                    Se connecter
                  </button>

                  <a
                    href="/auth/login"
                    style={{
                      borderRadius: 14,
                      background: "#ffffff",
                      color: "#111111",
                      padding: "14px 18px",
                      fontWeight: 700,
                      border: "1px solid #d8d8d8",
                      textDecoration: "none",
                    }}
                  >
                    Retour
                  </a>
                </div>
              </form>
            </section>

            <section
              style={{
                border: "1px solid #eadfca",
                borderRadius: 18,
                padding: 20,
                background: "#fffdfa",
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>
                Orange OTP quick test
              </h2>
              <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.6 }}>
                Validation rapide du runtime Orange CM / SN avant branchement transport réel.
              </p>

              <form onSubmit={handleOrangeOtp} style={{ display: "grid", gap: 14 }}>
                <div
                  style={{
                    display: "grid",
                    gap: 14,
                    gridTemplateColumns: "1fr 1fr",
                  }}
                >
                  <div>
                    <label htmlFor="country" style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
                      Pays
                    </label>
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      style={{
                        width: "100%",
                        height: 48,
                        borderRadius: 14,
                        border: "1px solid #d8d2c4",
                        padding: "0 14px",
                        fontSize: 15,
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="CM">CM</option>
                      <option value="SN">SN</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>
                      Numéro
                    </label>
                    <input
                      id="phoneNumber"
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{
                        width: "100%",
                        height: 48,
                        borderRadius: 14,
                        border: "1px solid #d8d2c4",
                        padding: "0 14px",
                        fontSize: 15,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      borderRadius: 14,
                      background: "#0b0b0b",
                      color: "#d4b26a",
                      padding: "14px 18px",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      border: "1px solid #0b0b0b",
                      cursor: "pointer",
                    }}
                  >
                    {loading ? "Envoi..." : "Envoyer OTP Orange"}
                  </button>
                </div>

                <div style={{ minHeight: 22, fontSize: 14, color: "#5c4a1f", fontWeight: 600 }}>
                  {status}
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
