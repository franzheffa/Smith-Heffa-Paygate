import React from 'react';
import Head from 'next/head';

export default function LoginClassic() {
  return (
    <>
      <Head>
        <title>Collaborateur · Smith-Heffa Paygate</title>
      </Head>

      <main style={{ minHeight: '100vh', backgroundColor: '#f4f4f5', color: '#111', fontFamily: 'system-ui, sans-serif', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#eefbf4', border: '1px solid #c3e8d1', color: '#1b5e3a', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '24px', textTransform: 'uppercase' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
          ENV : PRODUCTION SECURE
        </div>

        <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}>

          <section style={{ backgroundColor: '#09090b', color: '#fff', padding: '32px', textAlign: 'center', borderBottom: '4px solid #d4b26a' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>
              ✉️ Accès Collaborateur
            </h1>
            <p style={{ margin: '0', color: '#a1a1aa', fontSize: '15px' }}>Authentification Enterprise Directory.</p>
          </section>

          <section style={{ padding: '32px' }}>
            <form action="/api/auth/login" method="post" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '700', fontSize: '14px', color: '#111' }}>📧 Adresse Courriel</label>
                <input
                  type="email"
                  name="email"
                  placeholder="nom@buttertech.io"
                  required
                  style={{ height: '54px', padding: '0 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '16px', fontWeight: '500', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '700', fontSize: '14px', color: '#111' }}>🔑 Mot de Passe</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••••••"
                  required
                  style={{ height: '54px', padding: '0 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '16px', fontWeight: '500', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" style={{ flex: 1, height: '54px', borderRadius: '12px', backgroundColor: '#09090b', color: '#d4b26a', fontWeight: '800', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: 'pointer' }}>
                  Se Connecter
                </button>
                <a href="/register" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "54px", padding: "0 20px", borderRadius: "12px", backgroundColor: "#fff", border: "2px solid #e5e7eb", color: "#111", fontWeight: "800", fontSize: "14px", textDecoration: "none", boxSizing: "border-box" }}>Créer un compte</a>
                <a href="/auth/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100px", height: "54px", borderRadius: "12px", backgroundColor: "#fff", border: "2px solid #e5e7eb", color: "#111", fontWeight: "800", fontSize: "14px", textDecoration: "none", boxSizing: "border-box" }}>
                  Retour
                </a>
              </div>
            </form>
          </section>

          <div style={{ backgroundColor: '#09090b', padding: '20px 32px', borderTop: '4px solid #d4b26a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Protected by</span>
            <svg height="22" viewBox="0 0 340 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
              <path d="M28 3L6 12v18c0 12 9 23 22 27 13-4 22-15 22-27V12Z" fill="none" stroke="#4285F4" strokeWidth="3" strokeLinejoin="round"/>
              <path d="M40 3l10 4v23c0 8-4 16-10 21" fill="none" stroke="#34A853" strokeWidth="3" strokeLinecap="round"/>
              <path d="M24 20c-5 0-9 4-9 10s4 10 9 10c2 0 4-1 6-2" fill="none" stroke="#FBBC04" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M31 22c2 2 3 5 3 8s-1 6-3 8" fill="none" stroke="#EA4335" strokeWidth="3.5" strokeLinecap="round"/>
              <text x="62" y="39" fontFamily="-apple-system,BlinkMacSystemFont,'Google Sans',sans-serif" fontSize="19" fontWeight="400" fill="#ffffff">Google Security Operations</text>
            </svg>
          </div>
        </div>
      </main>
    </>
  );
}
