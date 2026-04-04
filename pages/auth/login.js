import { signIn, getProviders } from "next-auth/react";
import Link from "next/link";

export default function LoginPage({ providers }) {
  const googleProvider = providers?.google;
  const appleProvider = providers?.apple;

  const orangeEnabled = process.env.NEXT_PUBLIC_PAYGATE_AUTH_ORANGE_OTP_ENABLED === "true";
  const legacyEnabled = process.env.NEXT_PUBLIC_PAYGATE_AUTH_LEGACY_ENABLED === "true";

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-6 py-16 text-black">
      <div className="mx-auto max-w-xl overflow-hidden rounded-[28px] border border-[#d9d2bf] bg-white shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
        <div className="bg-black px-8 py-6 text-center">
          <div className="text-[12px] uppercase tracking-[0.35em] text-[#C6A85B]">
            Buttertech · Smith-Heffa Paygate
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            Authentification unifiée
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Accès centralisé, enterprise grade.
          </p>
        </div>

        <div className="space-y-4 px-8 py-8">
          {googleProvider && (
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="flex w-full items-center justify-center rounded-2xl border border-[#C6A85B] bg-black px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#C6A85B] transition hover:opacity-95"
            >
              Continuer avec Google
            </button>
          )}

          {appleProvider && (
            <button
              onClick={() => signIn("apple", { callbackUrl: "/" })}
              className="flex w-full items-center justify-center rounded-2xl border border-[#d9d2bf] bg-white px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#faf8f2]"
            >
              Continuer avec Apple
            </button>
          )}

          {orangeEnabled && (
            <Link
              href="/oidc-debug"
              className="flex w-full items-center justify-center rounded-2xl border border-[#d9d2bf] bg-white px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#faf8f2]"
            >
              Continuer avec téléphone / Orange OTP
            </Link>
          )}

          {legacyEnabled && (
            <Link
              href="/"
              className="block text-center text-xs uppercase tracking-[0.18em] text-black/55 underline-offset-4 hover:underline"
            >
              Utiliser le login classique (beta)
            </Link>
          )}

          {!googleProvider && !appleProvider && !orangeEnabled && !legacyEnabled && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Aucun provider d’authentification n’est activé.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: {
      providers: providers ?? null,
    },
  };
}
