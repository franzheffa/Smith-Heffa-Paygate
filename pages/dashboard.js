import Head from "next/head";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f3eb",
    color: "#111111",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: "40px 16px 56px",
  },
  wrap: {
    maxWidth: 980,
    margin: "0 auto",
  },
  hero: {
    background: "#0b0b0b",
    color: "#ffffff",
    borderRadius: 28,
    padding: "28px 30px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.08)",
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
    color: "rgba(255,255,255,0.76)",
    fontSize: 15,
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gap: 18,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    marginTop: 24,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e7dcc4",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 16px 40px rgba(0,0,0,0.06)",
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: 22,
    fontWeight: 800,
  },
  text: {
    margin: 0,
    color: "#3d3322",
    fontSize: 15,
    lineHeight: 1.6,
  },
  cta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
    height: 52,
    borderRadius: 18,
    border: "1px solid #0b0b0b",
    background: "#0b0b0b",
    color: "#d4b26a",
    fontWeight: 800,
    letterSpacing: "0.05em",
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
        <title>Dashboard · Smith-Heffa Paygate</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={styles.page}>
        <div style={styles.wrap}>
          <section style={styles.hero}>
            <p style={styles.eyebrow}>Buttertech · Smith-Heffa Paygate</p>
            <h1 style={styles.h1}>Espace connecté</h1>
            <p style={styles.lead}>Vous êtes bien connecté. Reprenez le déploiement depuis votre tableau de bord.</p>
          </section>

          <section style={styles.grid}>
            <article style={styles.card}>
              <h2 style={styles.cardTitle}>Orange OTP</h2>
              <p style={styles.text}>Contrôlez rapidement l’état du runtime et poursuivez les vérifications pays actifs.</p>
              <a href="/login-classic" style={styles.cta}>Ouvrir</a>
            </article>

            <article style={styles.card}>
              <h2 style={styles.cardTitle}>OIDC debug</h2>
              <p style={styles.text}>Retrouvez la génération d’URL et les parcours de test sans exposer de sortie brute.</p>
              <a href="/oidc-debug" style={styles.cta}>Ouvrir</a>
            </article>

            <article style={styles.card}>
              <h2 style={styles.cardTitle}>Retour accueil</h2>
              <p style={styles.text}>Revenez au point d’entrée principal sans tomber sur une page vide après connexion.</p>
              <a href="/" style={styles.cta}>Accueil</a>
            </article>
          </section>
        </div>
      </main>
    </>
  );
}
