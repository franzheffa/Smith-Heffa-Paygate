import React, { useState } from 'react';
import Head from 'next/head';

export default function Dashboard() {
  const [loadingRail, setLoadingRail] = useState(null);

  const triggerPayment = async (rail, apiRoute) => {
    setLoadingRail(rail);
    try {
      const res = await fetch(apiRoute, { method: 'POST' });
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      const data = await res.json().catch(() => null);
      if (data?.url) window.location.href = data.url;
      else window.location.href = apiRoute;
    } catch (error) {
      console.error(`Erreur ${rail}:`, error);
      alert(`Impossible de joindre le rail ${rail}`);
    } finally {
      setLoadingRail(null);
    }
  };

  return (
    <>
      <Head><title>Orchestration des Paiements · Smith-Heffa</title></Head>
      <main style={{ minHeight: '100vh', backgroundColor: '#f4f4f5', color: '#111', fontFamily: 'system-ui, sans-serif', padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#eefbf4', border: '1px solid #c3e8d1', color: '#1b5e3a', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '24px', textTransform: 'uppercase' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
          ENV : SANDBOX BUTTERTECH ACTIF
        </div>

        <div style={{ width: '100%', maxWidth: '900px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}>
          <section style={{ backgroundColor: '#09090b', color: '#fff', padding: '32px', borderBottom: '4px solid #d4b26a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>💳 Enterprise Payment Rail</h1>
              <p style={{ margin: '0', color: '#a1a1aa', fontSize: '15px' }}>Console d'orchestration unifiée. Sélectionnez un rail de paiement.</p>
            </div>
            <a href="/api/auth/logout" style={{ backgroundColor: '#27272a', color: '#fff', padding: '10px 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', border: '1px solid #3f3f46' }}>Déconnexion</a>
          </section>

          <section style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: '#111' }}>🚀 Rails de Paiement Disponibles</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              {/* Stripe */}
              <div style={{ border: '2px solid #e5e7eb', borderRadius: '16px', padding: '24px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '24px' }}>🌍</span> Stripe Checkout</h3>
                  <p style={{ color: '#52525b', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>Cartes bancaires (Visa, Mastercard). Redirection vers le bac à sable sécurisé Stripe.</p>
                </div>
                <button onClick={() => triggerPayment('Stripe', '/api/stripe-payment-intent')} disabled={loadingRail === 'Stripe'} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#635BFF', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer', opacity: loadingRail === 'Stripe' ? 0.7 : 1 }}>
                  {loadingRail === 'Stripe' ? 'Génération...' : 'Payer avec Stripe'}
                </button>
              </div>

              {/* Apple Pay */}
              <div style={{ border: '2px solid #e5e7eb', borderRadius: '16px', padding: '24px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '24px' }}>🍏</span> Apple Pay</h3>
                  <p style={{ color: '#52525b', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>Paiement biométrique rapide via l'écosystème Apple. Simulation Sandbox.</p>
                </div>
                <button onClick={() => triggerPayment('ApplePay', '/api/applepay-checkout')} disabled={loadingRail === 'ApplePay'} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#000', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer', opacity: loadingRail === 'ApplePay' ? 0.7 : 1 }}>
                  {loadingRail === 'ApplePay' ? 'Ouverture...' : 'Payer avec Apple Pay'}
                </button>
              </div>

              {/* PayPal */}
              <div style={{ border: '2px solid #e5e7eb', borderRadius: '16px', padding: '24px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '24px' }}>🅿️</span> PayPal</h3>
                  <p style={{ color: '#52525b', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>Portefeuille électronique international. Redirection environnement de test Buttertech.</p>
                </div>
                <button onClick={() => triggerPayment('PayPal', '/api/paypal-checkout')} disabled={loadingRail === 'PayPal'} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#003087', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer', opacity: loadingRail === 'PayPal' ? 0.7 : 1 }}>
                  {loadingRail === 'PayPal' ? 'Génération...' : 'Payer avec PayPal'}
                </button>
              </div>

            </div>
          </section>

          <div style={{ backgroundColor: '#fafafa', padding: '20px 32px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Infrastructure certifiée par</span>
            <img src="/images/SecOps-512-color-rgb.svg" alt="Google Cloud Security Operations" style={{ height: '24px', opacity: '0.9' }} onError={(e) => { e.target.style.display='none'; }}/>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#111' }}>Google Security Operations</span>
          </div>
        </div>
      </main>
    </>
  );
}
