import type { Catalog } from '@/lib/catalog';

export const researchStatuses = [
  'RESEARCH_LEAD',
  'NEEDS_TEST',
  'TESTING',
  'PARTIAL',
  'SUPPORTED',
  'CONFLICTING',
  'NOT_REPRODUCED',
  'REJECTED',
  'CURRENT_BUILD_VERIFIED',
] as const;

export type ResearchStatus = (typeof researchStatuses)[number];
export type ResearchPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

const gapMetrics = [
  'Body STK',
  'Direct damage',
  'RPM',
  'Archived TTK',
  'Reload',
  'Magazine',
  'Semi/full-auto data',
  'Ballistics',
  'Recoil',
  'Stealth',
  'Penetration',
  'Vehicle behavior',
  'Upgrade scaling',
  'Performance provenance',
] as const;

type GapMetric = (typeof gapMetrics)[number];
export type ResearchGapRow = {
  weaponId: string;
  weaponName: string;
  category: string;
  missing: GapMetric[];
  experimentIds: string[];
};

function numeric(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value);
}

function recorded(value: unknown) {
  return numeric(value) ||
    (typeof value === 'string' &&
      value.trim() !== '' &&
      !['-', 'N/A', '???', '#VALUE!'].includes(value.trim()));
}

export function buildResearchGapReport(catalog: Catalog) {
  const rows: ResearchGapRow[] = catalog.weapons.map((weapon) => {
    const stats = catalog.weaponSheetStats.find((entry) => entry.weaponId === weapon.id);
    const profile = catalog.damageProfiles.find((entry) => entry.weaponId === weapon.id);
    const configs = stats?.configurations ?? [];
    const hasBodyStk = configs.some((config) =>
      [config.tierOne, config.nonTier].some((tier) =>
        [tier.semiAuto.body, tier.fullAuto.body].some(numeric),
      ),
    );
    const hasDamage = Object.values(profile?.damageByBarrel ?? {}).some(recorded);
    const hasRpm = configs.some((config) => numeric(config.rpm) || (typeof config.rpm === 'string' && /^\s*\d+(?:\.\d+)?(?:\s|$)/.test(config.rpm))) ||
      numeric(profile?.rpm) ||
      (typeof profile?.rpm === 'string' && /^\s*\d+(?:\.\d+)?(?:\s|$)/.test(profile.rpm));
    const hasArchivedTtk = configs.some((config) =>
      [config.timeToKill.tierOne, config.timeToKill.nonTier].some(recorded),
    );
    const hasReload = configs.some((config) => numeric(config.reloadSeconds));
    const hasMagazine = configs.some((config) =>
      Object.values(config.magazine).some(numeric),
    );
    const hasBothModesInSameTierAndConfig = configs.some((config) =>
      [config.tierOne, config.nonTier].some(
        (tier) => numeric(tier.semiAuto.body) && numeric(tier.fullAuto.body),
      ) ||
      (recorded(config.tierOneDamage.semiAuto) &&
        recorded(config.tierOneDamage.fullAuto)),
    );
    const hasPerformanceProvenance = configs.some(
      (config) => Boolean(config.sourceLocator) && Boolean(stats?.sourceIds.length),
    ) || Boolean(
      profile &&
        'sourceIds' in profile &&
        profile.sourceLocator &&
        Array.isArray(profile.sourceIds) &&
        profile.sourceIds.length > 0,
    );
    const missing: GapMetric[] = [];
    if (!hasBodyStk) missing.push('Body STK');
    if (!hasDamage) missing.push('Direct damage');
    if (!hasRpm) missing.push('RPM');
    if (!hasArchivedTtk) missing.push('Archived TTK');
    if (!hasReload) missing.push('Reload');
    if (!hasMagazine) missing.push('Magazine');
    if (!hasBothModesInSameTierAndConfig) missing.push('Semi/full-auto data');
    // These dimensions do not yet have structured measurement fields in catalog v1.
    missing.push('Ballistics', 'Recoil', 'Stealth', 'Penetration', 'Vehicle behavior', 'Upgrade scaling');
    if (!hasPerformanceProvenance) missing.push('Performance provenance');
    return {
      weaponId: weapon.id,
      weaponName: weapon.name,
      category: weapon.category,
      missing,
      experimentIds: catalog.experiments
        .filter((experiment) => experiment.weaponIds.includes(weapon.id))
        .map((experiment) => experiment.id),
    };
  });

  return {
    rows,
    metricSummary: gapMetrics.map((metric) => ({
      metric,
      weaponsMissing: rows.filter((row) => row.missing.includes(metric)).length,
    })),
    generatedFromRelease: catalog.release,
  };
}
