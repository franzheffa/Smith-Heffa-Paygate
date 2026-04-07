import React, { useState } from 'react';
import Head from 'next/head';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    if (form.password !== form.confirm) {
      setFeedback({ type: 'error', msg: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (form.password.length < 8) {
      setFeedback({ type: 'error', msg: 'Mot de passe trop court (8 caractères minimum).' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', msg: '✅ Compte créé. Redirection...' });
        setTimeout(() => window.location.href = '/dashboard', 1200);
      } else {
        setFeedback({ type: 'error', msg: `❌ ${data.error || 'Erreur lors de la création du compte.'}` });
      }
    } catch {
      setFeedback({ type: 'error', msg: '⚠️ Anomalie réseau. Réessayez.' });
    } finally {
      setLoading(false);
    }
  };

  const input = (type, key, placeholder, autoComplete) => (
    <input
      type={type}
      value={form[key]}
      onChange={handle(key)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required
      style={{ height: '54px', padding: '0 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '16px', fontWeight: '500', outline: 'none', boxSizing: 'border-box', width: '100%' }}
    />
  );

  return (
    <>
      <Head><title>Créer un compte · Smith-Heffa Paygate</title></Head>
      <main style={{ minHeight: '100vh', backgroundColor: '#f4f4f5', fontFamily: 'system-ui, sans-serif', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#eefbf4', border: '1px solid #c3e8d1', color: '#1b5e3a', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '24px', textTransform: 'uppercase' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
          ENV : PRODUCTION SECURE
        </div>

        <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}>

          <section style={{ backgroundColor: '#09090b', color: '#fff', padding: '32px', textAlign: 'center', borderBottom: '4px solid #d4b26a' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>🚀 Créer un compte</h1>
            <p style={{ margin: '0', color: '#a1a1aa', fontSize: '15px' }}>Smith-Heffa Enterprise Payment Rail.</p>
          </section>

          <section style={{ padding: '32px' }}>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '700', fontSize: '14px', color: '#111' }}>👤 Nom complet</label>
                {input('text', 'name', 'Franz Heffa', 'name')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '700', fontSize: '14px', color: '#111' }}>📧 Adresse courriel</label>
                {input('email', 'email', 'nom@buttertech.io', 'email')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '700', fontSize: '14px', color: '#111' }}>🔑 Mot de passe</label>
                {input('password', 'password', '8 caractères minimum', 'new-password')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: '700', fontSize: '14px', color: '#111' }}>🔑 Confirmer le mot de passe</label>
                {input('password', 'confirm', 'Répétez le mot de passe', 'new-password')}
              </div>

              {feedback && (
                <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: feedback.type === 'success' ? '#eefbf4' : '#fef2f2', border: `1px solid ${feedback.type === 'success' ? '#c3e8d1' : '#fecaca'}`, color: feedback.type === 'success' ? '#1b5e3a' : '#991b1b', fontSize: '14px', fontWeight: '700' }}>
                  {feedback.msg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" disabled={loading} style={{ flex: 1, height: '54px', borderRadius: '12px', backgroundColor: loading ? '#52525b' : '#09090b', color: '#d4b26a', fontWeight: '800', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? '⏳ Création...' : 'Créer mon compte'}
                </button>
              </div>

              <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '14px', color: '#52525b' }}>
                Déjà un compte ?{' '}
                <a href="/login-classic" style={{ color: '#09090b', fontWeight: '700', textDecoration: 'underline' }}>Se connecter</a>
              </p>
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
