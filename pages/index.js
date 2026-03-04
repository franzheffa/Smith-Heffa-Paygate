import React, { useState, useEffect } from 'react';
import { Smartphone, Shield, Zap, ArrowUpRight, Mic, Camera, Search, LayoutGrid } from 'lucide-react';

export default function MobileAIDashboard() {
  const gold = "#D4AF37";
  const [usdAmount] = useState(150.00); // Exemple
  const rate = 600; // Taux Hiflux dynamique
  const fcfaAmount = usdAmount * rate;

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* AI Navigation Bar - Multimodal Gemini */}
      <nav style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F8F8F8' }}>
        <LayoutGrid size={24} color="#000" />
        <div style={{ fontWeight: '900', letterSpacing: '2px' }}>BUTTERTECH</div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Camera size={24} color={gold} />
          <Mic size={24} color={gold} />
        </div>
      </nav>

      <main style={{ flex: 1, padding: '20px' }}>
        {/* Main Wallet Card - The "Gold" Standard */}
        <div style={{ 
          background: '#000', 
          borderRadius: '28px', 
          padding: '35px 25px', 
          color: '#FFF', 
          marginBottom: '30px', 
          position: 'relative',
          overflow: 'hidden'
        }}>
          <p style={{ color: gold, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Global Balance</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h2 style={{ fontSize: '38px', margin: 0 }}>${usdAmount.toLocaleString()}</h2>
            <span style={{ color: gold, fontSize: '18px', fontWeight: '300' }}>/ {fcfaAmount.toLocaleString()} FCFA</span>
          </div>
          <div style={{ marginTop: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '12px', color: '#888' }}>Gemini Multimodal AI Secured</span>
          </div>
        </div>

        {/* AI Prompt Input (Central Feature for Mobile AI First) */}
        <div style={{ marginBottom: '30px', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Dis à l'IA : Envoie 50$ à Jean en Mobile Money..."
            style={{ width: '100%', padding: '18px 50px 18px 20px', borderRadius: '15px', border: '1px solid #EEE', backgroundColor: '#FAFAFA', fontSize: '14px' }}
          />
          <Search size={20} color={gold} style={{ position: 'absolute', right: '15px', top: '18px' }} />
        </div>

        {/* Action Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <button style={{ padding: '20px', background: '#FFF', border: '1px solid #EEE', borderRadius: '20px', textAlign: 'left' }}>
            <Zap size={24} color={gold} style={{ marginBottom: '10px' }} />
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Stripe</div>
            <div style={{ fontSize: '11px', color: '#999' }}>Apple Pay & Cards</div>
          </button>
          <button style={{ padding: '20px', background: '#FFF', border: '1px solid #EEE', borderRadius: '20px', textAlign: 'left' }}>
            <Smartphone size={24} color={gold} style={{ marginBottom: '10px' }} />
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>MoMo</div>
            <div style={{ fontSize: '11px', color: '#999' }}>Africa Payout</div>
          </button>
        </div>
      </main>

      {/* Footer System Nav */}
      <footer style={{ padding: '20px', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #F8F8F8' }}>
        <Shield size={24} color="#000" />
        <div style={{ width: '50px', height: '5px', background: '#EEE', borderRadius: '10px' }}></div>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: gold }}>HIFLUX v1.0</div>
      </footer>
    </div>
  );
}
