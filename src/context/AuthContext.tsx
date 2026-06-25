import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  clearDemoUser,
  getEmailFromUser,
  isAllowedEmail,
  readDemoUser,
  userDisplayFromSession,
  writeDemoUser,
  type AuthMode,
  type UserDisplay,
} from '../lib/auth';

const SSO_SESSION_TIMEOUT_MS = 3000;

type AuthContextValue = {
  session: Session | null;
  user: UserDisplay | null;
  authMode: AuthMode;
  loading: boolean;
  ssoAvailable: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithDemo: (email: string) => void;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  syncSessionFromStorage: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getRedirectUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

async function getSessionWithTimeout(timeoutMs: number): Promise<Session | null> {
  if (!supabase) return null;

  const client = supabase;

  try {
    const result = await Promise.race([
      client.auth.getSession(),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('SSO session check timed out')), timeoutMs);
      }),
    ]);

    return result.data.session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [demoUser, setDemoUser] = useState<UserDisplay | null>(() => readDemoUser());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const ssoAvailable = Boolean(supabase);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const rejectUnauthorizedDomain = useCallback(async (sessionUser: Session['user'] | undefined) => {
    const email = sessionUser ? getEmailFromUser(sessionUser) : undefined;
    if (!email || !isAllowedEmail(email)) {
      setAuthError('Only @infovision.com accounts are allowed.');
      if (supabase) {
        await supabase.auth.signOut();
      }
      setSession(null);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const storedDemoUser = readDemoUser();
    setDemoUser(storedDemoUser);
    setLoading(false);

    if (!supabase) {
      return () => {
        cancelled = true;
      };
    }

    async function hydrateSsoSession() {
      const existingSession = await getSessionWithTimeout(SSO_SESSION_TIMEOUT_MS);
      if (cancelled || !existingSession) return;

      const rejected = await rejectUnauthorizedDomain(existingSession.user);
      if (!cancelled && !rejected) {
        setSession(existingSession);
        setDemoUser(null);
        clearDemoUser();
      }
    }

    void hydrateSsoSession();

    const client = supabase;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      if (cancelled) return;

      if (!nextSession) {
        setSession(null);
        return;
      }

      const rejected = await rejectUnauthorizedDomain(nextSession.user);
      if (!rejected) {
        setSession(nextSession);
        setDemoUser(null);
        clearDemoUser();
        setAuthError(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [rejectUnauthorizedDomain]);

  const signInWithDemo = useCallback((email: string) => {
    if (!isAllowedEmail(email)) {
      setAuthError('Please use your InfoVision company email ID.');
      return;
    }

    if (supabase) {
      void supabase.auth.signOut();
    }

    const user = writeDemoUser(email);
    setSession(null);
    setDemoUser(user);
    setAuthError(null);
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    if (!supabase) {
      setAuthError('Microsoft SSO is not configured. Set Supabase environment variables.');
      return;
    }

    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: getRedirectUrl(),
        scopes: 'email',
      },
    });

    if (error) {
      setAuthError(error.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    clearDemoUser();
    setDemoUser(null);
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setAuthError(null);
  }, []);

  const syncSessionFromStorage = useCallback(async (): Promise<boolean> => {
    if (!supabase) return false;

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return false;

    const rejected = await rejectUnauthorizedDomain(data.session.user);
    if (rejected) return false;

    setSession(data.session);
    setDemoUser(null);
    clearDemoUser();
    setAuthError(null);
    return true;
  }, [rejectUnauthorizedDomain]);

  const authMode: AuthMode = session ? 'sso' : demoUser ? 'demo' : null;

  const user = useMemo(
    () => (session?.user ? userDisplayFromSession(session.user) : demoUser),
    [session, demoUser],
  );

  const value = useMemo(
    () => ({
      session,
      user,
      authMode,
      loading,
      ssoAvailable,
      authError,
      clearAuthError,
      signInWithDemo,
      signInWithMicrosoft,
      signOut,
      syncSessionFromStorage,
    }),
    [
      session,
      user,
      authMode,
      loading,
      ssoAvailable,
      authError,
      clearAuthError,
      signInWithDemo,
      signInWithMicrosoft,
      signOut,
      syncSessionFromStorage,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
