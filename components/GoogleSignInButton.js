import { signIn } from 'next-auth/react';

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M12.24 10.285v3.821h5.445c-.24 1.286-.96 2.375-2.045 3.107l3.307 2.568c1.928-1.778 3.043-4.397 3.043-7.496 0-.732-.066-1.435-.186-2.104H12.24z" />
      <path fill="#4285F4" d="M12 22c2.76 0 5.074-.914 6.765-2.469l-3.307-2.568c-.918.617-2.094.982-3.458.982-2.658 0-4.91-1.795-5.715-4.209H2.87v2.646A9.997 9.997 0 0012 22z" />
      <path fill="#FBBC05" d="M6.285 13.736A5.996 5.996 0 015.96 12c0-.603.108-1.188.325-1.736V7.618H2.87A9.997 9.997 0 002 12c0 1.61.384 3.134 1.065 4.382l3.22-2.646z" />
      <path fill="#34A853" d="M12 6.055c1.5 0 2.847.516 3.907 1.53l2.93-2.93C17.069 2.997 14.756 2 12 2A9.997 9.997 0 002.87 7.618l3.415 2.646C7.09 7.85 9.342 6.055 12 6.055z" />
    </svg>
  );
}

export default function GoogleSignInButton() {
  async function handleSignIn() {
    await signIn('google', { callbackUrl: '/api/auth/google-complete' });
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', height: '54px', borderRadius: '12px', backgroundColor: '#fff', border: '2px solid #e5e7eb', color: '#111', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}
    >
      <GoogleMark />
      Continuer avec Google
    </button>
  );
}
