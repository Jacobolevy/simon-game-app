/**
 * Login Page - Classic Neon Dots (mobile)
 *
 * Ported from the provided HTML/CSS reference.
 * Uses inline SVGs with explicit sizing to prevent icon blowups.
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/ui/layout/AppShell';
import { GlassSurface } from '../components/ui/layout/GlassSurface';
import { SimonLogo } from '../components/ui/SimonLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If user arrived via invite link, route them into the multiplayer entry flow.
  useEffect(() => {
    const joinCode = searchParams.get('join');
    if (joinCode) {
      navigate(`/entry?join=${encodeURIComponent(joinCode)}`, { replace: true });
    }
  }, [navigate, searchParams]);

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
  };

  const handleEmailLogin = () => {
    console.log('Email login clicked');
  };

  const handleGuestPlay = () => {
    navigate('/home');
  };

  return (
    <AppShell variant="jelly" className="flex items-center">
      <div className="text-center">
        {/* Brand mark */}
        <div className="mx-auto mb-3 grid place-items-center">
          <SimonLogo className="w-44 h-auto rounded-3xl border border-white/10 shadow-lg shadow-black/30" />
        </div>

        <h1 className="text-white text-3xl font-bold tracking-tight">Simon Says</h1>
        <p className="text-white/60 text-sm mt-2 font-medium">Memory, rhythm, and speed.</p>

        <GlassSurface className="mt-8 p-5 text-left">
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-colors active:scale-[0.99] border border-white/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleEmailLogin}
              className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-colors active:scale-[0.99] border border-white/10"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Continue with Email
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/45 text-[11px] font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGuestPlay}
              className="w-full h-12 rounded-2xl bg-white text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors active:scale-[0.99] shadow-[0_10px_26px_rgba(0,0,0,0.25)]"
            >
              <span aria-hidden="true">👤</span>
              Continue as Guest
            </button>
          </div>
        </GlassSurface>

        <div className="mt-6 text-[11px] text-white/35">
          v1.0.0 <span className="mx-1 opacity-60">|</span> Terms &amp; Privacy
        </div>
      </div>
    </AppShell>
  );
};

export default LoginPage;
