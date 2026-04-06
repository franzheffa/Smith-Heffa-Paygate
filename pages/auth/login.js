import React, { useState } from 'react';
import Head from 'next/head';

const COUNTRIES = {
  CM: { name: 'Cameroun', prefix: '+237', example: '6XX XXX XXX' },
  SN: { name: 'Sénégal', prefix: '+221', example: '7X XXX XX XX' },
  CI: { name: 'Côte d’Ivoire', prefix: '+225', example: '0X XX XX XX XX' },
  CD: { name: 'RD Congo', prefix: '+243', example: '8X XXX XXXX' },
  BF: { name: 'Burkina Faso', prefix: '+226', example: '5X XX XX XX' },
  GN: { name: 'Guinée', prefix: '+224', example: '6X XX XX XXX' }
};

export default function AuthLogin() {
  const [view, setView] = useState('initial'); 
  const [country, setCountry] = useState('CM');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const prefix = COUNTRIES[country].prefix;
    let cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    const fullNumber = cleanPhone.startsWith('+') ? cleanPhone : `${prefix}${cleanPhone}`;

    try {
      const res = await fetch('/api/paygate/orange/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, phoneNumber: fullNumber })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setFeedback({ type: 'success', msg: `✅ Code envoyé avec succès au ${fullNumber}` });
      } else {
        setFeedback({ type: 'error', msg: `❌ Erreur : ${data.error || 'Échec de l\'envoi'}` });
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: `❌ Erreur réseau. Vérifiez votre connexion.` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Connexion · Smith-Heffa Paygate</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main style={{ minHeight: '100vh', backgroundColor: '#f6f3eb', color: '#111', fontFamily: 'system-ui, sans-serif', padding: '48px 16px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', border: '1px solid #e7dcc4', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.08)' }}>
          
          {/* Header Premium */}
          <section style={{ backgroundColor: '#0b0b0b', color: '#fff', padding: '32px' }}>
            <p style={{ fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4b26a', margin: '0 0 16px 0', fontWeight: 'bold' }}>Buttertech · Smith-Heffa Paygate</p>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '800' }}>
              {view === 'initial' ? 'Bienvenue' : view === 'phone' ? 'Vérification Mobile' : 'Connexion Email'}
            </h1>
            <p style={{ margin: '0', color: '#aaa', fontSize: '15px' }}>
              {view === 'initial' ? 'Choisissez la manière la plus simple pour accéder à votre espace.' : 'Accès sécurisé Enterprise Grade.'}
            </p>
          </section>

          {/* Body Dynamique */}
          <section style={{ padding: '32px' }}>
            
            {/* VUE INITIALE */}
            {view === 'initial' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button onClick={() => setView('email')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eadfca', backgroundColor: '#fcfaf5', padding: '24px', borderRadius: '16px', cursor: 'pointer', textAlign: 'left' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#111' }}>Se connecter avec email</h2>
                    <p style={{ margin: '0', color: '#555', fontSize: '14px' }}>Accès direct avec votre email et votre mot de passe.</p>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#111' }}>Ouvrir &rarr;</span>
                </button>
                
                <button onClick={() => setView('phone')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eadfca', backgroundColor: '#fcfaf5', padding: '24px', borderRadius: '16px', cursor: 'pointer', textAlign: 'left' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#111' }}>Continuer avec téléphone</h2>
                    <p style={{ margin: '0', color: '#555', fontSize: '14px' }}>Vérification rapide par code OTP sécurisé.</p>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#111' }}>Ouvrir &rarr;</span>
                </button>
              </div>
            )}

            {/* VUE TELEPHONE (OTP ORANGE) */}
            {view === 'phone' && (
              <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: '700', fontSize: '14px', color: '#111' }}>Pays d'opération</label>
                  <select 
                    value={country} 
                    onChange={(e) => { setCountry(e.target.value); setPhone(''); setFeedback(null); }}
                    style={{ width: '100%', height: '54px', padding: '0 16px', borderRadius: '12px', border: '1px solid #d8c9aa', backgroundColor: '#fffdf8', fontSize: '16px', color: '#111', boxSizing: 'border-box' }}
                  >
                    {Object.entries(COUNTRIES).map(([code, data]) => (
                      <option key={code} value={code}>{data.name} ({data.prefix})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: '700', fontSize: '14px', color: '#111' }}>Numéro de téléphone</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '85px', height: '54px', borderRadius: '12px', border: '1px solid #d8c9aa', backgroundColor: '#fcfaf5', fontWeight: '800', color: '#111', boxSizing: 'border-box' }}>
                      {COUNTRIES[country].prefix}
                    </div>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={COUNTRIES[country].example}
                      required
                      style={{ flex: 1, height: '54px', padding: '0 16px', borderRadius: '12px', border: '1px solid #d8c9aa', fontSize: '16px', color: '#111', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                </div>

                {feedback && (
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: feedback.type === 'success' ? '#eefbf4' : '#fff0f0', border: `1px solid ${feedback.type === 'success' ? '#c3e8d1' : '#ffd6d6'}`, color: feedback.type === 'success' ? '#1b5e3a' : '#8a1d1d', fontSize: '14px', fontWeight: '600' }}>
                    {feedback.msg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="submit" disabled={loading} style={{ flex: 1, height: '54px', borderRadius: '12px', backgroundColor: loading ? '#666' : '#0b0b0b', color: '#d4b26a', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Traitement...' : 'Envoyer le code'}
                  </button>
                  <button type="button" onClick={() => { setView('initial'); setFeedback(null); }} style={{ width: '100px', height: '54px', borderRadius: '12px', backgroundColor: '#fff', border: '1px solid #d8c9aa', color: '#111', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                    Retour
                  </button>
                </div>
              </form>
            )}

            {/* VUE EMAIL (Placeholder propre) */}
            {view === 'email' && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ color: '#555', marginBottom: '24px' }}>Authentification Email classique disponible sur le portail direct.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button onClick={() => setView('initial')} style={{ height: '54px', padding: '0 24px', borderRadius: '12px', backgroundColor: '#fff', border: '1px solid #d8c9aa', color: '#111', fontWeight: 'bold', cursor: 'pointer' }}>
                    Retour
                  </button>
                  <a href="/login-classic" style={{ display: 'inline-flex', alignItems: 'center', height: '54px', padding: '0 24px', borderRadius: '12px', backgroundColor: '#0b0b0b', color: '#d4b26a', fontWeight: 'bold', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Aller au login
                  </a>
                </div>
              </div>
            )}

          </section>
        </div>
      </main>
    </>
  );
}
