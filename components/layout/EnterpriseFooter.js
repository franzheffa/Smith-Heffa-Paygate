export default function EnterpriseFooter() {
  return (
    <footer style={{ marginTop: '64px', borderTop: '1px solid #C6A85B', backgroundColor: '#000', color: '#fff' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gap: '32px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#C6A85B' }}>Smith-Heffa Paygate</div>
            <h3 style={{ marginTop: '12px', fontSize: '20px', fontWeight: '600' }}>Enterprise Payment Rail</h3>
            <p style={{ marginTop: '12px', fontSize: '14px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)' }}>Orchestration unifiée des paiements, OTP mobile trust layer, virements bancaires et mobile money.</p>
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#C6A85B' }}>Rails</div>
            <ul style={{ marginTop: '12px', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>
              {['Stripe','PayPal','Apple Pay','Interac','SWIFT / SEPA','Orange Money / Mobile Money'].map(r => <li key={r}>{r}</li>)}
            </ul>
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#C6A85B' }}>Sécurité</div>
            <ul style={{ marginTop: '12px', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>
              {['Authentication','2FA / OTP','Session hardening','Audit trail','Enterprise access control'].map(r => <li key={r}>{r}</li>)}
            </ul>
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#C6A85B' }}>Buttertech</div>
            <ul style={{ marginTop: '12px', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>
              {['Viize Parking','Buttertech Academy','AI Multimodal Studio','Production-ready orchestration'].map(r => <li key={r}>{r}</li>)}
            </ul>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.55)', flexWrap: 'wrap', gap: '12px' }}>
          <span>© 2026 Smith-Heffa Paygate</span>
          <span>Fond blanc • Noir • Or Louis XIV</span>
        </div>
      </div>
    </footer>
  );
}
