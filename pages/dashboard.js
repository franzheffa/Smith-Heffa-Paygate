import React, { useState } from 'react';
import Head from 'next/head';

const SecOps = () => (
  <svg height="20" viewBox="0 0 340 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
    <path d="M28 3L6 12v18c0 12 9 23 22 27 13-4 22-15 22-27V12Z" fill="none" stroke="#4285F4" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M40 3l10 4v23c0 8-4 16-10 21" fill="none" stroke="#34A853" strokeWidth="3" strokeLinecap="round"/>
    <path d="M24 20c-5 0-9 4-9 10s4 10 9 10c2 0 4-1 6-2" fill="none" stroke="#FBBC04" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M31 22c2 2 3 5 3 8s-1 6-3 8" fill="none" stroke="#EA4335" strokeWidth="3.5" strokeLinecap="round"/>
    <text x="62" y="39" fontFamily="-apple-system,BlinkMacSystemFont,'Google Sans',sans-serif" fontSize="19" fontWeight="400" fill="#ffffff">Google Security Operations</text>
  </svg>
);

const RAILS = [
  {
    id: 'Stripe',
    icon: '🌍',
    label: 'Stripe Checkout',
    desc: 'Cartes bancaires (Visa, Mastercard, Amex). Bac à sable sécurisé Buttertech.',
    route: '/api/stripe-payment-intent',
    color: '#635BFF',
    section: 'International',
  },
  {
    id: 'ApplePay',
    icon: '🍏',
    label: 'Apple Pay',
    desc: 'Paiement biométrique via l\'écosystème Apple. Sandbox activé.',
    route: '/api/applepay-checkout',
    color: '#000000',
    section: 'International',
  },
  {
    id: 'PayPal',
    icon: '🅿️',
    label: 'PayPal',
    desc: 'Portefeuille électronique international. Environnement de test Buttertech.',
    route: '/api/paypal-checkout',
    color: '#003087',
    section: 'International',
  },
  {
    id: 'OrangeMoney',
    icon: '🟠',
    label: 'Orange Money',
    desc: 'Mobile Money — CM, SN, CI, CD, BF, GN. Paiement par numéro de téléphone.',
    route: '/api/mobile-money-payout',
    body: { provider: 'orange' },
    color: '#FF6600',
    section: 'Mobile Money Afrique',
  },
  {
    id: 'MTN',
    icon: '🟡',
    label: 'MTN MoMo',
    desc: 'Mobile Money MTN — Cameroun, Ghana, Uganda, Rwanda, Zambie.',
    route: '/api/mobile-money-payout',
    body: { provider: 'mtn' },
    color: '#FFC107',
    textColor: '#111',
    section: 'Mobile Money Afrique',
  },
  {
    id: 'MPESA',
    icon: '🟢',
    label: 'M-Pesa',
    desc: 'Mobile Money Safaricom — Kenya, Tanzanie, Mozambique.',
    route: '/api/mobile-money-payout',
    body: { provider: 'mpesa' },
    color: '#00A550',
    section: 'Mobile Money Afrique',
  },
  {
    id: 'SEPA',
    icon: '🏦',
    label: 'SEPA Virement',
    desc: 'Virement bancaire zone Euro. Délai J+1. IBAN requis.',
    route: '/api/bank-transfer-payout',
    body: { method: 'sepa' },
    color: '#1a56db',
    section: 'Virements Bancaires',
  },
  {
    id: 'SWIFT',
    icon: '🌐',
    label: 'SWIFT / Wire',
    desc: 'Virement international SWIFT. Multi-devises. Délai 1-3 jours ouvrés.',
    route: '/api/bank-transfer-payout',
    body: { method: 'swift' },
    color: '#374151',
    section: 'Virements Bancaires',
  },
  {
    id: 'Interac',
    icon: '🍁',
    label: 'Interac e-Transfer',
    desc: 'Virement instantané canadien. CAD uniquement. Réseau bancaire canadien.',
    route: '/api/bank-transfer-payout',
    body: { method: 'interac' },
    color: '#ef4444',
    section: 'Virements Bancaires',
  },
];

const SECTIONS = ['International', 'Mobile Money Afrique', 'Virements Bancaires'];

export default function Dashboard() {
  const [loadingRail, setLoadingRail] = useState(null);
  const [results, setResults] = useState({});

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (!d.ok) window.location.href = '/auth/login'; })
      .catch(() => window.location.href = '/auth/login');
  }, []);

  const trigger = async (rail) => {
    setLoadingRail(rail.id);
    setResults(r => ({ ...r, [rail.id]: null }));
    try {
      const res = await fetch(rail.route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rail.body || { action: 'checkout', amount: 5000, currency: 'usd' }),
      });
      if (res.redirected) { window.location.href = res.url; return; }
      const data = await res.json().catch(() => null);
      if (data?.url) { window.location.href = data.url; return; }
      if (data?.checkoutUrl) { window.location.href = data.checkoutUrl; return; }
      setResults(r => ({ ...r, [rail.id]: data }));
    } catch (err) {
      setResults(r => ({ ...r, [rail.id]: { error: err.message } }));
    } finally {
      setLoadingRail(null);
    }
  };

  const card = (rail) => {
    const loading = loadingRail === rail.id;
    const result = results[rail.id];
    return (
      <div key={rail.id} style={{ border: '2px solid #e5e7eb', borderRadius: '16px', padding: '24px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>{rail.icon}</span> {rail.label}
          </h3>
          <p style={{ color: '#52525b', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>{rail.desc}</p>
        </div>
        {result && (
          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: result.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${result.error ? '#fecaca' : '#bbf7d0'}`, fontSize: '12px', color: result.error ? '#991b1b' : '#166534', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {result.error ? `❌ ${result.error}` : result.message || result.status || JSON.stringify(result).substring(0, 120)}
          </div>
        )}
        <button
          onClick={() => trigger(rail)}
          disabled={!!loadingRail}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: loading ? '#6b7280' : rail.color, color: rail.textColor || '#fff', border: 'none', fontWeight: '800', fontSize: '14px', cursor: loadingRail ? 'not-allowed' : 'pointer', opacity: loadingRail && !loading ? 0.5 : 1, transition: 'opacity 0.15s' }}
        >
          {loading ? '⏳ Traitement...' : `Payer avec ${rail.label}`}
        </button>
      </div>
    );
  };

  return (
    <>
      <Head><title>Enterprise Payment Rail · Smith-Heffa</title></Head>
      <main style={{ minHeight: '100vh', backgroundColor: '#f4f4f5', color: '#111', fontFamily: 'system-ui, sans-serif', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#eefbf4', border: '1px solid #c3e8d1', color: '#1b5e3a', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '24px', textTransform: 'uppercase' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
          ENV : PRODUCTION SECURE · BUTTERTECH
        </div>

        <div style={{ width: '100%', maxWidth: '1100px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}>

          <section style={{ backgroundColor: '#09090b', color: '#fff', padding: '28px 32px', borderBottom: '4px solid #d4b26a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em' }}>💳 Enterprise Payment Rail</h1>
              <p style={{ margin: '0', color: '#a1a1aa', fontSize: '14px' }}>Console d'orchestration unifiée · {RAILS.length} rails disponibles</p>
            </div>
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/auth/login'; }}
              style={{ backgroundColor: '#27272a', color: '#fff', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: '1px solid #3f3f46', cursor: 'pointer' }}
            >
              Déconnexion
            </button>
          </section>

          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {SECTIONS.map(section => (
              <div key={section}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#09090b', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #f4f4f5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {section === 'International' && '🌍 '}
                  {section === 'Mobile Money Afrique' && '📱 '}
                  {section === 'Virements Bancaires' && '🏦 '}
                  {section}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {RAILS.filter(r => r.section === section).map(card)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#09090b', padding: '18px 32px', borderTop: '4px solid #d4b26a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Infrastructure certifiée par</span>
            <SecOps />
          </div>
        </div>
      </main>
    </>
  );
}
