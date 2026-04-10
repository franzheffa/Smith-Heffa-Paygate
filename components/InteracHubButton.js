/**
 * components/InteracHubButton.js
 * Bouton Interac Hub — lance le flow OIDC PKCE
 * BUTTERTECH INC — Smith-Heffa-Paygate
 */
import { useState, useEffect } from 'react';

export default function InteracHubButton({ onVerified }) {
  const [status, setStatus] = useState('idle'); // idle | loading | verified | error
  const [userInfo, setUserInfo] = useState(null);

  // Vérifie si déjà authentifié Interac (cookie ihub_at)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('interac_auth') === 'success') {
      checkStatus();
      // Nettoie l'URL
      window.history.replaceState({}, '', '/dashboard');
    } else if (params.get('interac_error')) {
      setStatus('error');
    } else {
      checkStatus();
    }
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

  function startInteracFlow() {
    setStatus('loading');
    window.location.href = '/api/interac/init';
  }

  if (status === 'verified' && userInfo) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #00843D 0%, #006830 100%)',
        borderRadius: '12px',
        padding: '16px 20px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ fontSize: '24px' }}>🍁</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px' }}>
            Identité Interac vérifiée
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {userInfo.given_name} {userInfo.family_name}
            {userInfo.email ? ` · ${userInfo.email}` : ''}
          </div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '20px' }}>✅</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          background: '#FFF3F3',
          border: '1px solid #FFB3B3',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#CC0000',
          fontSize: '13px',
        }}>
          ⚠️ Erreur lors de la vérification Interac. Réessaie.
        </div>
        <button onClick={startInteracFlow} style={btnStyle}>
          🍁 Réessayer avec Interac
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startInteracFlow}
      disabled={status === 'loading'}
      style={btnStyle}
    >
      {status === 'loading' ? (
        <span>⏳ Redirection vers Interac Hub...</span>
      ) : (
        <span>🍁 Vérifier mon identité avec Interac</span>
      )}
    </button>
  );
}

const btnStyle = {
  width: '100%',
  padding: '14px 20px',
  background: 'linear-gradient(135deg, #FFB800 0%, #E6A500 100%)',
  color: '#000',
  fontWeight: 700,
  fontSize: '14px',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'opacity 0.2s',
};
