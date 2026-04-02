import Link from "next/link";

const paymentRails = [
  "Stripe",
  "PayPal",
  "Apple Pay",
  "SEPA",
  "SWIFT",
  "Interac",
  "Orange Money",
  "MTN MoMo",
  "M-PESA",
  "Wave",
];

const platform = [
  "Orchestration des paiements",
  "Trust layer OTP",
  "Mobile identity layer",
  "API enterprise",
  "Observabilité",
  "Déploiement Vercel",
];

export default function EnterpriseFooter() {
  return (
    <footer className="border-t border-[#C6A85B] bg-black text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="mb-4 text-2xl font-semibold tracking-[0.18em] text-[#C6A85B]">
            SMITH-HEFFA
          </div>
          <p className="max-w-sm text-sm leading-7 text-white/75">
            Infrastructure transactionnelle enterprise pour paiement,
            validation mobile et orchestration multimarché.
          </p>
          <div className="mt-6 inline-flex rounded-full border border-[#C6A85B] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#C6A85B]">
            Pure White · Black · Louis XIV Gold
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#C6A85B]">
            Payment Rails
          </h3>
          <ul className="space-y-3 text-sm text-white/80">
            {paymentRails.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#C6A85B]">
            Platform
          </h3>
          <ul className="space-y-3 text-sm text-white/80">
            {platform.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#C6A85B]">
            Enterprise
          </h3>
          <div className="space-y-3 text-sm text-white/80">
            <p>Google Partner ISV</p>
            <p>GCP Marketplace Ready</p>
            <p>NVIDIA AI Enterprise Alignment</p>
            <p>Vercel / Next.js / Prisma</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 text-sm">
            <Link href="/security" className="text-white/85 transition hover:text-[#C6A85B]">
              Security
            </Link>
            <Link href="/privacy" className="text-white/85 transition hover:text-[#C6A85B]">
              Privacy
            </Link>
            <Link href="/terms" className="text-white/85 transition hover:text-[#C6A85B]">
              Terms
            </Link>
            <Link href="/contact" className="text-white/85 transition hover:text-[#C6A85B]">
              Contact
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-xs uppercase tracking-[0.2em] text-white/55 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Smith-Heffa Paygate</span>
          <span>Enterprise Payment Orchestration • Mobile Trust Layer</span>
        </div>
      </div>
    </footer>
  );
}
