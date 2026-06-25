import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFamilies } from '../context/FamiliesContext';
import { useAuth } from '../context/AuthContext';
import { loadCatalogAssets, type CatalogAsset } from '../lib/catalog';

function MicrosoftLogo() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export const Login: React.FC = () => {
  const [assets, setAssets] = useState<CatalogAsset[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { families, loading: familiesLoading } = useFamilies();
  const { session, user, loading: authLoading, authError, clearAuthError, signInWithMicrosoft } =
    useAuth();

  useEffect(() => {
    if (!authLoading && (session || user)) {
      navigate('/', { replace: true });
    }
  }, [authLoading, session, user, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateCatalog() {
      const rows = await loadCatalogAssets();
      if (!cancelled) {
        setAssets(rows);
        setCatalogLoaded(true);
      }
    }

    void hydrateCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleMicrosoftSignIn = async () => {
    setIsSsoLoading(true);
    clearAuthError();
    try {
      await signInWithMicrosoft();
    } finally {
      setIsSsoLoading(false);
    }
  };

  const displayError =
    authError ?? (location.state as { authError?: string } | null)?.authError ?? null;

  const familyEntries = Object.entries(families);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative flex w-full flex-col justify-center overflow-hidden bg-[#131e36] p-8 text-white md:w-[55%] md:p-16 lg:w-1/2 lg:p-24"
        >
          <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[#1e2f50] opacity-50 blur-3xl mix-blend-screen" />
          <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#0a1120] opacity-80 blur-3xl" />

          <div className="relative z-10 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-12 flex items-center gap-3"
            >
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/20">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white/90">AIMPLIFY</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6 text-4xl font-bold leading-tight lg:text-5xl"
            >
              AI Capabilities & <br /> Accelerator Platform
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-10 max-w-md text-lg leading-relaxed text-blue-100/70 md:mb-14"
            >
              Discover, deploy, and demonstrate InfoVision's AI assets — from prompt libraries and agent patterns to production-ready accelerators.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-10"
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-blue-200/50">
                Platform families
              </p>
              {familiesLoading && familyEntries.length === 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="flex flex-col items-center rounded-lg bg-white/5 px-2 py-3">
                      <div className="mb-2 h-8 w-10 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-14 animate-pulse rounded bg-white/10" />
                    </div>
                  ))}
                </div>
              ) : familyEntries.length === 0 ? (
                <p className="text-sm text-blue-200/60">
                  Family metrics appear when <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">platform_families</code> is configured in Supabase.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 md:gap-5">
                  {familyEntries.map(([familyId, f]) => {
                    const count = assets.filter((a) => a.family === familyId).length;
                    return (
                      <div
                        key={familyId}
                        className="flex flex-col items-center rounded-lg bg-white/[0.06] px-2 py-3 ring-1 ring-white/10"
                      >
                        <span
                          className="mb-1.5 text-2xl font-bold tabular-nums md:text-3xl"
                          style={{ color: f.color }}
                        >
                          {!catalogLoaded ? '…' : count}
                        </span>
                        <span className="text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-blue-200/55 md:text-xs">
                          {f.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative flex w-full flex-col justify-center bg-white p-8 md:w-[45%] md:p-12 lg:w-1/2 lg:p-24"
        >
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex w-full justify-center">
              <img
                src="/infovision_logo.png"
                alt="InfoVision"
                className="h-20 w-auto max-w-[min(100%,420px)] object-contain sm:h-24 md:h-28 lg:h-32"
                width={400}
                height={112}
              />
            </div>

            <div className="mb-10 text-center md:text-left">
              <h2 className="mb-2 text-3xl font-bold text-slate-900">Sign in</h2>
              <p className="text-slate-500">Use your InfoVision Microsoft account</p>
            </div>

            {authLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {displayError}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: isSsoLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isSsoLoading ? 1 : 0.99 }}
                  type="button"
                  onClick={() => void handleMicrosoftSignIn()}
                  disabled={isSsoLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 font-medium text-slate-800 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MicrosoftLogo />
                  {isSsoLoading ? 'Redirecting to Microsoft…' : 'Sign in with SSO'}
                </motion.button>

                <p className="text-center text-sm text-slate-500">
                  Secured with Microsoft Entra ID (Azure AD)
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
