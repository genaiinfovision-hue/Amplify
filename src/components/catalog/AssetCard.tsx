import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { defaultFamilyBadge, useFamilies } from '../../context/FamiliesContext';
import { CC, CL, MC, ML, EC } from '../../data/uiConstants';
import { catalogAssetPath } from '../../lib/catalogSlug';
import { CheckCircle2 } from 'lucide-react';

interface AssetCardProps {
  asset: any;
  index: number;
}

export function AssetCard({ asset, index }: AssetCardProps) {
  const navigate = useNavigate();
  const { families } = useFamilies();
  const fm = families[asset.family] ?? defaultFamilyBadge();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
      onClick={() => navigate(catalogAssetPath(asset))}
      className="relative z-10 flex cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300"
      style={{ borderTop: `3px solid ${fm.color}` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-medium text-gray-500">
            {asset.displayId ?? asset.id}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: fm.color }}>
            {fm.name}
          </span>
        </div>
        <div className="flex gap-1.5">
          {asset.clouds.map((c: string) => (
            <span
              key={c}
              className="rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{ backgroundColor: `${CC[c]}15`, color: CC[c] }}
            >
              {CL[c]}
            </span>
          ))}
        </div>
      </div>

      <h3 className="mb-2 text-sm font-semibold leading-snug text-gray-900">
        {asset.name}
      </h3>
      
      <p className="mb-4 flex-1 text-xs leading-relaxed text-gray-500 line-clamp-3">
        {asset.desc}
      </p>
      
      <div className="mt-auto">
        <div className="mb-3 text-[11px] font-medium" style={{ color: fm.color }}>
          {asset.solution}
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold bg-gray-50 ${EC[asset.effort]}`}>
              {asset.effort.charAt(0).toUpperCase() + asset.effort.slice(1)} Effort
            </span>
            {asset.demoReady && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Demo
              </span>
            )}
          </div>
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold bg-gray-50 ${MC[asset.maturity]}`}>
            {ML[asset.maturity]}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
