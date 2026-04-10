/**
 * components/InteracHubButton.js
 * Bouton Interac Hub — OIDC PKCE + polling async 202
 * BUTTERTECH INC — Smith-Heffa-Paygate
 */
import { useState, useEffect, useRef } from 'react';

export default function InteracHubButton({ onVerified }) {
  const [status, setStatus] = useState('idle');
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('interac_auth') === 'success') {
      window.history.replaceState({}, '', '/dashboard');
      startPolling();
    } else if (params.get('interac_error')) {
      setError(decodeURIComponent(params.get('interac_error')));
      setStatus('error');
      window.history.replaceState({}, '', '/dashboard');
    } else {
      checkStatus();
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch('/api/interac/status');
      const data = await res.json();
      if (data.authenticated) {
        setUserInfo(data);
        setStatus('verified');
        onVerified?.(data);
      }
    } catch {}
  }

  function startPolling() {
    setStatus('polling');
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch('/api/interac/status');
        const data = await res.json();
        if (data.authenticated) {
          clearInterval(pollRef.current);
          setUserInfo(data);
          setStatus('verified');
          onVerified?.(data);
        } else if (attempts >= 20) {
          // Après 20 tentatives (60s), on abandonne le polling
          clearInterval(pollRef.current);
          // Essaie quand même de récupérer userinfo directement
          const ui = await fetch('/api/interac/userinfo');
          if (ui.ok) {
            const d = await ui.json();
            setUserInfo(d);
            setStatus('verified');
            onVerified?.(d);
          } else {
            setStatus('verified_no_claims');
          }
        }
      } catch {
        if (attempts >= 20) clearInterval(pollRef.current);
      }
    }, 3000);
  }

  function startInteracFlow() {
    setStatus('loading');
    window.location.href = '/api/interac/init';
  }

  if (status === 'verified' && userInfo) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #00843D 0%, #006830 100%)',
        borderRadius: '12px', padding: '14px 18px', color: 'white',
        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
      }}>
        <span style={{ fontSize: '22px' }}>🍁</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>Identité Interac vérifiée ✅</div>
          <div style={{ fontSize: '11px', opacity: 0.85 }}>
            {[userInfo.given_name, userInfo.family_name].filter(Boolean).join(' ') || userInfo.sub?.slice(0, 8)}
            {userInfo.email ? ` · ${userInfo.email}` : ''}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'verified_no_claims') {
    return (
      <div style={{
        background: '#065F46', borderRadius: '12px', padding: '12px 16px',
        color: 'white', fontSize: '13px', marginBottom: '12px',
      }}>
        🍁 Identité vérifiée — résultats en cours de traitement
      </div>
    );
  }

  if (status === 'polling') {
    return (
      <div style={{
        background: '#1e293b', borderRadius: '12px', padding: '14px 18px',
        color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>⏳</span>
        <span style={{ fontSize: '13px' }}>Vérification en cours avec Interac Hub...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          background: '#FFF3F3', border: '1px solid #FFB3B3', borderRadius: '8px',
          padding: '10px 14px', color: '#CC0000', fontSize: '12px', marginBottom: '8px',
        }}>
          ⚠️ {error || 'Erreur Interac. Réessaie.'}
        </div>
        <button onClick={startInteracFlow} style={btnStyle}>
          🍁 Réessayer avec Interac
        </button>
      </div>
    );
  }

  return (
    <button onClick={startInteracFlow} disabled={status === 'loading'} style={{
      ...btnStyle, opacity: status === 'loading' ? 0.7 : 1,
      marginBottom: '12px',
    }}>
      {status === 'loading' ? '⏳ Redirection vers Interac...' : '🍁 Vérifier mon identité avec Interac'}
    </button>
  );
}

const btnStyle = {
  width: '100%', padding: '13px 18px',
  background: 'linear-gradient(135deg, #FFB800 0%, #E6A500 100%)',
  color: '#000', fontWeight: 700, fontSize: '13px',
  border: 'none', borderRadius: '10px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
};
