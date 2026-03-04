import React, { useState } from 'react';
import { Smartphone, Shield, Zap, ArrowUpRight, Mic, Camera, Search, LayoutGrid, CreditCard, DollarSign, X, Youtube, Cpu, Globe } from 'lucide-react';

export default function PrestigeDashboard() {
  const gold = "#D4AF37";
  const [showPayModal, setShowPayModal] = useState(null);

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', color: '#000' }}>
      
      {/* Header avec Statut Partenaire */}
      <nav style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F2F2F2' }}>
        <LayoutGrid size={24} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '900', letterSpacing: '3px', fontSize: '18px' }}>BUTTERTECH</div>
          <div style={{ fontSize: '8px', color: gold, fontWeight: 'bold' }}>NVIDIA INCEPTION PARTNER</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Camera size={22} color={gold} onClick={() => alert('Gemini OCR: Analyse de facture...')} style={{cursor:'pointer'}} />
          <Mic size={22} color={gold} onClick={() => alert('Gemini Voice: Écoute active...')} style={{cursor:'pointer'}} />
        </div>
      </nav>

      <main style={{ flex: 1, padding: '20px' }}>
        {/* Wallet Premium */}
        <div style={{ background: '#000', borderRadius: '30px', padding: '30px', color: '#FFF', marginBottom: '25px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: gold, fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>GLOBAL BALANCE</p>
              <h2 style={{ fontSize: '36px', margin: '5px 0' }}>$2,540.50</h2>
              <p style={{ color: '#888', fontSize: '14px' }}>≈ 1,524,300 FCFA</p>
            </div>
            <div style={{ textAlign: 'right' }}>
               <div style={{ background: gold, color: '#000', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>PRO</div>
            </div>
          </div>
          
          {/* Partners Micro-Logos */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '15px', borderTop: '1px solid #333', paddingTop: '15px', opacity: 0.8 }}>
            <Cpu size={14} color={gold} /> <span style={{fontSize: '10px'}}>NVIDIA AI</span>
            <Youtube size={14} color="#FF0000" /> <span style={{fontSize: '10px'}}>YouTube Content</span>
            <Globe size={14} color="#4285F4" /> <span style={{fontSize: '10px'}}>Google Cloud</span>
          </div>
        </div>

        {/* Quick Actions (Actives) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '25px' }}>
          <button onClick={() => setShowPayModal('Stripe / Interac')} style={btnStyle}>
            <CreditCard size={20} color={gold} />
            <span style={btnTitle}>Interac & Card</span>
          </button>
          <button onClick={() => setShowPayModal('PayPal')} style={btnStyle}>
            <DollarSign size={20} color={gold} />
            <span style={btnTitle}>PayPal Int.</span>
          </button>
        </div>

        {/* Mobile Money Section (Marques Historiques) */}
        <button onClick={() => setShowPayModal('Mobile Money')} style={momoBtnStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Smartphone size={24} color={gold} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', color: gold }}>MOBILE MONEY AFRICA</div>
              <div style={{ fontSize: '10px', color: '#888' }}>MTN • ORANGE • M-PESA • CAMTEL</div>
            </div>
          </div>
          <ArrowUpRight size={20} color={gold} />
        </button>

        {/* NVIDIA / Google / YouTube Banner */}
        <div style={{ marginTop: '30px', textAlign: 'center', padding: '20px', background: '#FAFAFA', borderRadius: '20px', border: '1px dashed #DDD' }}>
          <p style={{ fontSize: '10px', color: '#999', marginBottom: '10px', fontWeight: 'bold' }}>POWERED BY CLOUD & AI GIANTS</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', grayscale: '100%', opacity: 0.5 }}>
            <span style={{fontWeight: 'bold'}}>Google</span>
            <span style={{fontWeight: 'bold', color: '#FF0000'}}>YouTube</span>
            <span style={{fontWeight: 'bold', color: '#76B900'}}>NVIDIA</span>
          </div>
        </div>
      </main>

      {/* Payment Drawer */}
      {showPayModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{fontWeight: '900'}}>{showPayModal}</h3>
              <X onClick={() => setShowPayModal(null)} style={{cursor: 'pointer'}} />
            </div>
            <div style={{ padding: '20px', border: '1px solid #EEE', borderRadius: '15px', marginBottom: '20px' }}>
               <p style={{fontSize: '14px'}}>Connexion sécurisée au Bridge FIX 4.4...</p>
            </div>
            <button style={{ width: '100%', padding: '15px', background: '#000', color: gold, borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>
              PAYER MAINTENANT
            </button>
          </div>
        </div>
      )}

      <footer style={{ padding: '20px', borderTop: '1px solid #F2F2F2', display: 'flex', justifyContent: 'space-around' }}>
        <Shield size={24} color={gold} />
        <div style={{ width: '40px', height: '4px', background: '#EEE', borderRadius: '10px' }}></div>
        <Search size={24} color="#DDD" />
      </footer>
    </div>
  );
}

const btnStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: '#FFF', border: '1px solid #EEE', borderRadius: '18px', cursor: 'pointer' };
const btnTitle = { fontWeight: '700', fontSize: '13px' };
const momoBtnStyle = { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#000', borderRadius: '20px', cursor: 'pointer', border: 'none' };
const modalOverlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 };
const modalContent = { backgroundColor: '#FFF', width: '100%', padding: '30px', borderTopLeftRadius: '30px', borderTopRightRadius: '30px' };
