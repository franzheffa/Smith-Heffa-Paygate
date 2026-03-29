import { useState } from 'react';

const gold = '#D4AF37';

export default function OidcDebugPage() {
  const [scope, setScope] = useState('openid dpv:FraudPreventionAndDetection number-verification:verify');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function generateAuthorizeUrl() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/oidc/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'OIDC init failed');
      }
      setResult(data);
    } catch (e) {
      setError(e.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#000', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 20px' }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 1, fontWeight: 900 }}>OIDC FRONTEND FLOW DEBUG</h1>
        <p style={{ marginTop: 8, color: '#333' }}>Smith-Heffa PayGate • Orange OIDC Authorization Code + PKCE</p>

        <div style={{ marginTop: 24, border: `1px solid ${gold}`, borderRadius: 18, padding: 18, background: '#000' }}>
          <label style={{ display: 'block', color: gold, fontWeight: 800, fontSize: 12, marginBottom: 8 }}>SCOPE</label>
          <textarea
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            rows={3}
            style={{ width: '100%', borderRadius: 12, border: '1px solid #222', padding: 12, color: '#fff', background: '#111' }}
          />
          <button
            type="button"
            onClick={generateAuthorizeUrl}
            disabled={loading}
            style={{
              marginTop: 14,
              background: loading ? '#444' : gold,
              color: '#000',
              border: 'none',
              borderRadius: 12,
              fontWeight: 900,
              letterSpacing: 1,
              padding: '12px 16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'GENERATION...' : 'GENERER URL OIDC'}
          </button>
        </div>

        {error ? (
          <div style={{ marginTop: 16, padding: 14, borderRadius: 12, border: '1px solid #ef4444', color: '#ef4444' }}>{error}</div>
        ) : null}

        {result?.authorizeUrl ? (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: `1px solid ${gold}` }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>URL d’autorisation générée:</p>
            <a href={result.authorizeUrl} style={{ color: '#000', fontWeight: 800, wordBreak: 'break-all' }}>
              {result.authorizeUrl}
            </a>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#666' }}>
              Callback configuré: <b>{result.redirectUri}</b>
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#666' }}>
              Après consentement, Orange redirige vers <code>/api/oidc/callback</code> qui échange le code contre le token.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
