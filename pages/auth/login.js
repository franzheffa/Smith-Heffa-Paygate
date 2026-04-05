import Head from "next/head";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f3eb",
    color: "#111111",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: "48px 16px",
  },
  wrap: {
    maxWidth: 760,
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
  h1: {
    margin: "14px 0 8px",
    fontSize: 34,
    lineHeight: 1.1,
    fontWeight: 800,
  },
  lead: {
    margin: 0,
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    lineHeight: 1.6,
  },
  body: {
    padding: 28,
    display: "grid",
    gap: 16,
  },
  choice: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    border: "1px solid #eadfca",
    background: "#fcfaf5",
    borderRadius: 20,
    padding: 20,
    textDecoration: "none",
    color: "#111111",
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 6,
  },
  choiceText: {
    fontSize: 15,
    color: "#4b3d28",
    lineHeight: 1.6,
  },
};

export default function AuthLogin() {
  return (
    <>
      <Head>
        <title>Connexion · Smith-Heffa Paygate</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.card}>
            <section style={styles.hero}>
              <p style={styles.eyebrow}>Buttertech · Smith-Heffa Paygate</p>
              <h1 style={styles.h1}>Bienvenue</h1>
              <p style={styles.lead}>Choisissez la manière la plus simple pour accéder à votre espace.</p>
            </section>

            <section style={styles.body}>
              <a href="/login-classic" style={styles.choice}>
                <div>
                  <div style={styles.choiceTitle}>Se connecter avec email</div>
                  <div style={styles.choiceText}>Accès direct avec votre email et votre mot de passe.</div>
                </div>
                <div style={{ fontWeight: 800 }}>Ouvrir</div>
              </a>

              <a href="/login-classic#otp" style={styles.choice}>
                <div>
                  <div style={styles.choiceTitle}>Continuer avec téléphone</div>
                  <div style={styles.choiceText}>Vérification rapide par code sur les pays Orange actifs.</div>
                </div>
                <div style={{ fontWeight: 800 }}>Ouvrir</div>
              </a>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
