import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, GitBranch, Info, Layers, Zap, CheckCircle2, ChevronRight, ArrowRight, Video } from 'lucide-react';
import { defaultFamilyBadge, useFamilies } from '../context/FamiliesContext';
import { CC, CL, MC, ML, ACM } from '../data/uiConstants';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { getCatalogAsset, loadCatalogAssets, type CatalogAsset } from '../lib/catalog';
import { catalogAssetPath } from '../lib/catalogSlug';
import { resolveWatchDemoUrl } from '../lib/demoMediaUrl';
import { resolveLaunchDemo } from '../lib/launchDemo';
import { DemoVideoModal } from '../components/media/DemoVideoModal';

export function AssetDetail() {
  const { slug: routeSlug } = useParams();
  const navigate = useNavigate();
  const { families } = useFamilies();
  const [tab, setTab] = useState<'overview' | 'architecture' | 'quick-start'>('overview');
  const [asset, setAsset] = useState<CatalogAsset | null>(null);
  const [relatedAssets, setRelatedAssets] = useState<CatalogAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [demoVideoOpen, setDemoVideoOpen] = useState(false);

  useEffect(() => {
    if (!routeSlug) return;

    const assetId = routeSlug;
    let cancelled = false;

    async function hydrate() {
      const [currentAsset, catalogAssets] = await Promise.all([
        getCatalogAsset(assetId),
        loadCatalogAssets(),
      ]);

      if (!cancelled) {
        setAsset(currentAsset);
        setRelatedAssets(
          currentAsset
            ? catalogAssets.filter((item) => item.id !== currentAsset.id && item.family === currentAsset.family).slice(0, 3)
            : [],
        );
        setIsLoading(false);

        if (currentAsset && assetId.toLowerCase() !== currentAsset.slug) {
          navigate(catalogAssetPath(currentAsset), { replace: true });
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [routeSlug, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-sm font-medium text-gray-500">Loading asset...</div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h2 className="text-xl font-bold text-gray-900">Asset not found</h2>
        <Button className="mt-4" onClick={() => navigate('/catalog')}>Back to Catalog</Button>
      </div>
    );
  }

  const fm = families[asset.family] ?? defaultFamilyBadge();
  const repoUrl = asset.repoUrl;
  const videoUrl =
    asset.videoUrl ??
    resolveWatchDemoUrl({
      videoUrl: asset.videoUrl,
      demoUrl: asset.demoUrl ?? asset.launchDemoUrl,
    });
  const launchDemoTarget = resolveLaunchDemo(asset);
  const hasLaunchDemo = launchDemoTarget.mode !== 'unavailable';
  const hasRepo = Boolean(repoUrl);
  const hasVideo = Boolean(videoUrl);

  const openExternalLink = (url: string | undefined, label: string) => {
    if (!url) {
      window.alert(`${label} is not available for this asset yet.`);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLaunchDemo = () => {
    if (launchDemoTarget.mode === 'internal') {
      navigate(launchDemoTarget.path);
      return;
    }
    if (launchDemoTarget.mode === 'external') {
      openExternalLink(launchDemoTarget.url, 'Demo link');
      return;
    }
    window.alert('Demo is not available for this asset yet.');
  };

  const openDemoVideo = () => {
    if (!videoUrl?.trim()) {
      window.alert('No video or image demo is linked for this asset yet.');
      return;
    }
    setDemoVideoOpen(true);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'quick-start', label: 'Quick Start', icon: Zap },
  ] as const;

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 px-4 py-4 text-sm md:px-10">
        <button onClick={() => navigate('/catalog')} className="font-medium text-sky-500 hover:text-sky-600 transition-colors">Catalog</button>
        <span className="text-gray-300">/</span>
        <button onClick={() => navigate(`/family/${asset.family}`)} className="font-medium hover:opacity-80 transition-opacity" style={{ color: fm.color }}>{fm.name}</button>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-900">{asset.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 px-4 md:px-10 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Header Section */}
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-xs font-semibold text-gray-500 border border-gray-200">
                {asset.displayId ?? asset.id}
              </span>
              <Badge customColor={fm.color}>{fm.name}</Badge>
              <Badge variant={asset.maturity === 'experimental' ? 'warning' : asset.maturity === 'validated' ? 'success' : 'default'} customColor={MC[asset.maturity] !== 'default' ? undefined : '#0EA5E9'}>
                {ML[asset.maturity]}
              </Badge>
              {asset.demoReady && (
                <Badge variant="success" className="gap-1 bg-emerald-100 text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Demo Ready
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
              {asset.name}
            </h1>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {asset.clouds.map((c: string) => (
                <span key={c} className="rounded-lg border px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: `${CC[c]}08`, color: CC[c], borderColor: `${CC[c]}25` }}>
                  {CL[c]}
                </span>
              ))}
            </div>
            
            <div className="mt-3 text-sm font-semibold" style={{ color: fm.color }}>
              {asset.solution}
            </div>
            
            <p className="mt-4 text-base leading-relaxed text-gray-600 max-w-3xl">
              {asset.desc}
            </p>
            
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={handleLaunchDemo}
                className="gap-2"
                disabled={!hasLaunchDemo}
              >
                <Play className="h-4 w-4" /> Launch Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => openExternalLink(repoUrl, 'Repository link')}
                className="gap-2"
                disabled={!hasRepo}
              >
                <GitBranch className="h-4 w-4" /> Clone Repo
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={openDemoVideo}
                className="gap-2"
                disabled={!hasVideo}
              >
                <Video className="h-4 w-4" /> Watch demo
              </Button>
            </div>
          </div>

          <DemoVideoModal
            open={demoVideoOpen}
            url={videoUrl ?? ''}
            title={asset.name}
            onClose={() => setDemoVideoOpen(false)}
          />

          {/* Tabs */}
          <div>
            <div className="flex gap-1 border-b border-gray-200">
              {tabs.map(t => {
                const Icon = t.icon;
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {tab === 'overview' && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> About
                    </h3>
                    <div className="space-y-4 text-sm leading-relaxed text-gray-600">
                      {asset.longDesc.split('\n\n').map((p: string, i: number) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {asset.tags.map((t: string) => (
                        <span key={t} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'architecture' && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Architecture Flow
                    </h3>
                    {asset.architecture.length === 1 && asset.architecture[0].toLowerCase() === 'not applicable' ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm font-semibold text-gray-500">
                        Not applicable
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8">
                        {asset.architecture.map((step: string, i: number) => (
                          <div key={i} className="flex items-center gap-4">
                            <div
                              className="min-w-[120px] rounded-lg border px-4 py-2.5 text-center text-sm font-bold shadow-sm bg-white"
                              style={{
                                color: ACM[asset.archColors[i]] || '#6B7280',
                                borderColor: `${ACM[asset.archColors[i]]}30` || '#E5E7EB'
                              }}
                            >
                              {step}
                            </div>
                            {i < asset.architecture.length - 1 && (
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'quick-start' && (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Commands
                      </h3>
                      <div className="overflow-x-auto rounded-lg bg-slate-900 p-5 font-mono text-sm leading-relaxed text-slate-300">
                        {asset.quickStart.split('\n').map((line: string, i: number) => (
                          <div key={i} className={line.startsWith('#') ? 'text-slate-500' : 'text-slate-200'}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Prerequisites
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {asset.prerequisites.map((p: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm font-medium text-gray-700">
                            {p.done ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-gray-300 bg-white" />
                            )}
                            {p.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Usage</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                <div className="text-xl font-bold text-sky-500">{asset.stats.deployments}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Deploys</div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                <div className="text-xl font-bold text-emerald-500">{asset.stats.demos}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Demos</div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                <div className="text-xl font-bold text-amber-500">{asset.stats.projects}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Projects</div>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                <div className="text-xl font-bold text-purple-500">{asset.stats.satisfaction}%</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Rating</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Details</h4>
            <div className="space-y-3">
              {[
                { label: 'ID', value: <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{asset.displayId ?? asset.id}</span> },
                { label: 'Family', value: <span className="font-semibold" style={{ color: fm.color }}>{fm.name}</span> },
                { label: 'Category', value: <span className="font-medium text-gray-900">{asset.category}</span> },
                { label: 'Maturity', value: <span className={`font-semibold ${MC[asset.maturity]}`} style={{ color: MC[asset.maturity] ? undefined : '#6B7280' }}>{ML[asset.maturity]}</span> },
                { label: 'Effort', value: <span className="font-medium text-gray-900 capitalize">{asset.effort}</span> },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0 text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  {item.value}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Owner</h4>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 border border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${fm.color}, #8B5CF6)` }}>
                {asset.ownerInit}
              </div>
              <div className="text-sm font-bold text-gray-900">{asset.owner}</div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Dependencies</h4>
            <div className="space-y-2">
              {asset.dependencies.map((d: string, i: number) => (
                <div key={i} className="text-sm text-gray-700 font-medium py-1.5 border-b border-gray-50 last:border-0">
                  {d}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Changelog</h4>
            <div className="space-y-4">
              {asset.changelog.map((c: any, i: number) => (
                <div key={i} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-sky-50 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-600">
                      {c.ver}
                    </span>
                    <span className="text-xs text-gray-400">{c.date}</span>
                  </div>
                  <div className="text-sm text-gray-600">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {relatedAssets.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">More in {fm.name}</h4>
              <div className="flex flex-col">
                {relatedAssets.map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => navigate(catalogAssetPath(r))}
                    className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 -mx-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: fm.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900 group-hover:text-sky-600 transition-colors">{r.name}</div>
                      <div className="text-[10px] font-mono text-gray-500">{r.displayId ?? r.id}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
