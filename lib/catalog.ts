import seed from '@/data/catalog.json';
export type Catalog = typeof seed;
export type Weapon = Catalog['weapons'][number];
export type Measurement = Catalog['measurements'][number];
export type CatalogResult = {
  catalog: Catalog;
  storage: 'snapshot' | 'postgres';
  error?: string;
};
export function filterWeapons(
  catalog: Catalog,
  query: string,
  category: string,
  province: string,
  measuredOnly: boolean,
) {
  const normalized = query.trim().toLowerCase();
  return catalog.weapons
    .filter(
      (w) =>
        (!normalized ||
          [w.name, ...w.aliases, w.province]
            .join(' ')
            .toLowerCase()
            .includes(normalized)) &&
        (category === 'All classes' || category === w.category) &&
        (province === 'All provinces' || province === w.province) &&
        (!measuredOnly ||
          catalog.measurements.some((m) => m.weaponId === w.id)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}
export function findMeasurement(
  catalog: Catalog,
  weaponId: string,
  attachmentId: string,
  mode: string,
) {
  return catalog.measurements.find(
    (m) =>
      m.weaponId === weaponId &&
      m.attachmentId === attachmentId &&
      m.mode === mode,
  );
}
