import React, { useState } from 'react';
import Head from 'next/head';

const COUNTRIES = {
  CM: { name: '🇨🇲 Cameroun', prefix: '+237', example: '6XX XXX XXX' },
  SN: { name: '🇸🇳 Sénégal', prefix: '+221', example: '7X XXX XX XX' },
  CI: { name: '🇨🇮 Côte d’Ivoire', prefix: '+225', example: '0X XX XX XX XX' },
  CD: { name: '🇨🇩 RD Congo', prefix: '+243', example: '8X XXX XXXX' },
  BF: { name: '🇧🇫 Burkina Faso', prefix: '+226', example: '5X XX XX XX' },
  GN: { name: '🇬🇳 Guinée', prefix: '+224', example: '6X XX XX XXX' }
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
        setFeedback({ type: 'success', msg: `✅ Code de sécurité transmis au ${fullNumber}` });
      } else {
        setFeedback({ type: 'error', msg: `❌ Accès refusé : ${data.error || 'Échec réseau'}` });
      }
    } catch (err) {
      setFeedback({ type: 'error', msg: `⚠️ Anomalie réseau détectée. Connexion instable.` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Portail Sécurisé · Smith-Heffa Paygate</title>
      </Head>

      <main style={{ minHeight: '100vh', backgroundColor: '#f4f4f5', color: '#111', fontFamily: 'system-ui, sans-serif', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Environment Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#eefbf4', border: '1px solid #c3e8d1', color: '#1b5e3a', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '24px', textTransform: 'uppercase' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
          ENV : PRODUCTION SECURE
        </div>

        <div style={{ width: '100%', maxWidth: '600px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}>
          
          {/* Header Premium */}
          <section style={{ backgroundColor: '#09090b', color: '#fff', padding: '32px', textAlign: 'center', borderBottom: '4px solid #d4b26a' }}>
            <h1 style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>
              {view === 'initial' ? '🔐 Portail d\'Authentification' : view === 'phone' ? '📱 Vérification Mobile (OTP)' : 'Connexion'}
            </h1>
            <p style={{ margin: '0', color: '#a1a1aa', fontSize: '15px', lineHeight: '1.5' }}>
              Smith-Heffa Enterprise Payment Rail. <br/>Infrastructure certifiée et chiffrée de bout en bout.
            </p>
          </section>

          {/* Body Dynamique */}
          <section style={{ padding: '32px' }}>
            
            {/* VUE INITIALE */}
            {view === 'initial' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <a href="/login-classic" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2px solid #f4f4f5', backgroundColor: '#fafafa', padding: '24px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#111' }}>✉️ Espace Collaborateur</h2>
                    <p style={{ margin: '0', color: '#52525b', fontSize: '14px' }}>Connexion classique par adresse courriel et mot de passe.</p>
                  </div>
                  <span style={{ fontWeight: '800', color: '#09090b', backgroundColor: '#e4e4e7', padding: '8px 16px', borderRadius: '12px' }}>Ouvrir</span>
                </a>
                
                <button onClick={() => setView('phone')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2px solid #e7dcc4', backgroundColor: '#fffdf8', padding: '24px', borderRadius: '16px', cursor: 'pointer', textAlign: 'left' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#111' }}>⚡️ Mobile Trust Layer</h2>
                    <p style={{ margin: '0', color: '#52525b', fontSize: '14px' }}>Vérification instantanée par code OTP sur réseau opérateur.</p>
                  </div>
                  <span style={{ fontWeight: '800', color: '#fff', backgroundColor: '#09090b', padding: '8px 16px', borderRadius: '12px' }}>Connecter</span>
                </button>
              </div>
            )}

            {/* VUE TELEPHONE (OTP ORANGE) */}
            {view === 'phone' && (
              <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: '700', fontSize: '14px', color: '#111' }}>🌐 Devise & Pays d'opération</label>
                  <select 
                    value={country} 
                    onChange={(e) => { setCountry(e.target.value); setPhone(''); setFeedback(null); }}
                    style={{ width: '100%', height: '54px', padding: '0 16px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: '#fafafa', fontSize: '16px', fontWeight: '600', color: '#111', boxSizing: 'border-box', cursor: 'pointer' }}
                  >
                    {Object.entries(COUNTRIES).map(([code, data]) => (
                      <option key={code} value={code}>{data.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: '700', fontSize: '14px', color: '#111' }}>📱 Numéro de téléphone cible</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '85px', height: '54px', borderRadius: '12px', border: '2px solid #e7dcc4', backgroundColor: '#fffdf8', fontWeight: '800', color: '#b45309', boxSizing: 'border-box' }}>
                      {COUNTRIES[country].prefix}
                    </div>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={COUNTRIES[country].example}
                      required
                      style={{ flex: 1, height: '54px', padding: '0 16px', borderRadius: '12px', border: '2px solid #e5e7eb', fontSize: '16px', fontWeight: '600', color: '#111', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                </div>

                {feedback && (
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: feedback.type === 'success' ? '#eefbf4' : '#fef2f2', border: `1px solid ${feedback.type === 'success' ? '#c3e8d1' : '#fecaca'}`, color: feedback.type === 'success' ? '#1b5e3a' : '#991b1b', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {feedback.msg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="submit" disabled={loading} style={{ flex: 1, height: '54px', borderRadius: '12px', backgroundColor: loading ? '#52525b' : '#09090b', color: '#d4b26a', fontWeight: '800', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                    {loading ? '⏳ Traitement Sécurisé...' : '🛡️ Recevoir le code'}
                  </button>
                  <button type="button" onClick={() => { setView('initial'); setFeedback(null); }} style={{ width: '100px', height: '54px', borderRadius: '12px', backgroundColor: '#fff', border: '2px solid #e5e7eb', color: '#111', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                    Retour
                  </button>
                </div>
              </form>
            )}

          </section>
          
          {/* Trust Banner Google SecOps */}
          <div style={{ backgroundColor: '#fafafa', padding: '20px 32px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Protected by</span>
            <img src="/images/SecOps-512-color-rgb.svg" alt="Google Cloud Security Operations" style={{ height: '24px', opacity: '0.9' }} onError={(e) => { e.target.style.display='none'; }}/>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#111' }}>Google Security</span>
          </div>
        </div>
      </main>
    </>
  );
}
