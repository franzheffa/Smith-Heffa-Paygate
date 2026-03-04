import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';

export default function EliteDashboard() {
  const gold = "#D4AF37";
  const [showPayModal, setShowPayModal] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [fixStatus, setFixStatus] = useState("DISCONNECTED");
  const videoRef = useRef(null);

  // --- ACTION: BRIDGE FIX 4.4 ---
  const connectFix = async () => {
    setFixStatus("CONNECTING...");
    try {
      const res = await fetch('/api/bridge-fix', { method: 'POST' });
      const data = await res.json();
      if(data.status === "CONNECTED") {
        setFixStatus("FIX 4.4 ACTIVE");
        const utterance = new SpeechSynthesisUtterance("Moteur FIX synchronisé");
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) { setFixStatus("ERROR"); }
  };

  // --- ACTION: CAMERA SCAN ---
  const toggleCamera = async () => {
    if (isScanning) {
      setIsScanning(false);
      return;
    }
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Accès caméra refusé");
      setIsScanning(false);
    }
  };

  // --- ACTION: VOICE COMMAND ---
  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Reconnaissance vocale non supportée sur ce navigateur");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      alert("Ordre reçu: " + text);
      if (text.toLowerCase().includes("paye") || text.toLowerCase().includes("achat")) {
        setShowPayModal("VOICE ORDER");
      }
    };
    recognition.start();
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', color: '#000', fontFamily: 'sans-serif' }}>
      
      {/* BADGE FIX 4.4 ACTIF */}
      <div onClick={connectFix} style={{ 
        background: fixStatus === "FIX 4.4 ACTIVE" ? "#00C853" : gold, 
        color: '#000', padding: '8px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
        transition: '0.3s'
      }}>
        {fixStatus} {fixStatus === "DISCONNECTED" && " (TAP TO CONNECT)"}
      </div>

      <nav style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Icons.LayoutGrid size={24} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '900', letterSpacing: '4px' }}>BUTTERTECH</div>
          <div style={{ fontSize: '7px', color: gold, fontWeight: 'bold' }}>NVIDIA INCEPTION PARTNER</div>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Icons.Camera size={26} color={gold} onClick={toggleCamera} style={{ cursor: 'pointer' }} />
          <Icons.Mic size={26} color={isListening ? "red" : gold} onClick={toggleVoice} style={{ cursor: 'pointer' }} />
        </div>
      </nav>

      <main style={{ padding: '20px' }}>
        <div style={{ background: '#000', borderRadius: '32px', padding: '40px 30px', color: '#FFF', marginBottom: '30px', position: 'relative', overflow: 'hidden' }}>
          <p style={{ color: gold, fontSize: '11px', fontWeight: 'bold' }}>ASSET VALUE (GOLD)</p>
          <h2 style={{ fontSize: '42px', margin: '10px 0', fontWeight: '800' }}>$2,540.50</h2>
          <p style={{ opacity: 0.5, fontSize: '14px' }}>1,524,300 FCFA</p>
          <Icons.Zap size={60} color={gold} style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.2 }} />
        </div>

        <div onClick={() => setShowPayModal('MOBILE MONEY')} style={momoCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Icons.Smartphone size={28} color={gold} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '900', color: gold, fontSize: '15px' }}>MOBILE MONEY</div>
              <div style={{ fontSize: '10px', color: '#888' }}>MTN • ORANGE • M-PESA</div>
            </div>
          </div>
          <Icons.ArrowUpRight size={24} color={gold} />
        </div>
      </main>

      {/* CAMERA OVERLAY */}
      {isScanning && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000 }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div onClick={() => setIsScanning(false)} style={{ position: 'absolute', top: 40, right: 20, color: '#FFF' }}>
            <Icons.XCircle size={40} />
          </div>
          <div style={{ position: 'absolute', bottom: 50, width: '100%', textAlign: 'center', color: gold, fontWeight: 'bold' }}>
            SCANNER LOGO POUR AUTO-PAY
          </div>
        </div>
      )}

      {/* MODAL TRANSACTION */}
      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#FFF', width: '100%', padding: '40px 30px', borderTopLeftRadius: '40px', borderTopRightRadius: '40px' }}>
            <h3 style={{ fontWeight: '900', marginBottom: '10px' }}>{showPayModal}</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '30px' }}>Validation via protocole FIX 4.4 sécurisé par NVIDIA AI.</p>
            <button onClick={() => setShowPayModal(null)} style={{ width: '100%', padding: '20px', background: '#000', color: gold, borderRadius: '20px', fontWeight: 'bold', border: 'none', fontSize: '16px' }}>
              CONFIRMER L'ORDRE D'ACHAT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const momoCard = { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px', background: '#000', borderRadius: '28px', cursor: 'pointer', border: 'none' };
