import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

function formatOAuthError(message: string): string {
  if (message.includes('Unable to exchange external code')) {
    return [
      'Microsoft sign-in failed during code exchange. Check your Azure + Supabase setup:',
      '1. Azure redirect URI must be type Web (not SPA): https://<project>.supabase.co/auth/v1/callback',
      '2. Supabase Azure provider uses the secret Value (not Secret ID)',
      '3. For single-tenant Entra, set Azure Tenant URL in Supabase to https://login.microsoftonline.com/<tenant-id>',
      '4. Add your app callback to Supabase Redirect URLs, e.g. https://<app>.vercel.app/auth/callback',
    ].join(' ');
  }

  return message;
}

export function AuthCallback() {
  const navigate = useNavigate();
  const { user, authError, syncSessionFromStorage } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) return;

    let cancelled = false;

    async function completeSignIn() {
      if (!supabase) {
        setLocalError('SSO is not configured.');
        setProcessing(false);
        return;
      }

      const url = new URL(window.location.href);
      const oauthError =
        url.searchParams.get('error_description') ?? url.searchParams.get('error');
      if (oauthError) {
        setLocalError(formatOAuthError(decodeURIComponent(oauthError)));
        setProcessing(false);
        return;
      }

      const code = url.searchParams.get('code');
      if (!code) {
        setLocalError('Missing OAuth code in callback URL.');
        setProcessing(false);
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (cancelled) return;

      if (error) {
        setLocalError(formatOAuthError(error.message));
        setProcessing(false);
        return;
      }

      const synced = await syncSessionFromStorage();
      if (cancelled) return;

      if (!synced) {
        setLocalError('Signed in with Microsoft, but the session could not be loaded.');
        setProcessing(false);
        return;
      }

      setProcessing(false);
    }

    void completeSignIn();

    return () => {
      cancelled = true;
    };
  }, [user, syncSessionFromStorage]);

  useEffect(() => {
    const message = localError ?? authError;
    if (!processing && message && !user) {
      navigate('/login', { replace: true, state: { authError: message } });
    }
  }, [localError, authError, user, navigate, processing]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="text-sm text-slate-600">Completing sign in…</p>
      </div>
    </div>
  );
}
