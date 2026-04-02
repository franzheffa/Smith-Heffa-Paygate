export default function EnterpriseFooter() {
  return (
    <footer className="mt-16 border-t border-[#C6A85B] bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-[#C6A85B]">
              Smith-Heffa Paygate
            </div>
            <h3 className="mt-3 text-xl font-semibold">Enterprise Payment Rail</h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Orchestration unifiée des paiements, OTP mobile trust layer, virements
              bancaires et mobile money.
            </p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#C6A85B]">
              Rails
            </div>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li>Stripe</li>
              <li>PayPal</li>
              <li>Apple Pay</li>
              <li>Interac</li>
              <li>SWIFT / SEPA</li>
              <li>Orange Money / Mobile Money</li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#C6A85B]">
              Sécurité
            </div>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li>Authentication</li>
              <li>2FA / OTP</li>
              <li>Session hardening</li>
              <li>Audit trail</li>
              <li>Enterprise access control</li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#C6A85B]">
              Buttertech
            </div>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              <li>Viize Parking</li>
              <li>Buttertech Academy</li>
              <li>AI Multimodal Studio</li>
              <li>Production-ready orchestration</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-xs uppercase tracking-[0.2em] text-white/55 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Smith-Heffa Paygate</span>
          <span>Fond blanc • Noir • Or Louis XIV</span>
        </div>
      </div>
    </footer>
  );
}
