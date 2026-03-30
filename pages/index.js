import React, { useState, useRef } from 'react';
import * as Icons from 'lucide-react';
const gold = "#D4AF37";
const MOMO_OPERATORS = [
  { id: 'mtn',    name: 'MTN Mobile Money', country: 'CI GH CM SN', color: '#FFCC00', prefix: '+225' },
  { id: 'orange', name: 'Orange Money',      country: 'SN ML CI BF', color: '#FF6600', prefix: '+221' },
  { id: 'mpesa',  name: 'M-PESA',            country: 'KE TZ RW MZ', color: '#00A550', prefix: '+254' },
  { id: 'wave',   name: 'Wave',              country: 'SN CI ML BF', color: '#0066FF', prefix: '+221' },
  { id: 'moov',   name: 'Moov Money',        country: 'BJ TG CI NE', color: '#0033A0', prefix: '+229' },
];
const MOMO_DIAL_CODES = {
  mtn: [
    { code: '+225', label: 'Cote d Ivoire (+225)' },
    { code: '+233', label: 'Ghana (+233)' },
    { code: '+237', label: 'Cameroun (+237)' },
    { code: '+221', label: 'Senegal (+221)' },
    { code: '+250', label: 'Rwanda (+250)' },
    { code: '+256', label: 'Ouganda (+256)' },
    { code: '+260', label: 'Zambie (+260)' }
  ],
  orange: [
    { code: '+221', label: 'Senegal (+221)' },
    { code: '+223', label: 'Mali (+223)' },
    { code: '+225', label: 'Cote d Ivoire (+225)' },
    { code: '+226', label: 'Burkina Faso (+226)' },
    { code: '+224', label: 'Guinee (+224)' },
    { code: '+242', label: 'Congo (+242)' },
    { code: '+237', label: 'Cameroun (+237)' }
  ],
  mpesa: [
    { code: '+254', label: 'Kenya (+254)' },
    { code: '+255', label: 'Tanzanie (+255)' },
    { code: '+250', label: 'Rwanda (+250)' },
    { code: '+258', label: 'Mozambique (+258)' },
    { code: '+251', label: 'Ethiopie (+251)' },
    { code: '+256', label: 'Ouganda (+256)' }
  ],
  wave: [
    { code: '+221', label: 'Senegal (+221)' },
    { code: '+225', label: 'Cote d Ivoire (+225)' },
    { code: '+223', label: 'Mali (+223)' },
    { code: '+226', label: 'Burkina Faso (+226)' }
  ],
  moov: [
    { code: '+229', label: 'Benin (+229)' },
    { code: '+228', label: 'Togo (+228)' },
    { code: '+225', label: 'Cote d Ivoire (+225)' },
    { code: '+227', label: 'Niger (+227)' }
  ]
};
const MOMO_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];
const FIAT_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];
const SWIFT_BANKS = [
  { id: 'td',   name: 'TD Bank Canada',     bic: 'TDOMCATTTOR', flag: 'CA', currency: 'CAD' },
  { id: 'bnp',  name: 'BNP Paribas',        bic: 'BNPAFRPPXXX', flag: 'FR', currency: 'EUR' },
  { id: 'db',   name: 'Deutsche Bank',      bic: 'DEUTDEDBFRA', flag: 'DE', currency: 'EUR' },
  { id: 'citi', name: 'Citibank N.A.',       bic: 'CITIUS33XXX', flag: 'US', currency: 'USD' },
  { id: 'stan', name: 'Standard Chartered', bic: 'SCBLGHACXXX', flag: 'GH', currency: 'GHS' },
  { id: 'eco',  name: 'Ecobank',            bic: 'ECOCGHACXXX', flag: 'AF', currency: 'XOF' },
];
const SEPA_COUNTRIES = [
  { id: 'fr', name: 'France',    flag: 'FR', example: 'FR76 3000 6000 0112 3456 7890 189' },
  { id: 'de', name: 'Allemagne', flag: 'DE', example: 'DE89 3704 0044 0532 0130 00' },
  { id: 'es', name: 'Espagne',   flag: 'ES', example: 'ES91 2100 0418 4502 0005 1332' },
  { id: 'be', name: 'Belgique',  flag: 'BE', example: 'BE71 0961 2345 6769' },
  { id: 'nl', name: 'Pays-Bas',  flag: 'NL', example: 'NL91 ABNA 0417 1643 00' },
  { id: 'it', name: 'Italie',    flag: 'IT', example: 'IT60 X054 2811 1010 0000 0123 456' },
];
const RECENT_TXS = [
  { icon: 'Smartphone',     label: 'MTN Mobile Money',   sub: 'Dakar - Abidjan',         val: '-12,500 FCFA' },
  { icon: 'Globe2',         label: 'SEPA Virement',       sub: 'Paris - Montreal',        val: '-EUR 850.00' },
  { icon: 'Landmark',       label: 'SWIFT Wire',          sub: 'TD Bank - BNP Paribas',   val: '-$1,200.00' },
  { icon: 'CreditCard',     label: 'Stripe / VISA',       sub: 'Paiement marchand',       val: '-$ 340.00' },
  { icon: 'Smartphone',     label: 'M-PESA',              sub: 'Nairobi - Dar es Salaam', val: '-15,000 KES' },
  { icon: 'ArrowLeftRight', label: 'Interac e-Transfer',  sub: 'CAD - Buttertech',        val: '-CA$ 200.00' },
];
export default function EliteDashboard() {
  const [fixStatus, setFixStatus]   = useState('DISCONNECTED');
  const [fixLog, setFixLog]         = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const videoRef = useRef(null);
  const [showPayModal, setShowPayModal] = useState(null);
  const [payProc, setPayProc] = useState(null);
  const [momoStep, setMomoStep]     = useState(0);
  const [momoOp, setMomoOp]         = useState(null);
  const [momoDial, setMomoDial]     = useState('');
  const [momoPhone, setMomoPhone]   = useState('');
  const [momoAmount, setMomoAmount] = useState('');
  const [momoPin, setMomoPin]       = useState('');
  const [momoProc, setMomoProc]     = useState(false);
  const [momoRef, setMomoRef]       = useState('');
  const [swiftStep, setSwiftStep]   = useState(0);
  const [swiftBank, setSwiftBank]   = useState(null);
  const [swiftIBAN, setSwiftIBAN]   = useState('');
  const [swiftBenef, setSwiftBenef] = useState('');
  const [swiftAmount, setSwiftAmount] = useState('');
  const [swiftProc, setSwiftProc]   = useState(false);
  const [swiftRef, setSwiftRef]     = useState('');
  const [sepaStep, setSepaStep]     = useState(0);
  const [sepaCtry, setSepaCtry]     = useState(null);
  const [sepaIBAN, setSepaIBAN]     = useState('');
  const [sepaBenef, setSepaBenef]   = useState('');
  const [sepaAmount, setSepaAmount] = useState('');
  const [sepaMotif, setSepaMotif]   = useState('');
  const [sepaProc, setSepaProc]     = useState(false);
  const [sepaRef, setSepaRef]       = useState('');
  const [interacStep, setInteracStep]     = useState(0);
  const [interacEmail, setInteracEmail]   = useState('');
  const [interacAmount, setInteracAmount] = useState('');
  const [interacMsg, setInteracMsg]       = useState('');
  const [interacProc, setInteracProc]     = useState(false);
  const [interacRef, setInteracRef]       = useState('');
  const isMomoSimulation = Boolean(momoOp && ['mtn', 'orange'].includes(momoOp.id));
  const addLog = (msg) => setFixLog(l => ['[' + new Date().toLocaleTimeString() + '] ' + msg, ...l].slice(0, 8));
  const mkRef  = (p) => p + '-' + Date.now().toString(36).toUpperCase();
  const delay  = (ms) => new Promise(r => setTimeout(r, ms));
  const speak  = (t) => { try { window.speechSynthesis.speak(new SpeechSynthesisUtterance(t)); } catch(e){} };
  const pinPress = (v, pin, set) => { if (v === 'del') set(p => p.slice(0,-1)); else if (pin.length < 4) set(p => p + v); };
  const connectFix = async () => {
    setFixStatus('CONNECTING...');
    addLog('Envoi signal LOGON FIX 4.4...');
    try {
      const res = await fetch('/api/bridge-fix', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'CONNECTED') {
        setFixStatus('FIX 4.4 ACTIVE');
        addLog('CONNECTED - ' + data.protocol + ' | Target: ' + data.target);
        speak('Moteur FIX synchronise');
      } else { setFixStatus('DISCONNECTED'); addLog('Connexion echouee'); }
    } catch(e) { setFixStatus('DISCONNECTED'); addLog('Erreur reseau'); }
  };
  const toggleCamera = async () => {
    if (isScanning) { setIsScanning(false); return; }
    setIsScanning(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch(e) { setIsScanning(false); }
  };
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert('Non supporte');
    const r = new SR(); r.lang = 'fr-FR';
    r.onstart = () => setIsListening(true);
    r.onend   = () => setIsListening(false);
    r.onresult = (e) => addLog('Commande: ' + e.results[0][0].transcript);
    r.start();
  };
  const rMomo    = () => { setMomoStep(0);    setMomoOp(null);    setMomoDial('');    setMomoPhone('');   setMomoAmount('');  setMomoPin('');  setMomoRef(''); };
  const rSwift   = () => { setSwiftStep(0);   setSwiftBank(null); setSwiftIBAN('');   setSwiftBenef('');  setSwiftAmount(''); setSwiftRef(''); };
  const rSepa    = () => { setSepaStep(0);    setSepaCtry(null);  setSepaIBAN('');    setSepaBenef('');   setSepaAmount(''); setSepaMotif(''); setSepaRef(''); };
  const rInterac = () => { setInteracStep(0); setInteracEmail('');setInteracAmount('');setInteracMsg(''); setInteracRef(''); };
  const execMomo = async () => {
    setMomoProc(true); addLog('MOMO ' + momoOp?.name + ' ' + momoAmount + ' FCFA');
    await delay(2200); const ref = mkRef('BTK-MM');
    setMomoRef(ref); setMomoProc(false); setMomoStep(6);
    addLog('MOMO confirme - ' + ref); speak('Mobile Money confirme');
  };
  const execSwift = async () => {
    setSwiftProc(true); addLog('SWIFT ' + swiftAmount + ' USD vers ' + swiftBank?.bic);
    await delay(2800); const ref = mkRef('BTK-SW');
    setSwiftRef(ref); setSwiftProc(false); setSwiftStep(6);
    addLog('SWIFT confirme - ' + ref); speak('Virement SWIFT confirme');
  };
  const execSepa = async () => {
    setSepaProc(true); addLog('SEPA ' + sepaAmount + ' EUR vers ' + sepaIBAN.slice(0,8));
    await delay(2400); const ref = mkRef('BTK-SP');
    setSepaRef(ref); setSepaProc(false); setSepaStep(6);
    addLog('SEPA confirme - ' + ref); speak('Virement SEPA confirme');
  };
  const execInterac = async () => {
    setInteracProc(true); addLog('Interac CA$' + interacAmount + ' vers ' + interacEmail);
    await delay(1800); const ref = mkRef('BTK-IT');
    setInteracRef(ref); setInteracProc(false); setInteracStep(5);
    addLog('Interac confirme - ' + ref); speak('Interac confirme');
  };
  const execHostedCheckout = async (rail) => {
    if (payProc) return;
    const map = {
      stripe: { endpoint: '/api/stripe', label: 'STRIPE / VISA' },
      apple: { endpoint: '/api/applepay-checkout', label: 'APPLE PAY' },
      paypal: { endpoint: '/api/paypal-checkout', label: 'PAYPAL' }
    };
    const current = map[rail] || map.stripe;
    setPayProc(rail);
    addLog(current.label + ' execute');
    try {
      const res = await fetch(current.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 5000 })
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || `${current.label} checkout session failed`);
      }
      window.location.href = data.url;
    } catch (e) {
      addLog(current.label + ' echec - ' + (e?.message || 'Erreur inconnue'));
      setPayProc(null);
    }
  };
  const momoUsd   = momoAmount   ? (parseInt(momoAmount) / 600).toFixed(2)         : '0.00';
  const swiftEur  = swiftAmount  ? (parseFloat(swiftAmount) * 0.92).toFixed(2)      : '0.00';
  const sepaUsd   = sepaAmount   ? (parseFloat(sepaAmount) * 1.09).toFixed(2)       : '0.00';
  const interacUs = interacAmount? (parseFloat(interacAmount) * 0.74).toFixed(2)    : '0.00';
  return (
    React.createElement('div', { style: { backgroundColor:'#FFFFFF', minHeight:'100vh', color:'#000', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', overflowX:'hidden' } },
      React.createElement('div', { onClick: connectFix, style: { background: fixStatus==='FIX 4.4 ACTIVE'?'#00C853':gold, color:'#000', padding:'10px', textAlign:'center', fontSize:'11px', fontWeight:'900', cursor:'pointer', letterSpacing:'2px' } },
        fixStatus + (fixStatus==='DISCONNECTED' ? ' - APPUYER POUR CONNECTER LE MOTEUR FIX' : '')
      ),
      fixLog.length > 0 && React.createElement('div', { style: { background:'#0a0a0a', padding:'10px 16px', fontFamily:'monospace', fontSize:'10px', color:'#4ade80', maxHeight:'80px', overflowY:'auto', borderBottom:'1px solid #222' } },
        fixLog.map((l,i) => React.createElement('div', { key: i }, l))
      ),
      React.createElement('nav', { style: { padding:'20px 25px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #F0F0F0' } },
        React.createElement(Icons.LayoutGrid, { size: 24, color: '#000' }),
        React.createElement('div', { style: { textAlign:'center' } },
          React.createElement('div', { style: { fontWeight:'900', letterSpacing:'4px', fontSize:'15px' } }, 'BUTTERTECH'),
          React.createElement('div', { style: { fontSize:'7px', color:gold, fontWeight:'800', letterSpacing:'1px' } }, 'NVIDIA INCEPTION PARTNER')
        ),
        React.createElement('div', { style: { display:'flex', gap:'18px' } },
          React.createElement(Icons.Camera, { size:24, color:isScanning?gold:'#000', onClick:toggleCamera, style:{ cursor:'pointer' } }),
          React.createElement(Icons.Mic,    { size:24, color:isListening?'#EF4444':'#000', onClick:toggleVoice, style:{ cursor:'pointer' } })
        )
      ),
      React.createElement('main', { style: { padding:'20px 25px' } },
        React.createElement('div', { style: { background:'#000', borderRadius:'28px', padding:'35px 28px', color:'#FFF', marginBottom:'20px', border:'1.5px solid ' + gold } },
          React.createElement('p', { style: { color:gold, fontSize:'9px', fontWeight:'800', letterSpacing:'2px', marginBottom:8 } }, 'GLOBAL ASSET VALUE'),
          React.createElement('h2', { style: { fontSize:'40px', margin:'0 0 6px', fontWeight:'900' } }, '$2,540.50'),
          React.createElement('div', { style: { display:'flex', justifyContent:'space-between', alignItems:'center' } },
            React.createElement('span', { style: { opacity:0.5, fontSize:'12px' } }, '1,524,300 FCFA  EUR 2,336  CA$3,453'),
            React.createElement(Icons.ShieldCheck, { size:18, color:gold })
          )
        ),
        React.createElement(SecLabel, { label:'PAIEMENTS DIGITAUX' }),
        React.createElement('div', { style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' } },
          React.createElement(PBtn, { icon:React.createElement(Icons.CreditCard,{size:20,color:gold}), label:'STRIPE',   onClick:()=>setShowPayModal('STRIPE / VISA') }),
          React.createElement(PBtn, { icon:React.createElement(Icons.Globe,     {size:20,color:gold}), label:'PAYPAL',   onClick:()=>setShowPayModal('PAYPAL') })
        ),
        React.createElement('div', { style: { marginBottom:'12px' } },
          React.createElement(PBtn, { icon:React.createElement(Icons.Apple,{size:20,color:gold}), label:'APPLE PAY', onClick:()=>setShowPayModal('APPLE PAY'), row:true })
        ),
        React.createElement(SecLabel, { label:'VIREMENTS BANCAIRES' }),
        React.createElement(BigBtn, { icon:React.createElement(Icons.Landmark,{size:22,color:'#000'}),         bg:gold,      title:'SWIFT / WIRE TRANSFER',    sub:'International USD EUR GBP CAD', onClick:()=>{ rSwift();   setSwiftStep(1); } }),
        React.createElement(BigBtn, { icon:React.createElement(Icons.Globe2,{size:22,color:'#FFF'}),           bg:'#003087', title:'SEPA / VIREMENT EUROPEEN', sub:'Zone Euro Instant J+1 IBAN',    onClick:()=>{ rSepa();    setSepaStep(1); } }),
        React.createElement(BigBtn, { icon:React.createElement(Icons.ArrowLeftRight,{size:22,color:'#FFF'}),   bg:'#E31837', title:'INTERAC e-TRANSFER',        sub:'Canada CA$ Instantane Email',   onClick:()=>{ rInterac(); setInteracStep(1); } }),
        React.createElement(SecLabel, { label:'AFRICA MOBILE MONEY' }),
        React.createElement(BigBtn, { icon:React.createElement(Icons.Smartphone,{size:22,color:'#000'}),       bg:gold,      title:'AFRICA MOBILE MONEY',       sub:'MTN ORANGE M-PESA WAVE MOOV',   onClick:()=>{ rMomo();   setMomoStep(1); } }),
        React.createElement(SecLabel, { label:'TRANSACTIONS RECENTES' }),
        RECENT_TXS.map((tx,i) => {
          const Ic = Icons[tx.icon] || Icons.Circle;
          return React.createElement('div', { key:i, style:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid #F5F5F5' } },
            React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'12px' } },
              React.createElement('div', { style:{ width:36, height:36, borderRadius:'50%', background:'#F8F8F8', display:'flex', alignItems:'center', justifyContent:'center' } },
                React.createElement(Ic, { size:16, color:gold })
              ),
              React.createElement('div', null,
                React.createElement('div', { style:{ fontWeight:'700', fontSize:'13px' } }, tx.label),
                React.createElement('div', { style:{ fontSize:'10px', color:'#999' } }, tx.sub)
              )
            ),
            React.createElement('div', { style:{ textAlign:'right' } },
              React.createElement('div', { style:{ fontWeight:'800', fontSize:'13px', color:'#EF4444' } }, tx.val),
              React.createElement('div', { style:{ fontSize:'9px', color:'#4ade80', fontWeight:'700' } }, 'CONFIRME')
            )
          );
        })
      ),
      isScanning && React.createElement('div', { style:{ position:'fixed', inset:0, background:'#000', zIndex:1000 } },
        React.createElement('video', { ref:videoRef, autoPlay:true, playsInline:true, style:{ width:'100%', height:'100%', objectFit:'cover' } }),
        React.createElement('button', { onClick:()=>setIsScanning(false), style:{ position:'absolute', top:40, right:20, background:'none', border:'none', cursor:'pointer' } },
          React.createElement(Icons.XCircle, { size:40, color:'#FFF' })
        )
      ),
      showPayModal && React.createElement(Sheet, { onClose:()=>setShowPayModal(null), title:'CONFIRMER ' + showPayModal },
        React.createElement('p', { style:{ fontSize:'12px', color:'#666', marginBottom:'30px' } }, 'Protocole FIX 4.4 & NVIDIA Inception Security actif.'),
        React.createElement(ActBtn, {
          label: payProc ? 'REDIRECTION CHECKOUT...' : "EXECUTER L'ORDRE",
          disabled: Boolean(payProc),
          onClick:()=>{
            if (showPayModal === 'STRIPE / VISA') return execHostedCheckout('stripe');
            if (showPayModal === 'APPLE PAY') return execHostedCheckout('apple');
            if (showPayModal === 'PAYPAL') return execHostedCheckout('paypal');
            addLog((showPayModal || 'Paiement') + ' execute');
          }
        }),
        React.createElement(BkBtn, { label:'Annuler', onClick:()=>setShowPayModal(null) })
      ),
      momoStep===1 && React.createElement(Sheet, { onClose:rMomo, title:"CHOISIR L'OPERATEUR" }, MOMO_OPERATORS.map(op => React.createElement(OpRow, { key:op.id, color:op.color, name:op.name, sub:op.country, onClick:()=>{ setMomoOp(op); setMomoDial(op.prefix); setMomoStep(2); } }))),
      momoStep===2 && momoOp && React.createElement(Sheet, { onClose:rMomo, title:'NUMERO - ' + momoOp.name },
        isMomoSimulation && React.createElement(SimBadge, null),
        React.createElement(PhoneIn, {
          prefix: momoDial || momoOp.prefix,
          prefixes: MOMO_DIAL_CODES[momoOp.id] || [{ code: momoOp.prefix, label: momoOp.prefix }],
          onPrefixChange: setMomoDial,
          value: momoPhone,
          onChange: setMomoPhone
        }),
        React.createElement(ActBtn, { disabled:momoPhone.length<8, label:'CONTINUER', onClick:()=>setMomoStep(3) }),
        React.createElement(BkBtn, { onClick:()=>setMomoStep(1) })
      ),
      momoStep===3 && React.createElement(Sheet, { onClose:rMomo, title:'MONTANT MOMO' },
        isMomoSimulation && React.createElement(SimBadge, null),
        React.createElement(AmtIn, { value:momoAmount, onChange:setMomoAmount, currency:'FCFA', equiv:'$'+momoUsd+' USD', amounts:MOMO_AMOUNTS }),
        React.createElement(ActBtn, { disabled:!momoAmount||parseInt(momoAmount)<100, label:'CONTINUER', onClick:()=>setMomoStep(4) }),
        React.createElement(BkBtn, { onClick:()=>setMomoStep(2) })
      ),
      momoStep===4 && React.createElement(Sheet, { onClose:rMomo, title:'CODE PIN' },
        isMomoSimulation && React.createElement(SimBadge, null),
        React.createElement(PinPad, { pin:momoPin, onP:(v)=>pinPress(v,momoPin,setMomoPin), label:momoOp?.name }),
        React.createElement(ActBtn, { disabled:momoPin.length<4, label:'VALIDER', onClick:()=>setMomoStep(5) }),
        React.createElement(BkBtn, { onClick:()=>setMomoStep(3) })
      ),
      momoStep===5 && React.createElement(Sheet, { onClose:rMomo, title:'CONFIRMER' },
        isMomoSimulation && React.createElement(SimBadge, null),
        React.createElement(Recap, { rows:[{l:'Operateur',v:momoOp?.name},{l:'Beneficiaire',v:(momoDial || momoOp?.prefix)+' '+momoPhone},{l:'Montant',v:parseInt(momoAmount).toLocaleString('fr-FR')+' FCFA'},{l:'USD',v:'$'+momoUsd},{l:'Protocole',v:'FIX 4.4'}] }),
        React.createElement(ActBtn, { disabled:momoProc, label:momoProc?'TRAITEMENT...':'EXECUTER', onClick:execMomo }),
        momoProc && React.createElement(PBar, null),
        React.createElement(BkBtn, { onClick:()=>setMomoStep(4) })
      ),
      momoStep===6 && React.createElement(Sheet, { onClose:rMomo }, React.createElement(Succ, { ref_:momoRef, amount:parseInt(momoAmount).toLocaleString('fr-FR')+' FCFA', label:momoOp?.name, onClose:rMomo, simMode:isMomoSimulation })),
      swiftStep===1 && React.createElement(Sheet, { onClose:rSwift, title:'BANQUE DESTINATAIRE - SWIFT' }, SWIFT_BANKS.map(b => React.createElement(OpRow, { key:b.id, color:'#1a1a2e', name:b.flag+' '+b.name, sub:'BIC: '+b.bic+' '+b.currency, onClick:()=>{ setSwiftBank(b); setSwiftStep(2); } }))),
      swiftStep===2 && swiftBank && React.createElement(Sheet, { onClose:rSwift, title:'COORDONNEES BANCAIRES' },
        React.createElement(InpF, { label:'IBAN / ACCOUNT', value:swiftIBAN, onChange:setSwiftIBAN, placeholder:swiftBank.bic.slice(0,4)+'...', mono:true }),
        React.createElement(InpF, { label:'NOM BENEFICIAIRE', value:swiftBenef, onChange:setSwiftBenef, placeholder:'Franz Heffa' }),
        React.createElement(ActBtn, { disabled:swiftIBAN.length<8||!swiftBenef, label:'CONTINUER', onClick:()=>setSwiftStep(3) }),
        React.createElement(BkBtn, { onClick:()=>setSwiftStep(1) })
      ),
      swiftStep===3 && React.createElement(Sheet, { onClose:rSwift, title:'MONTANT SWIFT (USD)' },
        React.createElement(AmtIn, { value:swiftAmount, onChange:setSwiftAmount, currency:'USD', equiv:'EUR '+swiftEur, amounts:FIAT_AMOUNTS }),
        React.createElement(ActBtn, { disabled:!swiftAmount||parseFloat(swiftAmount)<1, label:'CONTINUER', onClick:()=>setSwiftStep(4) }),
        React.createElement(BkBtn, { onClick:()=>setSwiftStep(2) })
      ),
      swiftStep===4 && React.createElement(Sheet, { onClose:rSwift, title:'CONFIRMER SWIFT WIRE' },
        React.createElement(Recap, { rows:[{l:'Banque',v:swiftBank?.flag+' '+swiftBank?.name},{l:'BIC',v:swiftBank?.bic},{l:'Beneficiaire',v:swiftBenef},{l:'IBAN',v:swiftIBAN},{l:'Montant',v:'$'+parseFloat(swiftAmount).toLocaleString()+' USD'},{l:'EUR',v:'EUR '+swiftEur},{l:'Protocole',v:'FIX 4.4 SWIFT'}] }),
        React.createElement(ActBtn, { disabled:swiftProc, label:swiftProc?'TRAITEMENT...':'EXECUTER WIRE', onClick:execSwift }),
        swiftProc && React.createElement(PBar, null),
        React.createElement(BkBtn, { onClick:()=>setSwiftStep(3) })
      ),
      swiftStep===6 && React.createElement(Sheet, { onClose:rSwift }, React.createElement(Succ, { ref_:swiftRef, amount:'$'+parseFloat(swiftAmount).toLocaleString()+' USD', label:'SWIFT '+swiftBank?.name, onClose:rSwift })),
      sepaStep===1 && React.createElement(Sheet, { onClose:rSepa, title:'PAYS DESTINATAIRE - SEPA' }, SEPA_COUNTRIES.map(c => React.createElement(OpRow, { key:c.id, color:'#003087', name:c.flag+' '+c.name, sub:c.example.slice(0,14)+'...', onClick:()=>{ setSepaCtry(c); setSepaStep(2); } }))),
      sepaStep===2 && sepaCtry && React.createElement(Sheet, { onClose:rSepa, title:'COORDONNEES SEPA' },
        React.createElement(InpF, { label:'IBAN', value:sepaIBAN, onChange:setSepaIBAN, placeholder:sepaCtry.example, mono:true }),
        React.createElement(InpF, { label:'NOM BENEFICIAIRE', value:sepaBenef, onChange:setSepaBenef, placeholder:'Jean Dupont' }),
        React.createElement(InpF, { label:'MOTIF', value:sepaMotif, onChange:setSepaMotif, placeholder:'Facture 2026-001' }),
        React.createElement(ActBtn, { disabled:sepaIBAN.length<14||!sepaBenef, label:'CONTINUER', onClick:()=>setSepaStep(3) }),
        React.createElement(BkBtn, { onClick:()=>setSepaStep(1) })
      ),
      sepaStep===3 && React.createElement(Sheet, { onClose:rSepa, title:'MONTANT SEPA (EUR)' },
        React.createElement(AmtIn, { value:sepaAmount, onChange:setSepaAmount, currency:'EUR', equiv:'$'+sepaUsd+' USD', amounts:FIAT_AMOUNTS }),
        React.createElement(ActBtn, { disabled:!sepaAmount||parseFloat(sepaAmount)<1, label:'CONTINUER', onClick:()=>setSepaStep(4) }),
        React.createElement(BkBtn, { onClick:()=>setSepaStep(2) })
      ),
      sepaStep===4 && React.createElement(Sheet, { onClose:rSepa, title:'CONFIRMER SEPA' },
        React.createElement(Recap, { rows:[{l:'Pays',v:sepaCtry?.flag+' '+sepaCtry?.name},{l:'IBAN',v:sepaIBAN},{l:'Beneficiaire',v:sepaBenef},{l:'Motif',v:sepaMotif||'-'},{l:'Montant',v:'EUR '+parseFloat(sepaAmount).toLocaleString()},{l:'USD',v:'$'+sepaUsd},{l:'Delai',v:'Instantane / J+1'},{l:'Protocole',v:'FIX 4.4 SEPA'}] }),
        React.createElement(ActBtn, { disabled:sepaProc, label:sepaProc?'TRAITEMENT...':'EXECUTER SEPA', onClick:execSepa }),
        sepaProc && React.createElement(PBar, null),
        React.createElement(BkBtn, { onClick:()=>setSepaStep(3) })
      ),
      sepaStep===6 && React.createElement(Sheet, { onClose:rSepa }, React.createElement(Succ, { ref_:sepaRef, amount:'EUR '+parseFloat(sepaAmount).toLocaleString(), label:'SEPA '+sepaCtry?.flag+' '+sepaCtry?.name, onClose:rSepa })),
      interacStep===1 && React.createElement(Sheet, { onClose:rInterac, title:'INTERAC e-TRANSFER' },
        React.createElement(InpF, { label:'EMAIL BENEFICIAIRE', value:interacEmail, onChange:setInteracEmail, placeholder:'ben@exemple.ca' }),
        React.createElement(InpF, { label:'MESSAGE', value:interacMsg, onChange:setInteracMsg, placeholder:'Remboursement loyer' }),
        React.createElement(ActBtn, { disabled:!interacEmail.includes('@'), label:'CONTINUER', onClick:()=>setInteracStep(2) }),
        React.createElement(BkBtn, { label:'Annuler', onClick:rInterac })
      ),
      interacStep===2 && React.createElement(Sheet, { onClose:rInterac, title:'MONTANT INTERAC (CAD)' },
        React.createElement(AmtIn, { value:interacAmount, onChange:setInteracAmount, currency:'CAD', equiv:'$'+interacUs+' USD', amounts:[50,100,200,500,1000,2000] }),
        React.createElement(ActBtn, { disabled:!interacAmount||parseFloat(interacAmount)<1, label:'CONTINUER', onClick:()=>setInteracStep(3) }),
        React.createElement(BkBtn, { onClick:()=>setInteracStep(1) })
      ),
      interacStep===3 && React.createElement(Sheet, { onClose:rInterac, title:'CONFIRMER INTERAC' },
        React.createElement(Recap, { rows:[{l:'Destinataire',v:interacEmail},{l:'Montant',v:'CA$ '+parseFloat(interacAmount).toLocaleString()},{l:'USD',v:'$'+interacUs},{l:'Message',v:interacMsg||'-'},{l:'Protocole',v:'FIX 4.4 Interac'}] }),
        React.createElement(ActBtn, { disabled:interacProc, label:interacProc?'TRAITEMENT...':'ENVOYER INTERAC', onClick:execInterac }),
        interacProc && React.createElement(PBar, null),
        React.createElement(BkBtn, { onClick:()=>setInteracStep(2) })
      ),
      interacStep===5 && React.createElement(Sheet, { onClose:rInterac }, React.createElement(Succ, { ref_:interacRef, amount:'CA$ '+parseFloat(interacAmount).toLocaleString(), label:'Interac '+interacEmail, onClose:rInterac }))
    )
  );
}
function SecLabel({label}){ return React.createElement('p',{style:{fontSize:'10px',fontWeight:'800',letterSpacing:'2px',color:'#999',marginBottom:'12px',marginTop:'20px'}},label); }
function PBtn({icon,label,onClick,row}){ return React.createElement('button',{onClick,style:{display:'flex',flexDirection:row?'row':'column',alignItems:'center',justifyContent:'center',gap:row?'10px':'8px',padding:'18px',background:'#FFF',border:'1px solid #EEE',borderRadius:'20px',cursor:'pointer',width:'100%'}},icon,React.createElement('span',{style:{fontWeight:'800',fontSize:'11px',letterSpacing:'1px',color:'#000'}},label)); }
function BigBtn({icon,bg,title,sub,onClick}){ const g="#D4AF37"; return React.createElement('button',{onClick,style:{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'22px',background:'#000',borderRadius:'24px',cursor:'pointer',border:'1.5px solid '+g,boxSizing:'border-box',marginBottom:'12px'}},React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'14px'}},React.createElement('div',{style:{background:bg,borderRadius:'50%',width:42,height:42,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}},icon),React.createElement('div',{style:{textAlign:'left'}},React.createElement('div',{style:{fontWeight:'900',color:g,fontSize:'13px',letterSpacing:'1px'}},title),React.createElement('div',{style:{fontSize:'10px',color:'#888',marginTop:2}},sub))),React.createElement(Icons.ArrowRightCircle,{size:20,color:g})); }
function Sheet({children,title,onClose}){ return React.createElement('div',{style:{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:3000,display:'flex',alignItems:'flex-end'}},React.createElement('div',{style:{background:'#FFF',width:'100%',padding:'32px 28px 48px',borderTopLeftRadius:'40px',borderTopRightRadius:'40px',maxHeight:'92vh',overflowY:'auto'}},React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:title?'24px':'8px'}},title&&React.createElement('h3',{style:{fontWeight:'900',fontSize:'15px',letterSpacing:'1px'}},title),React.createElement('button',{onClick:onClose,style:{background:'none',border:'none',cursor:'pointer',marginLeft:'auto'}},React.createElement(Icons.X,{size:22,color:'#999'}))),children)); }
function OpRow({color,name,sub,onClick}){ return React.createElement('button',{onClick,style:{width:'100%',display:'flex',alignItems:'center',gap:'14px',padding:'16px 18px',background:'#F8F8F8',border:'none',borderRadius:'16px',cursor:'pointer',textAlign:'left',marginBottom:'8px'}},React.createElement('div',{style:{width:38,height:38,borderRadius:'50%',background:color,flexShrink:0}}),React.createElement('div',{style:{flex:1}},React.createElement('div',{style:{fontWeight:'800',fontSize:'13px'}},name),React.createElement('div',{style:{fontSize:'10px',color:'#999',marginTop:2}},sub)),React.createElement(Icons.ChevronRight,{size:16,color:'#CCC'})); }
function PhoneIn({prefix,prefixes,onPrefixChange,value,onChange}){ const g="#D4AF37"; return React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'10px',background:'#F8F8F8',borderRadius:'16px',padding:'16px 18px',border:'1.5px solid '+(value.length>5?g:'#EEE'),marginBottom:'16px'}},React.createElement('select',{value:prefix,onChange:e=>onPrefixChange(e.target.value),style:{border:'1px solid #E5E5E5',background:'#FFF',borderRadius:'12px',padding:'10px 12px',fontWeight:'800',fontSize:'13px',color:'#000',outline:'none',minWidth:'146px',maxWidth:'55%'}},(prefixes||[]).map((p)=>React.createElement('option',{key:p.code,value:p.code},p.label))),React.createElement('input',{type:'tel',placeholder:'XX XXX XX XX',value,onChange:e=>onChange(e.target.value.replace(/\D/g,'').slice(0,12)),style:{border:'none',background:'none',fontSize:'18px',fontWeight:'700',flex:1,outline:'none',letterSpacing:'2px',minWidth:0},autoFocus:true})); }
function InpF({label,value,onChange,placeholder,mono}){ const g="#D4AF37"; return React.createElement('div',{style:{marginBottom:'12px'}},React.createElement('div',{style:{fontSize:'9px',fontWeight:'800',letterSpacing:'1.5px',color:'#999',marginBottom:'6px'}},label),React.createElement('input',{value,onChange:e=>onChange(e.target.value),placeholder,style:{width:'100%',padding:'14px 16px',border:'1.5px solid '+(value?g:'#EEE'),borderRadius:'14px',fontSize:'14px',fontWeight:mono?'600':'700',outline:'none',background:'#F8F8F8',boxSizing:'border-box',fontFamily:mono?'monospace':'inherit'},autoComplete:'off'})); }
function AmtIn({value,onChange,currency,equiv,amounts}){ const g="#D4AF37"; return React.createElement('div',{style:{marginBottom:'16px'}},React.createElement('div',{style:{background:'#F8F8F8',borderRadius:'16px',padding:'20px',border:'1.5px solid '+(value?g:'#EEE'),textAlign:'center',marginBottom:'12px'}},React.createElement('input',{type:'number',placeholder:'0',value,onChange:e=>onChange(e.target.value),style:{border:'none',background:'none',fontSize:'32px',fontWeight:'900',width:'100%',textAlign:'center',outline:'none',color:'#000'},autoFocus:true}),React.createElement('div',{style:{fontSize:'11px',color:'#999',fontWeight:'700',letterSpacing:'1px'}},currency)),value&&React.createElement('div',{style:{background:'#000',borderRadius:'12px',padding:'12px 16px',display:'flex',justifyContent:'space-between',marginBottom:'12px'}},React.createElement('span',{style:{color:'#888',fontSize:'11px'}},'Equivalent'),React.createElement('span',{style:{color:g,fontWeight:'900',fontSize:'15px'}},equiv)),React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}},amounts.map(a=>React.createElement('button',{key:a,onClick:()=>onChange(String(a)),style:{padding:'12px 6px',background:value===String(a)?'#000':'#F8F8F8',color:value===String(a)?g:'#000',border:value===String(a)?'1px solid '+g:'1px solid #EEE',borderRadius:'12px',fontWeight:'800',fontSize:'12px',cursor:'pointer'}},a.toLocaleString())))); }
function PinPad({pin,onP,label}){ const g="#D4AF37"; return React.createElement('div',{style:{textAlign:'center',marginBottom:'20px'}},React.createElement('p',{style:{fontSize:'12px',color:'#999',marginBottom:'20px'}},'Code PIN - '+label),React.createElement('div',{style:{display:'flex',justifyContent:'center',gap:'16px',marginBottom:'24px'}},[0,1,2,3].map(i=>React.createElement('div',{key:i,style:{width:50,height:50,borderRadius:'50%',border:'2px solid '+(pin.length>i?g:'#E0E0E0'),background:pin.length>i?g:'transparent',transition:'all 0.2s'}}))),React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'16px'}},['1','2','3','4','5','6','7','8','9','','0','del'].map((k,i)=>React.createElement('button',{key:i,onClick:()=>k&&onP(k),style:{padding:'18px',background:k===''?'transparent':'#F8F8F8',border:'none',borderRadius:'14px',fontSize:k==='del'?'14px':'20px',fontWeight:'700',cursor:k?'pointer':'default',color:k==='del'?'#999':'#000'}},k==='del'?'<--':k)))); }
function Recap({rows}){ return React.createElement('div',{style:{background:'#F8F8F8',borderRadius:'20px',padding:'20px',marginBottom:'20px'}},rows.map((r,i)=>React.createElement('div',{key:i,style:{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:i<rows.length-1?'1px solid #ECECEC':'none'}},React.createElement('span',{style:{fontSize:'11px',color:'#999',fontWeight:'600'}},r.l),React.createElement('span',{style:{fontSize:'12px',fontWeight:'800',maxWidth:'60%',textAlign:'right',wordBreak:'break-all'}},r.v)))); }
function Succ({ref_,amount,label,onClose,simMode}){ const g="#D4AF37"; return React.createElement('div',{style:{textAlign:'center',paddingTop:'10px'}},simMode&&React.createElement(SimBadge, null),React.createElement('div',{style:{width:80,height:80,background:'#000',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}},React.createElement(Icons.CheckCircle,{size:40,color:g})),React.createElement('h3',{style:{fontSize:'20px',fontWeight:'900',marginBottom:'8px'}},'TRANSACTION CONFIRMEE'),React.createElement('p',{style:{fontSize:'12px',color:'#999',marginBottom:'20px'}},'Execute via protocole FIX 4.4 NVIDIA Inception Security.'),React.createElement('div',{style:{background:'#F8F8F8',borderRadius:'16px',padding:'16px',marginBottom:'16px'}},React.createElement('p',{style:{fontSize:'10px',color:'#999',marginBottom:'4px',letterSpacing:'1px'}},'REFERENCE'),React.createElement('p',{style:{fontSize:'15px',fontWeight:'900',color:g,letterSpacing:'2px'}},ref_)),React.createElement('div',{style:{background:'#000',borderRadius:'16px',padding:'16px',marginBottom:'20px',display:'flex',justifyContent:'space-between'}},React.createElement('div',{style:{textAlign:'left'}},React.createElement('p',{style:{fontSize:'10px',color:'#888',marginBottom:'4px'}},'MONTANT'),React.createElement('p',{style:{fontSize:'18px',fontWeight:'900',color:g}},amount)),React.createElement('div',{style:{textAlign:'right'}},React.createElement('p',{style:{fontSize:'10px',color:'#888',marginBottom:'4px'}},'CANAL'),React.createElement('p',{style:{fontSize:'11px',fontWeight:'800',color:'#FFF'}},label))),React.createElement(ActBtn,{label:'FERMER',onClick:onClose})); }
function SimBadge(){ const g="#D4AF37"; return React.createElement('div',{style:{display:'inline-flex',alignItems:'center',gap:'8px',background:'#000',color:g,border:'1px solid '+g,borderRadius:'999px',padding:'6px 12px',fontSize:'10px',fontWeight:'900',letterSpacing:'1px',marginBottom:'14px'}},React.createElement(Icons.FlaskConical,{size:12,color:g}),'MODE SIMULATION'); }
function PBar(){ const g="#D4AF37"; return React.createElement('div',{style:{marginTop:'14px'}},React.createElement('div',{style:{width:'100%',height:'3px',background:'#F0F0F0',borderRadius:'4px',overflow:'hidden'}},React.createElement('div',{style:{height:'100%',background:g,borderRadius:'4px',animation:'prog 2.4s linear forwards'}})),React.createElement('style',null,'@keyframes prog{from{width:0%}to{width:100%}}')); }
function ActBtn({onClick,disabled,label}){ const g="#D4AF37"; return React.createElement('button',{onClick,disabled,style:{width:'100%',padding:'20px',background:disabled?'#F0F0F0':'#000',color:disabled?'#CCC':g,borderRadius:'20px',fontWeight:'900',border:'none',fontSize:'13px',letterSpacing:'2px',cursor:disabled?'not-allowed':'pointer',transition:'all 0.2s'}},label); }
function BkBtn({onClick,label}){ return React.createElement('button',{onClick,style:{width:'100%',padding:'14px',background:'none',border:'none',color:'#999',fontSize:'13px',cursor:'pointer',marginTop:'10px'}},label||'Retour'); }
