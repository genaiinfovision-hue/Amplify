import type { CatalogAsset } from './catalog';

export function slugifyAssetName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function assignCatalogSlugs(assets: CatalogAsset[]): CatalogAsset[] {
  const baseSlugs = assets.map(
    (asset) => slugifyAssetName(asset.name) || slugifyAssetName(asset.displayId ?? asset.id),
  );

  const duplicateBases = new Set(
    baseSlugs.filter((slug, index) => baseSlugs.indexOf(slug) !== index),
  );

  return assets.map((asset, index) => {
    let slug = baseSlugs[index];
    if (duplicateBases.has(slug)) {
      slug = `${slug}-${slugifyAssetName(asset.displayId ?? asset.id)}`;
    }
    return { ...asset, slug };
  });
}

export function catalogAssetPath(asset: Pick<CatalogAsset, 'slug'>): string {
  return `/catalog/${asset.slug}`;
}

export function catalogDemoPath(asset: Pick<CatalogAsset, 'slug'>): string {
  return `/catalog/${asset.slug}/demo`;
}
