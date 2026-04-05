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
    maxWidth: 920,
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
    gap: 18,
  },
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  box: {
    borderRadius: 20,
    border: "1px solid #eadfca",
    background: "#fcfaf5",
    padding: 20,
  },
  title: {
    margin: "0 0 8px",
    fontSize: 20,
    fontWeight: 800,
  },
  text: {
    margin: 0,
    color: "#4b3d28",
    fontSize: 15,
    lineHeight: 1.6,
  },
  cta: {
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
    marginTop: 16,
    padding: "0 20px",
  },
};

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Espace connecté · Smith-Heffa Paygate</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={styles.page}>
        <div style={styles.wrap}>
          <div style={styles.card}>
            <section style={styles.hero}>
              <p style={styles.eyebrow}>Buttertech · Smith-Heffa Paygate</p>
              <h1 style={styles.h1}>Connexion réussie</h1>
              <p style={styles.lead}>Vous êtes dans votre espace. Le flux email s’arrête ici, proprement.</p>
            </section>

            <section style={styles.body}>
              <div style={styles.grid}>
                <div style={styles.box}>
                  <h2 style={styles.title}>Espace principal</h2>
                  <p style={styles.text}>Reprenez votre travail sans affichage technique ni sortie JSON.</p>
                  <a href="/auth/login" style={styles.cta}>Accueil</a>
                </div>

                <div style={styles.box}>
                  <h2 style={styles.title}>Test Orange</h2>
                  <p style={styles.text}>Accédez au test rapide téléphone si vous voulez vérifier les pays actifs.</p>
                  <a href="/login-classic#otp" style={styles.cta}>Ouvrir</a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
