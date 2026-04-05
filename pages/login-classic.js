import Head from "next/head";

const shell = {
  page: {
    minHeight: "100vh",
    background: "#f6f3eb",
    color: "#111111",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: "40px 16px 56px",
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
    padding: "28px 30px 24px",
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
  body: {
    padding: 30,
    display: "grid",
    gap: 22,
  },
  section: {
    borderRadius: 22,
    border: "1px solid #eadfca",
    background: "#fcfaf5",
    padding: 24,
  },
  title: {
    margin: "0 0 8px",
    fontSize: 22,
    lineHeight: 1.2,
    fontWeight: 800,
  },
  text: {
    margin: "0 0 18px",
    color: "#3d3322",
    fontSize: 15,
    lineHeight: 1.6,
  },
  form: {
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
    height: 54,
    borderRadius: 18,
    border: "1px solid #d8c9aa",
    background: "#fffdf8",
    padding: "0 16px",
    fontSize: 16,
    color: "#111111",
    outline: "none",
    boxSizing: "border-box",
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
    minWidth: 180,
    height: 54,
    borderRadius: 18,
    border: "1px solid #0b0b0b",
    background: "#0b0b0b",
    color: "#d4b26a",
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    padding: "0 20px",
    textDecoration: "none",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
    height: 54,
    borderRadius: 18,
    border: "1px solid #d7d7d7",
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
  infoBox: {
    borderRadius: 16,
    background: "#faf7ef",
    border: "1px solid #eadfca",
    padding: 16,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#4a3b22",
  },
  helper: {
    marginTop: -2,
    fontSize: 13,
    lineHeight: 1.5,
    color: "#6a5730",
    fontWeight: 600,
  },
};

const countries = [
  { code: "CM", label: "Cameroun", dialCode: "+237", example: "+2376XXXXXXX" },
  { code: "SN", label: "Sénégal", dialCode: "+221", example: "+221771234567" },
  { code: "CI", label: "Côte d’Ivoire", dialCode: "+225", example: "+2250700000000" },
  { code: "CD", label: "RD Congo", dialCode: "+243", example: "+243970000000" },
  { code: "BF", label: "Burkina Faso", dialCode: "+226", example: "+22670000000" },
  { code: "GN", label: "Guinée", dialCode: "+224", example: "+224620000000" },
];

export default function LoginClassic() {
  const current = countries[0];

  return (
    <>
      <Head>
        <title>Login classique · Smith-Heffa Paygate</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={shell.page}>
        <div style={shell.wrap}>
          <div style={shell.card}>
            <section style={shell.hero}>
              <p style={shell.eyebrow}>Buttertech · Smith-Heffa Paygate</p>
              <h1 style={shell.h1}>Login classique</h1>
              <p style={shell.lead}>Accédez à votre espace en toute simplicité.</p>
            </section>

            <section style={shell.body}>
              <section style={shell.section}>
                <h2 style={shell.title}>Connexion</h2>
                <p style={shell.text}>Utilisez votre email et votre mot de passe pour continuer.</p>

                <form style={shell.form} action="/api/auth/login" method="post" noValidate>
                  <input type="hidden" name="redirectTo" value="/dashboard" />

                  <label style={shell.label}>
                    Email
                    <input
                      style={shell.input}
                      type="email"
                      name="email"
                      autoComplete="email"
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
                      placeholder="Votre mot de passe"
                      required
                    />
                  </label>

                  <div style={shell.actions}>
                    <button type="submit" style={shell.primary}>
                      Se connecter
                    </button>
                    <a href="/auth/login" style={shell.secondary}>
                      Retour
                    </a>
                  </div>

                  <div style={shell.status} />
                </form>
              </section>

              <section style={shell.section}>
                <h2 style={shell.title}>Test rapide Orange</h2>
                <p style={shell.text}>Vérifiez l’envoi d’un code sur les pays actifs avant le branchement final.</p>

                <form style={shell.form}>
                  <div style={shell.row2}>
                    <label style={shell.label}>
                      Pays
                      <select style={shell.input} defaultValue={current.code}>
                        {countries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={shell.label}>
                      Numéro
                      <input
                        style={shell.input}
                        type="text"
                        placeholder={current.example}
                        defaultValue={current.example}
                        required
                      />
                      <span style={shell.helper}>
                        Indicatif {current.dialCode} · Exemple {current.example}
                      </span>
                    </label>
                  </div>

                  <div style={shell.actions}>
                    <button type="button" style={shell.primary}>
                      Envoyer le code
                    </button>
                  </div>

                  <div style={shell.status} />
                </form>
              </section>

              <div style={shell.infoBox}>
                Pays disponibles : Cameroun, Sénégal, Côte d’Ivoire, RD Congo, Burkina Faso, Guinée.
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
