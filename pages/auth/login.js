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
  const [view, setView] = useState('initial'); // 'initial', 'phone', 'email'
  const [country, setCountry] = useState('CM');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    // Formatage propre du numéro
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

      <main style={{ minHeight: '100vh', background: '#f6f3eb', color: '#111111', fontFamily: 'system-ui, sans-serif', padding: '48px 16px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', background: '#ffffff', border: '1px solid #e7dcc4', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.08)' }}>
          
          {/* HEADER PREMIUM */}
          <section style={{ background: '#0b0b0b', color: '#ffffff', padding: '28px 28px 24px' }}>
            <p style={{ fontSize: '12px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#d4b26a', margin: '0' }}>Buttertech · Smith-Heffa Paygate</p>
            <h1 style={{ margin: '14px 0 8px', fontSize: '34px', lineHeight: '1.1', fontWeight: '800' }}>
              {view === 'initial' ? 'Bienvenue' : view === 'phone' ? 'Vérification Mobile' : 'Connexion Email'}
            </h1>
            <p style={{ margin: '0', color: 'rgba(255,255,255,0.72)', fontSize: '15px', lineHeight: '1.6' }}>
              {view === 'initial' ? 'Choisissez la manière la plus simple pour accéder à votre espace.' : 'Accès sécurisé Enterprise Grade.'}
            </p>
          </section>

          {/* CONTENU DYNAMIQUE */}
          <section style={{ padding: '28px' }}>
            
            {/* VUE INITIALE */}
            {view === 'initial' && (
              <div style={{ display: 'grid', gap: '16px' }}>
                <button onClick={() => setView('email')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', border: '1px solid #eadfca', background: '#fcfaf5', borderRadius: '20px', padding: '20px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Se connecter avec email</div>
                    <div style={{ fontSize: '15px', color: '#4b3d28', lineHeight: '1.6' }}>Accès direct avec votre email et votre mot de passe.</div>
                  </div>
                  <div style={{ fontWeight: '800' }}>Ouvrir</div>
                </button>
                
                <button onClick={() => setView('phone')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', border: '1px solid #eadfca', background: '#fcfaf5', borderRadius: '20px', padding: '20px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Continuer avec téléphone</div>
                    <div style={{ fontSize: '15px', color: '#4b3d28', lineHeight: '1.6' }}>Vérification rapide par code OTP sécurisé.</div>
                  </div>
                  <div style={{ fontWeight: '800' }}>Ouvrir</div>
                </button>
              </div>
            )}

            {/* VUE TELEPHONE (OTP ORANGE) */}
            {view === 'phone' && (
              <form onSubmit={handlePhoneSubmit} style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <label style={{ fontWeight: '700', fontSize: '15px' }}>Pays d'opération</label>
                  <select 
                    value={country} 
                    onChange={(e) => { setCountry(e.target.value); setPhone(''); setFeedback(null); }}
                    style={{ height: '54px', borderRadius: '16px', border: '1px solid #d8c9aa', background: '#fffdf8', padding: '0 16px', fontSize: '16px', outline: 'none' }}
                  >
                    {Object.entries(COUNTRIES).map(([code, data]) => (
                      <option key={code} value={code}>{data.name} ({data.prefix})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  <label style={{ fontWeight: '700', fontSize: '15px' }}>Numéro de téléphone</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* INDICATIF DYNAMIQUE */}
                    <div style={{ background: '#fcfaf5', border: '1px solid #d8c9aa', borderRadius: '16px', height: '54px', padding: '0 16px', display: 'flex', alignItems: 'center', fontWeight: '800', color: '#4b3d28' }}>
                      {COUNTRIES[country].prefix}
                    </div>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={COUNTRIES[country].example}
                      required
                      style={{ flex: 1, height: '54px', borderRadius: '16px', border: '1px solid #d8c9aa', padding: '0 16px', fontSize: '16px', outline: 'none' }}
                    />
                  </div>
                </div>

                {feedback && (
                  <div style={{ padding: '16px', borderRadius: '12px', background: feedback.type === 'success' ? '#eefbf4' : '#fff0f0', border: `1px solid ${feedback.type === 'success' ? '#c3e8d1' : '#ffd6d6'}`, color: feedback.type === 'success' ? '#1b5e3a' : '#8a1d1d', fontWeight: '600', fontSize: '14px' }}>
                    {feedback.msg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="submit" disabled={loading} style={{ flex: 1, height: '54px', borderRadius: '16px', background: loading ? '#444' : '#0b0b0b', color: '#d4b26a', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Traitement...' : 'Envoyer le code'}
                  </button>
                  <button type="button" onClick={() => { setView('initial'); setFeedback(null); }} style={{ width: '120px', height: '54px', borderRadius: '16px', background: '#fff', border: '1px solid #d8c9aa', fontWeight: '700', cursor: 'pointer' }}>
                    Retour
                  </button>
                </div>
              </form>
            )}

            {/* VUE EMAIL (Placeholder propre) */}
            {view === 'email' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontWeight: '600', color: '#4b3d28', marginBottom: '24px' }}>Authentification Email en cours de branchement.</p>
                <button onClick={() => setView('initial')} style={{ height: '54px', borderRadius: '16px', background: '#fff', border: '1px solid #d8c9aa', fontWeight: '700', cursor: 'pointer', padding: '0 32px' }}>
                  Retour
                </button>
              </div>
            )}

          </section>
        </div>
      </main>
    </>
  );
}
