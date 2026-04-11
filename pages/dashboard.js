import InteracHubButton from '../components/InteracHubButton';
import React, { useState } from 'react';
import Head from 'next/head';

const GOLD = '#C6A85B';
const BLACK = '#09090b';

const SecOps = () => (
  <svg height="20" viewBox="0 0 340 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
    <path d="M28 3L6 12v18c0 12 9 23 22 27 13-4 22-15 22-27V12Z" fill="none" stroke="#4285F4" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M40 3l10 4v23c0 8-4 16-10 21" fill="none" stroke="#34A853" strokeWidth="3" strokeLinecap="round"/>
    <path d="M24 20c-5 0-9 4-9 10s4 10 9 10c2 0 4-1 6-2" fill="none" stroke="#FBBC04" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M31 22c2 2 3 5 3 8s-1 6-3 8" fill="none" stroke="#EA4335" strokeWidth="3.5" strokeLinecap="round"/>
    <text x="62" y="39" fontFamily="-apple-system,BlinkMacSystemFont,'Google Sans',sans-serif" fontSize="19" fontWeight="400" fill="#ffffff">Google Security Operations</text>
  </svg>
);

// Pays Mobile Money avec préfixes
const MM_COUNTRIES = {
  orange: [
    { code: 'CM', name: 'CM - Cameroun', prefix: '+237' },
    { code: 'SN', name: 'SN - Sénégal', prefix: '+221' },
    { code: 'CI', name: "CI - Côte d'Ivoire", prefix: '+225' },
    { code: 'CD', name: 'CD - RD Congo', prefix: '+243' },
    { code: 'BF', name: 'BF - Burkina Faso', prefix: '+226' },
    { code: 'GN', name: 'GN - Guinée', prefix: '+224' },
  ],
  mtn: [
    { code: 'CM', name: '🇨�� Cameroun', prefix: '+237' },
    { code: 'GH', name: 'GH - Ghana', prefix: '+233' },
    { code: 'UG', name: 'UG - Uganda', prefix: '+256' },
    { code: 'RW', name: 'RW - Rwanda', prefix: '+250' },
    { code: 'ZM', name: 'ZM - Zambie', prefix: '+260' },
  ],
  mpesa: [
    { code: 'KE', name: '��🇪 Kenya', prefix: '+254' },
    { code: 'TZ', name: 'TZ - Tanzanie', prefix: '+255' },
    { code: 'MZ', name: 'MZ - Mozambique', prefix: '+258' },
  ],
};

// Formulaire Mobile Money
function MobileMoneyForm({ provider, color, onSubmit, loading, result }) {
  const countries = MM_COUNTRIES[provider] || [];
  const [country, setCountry] = useState(countries[0]?.code || '');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const prefix = countries.find(c => c.code === country)?.prefix || '';

  const submit = (e) => {
    e.preventDefault();
    const clean = phone.replace(/\s/g, '').replace(/^0/, '');
    const full = clean.startsWith('+') ? clean : `${prefix}${clean}`;
    onSubmit({ provider, country, phoneNumber: full, amount: Math.round(parseFloat(amount) * 100) });
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
      <select value={country} onChange={e => setCountry(e.target.value)}
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff' }}>
        {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
      </select>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '72px', height: '42px', borderRadius: '10px', border: `1.5px solid ${GOLD}`, backgroundColor: '#fffdf8', fontWeight: '800', color: '#b45309', fontSize: '13px' }}>
          {prefix}
        </div>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Numéro" required
          style={{ flex: 1, height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      </div>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Montant (XAF / USD)" min="1" step="any" required
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      {result && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: result.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${result.error ? '#fecaca' : '#bbf7d0'}`, fontSize: '12px', color: result.error ? '#991b1b' : '#166534', fontFamily: 'monospace' }}>
          {result.error ? `❌ ${result.error}` : result.message || result.status || 'Traitement en cours...'}
        </div>
      )}
      <button type="submit" disabled={loading}
        style={{ height: '46px', borderRadius: '10px', backgroundColor: loading ? '#6b7280' : color, color: '#fff', border: 'none', fontWeight: '800', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳ Traitement...' : 'Envoyer'}
      </button>
    </form>
  );
}

// Formulaire Virement Bancaire
function BankTransferForm({ rail, onSubmit, loading, result }) {
  const isSepa = rail === 'sepa';
  const [name, setName] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      rail,
      amount: Math.round(parseFloat(amount) * 100),
      currency: isSepa ? 'EUR' : 'USD',
      beneficiaryName: name,
      iban: isSepa ? iban : undefined,
      bic: isSepa ? bic : undefined,
      accountNumber: !isSepa ? account : undefined,
      dryRun: true,
    });
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom du bénéficiaire" required
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      {isSepa ? <>
        <input type="text" value={iban} onChange={e => setIban(e.target.value)} placeholder="IBAN (ex: FR76...)" required
          style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
        <input type="text" value={bic} onChange={e => setBic(e.target.value)} placeholder="BIC / SWIFT"
          style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      </> : <>
        <input type="text" value={account} onChange={e => setAccount(e.target.value)} placeholder={rail === 'interac' ? 'Email ou numéro Interac' : 'Numéro de compte / SWIFT'}
          style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      </>}
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Montant (${isSepa ? 'EUR' : 'CAD/USD'})`} min="1" step="any" required
        style={{ height: '42px', borderRadius: '10px', border: '1.5px solid #e5e7eb', padding: '0 12px', fontSize: '14px' }} />
      {result && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: result.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${result.error ? '#fecaca' : '#bbf7d0'}`, fontSize: '12px', color: result.error ? '#991b1b' : '#166534', fontFamily: 'monospace' }}>
          {result.error ? `❌ ${result.error}` : JSON.stringify(result).substring(0, 150)}
        </div>
      )}
      <button type="submit" disabled={loading}
        style={{ height: '46px', borderRadius: '10px', backgroundColor: loading ? '#6b7280' : BLACK, color: GOLD, border: 'none', fontWeight: '800', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? '⏳ Traitement...' : 'Initier le virement'}
      </button>
    </form>
  );
}

// Card générique
function RailCard({ icon, label, desc, accentColor, children }) {
  return (
    <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '16px', padding: '22px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: `3px solid ${accentColor || GOLD}` }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>{label}
      </h3>
      <p style={{ margin: '0 0 4px', color: '#52525b', fontSize: '13px', lineHeight: '1.5' }}>{desc}</p>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [interacUser, setInteracUser] = useState(null);
  const [interacVerified, setInteracVerified] = useState(false);

  // Gestion retour flow Interac Hub
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('interac_auth') === 'success') {
      const info = {
        given_name:  p.get('interac_given_name')  || '',
        family_name: p.get('interac_family_name') || '',
        email:       p.get('interac_email')       || '',
      };
      setInteracVerified(true);
      setInteracUser(info);
      window.history.replaceState({}, '', '/dashboard');
      setTimeout(() => {
        const el = document.getElementById('interac-transfer-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
    if (p.get('interac_error')) {
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});

  React.useEffect(() => {
    fetch('/api/auth/me').then(r => r.json())
      .then(d => { if (!d.ok) window.location.href = '/auth/login'; })
      .catch(() => window.location.href = '/auth/login');
  }, []);

  const post = async (id, url, body) => {
    setLoading(l => ({ ...l, [id]: true }));
    setResults(r => ({ ...r, [id]: null }));
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.redirected) { window.location.href = res.url; return; }
      const data = await res.json().catch(() => null);
      if (data?.url) { window.location.href = data.url; return; }
      if (data?.checkoutUrl) { window.location.href = data.checkoutUrl; return; }
      setResults(r => ({ ...r, [id]: data }));
    } catch (err) {
      setResults(r => ({ ...r, [id]: { error: err.message } }));
    } finally {
      setLoading(l => ({ ...l, [id]: false }));
    }
  };

  const btnStyle = (color, textColor = '#fff') => ({
    width: '100%', height: '46px', borderRadius: '10px', backgroundColor: color, color: textColor,
    border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '12px'
  });

  const resultBox = (id) => results[id] && (
    <div style={{ padding: '8px 12px', borderRadius: '8px', marginTop: '10px', backgroundColor: results[id]?.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${results[id]?.error ? '#fecaca' : '#bbf7d0'}`, fontSize: '12px', color: results[id]?.error ? '#991b1b' : '#166534', fontFamily: 'monospace', wordBreak: 'break-all' }}>
      {results[id]?.error ? `❌ ${results[id].error}` : results[id]?.status || results[id]?.message || JSON.stringify(results[id]).substring(0, 150)}
    </div>
  );

  const sectionTitle = (label) => (
    <h2 style={{ fontSize: '13px', fontWeight: '800', color: '#09090b', marginBottom: '16px', paddingBottom: '10px', borderBottom: `2px solid ${GOLD}`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {label}
    </h2>
  );

  return (
    <>
      <Head><title>Enterprise Payment Rail · Smith-Heffa</title></Head>
      <main style={{ minHeight: '100vh', backgroundColor: '#f4f4f4', color: '#111', fontFamily: 'system-ui, sans-serif', padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Badge env */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#eefbf4', border: '1px solid #c3e8d1', color: '#1b5e3a', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '24px', textTransform: 'uppercase' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
          ENV : PRODUCTION SECURE · BUTTERTECH
        </div>

        <div style={{ width: '100%', maxWidth: '1140px', backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 60px -20px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb' }}>

          {/* Header */}
          <section style={{ backgroundColor: BLACK, color: '#fff', padding: '28px 32px', borderBottom: `4px solid ${GOLD}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>💳 Enterprise Payment Rail</h1>
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>Console d'orchestration unifiée · 9 rails de paiement</p>
            </div>
            <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/auth/login'; }}
              style={{ backgroundColor: '#27272a', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: `1px solid #3f3f46`, cursor: 'pointer' }}>
              Déconnexion
            </button>
          </section>

          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* ─── INTERNATIONAL ─── */}
            <div>
              {sectionTitle('🌍 Paiements Internationaux')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

                <RailCard icon="��" label="Stripe Checkout" desc="Cartes bancaires (Visa, Mastercard, Amex). Bac à sable Buttertech." accentColor="#635BFF">
                  {resultBox('stripe')}
                  <button onClick={() => post('stripe', '/api/applepay-checkout', { amount: 5000, currency: 'usd' })}
                    disabled={loading.stripe} style={btnStyle('#635BFF')}>
                    {loading.stripe ? '⏳...' : 'Payer avec Stripe'}
                  </button>
                </RailCard>

                <RailCard icon="🍏" label="Apple Pay" desc="Paiement biométrique via l'écosystème Apple. Checkout Stripe Sandbox." accentColor="#000">
                  {resultBox('applepay')}
                  <button onClick={() => post('applepay', '/api/applepay-checkout', { amount: 5000, currency: 'usd' })}
                    disabled={loading.applepay} style={btnStyle('#000')}>
                    {loading.applepay ? '⏳...' : 'Payer avec Apple Pay'}
                  </button>
                </RailCard>

                <RailCard icon="🅿️" label="PayPal" desc="Portefeuille électronique international. Fallback Stripe si PayPal indisponible." accentColor="#003087">
                  {resultBox('paypal')}
                  <button onClick={() => post('paypal', '/api/paypal-checkout', { amount: 5000, currency: 'usd' })}
                    disabled={loading.paypal} style={btnStyle('#003087')}>
                    {loading.paypal ? '⏳...' : 'Payer avec PayPal'}
                  </button>
                </RailCard>

              </div>
            </div>

            {/* ─── MOBILE MONEY AFRIQUE ─── */}
            <div>
              {sectionTitle('📱 Mobile Money Afrique')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

                <RailCard icon="🟠" label="Orange Money" desc="CM · SN · CI · CD · BF · GN — Paiement par numéro Orange." accentColor="#FF6600">
                  <MobileMoneyForm provider="orange" color="#FF6600"
                    onSubmit={body => post('orange', '/api/mobile-money-payout', body)}
                    loading={!!loading.orange} result={results.orange} />
                </RailCard>

                <RailCard icon="🟡" label="MTN MoMo" desc="CM · GH · UG · RW · ZM — Mobile Money MTN." accentColor="#FFC107">
                  <MobileMoneyForm provider="mtn" color="#FFC107"
                    onSubmit={body => post('mtn', '/api/mobile-money-payout', body)}
                    loading={!!loading.mtn} result={results.mtn} />
                </RailCard>

                <RailCard icon="🟢" label="M-Pesa" desc="KE · TZ · MZ — Mobile Money Safaricom." accentColor="#00A550">
                  <MobileMoneyForm provider="mpesa" color="#00A550"
                    onSubmit={body => post('mpesa', '/api/mobile-money-payout', body)}
                    loading={!!loading.mpesa} result={results.mpesa} />
                </RailCard>

              </div>
            </div>

            {/* ─── VIREMENTS BANCAIRES ─── */}
            <div>
              {sectionTitle('🏦 Virements Bancaires')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

                <RailCard icon="🏦" label="SEPA Virement" desc="Zone Euro · Délai J+1 · IBAN requis · Mode simulation activé." accentColor="#1a56db">
                  <BankTransferForm rail="sepa"
                    onSubmit={body => post('sepa', '/api/bank-transfer-payout', body)}
                    loading={!!loading.sepa} result={results.sepa} />
                </RailCard>

                <RailCard icon="🌐" label="SWIFT / Wire" desc="International · Multi-devises · Délai 1-3 jours · Mode simulation activé." accentColor="#374151">
                  <BankTransferForm rail="swift"
                    onSubmit={body => post('swift', '/api/bank-transfer-payout', body)}
                    loading={!!loading.swift} result={results.swift} />
                </RailCard>

                <RailCard icon="🍁" label="Interac e-Transfer" desc="Canada uniquement · CAD · Instantané · Email ou numéro de téléphone." accentColor="#ef4444">
                  <div style={{marginBottom:'12px'}}>
                    <InteracHubButton onVerified={(info) => {
                      setInteracUser(info);
                      setInteracVerified(true);
                    }} />
                  </div>
                  <BankTransferForm rail="interac"
                    interacPreFill={interacUser}
                    onSubmit={body => post('interac', '/api/interac/etransfer', {
                      ...body,
                      recipientName: body.beneficiaryName,
                      recipientEmail: body.accountNumber,
                      dryRun: false
                    })}
                    loading={!!loading.interac} result={results.interac} />
                </RailCard>

              </div>
            </div>

          </div>

          {/* Footer SecOps */}
          <div style={{ backgroundColor: BLACK, padding: '18px 32px', borderTop: `4px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Infrastructure certifiée par</span>
            <SecOps />
          </div>

        </div>
      </main>
    </>
  );
}
