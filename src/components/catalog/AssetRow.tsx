import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { defaultFamilyBadge, useFamilies } from '../../context/FamiliesContext';
import { CC, CL, MC, ML } from '../../data/uiConstants';
import { catalogAssetPath } from '../../lib/catalogSlug';
import { ArrowRight } from 'lucide-react';

interface AssetRowProps {
  asset: any;
  index: number;
}

export function AssetRow({ asset, index }: AssetRowProps) {
  const navigate = useNavigate();
  const { families } = useFamilies();
  const fm = families[asset.family] ?? defaultFamilyBadge();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ x: 4, backgroundColor: '#FAFBFC' }}
      onClick={() => navigate(catalogAssetPath(asset))}
      className="group flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm transition-all hover:shadow-md"
      style={{ borderLeft: `4px solid ${fm.color}` }}
    >
      <span className="min-w-[60px] rounded bg-gray-50 px-2 py-1 font-mono text-[10px] font-medium text-gray-500">
        {asset.displayId ?? asset.id}
      </span>
      
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold text-gray-900">{asset.name}</div>
        <div className="truncate text-xs text-gray-500 mt-0.5">{asset.desc}</div>
      </div>
      
      <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider" style={{ color: fm.color }}>
        {fm.name}
      </span>
      
      <div className="flex gap-1.5 w-24 justify-end">
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
      
      <span className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold bg-gray-50 w-24 text-center ${MC[asset.maturity]}`}>
        {ML[asset.maturity]}
      </span>
      
      <div className="w-5 flex justify-center">
        {asset.demoReady && (
          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Demo Ready" />
        )}
      </div>
      
      <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" />
    </motion.div>
  );
}
