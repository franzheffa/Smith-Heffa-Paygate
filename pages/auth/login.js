import Link from "next/link";

export async function getServerSideProps() {
  const orangeEnabled =
    String(process.env.PAYGATE_AUTH_ORANGE_OTP_ENABLED || "").trim().toLowerCase() === "true" ||
    String(process.env.NEXT_PUBLIC_PAYGATE_AUTH_ORANGE_OTP_ENABLED || "").trim().toLowerCase() === "true";

  const googleEnabled =
    String(process.env.PAYGATE_AUTH_GOOGLE_ENABLED || "").trim().toLowerCase() === "true";

  const appleEnabled =
    String(process.env.PAYGATE_AUTH_APPLE_ENABLED || "").trim().toLowerCase() === "true";

  return {
    props: {
      orangeEnabled,
      googleEnabled,
      appleEnabled,
    },
  };
}

export default function UnifiedLoginPage({ orangeEnabled, googleEnabled, appleEnabled }) {
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
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e7dcc4",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 24px 80px rgba(0,0,0,0.08)",
          }}
        >
          <section
            style={{
              background: "#0b0b0b",
              color: "#ffffff",
              padding: "28px 28px 24px",
            }}
          >
            <p
              style={{
                fontSize: 12,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#d4b26a",
                margin: 0,
              }}
            >
              Buttertech · Smith-Heffa Paygate
            </p>

            <h1
              style={{
                margin: "14px 0 8px",
                fontSize: 34,
                lineHeight: 1.1,
                fontWeight: 800,
              }}
            >
              Authentification unifiée
            </h1>

            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.72)",
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              Point d’entrée enterprise grade pour poursuivre le go-to-market
              sans bloquer le rail Orange.
            </p>
          </section>

          <section style={{ padding: 28, display: "grid", gap: 14 }}>
            {orangeEnabled ? (
              <Link
                href="/login-classic"
                style={{
                  display: "block",
                  width: "100%",
                  borderRadius: 16,
                  background: "#0b0b0b",
                  color: "#d4b26a",
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "16px 18px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  border: "1px solid #0b0b0b",
                  boxSizing: "border-box",
                }}
              >
                Continuer avec téléphone
              </Link>
            ) : null}

            {googleEnabled ? (
              <a
                href="/api/auth/signin/google"
                style={{
                  display: "block",
                  width: "100%",
                  borderRadius: 16,
                  background: "#ffffff",
                  color: "#111111",
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "16px 18px",
                  fontWeight: 700,
                  border: "1px solid #d8d8d8",
                  boxSizing: "border-box",
                }}
              >
                Continuer avec Google
              </a>
            ) : null}

            {appleEnabled ? (
              <a
                href="/api/auth/signin/apple"
                style={{
                  display: "block",
                  width: "100%",
                  borderRadius: 16,
                  background: "#ffffff",
                  color: "#111111",
                  textAlign: "center",
                  textDecoration: "none",
                  padding: "16px 18px",
                  fontWeight: 700,
                  border: "1px solid #d8d8d8",
                  boxSizing: "border-box",
                }}
              >
                Continuer avec Apple
              </a>
            ) : null}

            {!orangeEnabled && !googleEnabled && !appleEnabled ? (
              <div
                style={{
                  borderRadius: 16,
                  background: "#faf7ef",
                  border: "1px solid #eadfca",
                  padding: 16,
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                Aucun provider n’est actuellement activé.
              </div>
            ) : null}

            <div
              style={{
                borderRadius: 16,
                background: "#faf7ef",
                border: "1px solid #eadfca",
                padding: 16,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Sprint mode: le CTA principal reste orienté téléphone / Orange OTP.
              <br />
              <a
                href="/"
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  color: "#5c4a1f",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Retour à l’accueil
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
