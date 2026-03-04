import React, { useState } from 'react';
import { Smartphone, Shield, Zap, ArrowUpRight, Mic, Camera, LayoutGrid, CreditCard, DollarSign, X, Globe } from 'lucide-react';

export default function EliteDashboard() {
  const gold = "#D4AF37";
  const [showPayModal, setShowPayModal] = useState(null);

  const triggerSecurityLog = async (amt) => {
    try {
      await fetch('/api/automate-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, currency: 'USD', userId: 'USER_001' })
      });
    } catch (e) { console.error("Security Log Error", e); }
  };

  const handleFinalPay = () => {
    alert("Redirection vers la passerelle sécurisée...");
    setShowPayModal(null);
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#000', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <nav style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <LayoutGrid size={24} color="#000" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '900', letterSpacing: '4px' }}>BUTTERTECH</div>
          <div style={{ fontSize: '7px', color: gold, fontWeight: 'bold' }}>NVIDIA INCEPTION PARTNER</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Camera size={22} color={gold} style={{cursor:'pointer'}} />
          <Mic size={22} color={gold} style={{cursor:'pointer'}} />
        </div>
      </nav>

      <main style={{ flex: 1, padding: '20px' }}>
        {/* Wallet Card */}
        <div style={{ background: '#000', borderRadius: '32px', padding: '35px', color: '#FFF', marginBottom: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
          <p style={{ color: gold, fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>TOTAL BALANCE</p>
          <h2 style={{ fontSize: '42px', margin: '10px 0' }}>$2,540.50</h2>
          <div style={{ height: '1px', background: '#333', margin: '20px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: '14px', color: '#888' }}>1,524,300 FCFA</span>
             <Shield size={20} color={gold} />
          </div>
        </div>

        {/* Payment Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div onClick={() => { setShowPayModal('INTERAC / VISA'); triggerSecurityLog(1200); }} style={btnStyle}>
            <CreditCard size={20} color={gold} />
            <span style={{fontWeight: '700', fontSize: '13px'}}>Interac / Visa</span>
          </div>
          <div onClick={() => setShowPayModal('PAYPAL')} style={btnStyle}>
            <DollarSign size={20} color={gold} />
            <span style={{fontWeight: '700', fontSize: '13px'}}>PayPal</span>
          </div>
        </div>

        <div onClick={() => setShowPayModal('MOBILE MONEY')} style={momoBtnStyle}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '900', color: gold }}>MOBILE MONEY</div>
            <div style={{ fontSize: '10px', color: '#AAA' }}>MTN • ORANGE • M-PESA • CAMTEL</div>
          </div>
          <Smartphone size={24} color={gold} />
        </div>

        {/* Partners */}
        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'center', gap: '30px', opacity: 0.4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Globe size={14}/> <span style={{ fontWeight: 'bold', fontSize: '12px' }}>GOOGLE CLOUD</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Zap size={14}/> <span style={{ fontWeight: 'bold', fontSize: '12px' }}>NVIDIA</span></div>
        </div>
      </main>

      {/* Pop-up de Paiement */}
      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#FFF', width: '100%', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '40px 30px', boxShadow: '0 -10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ fontWeight: '900', margin: 0 }}>{showPayModal}</h3>
              <X onClick={() => setShowPayModal(null)} style={{ cursor: 'pointer' }} size={24} />
            </div>
            <div style={{ background: '#F9F9F9', padding: '20px', borderRadius: '15px', marginBottom: '25px', border: '1px solid #EEE' }}>
              <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                Connexion établie avec le **Bridge FIX 4.4**. <br/> 
                La sécurité **NVIDIA AI** monitore cette transaction.
              </p>
            </div>
            <button onClick={handleFinalPay} style={{ width: '100%', padding: '20px', background: '#000', color: gold, borderRadius: '18px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
              CONFIRMER ET PROCÉDER
            </button>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <footer style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F5F5F5' }}>
        <Zap size={24} color={gold} />
        <div style={{ width: '50px', height: '4px', background: '#EEE', borderRadius: '10px', alignSelf: 'center' }}></div>
        <div style={{ width: '24px', height: '24px', background: '#000', borderRadius: '50%' }}></div>
      </footer>
    </div>
  );
}

const btnStyle = { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', background: '#FFF', border: '1px solid #EEE', borderRadius: '24px', textAlign: 'left', cursor: 'pointer' };
const momoBtnStyle = { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px', background: '#000', borderRadius: '24px', cursor: 'pointer', border: 'none', boxSizing: 'border-box' };
