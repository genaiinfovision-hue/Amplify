import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Activity } from 'lucide-react';
import { defaultFamilyBadge, useFamilies } from '../context/FamiliesContext';
import { loadRecentActivity, type ActivityFeedItem } from '../lib/activity';
import { loadCatalogAssets, type CatalogAsset } from '../lib/catalog';
import { loadSubmissions, type PipelineSubmission } from '../lib/pipeline';

export function Home() {
  const navigate = useNavigate();
  const { families, loading: familiesLoading } = useFamilies();
  const [userName, setUserName] = useState('');
  const [assets, setAssets] = useState<CatalogAsset[]>([]);
  const [submissions, setSubmissions] = useState<PipelineSubmission[]>([]);
  const [activity, setActivity] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const [catalogAssets, pipelineSubmissions, activityRows] = await Promise.all([
        loadCatalogAssets(),
        loadSubmissions(),
        loadRecentActivity(),
      ]);
      if (!cancelled) {
        setAssets(catalogAssets);
        setSubmissions(pipelineSubmissions);
        setActivity(activityRows);
        setIsLoading(false);
      }
    }

    void hydrate();

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUserName(u.name.split(' ')[0] || u.name);
      } catch (e) {}
    }
    
    return () => {
      cancelled = true;
    };
  }, []);
  
  const recentAssets = [...assets].sort((a, b) => b.stats.deployments - a.stats.deployments).slice(0, 5);
  const pendingSubs = submissions.filter((submission) => submission.status !== 'Published');
  
  const totalDeploys = assets.reduce((s, a) => s + a.stats.deployments, 0);
  const demoCount = assets.filter(a => a.demoReady).length;
  const btCount = assets.filter(a => a.maturity === "battle-tested").length;

  const stats = [
    { value: assets.length, label: "Total Assets", color: "text-sky-500" },
    { value: btCount, label: "Battle-Tested", color: "text-sky-500" },
    { value: demoCount, label: "Demo-Ready", color: "text-emerald-500" },
    { value: totalDeploys, label: "Total Deploys", color: "text-purple-500" },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between md:px-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome back, {userName}</h1>
          <p className="mt-1 text-sm text-gray-500">Here's what's happening across the AIMPLIFY platform</p>
        </div>
        <div className="flex shrink-0 items-center justify-center gap-4 sm:justify-end">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-purple-500 text-xs font-bold text-white shadow-sm">
              Ai
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">AIMPLIFY</span>
          </div>
          <div className="h-10 w-px shrink-0 bg-gray-200" aria-hidden />
          <img
            src="/infovision_logo.png"
            alt="InfoVision"
            className="h-12 w-auto max-w-[min(100%,220px)] object-contain sm:h-14 md:h-16"
            width={220}
            height={64}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 px-4 pb-6 md:grid-cols-4 md:px-10">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="mt-1 text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Families */}
      <div className="px-4 pb-8 md:px-10">
        <h2 className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wide">Platform Families</h2>
        {familiesLoading ? (
          <p className="text-sm text-gray-500">Loading platform families…</p>
        ) : Object.keys(families).length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No platform families loaded. Ensure Supabase <code className="rounded bg-white/80 px-1">platform_families</code> has rows and your API keys are configured.
          </p>
        ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(families).map(([k, f], i) => {
            const count = assets.filter((asset) => asset.family === k).length;
            return (
              <motion.div
                key={k}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                onClick={() => navigate(`/family/${k}`)}
                className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-all"
                style={{ borderTop: `3px solid ${f.color}` }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-base font-bold" style={{ color: f.color }}>{f.name}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold"
                    style={{ backgroundColor: `${f.color}15`, color: f.color }}
                  >
                    {isLoading ? '...' : count}
                  </span>
                </div>
                <div className="text-xs leading-relaxed text-gray-500 group-hover:text-gray-700 transition-colors">
                  {f.tagline}
                </div>
              </motion.div>
            );
          })}
        </div>
        )}
      </div>

      {/* Two columns layout */}
      <div className="grid grid-cols-1 gap-6 px-4 pb-12 md:grid-cols-2 md:px-10">
        
        {/* Popular Assets */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wide">Most Deployed Assets</h2>
          <div className="flex flex-col">
            {recentAssets.map(a => {
              const fm = families[a.family] ?? defaultFamilyBadge();
              return (
                <div 
                  key={a.id} 
                  onClick={() => navigate(`/catalog/${a.id}`)}
                  className="group flex cursor-pointer items-center gap-3 border-b border-gray-100 py-3 transition-colors hover:bg-gray-50"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: fm.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{a.name}</div>
                    <div className="text-xs text-gray-500">{a.id} · {fm.name}</div>
                  </div>
                  <div className="text-sm font-bold text-gray-700">{a.stats.deployments}</div>
                  <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1" />
                </div>
              );
            })}
          </div>
          <button 
            onClick={() => navigate('/catalog')}
            className="mt-4 text-sm font-medium text-sky-500 hover:text-sky-600 flex items-center gap-1"
          >
            View full catalog <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Activity & Pipeline */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" /> Recent Activity
            </h2>
            <div className="flex flex-col">
              {activity.length === 0 ? (
                <p className="py-2 text-sm text-gray-500">No recent activity yet. Events from the database activity log will appear here.</p>
              ) : (
                activity.map((a, i) => (
                  <div key={`${a.who}-${a.time}-${i}`} className={`py-2.5 ${i < activity.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{a.who}</span> {a.action} <span className="font-medium" style={{ color: a.color }}>{a.what}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">{a.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {pendingSubs.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Pipeline</h2>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                  {pendingSubs.length} pending
                </span>
              </div>
              <div className="flex flex-col">
              {pendingSubs.slice(0, 3).map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => navigate(`/pipeline/${s.id}`)}
                    className="group flex cursor-pointer items-center gap-3 border-b border-gray-100 py-3 hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.status}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
              <button 
                onClick={() => navigate('/pipeline')}
                className="mt-4 text-sm font-medium text-sky-500 hover:text-sky-600 flex items-center gap-1"
              >
                View pipeline <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
