export default function EnterpriseFooter() {
  const products = [
    { name: 'Viize Parking',              href: 'https://viize-app.vercel.app' },
    { name: 'Buttertech Academy',         href: 'https://buttertech-academy.vercel.app' },
    { name: 'AI Multimodal Studio',       href: 'https://aistudio-smith-heffa.vercel.app/index.html' },
    { name: 'Sovereign Orchestrator',     href: 'https://smith-heffa-sovereign-orchestrator.vercel.app' },
    { name: 'Med Gemma Foundry',          href: 'https://med-gemma-foundry-smith-heffa.vercel.app' },
    { name: 'DeepStream Viize',           href: 'https://deepstream-viize-app.vercel.app' },
  ];

  const secOpsBadge = (
    <svg height="18" viewBox="0 0 340 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <path d="M28 3L6 12v18c0 12 9 23 22 27 13-4 22-15 22-27V12Z" fill="none" stroke="#4285F4" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M40 3l10 4v23c0 8-4 16-10 21" fill="none" stroke="#34A853" strokeWidth="3" strokeLinecap="round"/>
      <path d="M24 20c-5 0-9 4-9 10s4 10 9 10c2 0 4-1 6-2" fill="none" stroke="#FBBC04" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M31 22c2 2 3 5 3 8s-1 6-3 8" fill="none" stroke="#EA4335" strokeWidth="3.5" strokeLinecap="round"/>
      <text x="62" y="39" fontFamily="-apple-system,BlinkMacSystemFont,'Google Sans',sans-serif" fontSize="19" fontWeight="400" fill="#9ca3af">Google Security Operations</text>
    </svg>
  );

  return (
    <footer style={{ backgroundColor: '#000', color: '#fff', borderTop: '1px solid #C6A85B' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px 32px' }}>
        <div style={{ display: 'grid', gap: '32px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '40px' }}>

          {/* Colonne 1 — Identité */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#C6A85B', marginBottom: '12px' }}>Smith-Heffa Paygate</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 12px' }}>Enterprise Payment Rail</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.65)', margin: '0 0 16px' }}>
              Orchestration unifiée des paiements, OTP mobile trust layer, virements bancaires et mobile money.
            </p>
            <a href="https://www.buttertech.io" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '12px', fontWeight: '700', color: '#C6A85B', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              buttertech.io →
            </a>
          </div>

          {/* Colonne 2 — Rails */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#C6A85B', marginBottom: '12px' }}>Rails</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              {['Stripe', 'PayPal', 'Apple Pay', 'Interac', 'SWIFT / SEPA', 'Orange Money / Mobile Money'].map(r => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Colonne 3 — Sécurité */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#C6A85B', marginBottom: '12px' }}>Sécurité</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              {['Authentication', '2FA / OTP', 'Session hardening', 'Audit trail', 'Enterprise access control'].map(r => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Colonne 4 — Écosystème Buttertech */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#C6A85B', marginBottom: '12px' }}>Écosystème Buttertech</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              {products.map(p => (
                <li key={p.name}>
                  <a href={p.href} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.target.style.color = '#C6A85B'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.7)'}>
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Barre bas */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            © 2026 Smith-Heffa Paygate · Buttertech Inc.
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Protected by</span>
            {secOpsBadge}
          </div>
        </div>
      </div>
    </footer>
  );
}
