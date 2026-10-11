'use client';

import { type CSSProperties, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Crosshair,
  Search,
  Info,
  ArrowUpRight,
  Layers,
  Map as MapIcon,
  BookOpen,
  Shirt,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Activity,
  ArrowUpDown,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import {
  filterWeapons,
  findMeasurement,
  type Catalog,
  type CatalogResult,
  type RealWorldWeapon,
  type WeaponExperiment,
  type WeaponDamageProfile,
  type Weapon,
  type WeaponSheetStats,
  type DamageWorkbook,
  type DamageWorkbookResult,
} from '@/lib/catalog';
import { buildResearchGapReport, researchStatuses } from '@/lib/research';

function columnName(column: number) {
  let value = column;
  let name = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

type LabSortKey =
  | 'weapon'
  | 'category'
  | 'barrel'
  | 'damage'
  | 'dps'
  | 'rpm'
  | 'rps'
  | 'interval'
  | 'tierHead'
  | 'tierBody'
  | 'nonTierHead'
  | 'nonTierBody'
  | 'tierTtk'
  | 'nonTierTtk'
  | 'tierIdealTtk'
  | 'nonTierIdealTtk'
  | 'tierFullAutoIdealTtk'
  | 'nonTierFullAutoIdealTtk'
  | 'tierFullAutoTtkDelta'
  | 'nonTierFullAutoTtkDelta'
  | 'reload'
  | 'magStandard'
  | 'magExtended'
  | 'magLarge'
  | 'aimDelay'
  | 'aimSensitivity'
  | 'tierDamageSemi'
  | 'tierDamageFull';

type WeaponSortKey =
  | 'name'
  | 'ttk'
  | 'idealTtk'
  | 'damage'
  | 'reload'
  | 'magazine';

const sourceContributions: Record<string, string> = {
  locations: 'Province and weapon-location cross-checks',
  'weapon-cases': 'Audited 51-case Bolivia weapon inventory',
  'province-map': 'Selected province and case-location cross-checks',
  prima: 'Unlock routes and weapon-case cross-checks',
  damage: 'Hit counts, RPM, reload, magazines, damage, and DPS workbook data',
  'damage-method': 'Testing-method context and historical caveats',
  'darkdally-steam': 'Attribution trail for Darkdally’s scale-testing work',
  'siim-numeric-data':
    'Independent APC damage tests, detection distances, and ballistic ranking',
  'attachments-2026': 'Attachment behavior and current community retesting',
  'ghostrecon-wiki':
    'Weapon identities, classes, variants, and appearance context',
  'imfdb-wildlands': 'Real-world firearm identity and naming cross-checks',
  'prima-official-pdf': 'Archival guide and weapon-stat comparison lead',
  missions: 'Mission names, provinces, and campaign indexing',
  bulletdrop: 'Ballistics and bullet-drop research lead',
  'last-rites': 'Official confirmation of current Wildlands content changes',
  engine: 'Potential game-data extraction research',
};

type WeaponEffectProfile = {
  vehicleRating: string;
  vehicleNote: string;
  areaRating: string;
  areaNote: string;
  sourceIds: string[];
};

const weaponEffectProfiles: Record<string, WeaponEffectProfile> = {
  hti: {
    vehicleRating: 'Very high',
    vehicleNote:
      'Historical tests report exceptional anti-vehicle performance. Vehicle Damage skills, suppressor state, and hit placement can change the result.',
    areaRating: 'Not confirmed',
    areaNote:
      'No blast-radius measurement is recorded. Treat it as anti-materiel impact, not a grenade.',
    sourceIds: ['siim-numeric-data', 'darkdally-steam'],
  },
  'desert-tech-hti-bdc': {
    vehicleRating: 'Exceptional',
    vehicleNote:
      'Community tests report one-shot vehicle and helicopter kills in applicable setups. This behavior is separate from infantry damage.',
    areaRating: 'Explosive-like impact',
    areaNote:
      'References describe seemingly explosive rounds, but no measured area-of-effect radius is established.',
    sourceIds: ['ghostrecon-wiki', 'siim-numeric-data', 'darkdally-steam'],
  },
};

function sourceContribution(source: Catalog['sources'][number]) {
  return (
    sourceContributions[source.id] ??
    (source.kind === 'research_lead'
      ? 'Research lead; no values imported yet'
      : 'Reference and factual cross-check')
  );
}

type OperatorPreset = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  categories: string[];
  sort: Exclude<WeaponSortKey, 'name'>;
  direction: 'asc' | 'desc';
};

const operatorPresets: OperatorPreset[] = [
  {
    id: 'all',
    label: 'All weapons',
    shortLabel: 'All',
    description: 'Keep the whole armory in play.',
    categories: [],
    sort: 'ttk',
    direction: 'asc',
  },
  {
    id: 'silent',
    label: 'Silent precision',
    shortLabel: 'Silent',
    description: 'Prioritize high damage for deliberate shots.',
    categories: ['Sniper rifle'],
    sort: 'damage',
    direction: 'desc',
  },
  {
    id: 'assault',
    label: 'Assault / general purpose',
    shortLabel: 'Assault',
    description: 'Lowest recorded body-hit count among rifles.',
    categories: ['Assault rifle'],
    sort: 'ttk',
    direction: 'asc',
  },
  {
    id: 'close',
    label: 'Close quarters',
    shortLabel: 'CQB',
    description: 'Fast reloads across SMGs, shotguns and machine pistols.',
    categories: ['Submachine gun', 'Shotgun', 'Compact machine gun'],
    sort: 'reload',
    direction: 'asc',
  },
  {
    id: 'sustain',
    label: 'Sustained fire',
    shortLabel: 'Sustain',
    description: 'Largest recorded magazines for a long contact.',
    categories: ['Light machine gun'],
    sort: 'magazine',
    direction: 'desc',
  },
];

const weaponSortOptions: { value: WeaponSortKey; label: string }[] = [
  { value: 'ttk', label: 'Fewest body shots' },
  { value: 'idealTtk', label: 'Calculated ideal body TTK' },
  { value: 'damage', label: 'Infantry damage' },
  { value: 'reload', label: 'Reload time' },
  { value: 'magazine', label: 'Magazine capacity' },
  { value: 'name', label: 'Weapon name' },
];

type LabRow = {
  id: string;
  weaponId: string;
  weapon: string;
  category: string;
  barrel: string;
  damage: string | number | null;
  dps: string | number | null;
  rpm: string | number | null;
  rps: string | number | null;
  interval: string | number | null;
  tierHead: string | number | null;
  tierBody: string | number | null;
  nonTierHead: string | number | null;
  nonTierBody: string | number | null;
  tierTtk: string | number | null;
  nonTierTtk: string | number | null;
  tierIdealTtk: number | null;
  nonTierIdealTtk: number | null;
  tierFullAutoIdealTtk: number | null;
  nonTierFullAutoIdealTtk: number | null;
  tierFullAutoTtkDelta: number | null;
  nonTierFullAutoTtkDelta: number | null;
  reload: string | number | null;
  magStandard: string | number | null;
  magExtended: string | number | null;
  magLarge: string | number | null;
  aimDelay: string | number | null;
  aimSensitivity: string | number | null;
  tierDamageSemi: string | number | null;
  tierDamageFull: string | number | null;
  sourceLocator: string;
};

type WeaponDecisionRow = {
  weapon: Weapon;
  ttk: string | number | null;
  idealTtk: number | null;
  damage: string | number | null;
  rpm: string | number | null;
  dps: string | number | null;
  reload: string | number | null;
  magazine: string | number | null;
};

type HitModeStats = {
  semiAuto: { body: string | number | null };
  fullAuto: { body: string | number | null };
};

function numericRpm(value: string | number | null | undefined) {
  if (typeof value === 'number')
    return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d+(?:\.\d+)?)(?:\s|$)/);
  if (!match) return null;
  const rpm = Number(match[1]);
  return Number.isFinite(rpm) && rpm > 0 ? rpm : null;
}

function calculatedIdealBodyTtk(
  bodyHits: string | number | null | undefined,
  rpmValue: string | number | null | undefined,
) {
  const rpm = numericRpm(rpmValue);
  if (
    typeof bodyHits !== 'number' ||
    !Number.isInteger(bodyHits) ||
    bodyHits < 1 ||
    rpm === null
  )
    return null;
  return ((bodyHits - 1) * 60) / rpm;
}

function formatSeconds(value: number | null) {
  return value === null ? 'Not recorded' : `${value.toFixed(3)} s`;
}

function numericSeconds(value: string | number | null) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !/^\s*\d+(?:\.\d+)?(?:\s|$)/.test(value))
    return null;
  const seconds = Number.parseFloat(value);
  return Number.isFinite(seconds) ? seconds : null;
}

function archiveIdealTtkDelta(
  archivedValue: string | number | null,
  idealValue: number | null,
) {
  const archivedSeconds = numericSeconds(archivedValue);
  return archivedSeconds === null || idealValue === null
    ? null
    : archivedSeconds - idealValue;
}

type DerivedBand = {
  minimum: number;
  maximum: number | null;
  label: string;
};

function bodyHitsForMode(stats: HitModeStats | undefined) {
  const semiAutoBody = stats?.semiAuto.body;
  return semiAutoBody !== null &&
    semiAutoBody !== undefined &&
    semiAutoBody !== 'N/A' &&
    semiAutoBody !== '-'
    ? semiAutoBody
    : (stats?.fullAuto.body ?? null);
}

function derivedDamageBand(
  bodyHits: string | number | null,
): DerivedBand | null {
  if (
    typeof bodyHits !== 'number' ||
    !Number.isInteger(bodyHits) ||
    bodyHits < 1
  )
    return null;

  const minimum = Math.ceil(1000 / bodyHits);
  if (bodyHits === 1) return { minimum, maximum: null, label: `≥${minimum}*` };

  const maximum = Math.ceil(1000 / (bodyHits - 1)) - 1;
  return {
    minimum,
    maximum,
    label: `${minimum}–${maximum}*`,
  };
}

function derivedDpsBand(
  damageBand: DerivedBand | null,
  rpm: string | number | null,
) {
  if (!damageBand || typeof rpm !== 'number') return null;
  const minimum = Math.round((damageBand.minimum * rpm) / 60);
  if (damageBand.maximum === null) return `≥${minimum}*`;
  const maximum = Math.round((damageBand.maximum * rpm) / 60);
  return `${minimum}–${maximum}*`;
}

function sortableValue(value: string | number | null) {
  if (value === null || value === '-' || value === 'N/A') return null;
  if (typeof value === 'number') return value;
  if (value.toLowerCase().includes('one-hit')) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? value.toLowerCase() : parsed;
}

function compareLabValues(
  a: string | number | null,
  b: string | number | null,
) {
  const left = sortableValue(a);
  const right = sortableValue(b);
  if (left === null) return right === null ? 0 : 1;
  if (right === null) return -1;
  if (typeof left === 'number' && typeof right === 'number')
    return left - right;
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
  });
}

function labShownValue(value: string | number | null) {
  return value === null ? '—' : shownValue(value);
}

function labShownSeconds(value: number | null) {
  return value === null ? '—' : value.toFixed(3);
}

function SortableLabHead({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
  rowSpan,
}: {
  label: string;
  sortKey: LabSortKey;
  activeKey: LabSortKey;
  direction: 'asc' | 'desc';
  onSort: (key: LabSortKey) => void;
  className?: string;
  rowSpan?: number;
}) {
  const active = activeKey === sortKey;
  return (
    <th
      className={className}
      rowSpan={rowSpan}
      aria-sort={
        active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      <button className="lab-sort" onClick={() => onSort(sortKey)}>
        {label}
        <ArrowUpDown aria-hidden="true" />
        {active && (
          <span className="sort-direction">
            {direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </button>
    </th>
  );
}

function DamageLab({
  catalog,
  workbook,
  loading,
  error,
}: {
  catalog: Catalog;
  workbook: DamageWorkbook | null;
  loading: boolean;
  error: boolean;
}) {
  const [view, setView] = useState<'analysis' | 'source'>('analysis');
  const [category, setCategory] = useState('All classes');
  const [barrelFilter, setBarrelFilter] = useState('All barrels');
  const [sortKey, setSortKey] = useState<LabSortKey>('weapon');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState('Sniper Rifles');
  const [query, setQuery] = useState('');
  const [sourceQuery, setSourceQuery] = useState('');
  const [page, setPage] = useState(0);
  const [showFormulas, setShowFormulas] = useState(false);
  const sheet =
    workbook?.sheets.find((item) => item.name === sheetName) ??
    workbook?.sheets[0];
  const rows = (sheet?.rows ?? []).filter((row) => {
    if (!sourceQuery.trim()) return true;
    const target = sourceQuery.toLowerCase();
    return row.cells.some((cell) =>
      `${cell.value ?? ''} ${cell.formula ?? ''}`
        .toLowerCase()
        .includes(target),
    );
  });
  const pageSize = 80;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice(page * pageSize, (page + 1) * pageSize);
  const labRows: LabRow[] = catalog.weaponSheetStats.flatMap((stats) => {
    const weapon = catalog.weapons.find((item) => item.id === stats.weaponId);
    const profile = catalog.damageProfiles.find(
      (item) => item.weaponId === stats.weaponId,
    );
    if (!weapon) return [];
    return stats.configurations.map((configuration) => {
      const barrelKey = configuration.barrel.toLowerCase().split(' ')[0] as
        | 'short'
        | 'standard'
        | 'long';
      return {
        id: `${weapon.id}-${configuration.barrel}`,
        weaponId: weapon.id,
        weapon: weapon.name,
        category: weapon.category,
        barrel: configuration.barrel.replace(' Barrel', ''),
        damage: profile?.damageByBarrel[barrelKey] ?? null,
        dps: profile?.dpsByBarrel[barrelKey] ?? null,
        rpm: configuration.rpm,
        rps: configuration.roundsPerSecond,
        interval: configuration.shotIntervalSeconds,
        tierHead: configuration.tierOne.semiAuto.head,
        tierBody: configuration.tierOne.semiAuto.body,
        nonTierHead: configuration.nonTier.semiAuto.head,
        nonTierBody: configuration.nonTier.semiAuto.body,
        tierTtk: configuration.timeToKill.tierOne,
        nonTierTtk: configuration.timeToKill.nonTier,
        tierIdealTtk: calculatedIdealBodyTtk(
          configuration.tierOne.semiAuto.body,
          configuration.rpm,
        ),
        nonTierIdealTtk: calculatedIdealBodyTtk(
          configuration.nonTier.semiAuto.body,
          configuration.rpm,
        ),
        tierFullAutoIdealTtk: calculatedIdealBodyTtk(
          configuration.tierOne.fullAuto.body,
          configuration.rpm,
        ),
        nonTierFullAutoIdealTtk: calculatedIdealBodyTtk(
          configuration.nonTier.fullAuto.body,
          configuration.rpm,
        ),
        tierFullAutoTtkDelta: archiveIdealTtkDelta(
          configuration.timeToKill.tierOne,
          calculatedIdealBodyTtk(
            configuration.tierOne.fullAuto.body,
            configuration.rpm,
          ),
        ),
        nonTierFullAutoTtkDelta: archiveIdealTtkDelta(
          configuration.timeToKill.nonTier,
          calculatedIdealBodyTtk(
            configuration.nonTier.fullAuto.body,
            configuration.rpm,
          ),
        ),
        reload: configuration.reloadSeconds,
        magStandard: configuration.magazine.standard,
        magExtended: configuration.magazine.extended,
        magLarge: configuration.magazine.large,
        aimDelay: configuration.aimDelay,
        aimSensitivity: configuration.aimSensitivity,
        tierDamageSemi: configuration.tierOneDamage.semiAuto,
        tierDamageFull: configuration.tierOneDamage.fullAuto,
        sourceLocator: configuration.sourceLocator,
      };
    });
  });
  const normalizedQuery = query.trim().toLowerCase();
  const analysisRows = labRows
    .filter(
      (row) =>
        (!normalizedQuery ||
          `${row.weapon} ${row.category} ${row.barrel}`
            .toLowerCase()
            .includes(normalizedQuery)) &&
        (category === 'All classes' || row.category === category) &&
        (barrelFilter === 'All barrels' || row.barrel === barrelFilter),
    )
    .sort((a, b) => {
      const left = sortableValue(a[sortKey]);
      const right = sortableValue(b[sortKey]);
      if (left === null) return right === null ? 0 : 1;
      if (right === null) return -1;
      const result = compareLabValues(a[sortKey], b[sortKey]);
      return sortDirection === 'asc' ? result : -result;
    });
  const selectedLabRow = labRows.find((row) => row.id === selectedRow);
  const selectedWeapon = selectedLabRow
    ? catalog.weapons.find((weapon) => weapon.id === selectedLabRow.weaponId)
    : undefined;
  const selectedStats = selectedLabRow
    ? catalog.weaponSheetStats.find(
        (entry) => entry.weaponId === selectedLabRow.weaponId,
      )
    : undefined;
  const selectedProfile = selectedLabRow
    ? catalog.damageProfiles.find(
        (entry) => entry.weaponId === selectedLabRow.weaponId,
      )
    : undefined;

  function updateSort(key: LabSortKey) {
    if (key === sortKey)
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  function clearAnalysisFilters() {
    setQuery('');
    setCategory('All classes');
    setBarrelFilter('All barrels');
  }

  return (
    <section className="damage-lab" aria-label="Damage Lab workbook browser">
      <div className="damage-hero">
        <div className="damage-hero-copy">
          <span className="eyebrow">
            <Activity size={14} /> FIELD INTELLIGENCE / ARCHIVE 01
          </span>
          <h1>The Damage Lab</h1>
          <p>
            Compare every normalized weapon metric in one sortable workspace,
            then inspect the preserved source workbook when you need the
            original evidence.
          </p>
        </div>
        <div className="damage-hero-mark" aria-hidden="true">
          <Crosshair />
          <span>WLD / 01</span>
        </div>
        <div className="damage-stats">
          <div>
            <strong>{catalog.weaponSheetStats.length}</strong>
            <span>measured weapons</span>
          </div>
          <div>
            <strong>{labRows.length}</strong>
            <span>tested configurations</span>
          </div>
          <div>
            <strong>{catalog.damageProfiles.length}</strong>
            <span>damage profiles</span>
          </div>
          <div>
            <strong>{workbook?.sheetCount ?? 11}</strong>
            <span>preserved source sheets</span>
          </div>
        </div>
      </div>
      <Note>
        <strong>Enemy health reference:</strong> the workbook uses 1,000 HP for
        Unidad Heavy and 760 HP for SB Regular enemies. Its hit-count bands are
        derived from those baselines; they are test context, not weapon stats.
      </Note>
      <Note>
        <strong>TTK columns:</strong> archived TTK preserves the workbook value.
        Ideal semi-auto and full-auto TTK are calculated separately from their
        matching body-hit columns using (STK − 1) × 60 ÷ recorded RPM. Each
        assumes consecutive body hits, with the first shot at time zero. Missing
        STK or RPM stays blank. Full-auto archive-minus-ideal deltas appear only
        when all matching inputs are numeric; they compare historical source
        values and do not establish current-build measured TTK.
      </Note>

      <fieldset className="lab-view-switch">
        <legend className="sr-only">Damage Lab view</legend>
        <button
          className={view === 'analysis' ? 'active' : ''}
          onClick={() => setView('analysis')}
        >
          Weapon analysis
        </button>
        <button
          className={view === 'source' ? 'active' : ''}
          onClick={() => setView('source')}
        >
          Source workbook
        </button>
      </fieldset>

      {view === 'analysis' && (
        <>
          <div className="lab-analysis-toolbar">
            <div className="field search">
              <label htmlFor="lab-search">Weapon or class</label>
              <div className="searchbox">
                <Search aria-hidden="true" />
                <Input
                  id="lab-search"
                  placeholder="Search M4A1, sniper rifle…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>
            <Picker
              label="Weapon class"
              value={category}
              options={[
                'All classes',
                ...new Set(labRows.map((row) => row.category)),
              ]}
              onChange={setCategory}
            />
            <Picker
              label="Barrel"
              value={barrelFilter}
              options={['All barrels', 'Short', 'Standard', 'Long']}
              onChange={setBarrelFilter}
            />
            <button
              className="text-button lab-clear"
              onClick={clearAnalysisFilters}
            >
              Clear filters
            </button>
          </div>
          <div className="lab-resultsline">
            <span>
              <strong>{analysisRows.length}</strong> configurations · click any
              heading to sort
            </span>
            <span>— means unavailable in the source</span>
          </div>
          <div className="lab-table-frame">
            <table className="lab-table">
              <thead>
                <tr>
                  <SortableLabHead
                    label="Weapon"
                    sortKey="weapon"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    className="lab-sticky-weapon"
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="Class"
                    sortKey="category"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    className="lab-sticky-class"
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="Barrel"
                    sortKey="barrel"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="Damage"
                    sortKey="damage"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="DPS"
                    sortKey="dps"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="RPM"
                    sortKey="rpm"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="RPS"
                    sortKey="rps"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="Interval · s"
                    sortKey="interval"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <th colSpan={2} className="lab-group">
                    Tier One · hits
                  </th>
                  <th colSpan={2} className="lab-group">
                    Non-tier · hits
                  </th>
                  <SortableLabHead
                    label="T1 archived full-auto TTK · s"
                    sortKey="tierTtk"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="NT archived full-auto TTK · s"
                    sortKey="nonTierTtk"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="T1 ideal semi TTK · s"
                    sortKey="tierIdealTtk"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="NT ideal semi TTK · s"
                    sortKey="nonTierIdealTtk"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="T1 ideal full-auto TTK · s"
                    sortKey="tierFullAutoIdealTtk"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="NT ideal full-auto TTK · s"
                    sortKey="nonTierFullAutoIdealTtk"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="T1 full-auto archive − ideal · s"
                    sortKey="tierFullAutoTtkDelta"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="NT full-auto archive − ideal · s"
                    sortKey="nonTierFullAutoTtkDelta"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="Reload · s"
                    sortKey="reload"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="Std mag"
                    sortKey="magStandard"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="Ext mag"
                    sortKey="magExtended"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="Large mag"
                    sortKey="magLarge"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="Aim delay"
                    sortKey="aimDelay"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="Aim sensitivity"
                    sortKey="aimSensitivity"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="T1 dmg · semi"
                    sortKey="tierDamageSemi"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                  <SortableLabHead
                    label="T1 dmg · full"
                    sortKey="tierDamageFull"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                    rowSpan={2}
                  />
                </tr>
                <tr className="lab-subheads">
                  <SortableLabHead
                    label="Head"
                    sortKey="tierHead"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                  />
                  <SortableLabHead
                    label="Body"
                    sortKey="tierBody"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                  />
                  <SortableLabHead
                    label="Head"
                    sortKey="nonTierHead"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                  />
                  <SortableLabHead
                    label="Body"
                    sortKey="nonTierBody"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={updateSort}
                  />
                </tr>
              </thead>
              <tbody>
                {analysisRows.map((row) => (
                  <tr
                    key={row.id}
                    data-selected={row.id === selectedRow}
                    onClick={() =>
                      setSelectedRow(row.id === selectedRow ? null : row.id)
                    }
                  >
                    <th className="lab-sticky-weapon">
                      <button>{row.weapon}</button>
                      <small>{row.sourceLocator}</small>
                    </th>
                    <td className="lab-sticky-class">{row.category}</td>
                    <td>{row.barrel}</td>
                    <td className="lab-primary-metric">
                      {labShownValue(row.damage)}
                    </td>
                    <td>{labShownValue(row.dps)}</td>
                    <td>{labShownValue(row.rpm)}</td>
                    <td>{labShownValue(row.rps)}</td>
                    <td>{labShownValue(row.interval)}</td>
                    <td>{labShownValue(row.tierHead)}</td>
                    <td>{labShownValue(row.tierBody)}</td>
                    <td>{labShownValue(row.nonTierHead)}</td>
                    <td>{labShownValue(row.nonTierBody)}</td>
                    <td>{labShownValue(row.tierTtk)}</td>
                    <td>{labShownValue(row.nonTierTtk)}</td>
                    <td>{labShownSeconds(row.tierIdealTtk)}</td>
                    <td>{labShownSeconds(row.nonTierIdealTtk)}</td>
                    <td>{labShownSeconds(row.tierFullAutoIdealTtk)}</td>
                    <td>{labShownSeconds(row.nonTierFullAutoIdealTtk)}</td>
                    <td>{labShownSeconds(row.tierFullAutoTtkDelta)}</td>
                    <td>{labShownSeconds(row.nonTierFullAutoTtkDelta)}</td>
                    <td>{labShownValue(row.reload)}</td>
                    <td>{labShownValue(row.magStandard)}</td>
                    <td>{labShownValue(row.magExtended)}</td>
                    <td>{labShownValue(row.magLarge)}</td>
                    <td>{labShownValue(row.aimDelay)}</td>
                    <td>{labShownValue(row.aimSensitivity)}</td>
                    <td>{labShownValue(row.tierDamageSemi)}</td>
                    <td>{labShownValue(row.tierDamageFull)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!analysisRows.length && (
              <div className="damage-empty">
                No weapon configurations match these filters.
              </div>
            )}
          </div>
          {selectedWeapon && selectedStats && (
            <div className="lab-selection">
              <div className="dossier-heading">
                <div>
                  <span className="eyebrow">
                    SELECTED WEAPON / COMPLETE RECORD
                  </span>
                  <h2>{selectedWeapon.name}</h2>
                  <p className="muted">
                    {selectedWeapon.category} · {selectedWeapon.province} ·{' '}
                    {selectedWeapon.acquisition}
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setSelectedRow(null)}
                >
                  Close details
                </button>
              </div>
              <WeaponSheetPanel
                key={selectedLabRow?.id}
                stats={selectedStats}
                profile={selectedProfile}
              />
            </div>
          )}
        </>
      )}

      {view === 'source' && loading && (
        <div className="damage-status">Loading the workbook archive…</div>
      )}
      {view === 'source' && error && (
        <Note>
          The damage archive could not be loaded from storage. Reload or try
          again when the database is available.
        </Note>
      )}
      {view === 'source' && workbook && sheet && (
        <>
          <div className="damage-toolbar">
            <div className="damage-sheet-heading">
              <span className="eyebrow">PRESERVED WORKSHEET</span>
              <strong>{sheet.name}</strong>
              <span className="muted small">
                {sheet.rows.length.toLocaleString()} populated rows ·{' '}
                {sheet.columnCount} columns
              </span>
            </div>
            <div className="damage-controls">
              <div className="searchbox damage-search">
                <Search aria-hidden="true" />
                <Input
                  aria-label="Search this worksheet"
                  placeholder="Search cells…"
                  value={sourceQuery}
                  onChange={(event) => {
                    setSourceQuery(event.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <label
                className="checklabel formula-toggle"
                htmlFor="show-formulas"
              >
                <Checkbox
                  id="show-formulas"
                  checked={showFormulas}
                  onCheckedChange={(checked) =>
                    setShowFormulas(checked === true)
                  }
                />
                Show formulas
              </label>
            </div>
          </div>
          <nav className="damage-sheet-nav" aria-label="Workbook worksheets">
            {workbook.sheets.map((item, index) => (
              <button
                key={item.name}
                className={
                  item.name === sheet.name
                    ? 'damage-sheet-button active'
                    : 'damage-sheet-button'
                }
                onClick={() => {
                  setSheetName(item.name);
                  setPage(0);
                }}
                aria-current={item.name === sheet.name ? 'page' : undefined}
              >
                <span className="mono">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item.name}
              </button>
            ))}
          </nav>
          <div className="damage-grid-frame">
            <table className="damage-grid">
              <thead>
                <tr>
                  <th className="row-number">ROW</th>
                  {Array.from({ length: sheet.columnCount }, (_, index) => (
                    <th key={index}>{columnName(index + 1)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const cells = new Map(
                    row.cells.map((cell) => [cell.column, cell]),
                  );
                  return (
                    <tr key={row.number}>
                      <th className="row-number">{row.number}</th>
                      {Array.from({ length: sheet.columnCount }, (_, index) => {
                        const cell = cells.get(index + 1);
                        const value =
                          cell?.formula && showFormulas
                            ? cell.formula
                            : cell?.value;
                        return (
                          <td
                            key={index}
                            title={
                              cell?.formula
                                ? `Formula: ${cell.formula}`
                                : undefined
                            }
                            data-formula={Boolean(cell?.formula)}
                          >
                            {value === null || value === undefined
                              ? ''
                              : typeof value === 'boolean'
                                ? value
                                  ? 'TRUE'
                                  : 'FALSE'
                                : String(value)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {!visibleRows.length && (
                  <tr>
                    <td
                      className="damage-empty"
                      colSpan={sheet.columnCount + 1}
                    >
                      No cells match “{sourceQuery}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="damage-grid-footer">
            <span>
              {rows.length.toLocaleString()} rows{' '}
              {sourceQuery ? 'matching search' : 'in sheet'} ·{' '}
              {workbook.sourceFile}
            </span>
            <div className="damage-pager">
              <button
                className="text-button"
                aria-label="Previous page"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                <ChevronLeft />
              </button>
              <span>
                Page {page + 1} / {pageCount}
              </span>
              <button
                className="text-button"
                aria-label="Next page"
                disabled={page + 1 >= pageCount}
                onClick={() =>
                  setPage((current) => Math.min(pageCount - 1, current + 1))
                }
              >
                <ChevronRight />
              </button>
            </div>
          </div>
          <div className="damage-provenance">
            <FileSpreadsheet />
            <span>
              Original workbook preserved · formulas show cached source values
              by default · no recalculation or interpretation applied.
            </span>
            <span className="mono">
              SHA-256 {workbook.sha256.slice(0, 12)}…
            </span>
          </div>
        </>
      )}
    </section>
  );
}

function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
function SourceLinks({ ids, catalog }: { ids: string[]; catalog: Catalog }) {
  return (
    <div className="flex flex-col gap-2">
      {[...new Set(ids)].map((id) => {
        const s = catalog.sources.find((source) => source.id === id);
        return s ? (
          <a
            className="source-link"
            href={s.url}
            target="_blank"
            rel="noreferrer"
            key={id}
          >
            {s.title} ↗
          </a>
        ) : null;
      })}
    </div>
  );
}
function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="info-note">
      <Info aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
function NoResults() {
  return (
    <Empty>
      <EmptyTitle>No matching records</EmptyTitle>
      <EmptyDescription>
        Try a different search or clear the filters.
      </EmptyDescription>
    </Empty>
  );
}

function shownValue(value: string | number | null) {
  if (value === null) return 'Not recorded';
  if (value === '-') return '—';
  if (typeof value === 'number')
    return Number.isInteger(value) ? value : value.toFixed(2);
  return value.split('\n')[0].replace('one-hit', '1 hit');
}

function shownWithUnit(value: string | number | null, unit: string) {
  const shown = shownValue(value);
  return typeof value === 'number' ? `${shown} ${unit}` : shown;
}

function decisionShownValue(value: string | number | null) {
  if (value === null || value === '-' || value === '???' || value === '#VALUE!')
    return 'Not recorded';
  if (typeof value === 'string' && value.toLowerCase() === 'manual')
    return 'Manual';
  return shownValue(value);
}

function weaponSortableValue(value: string | number | null) {
  if (typeof value === 'number') return value;
  if (value?.toLowerCase().includes('one-hit')) return 0;
  if (typeof value === 'string' && /^\d/.test(value)) {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

const decisionMetricMeta = {
  ttk: { label: 'Body shots to kill', unit: '', lowerIsBetter: true },
  idealTtk: {
    label: 'Calculated ideal body TTK',
    unit: 's',
    lowerIsBetter: true,
  },
  damage: { label: 'Infantry damage', unit: '', lowerIsBetter: false },
  reload: { label: 'Reload', unit: 's', lowerIsBetter: true },
  magazine: { label: 'Magazine', unit: 'rds', lowerIsBetter: false },
} satisfies Record<
  Exclude<WeaponSortKey, 'name'>,
  {
    label: string;
    unit: string;
    lowerIsBetter: boolean;
  }
>;

function relativeBarPercent(
  value: number,
  values: number[],
  lowerIsBetter: boolean,
) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) return 100;
  const position = (value - minimum) / (maximum - minimum);
  const quality = lowerIsBetter ? 1 - position : position;
  return 18 + quality * 82;
}

function WeaponRankChart({
  rows,
  metric,
  onSelect,
}: {
  rows: WeaponDecisionRow[];
  metric: Exclude<WeaponSortKey, 'name'>;
  onSelect: (id: string) => void;
}) {
  const meta = decisionMetricMeta[metric];
  const ranked = rows
    .map((row) => ({ row, value: weaponSortableValue(row[metric]) }))
    .filter(
      (item): item is { row: WeaponDecisionRow; value: number } =>
        item.value !== null,
    )
    .sort((left, right) =>
      meta.lowerIsBetter ? left.value - right.value : right.value - left.value,
    )
    .slice(0, 7);
  const values = ranked.map((item) => item.value);

  return (
    <figure className={`rank-chart metric-${metric}`}>
      <figcaption>
        <div>
          <span className="eyebrow">VISIBLE FIELD / TOP {ranked.length}</span>
          <h2>
            {meta.lowerIsBetter ? 'Lowest' : 'Highest'}{' '}
            {meta.label.toLowerCase()}
          </h2>
        </div>
        <small>Tap a bar to inspect the weapon</small>
      </figcaption>
      <div className="rank-chart-bars">
        {ranked.map(({ row, value }, index) => (
          <button key={row.weapon.id} onClick={() => onSelect(row.weapon.id)}>
            <span className="chart-rank">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="chart-name">{row.weapon.name}</span>
            <span className="chart-track" aria-hidden="true">
              <span
                style={{
                  width: `${relativeBarPercent(value, values, meta.lowerIsBetter)}%`,
                }}
              />
            </span>
            <strong>
              {metric === 'idealTtk' && row.idealTtk !== null
                ? row.idealTtk.toFixed(3)
                : decisionShownValue(row[metric])}
              {typeof row[metric] === 'number' && meta.unit
                ? ` ${meta.unit}`
                : ''}
            </strong>
          </button>
        ))}
      </div>
    </figure>
  );
}

function WeaponSheetPanel({
  stats,
  profile,
}: {
  stats: WeaponSheetStats;
  profile?: WeaponDamageProfile;
}) {
  const standard = stats.configurations.find(
    (configuration) => configuration.barrel === 'Standard Barrel',
  );
  const configuration = standard ?? stats.configurations[0];
  const referenceBodyHits = bodyHitsForMode(configuration.nonTier);
  const damageBand = derivedDamageBand(referenceBodyHits);
  const dpsBand = derivedDpsBand(damageBand, configuration.rpm);

  return (
    <section className="field-sheet" aria-label="Historical weapon performance">
      <div className="field-sheet-heading">
        <div>
          <span className="eyebrow">ARCHIVED FIELD TEST / COMMUNITY DATA</span>
          <h3>Shots to kill · reference model</h3>
          <p>Standard configuration · source-era workbook test</p>
        </div>
      </div>
      <p className="field-sheet-method-note">
        Semi-auto and full-auto rows are workbook hit-count models. Full-auto
        assumes uninterrupted firing cadence; recoil, burst control, misses,
        attachments, and target movement are not modeled.
      </p>
      <div className="field-matrix-wrap">
        <table className="field-matrix">
          <thead>
            <tr>
              <th>Enemy model</th>
              <th>Semi-auto · head hits</th>
              <th>Semi-auto · body hits</th>
              <th>Full-auto · head hits · theoretical</th>
              <th>Full-auto · body hits · theoretical</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['Tier One', configuration.tierOne],
                ['Non-tier', configuration.nonTier],
              ] as const
            ).map(([label, values]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{shownValue(values.semiAuto.head)}</td>
                <td>{shownValue(values.semiAuto.body)}</td>
                <td>{shownValue(values.fullAuto.head)}</td>
                <td>{shownValue(values.fullAuto.body)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {profile && (
        <div className="damage-profile">
          <div className="damage-profile-heading">
            <div>
              <span className="eyebrow">DAMAGE / DPS</span>
              <strong>Standard damage value / DPS</strong>
            </div>
            <span>Damage value · DPS</span>
          </div>
          <div
            className="damage-profile-grid"
            style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}
          >
            <div>
              <span>Standard configuration</span>
              <strong>{shownValue(profile.damageByBarrel.standard)}</strong>
              <small>
                {shownWithUnit(profile.dpsByBarrel.standard, 'DPS')}
              </small>
            </div>
          </div>
        </div>
      )}
      {!profile && (
        <div className="damage-profile derived-profile">
          <div className="damage-profile-heading">
            <div>
              <span className="eyebrow">DERIVED DAMAGE BAND</span>
              <strong>Calculated from recorded body hits</strong>
            </div>
            <span>1,000-HP reference model</span>
          </div>
          {damageBand ? (
            <div
              className="damage-profile-grid"
              style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
            >
              <div>
                <span>Damage per shot</span>
                <strong>{damageBand.label}</strong>
                <small>{referenceBodyHits} body hits</small>
              </div>
              <div>
                <span>Theoretical DPS</span>
                <strong>{dpsBand ?? 'RPM not recorded'}</strong>
                <small>Perfect cadence; recoil and misses excluded</small>
              </div>
            </div>
          ) : (
            <p className="damage-profile-missing">
              No damage row or numeric body-hit result is available for this
              weapon.
            </p>
          )}
        </div>
      )}
      <div className="field-sheet-specs">
        <div>
          <span>Rate of fire</span>
          <strong>{shownWithUnit(configuration.rpm, 'RPM')}</strong>
        </div>
        <div>
          <span>Rounds per second</span>
          <strong>{shownWithUnit(configuration.roundsPerSecond, 'RPS')}</strong>
        </div>
        <div>
          <span>Shot interval</span>
          <strong>
            {shownWithUnit(configuration.shotIntervalSeconds, 's')}
          </strong>
        </div>
        <div>
          <span>Full-auto TTK · T1</span>
          <strong>
            {shownWithUnit(configuration.timeToKill.tierOne, 's')}
          </strong>
        </div>
        <div>
          <span>Full-auto TTK · non-tier</span>
          <strong>
            {shownWithUnit(configuration.timeToKill.nonTier, 's')}
          </strong>
        </div>
        <div>
          <span>Calculated ideal full-auto body TTK · T1</span>
          <strong>
            {formatSeconds(
              calculatedIdealBodyTtk(
                configuration.tierOne.fullAuto.body,
                configuration.rpm,
              ),
            )}
          </strong>
        </div>
        <div>
          <span>Calculated ideal full-auto body TTK · non-tier</span>
          <strong>
            {formatSeconds(
              calculatedIdealBodyTtk(
                configuration.nonTier.fullAuto.body,
                configuration.rpm,
              ),
            )}
          </strong>
        </div>
        <div>
          <span>Archived TTK − ideal · T1 full-auto</span>
          <strong>
            {formatSeconds(
              archiveIdealTtkDelta(
                configuration.timeToKill.tierOne,
                calculatedIdealBodyTtk(
                  configuration.tierOne.fullAuto.body,
                  configuration.rpm,
                ),
              ),
            )}
          </strong>
        </div>
        <div>
          <span>Archived TTK − ideal · non-tier full-auto</span>
          <strong>
            {formatSeconds(
              archiveIdealTtkDelta(
                configuration.timeToKill.nonTier,
                calculatedIdealBodyTtk(
                  configuration.nonTier.fullAuto.body,
                  configuration.rpm,
                ),
              ),
            )}
          </strong>
        </div>
        <div>
          <span>Magazine · std / ext / large</span>
          <strong>
            {[
              configuration.magazine.standard,
              configuration.magazine.extended,
              configuration.magazine.large,
            ]
              .map((value) =>
                value === null ? 'Not recorded' : shownValue(value),
              )
              .join(' / ')}
          </strong>
        </div>
        <div>
          <span>Reload</span>
          <strong>{shownWithUnit(configuration.reloadSeconds, 's')}</strong>
        </div>
        <div>
          <span>Aim delay</span>
          <strong>{shownValue(configuration.aimDelay)}</strong>
        </div>
        <div>
          <span>Aim sensitivity</span>
          <strong>{shownValue(configuration.aimSensitivity)}</strong>
        </div>
        <div>
          <span>T1 damage / semi-auto · full-auto</span>
          <strong>
            {[
              configuration.tierOneDamage.semiAuto,
              configuration.tierOneDamage.fullAuto,
            ]
              .map(shownValue)
              .join(' / ')}
          </strong>
        </div>
      </div>
      <div className="field-sheet-source">
        <span>
          {configuration.sourceLocator}
          {profile ? ` · ${profile.sourceLocator}` : ''}
        </span>
        <span>
          — source dash · Not recorded = blank cell · Historical test / build
          unknown
        </span>
      </div>
    </section>
  );
}

function RealWorldWeaponThumbnail({ weapon }: { weapon: RealWorldWeapon }) {
  const [failed, setFailed] = useState(false);
  if (failed || !weapon.thumbnailUrl || !weapon.imagePageUrl) {
    return <div className="real-world-reference-image-placeholder" aria-hidden="true">No sourced image</div>;
  }
  return (
    <a
      className="real-world-thumbnail"
      href={weapon.imagePageUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`View ${weapon.name} photo source`}
    >
      <Image
        src={weapon.thumbnailUrl}
        alt={weapon.name}
        width={320}
        height={180}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </a>
  );
}

function experimentStatusLabel(status: WeaponExperiment['status']) {
  const labels: Record<string, string> = {
    RESEARCH_LEAD: 'Research lead',
    NEEDS_TEST: 'Needs test',
    TESTING: 'Testing',
    PARTIAL: 'Partial evidence',
    SUPPORTED: 'Supported by archived data',
    CONFLICTING: 'Conflicting evidence',
    NOT_REPRODUCED: 'Not reproduced',
    REJECTED: 'Rejected',
    CURRENT_BUILD_VERIFIED: 'Current build verified',
  };
  return labels[status] ?? status;
}

function experimentStatusTone(status: WeaponExperiment['status']) {
  return ['NEEDS_TEST', 'TESTING', 'CONFLICTING', 'RESEARCH_LEAD'].includes(
    status,
  )
    ? 'warning'
    : status === 'CURRENT_BUILD_VERIFIED' || status === 'SUPPORTED'
      ? 'success'
      : 'neutral';
}

function ExperimentPanel({
  catalog,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onOpenWeapon,
}: {
  catalog: Catalog;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  onOpenWeapon: (id: string) => void;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const gapReport = buildResearchGapReport(catalog);
  const experiments = catalog.experiments.filter((experiment) => {
    const weaponNames = experiment.weaponIds
      .map((id) => catalog.weapons.find((weapon) => weapon.id === id)?.name ?? id)
      .join(' ');
    const researchLabels =
      'badges' in experiment ? experiment.badges.join(' ') : '';
    const priority = 'priority' in experiment ? experiment.priority : '';
    return (
      (statusFilter === 'All statuses' || experiment.status === statusFilter) &&
      (priorityFilter === 'All priorities' || priority === priorityFilter) &&
      `${weaponNames} ${experiment.metric} ${experiment.summary} ${experiment.catalogSignal} ${experiment.testPlan} ${researchLabels} ${priority}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  });
  const visibleGapRows = gapReport.rows.filter((row) =>
    `${row.weaponName} ${row.category} ${row.missing.join(' ')}`
      .toLowerCase()
      .includes(normalizedQuery),
  );
  return (
    <>
      <div className="topline experiments-hero">
        <div>
          <span className="eyebrow">INFO / EXPERIMENTS</span>
          <h1>Claims worth testing</h1>
          <p className="muted">
            Internet reports stay visible beside the evidence they agree with,
            the gaps we still need to measure, and a concrete next test.
          </p>
        </div>
        <span className="pill warning">{catalog.experiments.length} research records</span>
      </div>
      <div className="filters experiments-filter">
        <div className="field search">
          <label htmlFor="experiment-search">Search weapons or claims</label>
          <div className="searchbox">
            <Search aria-hidden="true" />
            <Input
              id="experiment-search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Mk17, recoil, penetration…"
            />
          </div>
        </div>
        <Picker
          label="Research status"
          value={statusFilter}
          options={['All statuses', ...researchStatuses]}
          onChange={onStatusFilterChange}
        />
        <Picker
          label="Priority"
          value={priorityFilter}
          options={['All priorities', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']}
          onChange={onPriorityFilterChange}
        />
      </div>
      <Note>
        Supported means the archived catalog signal points in the same
        direction; source confidence describes each evidence item and does not
        establish a current-build result. Empty context and result fields mean
        no trial context or result has been entered in that experiment record;
        cited historical data may still exist.
      </Note>
      <details className="research-gap-report">
        <summary>
          Data completeness report · {gapReport.rows.length} weapons ·{' '}
          {gapReport.metricSummary.reduce((sum, item) => sum + item.weaponsMissing, 0)}{' '}
          missing metric entries
        </summary>
        <p className="muted small">
          Generated from release {gapReport.generatedFromRelease}. A missing
          structured measurement means the catalog does not hold that value; it
          does not prove the source archive contains no relevant evidence.
        </p>
        <div className="gap-metric-list">
          {gapReport.metricSummary.map(({ metric, weaponsMissing }) => (
            <span className="pill neutral" key={metric}>
              {metric}: {weaponsMissing} missing
            </span>
          ))}
        </div>
        <div className="tableframe gap-table-frame">
          <table className="lab-table research-gap-table">
            <thead>
              <tr>
                <th>Weapon</th>
                <th>Class</th>
                <th>Missing structured data</th>
                <th>Linked experiments</th>
              </tr>
            </thead>
            <tbody>
              {visibleGapRows.map((row) => (
                <tr key={row.weaponId}>
                  <th>{row.weaponName}</th>
                  <td>{row.category}</td>
                  <td>{row.missing.join(', ') || 'No listed gaps'}</td>
                  <td>{row.experimentIds.length || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleGapRows.length && <NoResults />}
        </div>
      </details>
      <section className="experiment-grid" aria-label="Weapon information and experiments">
        {experiments.map((experiment) => (
          <article className="experiment-card" key={experiment.id}>
            <div className="experiment-card-heading">
              <span className={`pill ${experimentStatusTone(experiment.status)}`}>
                {experimentStatusLabel(experiment.status)}
              </span>
              {'priority' in experiment && (
                <span className="pill priority-critical">
                  {experiment.priority} priority
                </span>
              )}
              <span className="eyebrow">{experiment.metric}</span>
            </div>
            {'badges' in experiment && experiment.badges.length > 0 && (
              <div className="experiment-badges" aria-label="Research labels">
                {experiment.badges.map((badge) => (
                  <span className="pill neutral" key={badge}>{badge.replaceAll('_', ' ')}</span>
                ))}
              </div>
            )}
            <div className="experiment-weapons">
              {experiment.weaponIds.map((id) => {
                const weapon = catalog.weapons.find((item) => item.id === id);
                return weapon ? (
                  <button className="text-button" key={id} onClick={() => onOpenWeapon(id)}>
                    {weapon.name}
                  </button>
                ) : null;
              })}
            </div>
            <p>{experiment.summary}</p>
            {'whyItMatters' in experiment && (
              <div className="experiment-detail">
                <span>Why it matters</span>
                <p>{experiment.whyItMatters}</p>
              </div>
            )}
            {'evidenceSources' in experiment && (
              <div className="experiment-evidence-confidence">
                {experiment.evidenceSources.map((evidence) => (
                  <span className="pill neutral" key={evidence.sourceId}>
                    {evidence.type.replaceAll('_', ' ')} · {evidence.confidence} confidence
                  </span>
                ))}
              </div>
            )}
            <div className="experiment-detail">
              <span>Current catalog signal</span>
              <p>{experiment.catalogSignal}</p>
            </div>
            <div className="experiment-detail">
              <span>Suggested test</span>
              <p>{experiment.testPlan}</p>
            </div>
            {'testContext' in experiment && (
              <details className="experiment-context">
                <summary>Recorded context and result</summary>
                {(() => {
                  const captured = Object.entries(experiment.testContext).filter(
                    ([, value]) => value !== null && value !== '',
                  );
                  return captured.length ? (
                    <ul>
                      {captured.map(([key, value]) => (
                        <li key={key}>{key}: {String(value)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No trial context entered in this record yet.</p>
                  );
                })()}
                <p>
                  {'result' in experiment && experiment.result
                    ? JSON.stringify(experiment.result)
                    : 'No result entered in this experiment record.'}
                </p>
              </details>
            )}
            <SourceLinks ids={experiment.sourceIds} catalog={catalog} />
          </article>
        ))}
        {!experiments.length && <NoResults />}
      </section>
    </>
  );
}

function RealWorldReferenceCard({
  weapon,
  catalog,
  active,
  onOpenWildlandsWeapon,
}: {
  weapon: RealWorldWeapon;
  catalog: Catalog;
  active: boolean;
  onOpenWildlandsWeapon: (id: string) => void;
}) {
  const wildlandsWeapon = catalog.weapons.find(
    (item) => item.id === weapon.wildlandsWeaponId,
  );
  const stats = catalog.weaponSheetStats.find(
    (item) => item.weaponId === weapon.wildlandsWeaponId,
  );
  const profile = catalog.damageProfiles.find(
    (item) => item.weaponId === weapon.wildlandsWeaponId,
  );
  const configuration =
    stats?.configurations.find((item) => item.barrel === 'Standard Barrel') ??
    stats?.configurations[0];
  const bodyHits = configuration ? bodyHitsForMode(configuration.nonTier) : null;
  const damage = profile?.damageByBarrel.standard ?? derivedDamageBand(bodyHits)?.label ?? null;
  const magazine = configuration
    ? Math.max(
        ...[configuration.magazine.standard, configuration.magazine.extended, configuration.magazine.large].filter(
          (value): value is number => typeof value === 'number',
        ),
      )
    : null;
  return (
    <article className="real-world-reference-card" data-active={active}>
      <RealWorldWeaponThumbnail weapon={weapon} />
      <div>
        <span className="eyebrow">CONFIRMED DIRECT MATCH · CALIBER {weapon.caliber}</span>
        <h3>{wildlandsWeapon?.name} ↔ {weapon.name}</h3>
        <p>{weapon.notes}</p>
        <dl className="real-world-reference-specs">
          <div><dt>Manufacturer</dt><dd>{weapon.manufacturer}</dd></div>
          <div><dt>Caliber</dt><dd>{weapon.caliber}</dd></div>
          <div><dt>Weapon class</dt><dd>{weapon.weaponClass}</dd></div>
        </dl>
        <div className="real-world-game-metrics" aria-label={`${wildlandsWeapon?.name} archived game metrics`}>
          <span>Wildlands metrics</span>
          <strong>{shownValue(bodyHits)} body STK</strong>
          <strong>{shownValue(damage)} damage</strong>
          <strong>{shownWithUnit(configuration?.rpm ?? null, 'RPM')}</strong>
          <strong>{magazine === null || magazine === -Infinity ? 'Mag not recorded' : `${magazine}-round mag`}</strong>
        </div>
        <div className="real-world-links">
          <button className="text-button" onClick={() => onOpenWildlandsWeapon(weapon.wildlandsWeaponId)}>
            Open {wildlandsWeapon?.name} dossier
          </button>
          <a href={weapon.referenceUrl} target="_blank" rel="noreferrer">Learn more: {weapon.referenceLabel} ↗</a>
          <a href={weapon.imagePageUrl} target="_blank" rel="noreferrer">Photo credit ↗</a>
        </div>
      </div>
    </article>
  );
}

function WeaponDossier({
  weapon,
  catalog,
  selected,
  barrel,
  mode,
  onCompare,
  onClose,
  onOpenRealWorldReference,
}: {
  weapon: Weapon;
  catalog: Catalog;
  selected: string[];
  barrel: string;
  mode: string;
  onCompare: () => void;
  onClose: () => void;
  onOpenRealWorldReference: (id: string) => void;
}) {
  const compatibility = catalog.compatibility.filter(
    (item) =>
      item.weaponId === weapon.id &&
      catalog.attachments.find(
        (attachment) => attachment.id === item.attachmentId,
      )?.slot !== 'Barrel',
  );
  const stats = catalog.weaponSheetStats.find(
    (entry) => entry.weaponId === weapon.id,
  );
  const profile = catalog.damageProfiles.find(
    (entry) => entry.weaponId === weapon.id,
  );
  const configuration =
    stats?.configurations.find(
      (item) => item.barrel.toLowerCase() === barrel.toLowerCase(),
    ) ?? stats?.configurations[0];
  const barrelKey = barrel.toLowerCase().split(' ')[0] as
    | 'short'
    | 'standard'
    | 'long';
  const modeStats = configuration
    ? mode === 'Tier One'
      ? configuration.tierOne
      : configuration.nonTier
    : undefined;
  const semiAutoBody = modeStats?.semiAuto.body;
  const hasSemiAutoBody =
    semiAutoBody !== null &&
    semiAutoBody !== undefined &&
    semiAutoBody !== 'N/A' &&
    semiAutoBody !== '-';
  const bodyHitsValue = bodyHitsForMode(modeStats);
  const damageBand = derivedDamageBand(bodyHitsValue);
  const measuredDamage = profile?.damageByBarrel[barrelKey] ?? null;
  const effectProfile = weaponEffectProfiles[weapon.id];
  const infantryDamage = measuredDamage ?? damageBand?.label ?? null;
  const reload =
    typeof configuration?.reloadSeconds === 'number'
      ? configuration.reloadSeconds
      : (stats?.configurations
          .map((item) => item.reloadSeconds)
          .find((value): value is number => typeof value === 'number') ?? null);
  const magazines =
    stats?.configurations.flatMap((item) => [
      item.magazine.standard,
      item.magazine.extended,
      item.magazine.large,
    ]) ?? [];
  const recordedMagazines = magazines.filter(
    (value): value is number => typeof value === 'number',
  );
  const magazine = recordedMagazines.length
    ? Math.max(...recordedMagazines)
    : null;
  const canCompare = selected.length < 3 || selected.includes(weapon.id);
  const realWorldReference = catalog.realWorldWeapons.find(
    (reference) => reference.wildlandsWeaponId === weapon.id,
  );
  const experiments = catalog.experiments.filter((experiment) =>
    experiment.weaponIds.includes(weapon.id),
  );

  return (
    <article className="weapon-dossier" aria-label={`${weapon.name} details`}>
      <div className="dossier-heading compact-dossier-heading">
        <div>
          <h2>
            {weapon.name}
            <span className="dossier-weapon-class">{weapon.category}</span>
          </h2>
        </div>
        <div className="dossier-header-actions">
          <button
            className="text-button"
            disabled={!canCompare}
            onClick={onCompare}
          >
            {selected.includes(weapon.id)
              ? 'Remove compare'
              : canCompare
                ? 'Compare'
                : 'Compare full'}
          </button>
          <button className="text-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <p className="dossier-context-line">
        Infantry reference · {mode} · Unidad Heavy · historical community test
      </p>
      <div className="dossier-key-metrics">
        {realWorldReference && (
          <button
            className="key-metric caliber-reference"
            onClick={() => onOpenRealWorldReference(realWorldReference.id)}
            title="Open the sourced real-world caliber reference"
          >
            <span>Real-world caliber ↗</span>
            <strong>{realWorldReference.caliber}</strong>
          </button>
        )}
        <div className="key-metric primary">
          <span>Body STK ↓</span>
          <strong>{shownValue(bodyHitsValue ?? null)}</strong>
        </div>
        <div className="key-metric">
          <span>Fire-mode model</span>
          <strong>{hasSemiAutoBody ? 'Semi-auto' : 'Full-auto'}</strong>
        </div>
        <div className="key-metric">
          <span>
            {measuredDamage === null
              ? 'Infantry damage · derived'
              : 'Infantry damage'}
          </span>
          <strong>{shownValue(infantryDamage)}</strong>
        </div>
        <div className="key-metric">
          <span>Reload ↓</span>
          <strong>{shownWithUnit(reload, 's')}</strong>
        </div>
        <div className="key-metric">
          <span>Mag</span>
          <strong>
            {magazine === null || magazine === -Infinity
              ? 'Not recorded'
              : magazine}
          </strong>
        </div>
      </div>
      <section className="target-effects" aria-label="Target effect breakdown">
        <div className="target-effects-heading">
          <div>
            <span className="eyebrow">TARGET EFFECTS / SEPARATE MODELS</span>
            <h3>What this weapon does to different targets</h3>
          </div>
          <span>Do not infer vehicle power from infantry damage.</span>
        </div>
        <div className="target-effects-grid">
          <article className="effect-card personnel">
            <span>Personnel</span>
            <strong>
              {typeof bodyHitsValue === 'number'
                ? `${bodyHitsValue} body ${bodyHitsValue === 1 ? 'shot' : 'shots'} to kill`
                : 'Not recorded'}
            </strong>
            <p>
              {infantryDamage === null
                ? 'No direct or derived infantry-damage value is available.'
                : `${shownValue(infantryDamage)} ${measuredDamage === null ? 'damage band derived from the 1,000-HP reference.' : 'direct workbook damage value.'}`}
            </p>
          </article>
          <article className="effect-card vehicle">
            <span>Vehicles</span>
            <strong>
              {effectProfile?.vehicleRating ?? 'Not separately recorded'}
            </strong>
            <p>
              {effectProfile?.vehicleNote ??
                'Infantry damage and body STK do not establish vehicle damage.'}
            </p>
          </article>
          <article className="effect-card area">
            <span>Blast / area effect</span>
            <strong>
              {effectProfile?.areaRating ?? 'No evidence recorded'}
            </strong>
            <p>
              {effectProfile?.areaNote ??
                'Do not assume explosive splash damage from a high damage value.'}
            </p>
          </article>
        </div>
      </section>
      <section className="dossier-technical">
        <div className="dossier-technical-heading">
          <div>
            <span className="eyebrow">FULL FIELD RECORD</span>
            <h3>Technical record, attachments &amp; sources</h3>
          </div>
          <span className="dossier-record-note">
            Blank workbook cells remain “Not recorded”. Range is not recorded in
            this source.
          </span>
        </div>
        {stats ? (
          <WeaponSheetPanel key={weapon.id} stats={stats} profile={profile} />
        ) : (
          <p className="muted">No matching row in the imported damage sheet.</p>
        )}
        <div className="dossier-support">
          {realWorldReference && (
            <section>
              <h3>Real-world reference</h3>
              <p className="muted small">Confirmed direct model match: {realWorldReference.name}.</p>
              <button className="text-button" onClick={() => onOpenRealWorldReference(realWorldReference.id)}>
                Open reference wiki
              </button>
            </section>
          )}
          {experiments.length > 0 && (
            <section className="dossier-experiments">
              <h3>Info / experiments</h3>
              <p className="muted small">
                Internet observations connected to this weapon. They are
                hypotheses or partial matches until the stated test is run.
              </p>
              {experiments.map((experiment) => (
                <article className="dossier-experiment" key={experiment.id}>
                  <span className={`pill ${experimentStatusTone(experiment.status)}`}>
                    {experimentStatusLabel(experiment.status)}
                  </span>
                  <strong>{experiment.metric}</strong>
                  <p>{experiment.summary}</p>
                  <SourceLinks ids={experiment.sourceIds} catalog={catalog} />
                </article>
              ))}
            </section>
          )}
          <section>
            <h3>Attachments</h3>
            {compatibility.length ? (
              <div className="flex flex-wrap gap-2">
                {compatibility.map((item) => (
                  <span className="pill neutral" key={item.id}>
                    {catalog.attachments.find((a) => a.id === item.attachmentId)
                      ?.name ?? 'Unknown'}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted small">
                Weapon-specific attachment options are still being audited.
              </p>
            )}
          </section>
          <section>
            <h3>Sources</h3>
            <SourceLinks
              ids={[
                'damage',
                ...weapon.sourceIds,
                ...(effectProfile?.sourceIds ?? []),
              ]}
              catalog={catalog}
            />
          </section>
        </div>
        <p className="dossier-caveat">
          Historical community data; exact build and several test conditions are
          unknown.
        </p>
      </section>
    </article>
  );
}

export function DatabaseApp({ initialCatalog }: { initialCatalog: Catalog }) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [storage, setStorage] = useState('Curated snapshot');
  const [storageError, setStorageError] = useState(false);
  const [tab, setTab] = useState('weapons');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All classes');
  const [selected, setSelected] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [mode, setMode] = useState('Non-tier');
  const barrel = 'Standard barrel';
  const [operatorPresetId, setOperatorPresetId] = useState('all');
  const [weaponSort, setWeaponSort] = useState<WeaponSortKey>('ttk');
  const [weaponSortDirection, setWeaponSortDirection] = useState<
    'asc' | 'desc'
  >('asc');
  const [attachmentQuery, setAttachmentQuery] = useState('');
  const [missionQuery, setMissionQuery] = useState('');
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [experimentQuery, setExperimentQuery] = useState('');
  const [experimentStatusFilter, setExperimentStatusFilter] = useState('All statuses');
  const [experimentPriorityFilter, setExperimentPriorityFilter] = useState('All priorities');
  const [realWorldReferenceId, setRealWorldReferenceId] = useState<string | null>(null);
  const [damageWorkbook, setDamageWorkbook] = useState<DamageWorkbook | null>(
    null,
  );
  const [damageWorkbookLoading, setDamageWorkbookLoading] = useState(false);
  const [damageWorkbookError, setDamageWorkbookError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/catalog`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Catalog unavailable');
        const result = (await response.json()) as CatalogResult;
        if (result.storage === 'postgres') {
          setCatalog(result.catalog);
          setStorage('PostgreSQL');
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setStorageError(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (
      tab !== 'damage-lab' ||
      damageWorkbook ||
      damageWorkbookLoading ||
      damageWorkbookError
    )
      return;
    void (async () => {
      try {
        await Promise.resolve();
        setDamageWorkbookLoading(true);
        if (storage === 'PostgreSQL') {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/damage-workbook`,
          );
          if (!response.ok) throw new Error('Damage archive unavailable');
          const result = (await response.json()) as DamageWorkbookResult;
          setDamageWorkbook(result.workbook);
        } else {
          const result = await import('@/data/damage-workbook.json');
          setDamageWorkbook(result.default as DamageWorkbook);
        }
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError'))
          setDamageWorkbookError(true);
      } finally {
        setDamageWorkbookLoading(false);
      }
    })();
  }, [
    tab,
    damageWorkbook,
    damageWorkbookLoading,
    damageWorkbookError,
    storage,
  ]);

  const operatorPreset =
    operatorPresets.find((preset) => preset.id === operatorPresetId) ??
    operatorPresets[0];
  const filteredWeapons = filterWeapons(
    catalog,
    query,
    category,
    'All provinces',
    false,
  ).filter(
    (weapon) =>
      !operatorPreset.categories.length ||
      operatorPreset.categories.includes(weapon.category),
  );
  const weaponRows: WeaponDecisionRow[] = filteredWeapons
    .map((weapon) => {
      const stats = catalog.weaponSheetStats.find(
        (entry) => entry.weaponId === weapon.id,
      );
      const profile = catalog.damageProfiles.find(
        (entry) => entry.weaponId === weapon.id,
      );
      const configuration =
        stats?.configurations.find(
          (item) => item.barrel.toLowerCase() === barrel.toLowerCase(),
        ) ?? stats?.configurations[0];
      const barrelKey = barrel.toLowerCase().split(' ')[0] as
        | 'short'
        | 'standard'
        | 'long';
      const modeStats = configuration
        ? mode === 'Tier One'
          ? configuration.tierOne
          : configuration.nonTier
        : undefined;
      // The armory comparison uses the archived semi-auto column consistently.
      // Full-auto observations remain separate in Damage Lab.
      const bodyHits = modeStats?.semiAuto.body ?? null;
      const magazines = configuration
        ? (stats?.configurations
            .flatMap((item) => [
              item.magazine.standard,
              item.magazine.extended,
              item.magazine.large,
            ])
            .filter((value): value is number => typeof value === 'number') ??
          [])
        : [];
      const reload =
        typeof configuration?.reloadSeconds === 'number'
          ? configuration.reloadSeconds
          : (stats?.configurations
              .map((item) => item.reloadSeconds)
              .find((value): value is number => typeof value === 'number') ??
            null);
      const rpm = configuration?.rpm ?? profile?.rpm ?? null;
      const measuredDamage = profile?.damageByBarrel[barrelKey] ?? null;
      const damageBand = derivedDamageBand(bodyHits);
      const damage = measuredDamage ?? damageBand?.label ?? null;
      const measuredDps = profile?.dpsByBarrel[barrelKey] ?? null;
      const dps = measuredDps ?? derivedDpsBand(damageBand, rpm);
      return {
        weapon,
        ttk: bodyHits,
        idealTtk: calculatedIdealBodyTtk(bodyHits, configuration?.rpm),
        damage,
        rpm,
        dps,
        reload,
        magazine: magazines.length ? Math.max(...magazines) : null,
      };
    })
    .sort((left, right) => {
      if (weaponSort === 'name') {
        const result = left.weapon.name.localeCompare(
          right.weapon.name,
          undefined,
          { numeric: true },
        );
        return weaponSortDirection === 'asc' ? result : -result;
      }
      const leftValue = weaponSortableValue(left[weaponSort]);
      const rightValue = weaponSortableValue(right[weaponSort]);
      if (leftValue === null) return rightValue === null ? 0 : 1;
      if (rightValue === null) return -1;
      const result = leftValue - rightValue;
      return weaponSortDirection === 'asc' ? result : -result;
    });
  const selectedWeapons = catalog.weapons.filter((w) =>
    selected.includes(w.id),
  );
  const barrelId = barrel.toLowerCase().replaceAll(' ', '-');
  const measuredCount = new Set(
    catalog.weaponSheetStats.map((entry) => entry.weaponId),
  ).size;
  const caseCount = catalog.weapons.filter((weapon) =>
    weapon.acquisition.startsWith('Weapon case'),
  ).length;
  const sourceGroups = [
    {
      id: 'evidence',
      title: 'Direct evidence & community testing',
      description:
        'Sources that contributed measurements, imported records, or test-method context.',
      sources: catalog.sources.filter((source) =>
        ['community_test', 'extracted', 'game_capture'].includes(source.kind),
      ),
    },
    {
      id: 'references',
      title: 'Reference & identity cross-checks',
      description:
        'Guides and official pages used to verify names, classes, locations, unlocks, and historical context.',
      sources: catalog.sources.filter((source) =>
        ['guide', 'official'].includes(source.kind),
      ),
    },
    {
      id: 'leads',
      title: 'Research leads',
      description:
        'Promising resources kept visible for future extraction or controlled retesting; no silent imports.',
      sources: catalog.sources.filter(
        (source) => source.kind === 'research_lead',
      ),
    },
  ];
  function toggleWeapon(id: string) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((x) => x !== id)
        : previous.length < 3
          ? [...previous, id]
          : previous,
    );
  }
  function clearFilters() {
    setQuery('');
    setCategory('All classes');
    setOperatorPresetId('all');
    setWeaponSort('ttk');
    setWeaponSortDirection('asc');
  }
  function chooseWeaponSort(value: string) {
    const option = weaponSortOptions.find((item) => item.label === value);
    if (!option) return;
    setWeaponSort(option.value);
    setWeaponSortDirection(
      option.value === 'damage' || option.value === 'magazine'
        ? 'desc'
        : 'asc',
    );
  }
  function chooseOperatorPreset(preset: OperatorPreset) {
    setOperatorPresetId(preset.id);
    setWeaponSort(preset.sort);
    setWeaponSortDirection(preset.direction);
    setDetailId(null);
  }
  function toggleWeaponSort(key: WeaponSortKey) {
    if (weaponSort === key) {
      setWeaponSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setWeaponSort(key);
      setWeaponSortDirection(
        key === 'damage' || key === 'magazine' ? 'desc' : 'asc',
      );
    }
  }
  return (
    <>
      <a href="#workspace" className="sr-only focus:not-sr-only">
        Skip to database
      </a>
      <header className="brandbar">
        <div className="brand">
          <Crosshair aria-hidden="true" />
          <div>
            <strong>GHOST RECON BUDDY</strong>
            <small>Wildlands / Tier One field index</small>
          </div>
        </div>
        <span className="pill neutral">
          Research edition · {catalog.release}
        </span>
      </header>
      <main id="workspace" className="workspace">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(String(v))}
          className="main-tabs"
        >
          <TabsList variant="line" aria-label="Database sections">
            <TabsTrigger value="weapons">
              <Crosshair />
              Weapons <span className="mono">{catalog.weapons.length}</span>
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <Layers />
              Attachments
            </TabsTrigger>
            <TabsTrigger value="missions">
              <MapIcon />
              Missions
            </TabsTrigger>
            <TabsTrigger value="apparel">
              <Shirt />
              Apparel
            </TabsTrigger>
            <TabsTrigger value="sources">
              <BookOpen />
              Sources
            </TabsTrigger>
            <TabsTrigger value="wiki">
              <Info />
              Field Wiki
            </TabsTrigger>
            <TabsTrigger value="experiments">
              <Activity />
              Info / Experiments <span className="mono">{catalog.experiments.length}</span>
            </TabsTrigger>
            <TabsTrigger value="damage-lab">
              <FileSpreadsheet />
              Damage Lab <span className="mono">11</span>
            </TabsTrigger>
          </TabsList>
          {storageError && (
            <Note>
              Live database unavailable. Showing the bundled research snapshot;
              these records may be older than the live database.
            </Note>
          )}
          <TabsContent value="weapons">
            <div className="armory-heading">
              <div>
                <span className="eyebrow">WEAPON DECISION WORKSPACE</span>
                <h1>Choose a weapon for the mission</h1>
                <p className="muted">
                  Choose a mission profile, then search and compare the archived
                  weapon results.
                </p>
              </div>
              <div className="coverage-summary">
                <strong>{measuredCount}</strong>
                <span>weapons with archived test data</span>
              </div>
            </div>
            <div
              className="operator-panel"
              aria-label="Choose a mission profile"
            >
              <div className="operator-panel-heading">
                <div>
                  <span className="operator-section-label">Mission profile</span>
                  <strong>{operatorPreset.label}</strong>
                  <small>{operatorPreset.description}</small>
                </div>
              </div>
              <div className="operator-preset-list">
                {operatorPresets.map((preset) => (
                  <button
                    key={preset.id}
                    className={operatorPresetId === preset.id ? 'active' : ''}
                    onClick={() => chooseOperatorPreset(preset)}
                  >
                    {preset.shortLabel}
                  </button>
                ))}
              </div>
              <div className="operator-order">
                <Picker
                  label="Order weapons by"
                  value={
                    weaponSortOptions.find((option) => option.value === weaponSort)
                      ?.label ?? weaponSortOptions[0].label
                  }
                  options={weaponSortOptions.map((option) => option.label)}
                  onChange={chooseWeaponSort}
                />
              </div>
                  <span className="operator-evidence">
                Uses archived measurements. Treat the order as a comparison aid,
                not a field verdict. Ideal TTK is a separate derived metric.
              </span>
            </div>
            <div className="armory-controls">
              <div className="field search">
                <label htmlFor="weapon-search">Search weapons</label>
                <div className="searchbox">
                  <Search aria-hidden="true" />
                  <Input
                    id="weapon-search"
                    placeholder="Try M4A1, SR25 or Montuyoc…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <Picker
                label="Weapon class"
                value={category}
                options={[
                  'All classes',
                  ...new Set(catalog.weapons.map((w) => w.category)),
                ]}
                onChange={setCategory}
              />
              <Picker
                label="Game mode"
                value={mode}
                options={['Non-tier', 'Tier One']}
                onChange={setMode}
              />
            </div>
            <div className="armory-resultbar">
              <span aria-live="polite">
                <strong>{weaponRows.length}</strong> weapons · {mode}
              </span>
              <span className="derived-legend">
                Ideal TTK assumes consecutive semi-auto body hits; first shot at
                time zero. It is calculated from recorded STK + RPM.
              </span>
              <button className="text-button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
            <div className="armory-browser">
              {weaponSort !== 'name' && (
                <details className="mobile-rank-chart">
                  <summary>Visual ranking</summary>
                  <WeaponRankChart
                    rows={weaponRows}
                    metric={weaponSort}
                    onSelect={setDetailId}
                  />
                </details>
              )}
              <section
                className="weapon-shortlist"
                aria-label="Weapon results"
              >
                <div className="shortlist-head">
                  <span>#</span>
                  <button onClick={() => toggleWeaponSort('name')}>
                    Weapon{' '}
                    {weaponSort === 'name'
                      ? weaponSortDirection === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </button>
                  <button onClick={() => toggleWeaponSort('ttk')}>
                    Body STK{' '}
                    {weaponSort === 'ttk'
                      ? weaponSortDirection === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </button>
                  <button onClick={() => toggleWeaponSort('idealTtk')}>
                    Ideal TTK · semi{' '}
                    {weaponSort === 'idealTtk'
                      ? weaponSortDirection === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </button>
                  <button onClick={() => toggleWeaponSort('damage')}>
                    Inf. damage{' '}
                    {weaponSort === 'damage'
                      ? weaponSortDirection === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </button>
                  <span>Cyclic RPM</span>
                  <span>Ideal DPS</span>
                  <button onClick={() => toggleWeaponSort('reload')}>
                    Reload{' '}
                    {weaponSort === 'reload'
                      ? weaponSortDirection === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </button>
                  <button onClick={() => toggleWeaponSort('magazine')}>
                    Mag{' '}
                    {weaponSort === 'magazine'
                      ? weaponSortDirection === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </button>
                  <span>Compare</span>
                </div>
                {weaponRows.map((row, index) => (
                  <div
                    className="shortlist-row"
                    data-active={detailId === row.weapon.id}
                    key={row.weapon.id}
                  >
                    <span className="weapon-rank">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <button
                      className="shortlist-weapon"
                      onClick={() => setDetailId(row.weapon.id)}
                      aria-pressed={detailId === row.weapon.id}
                    >
                      <strong>
                        {row.weapon.name}
                        <span className="weapon-class-inline">
                          {row.weapon.category}
                        </span>
                      </strong>
                    </button>
                    <span
                      className="shortlist-metric metric-ttk"
                      data-label="Body STK"
                    >
                      <span
                        className="metric-wash"
                        style={
                          {
                            '--metric-fill': `${
                              weaponSortableValue(row.ttk) === null
                                ? 0
                                : relativeBarPercent(
                                    weaponSortableValue(row.ttk)!,
                                    weaponRows
                                      .map((item) =>
                                        weaponSortableValue(item.ttk),
                                      )
                                      .filter(
                                        (item): item is number => item !== null,
                                      ),
                                    true,
                                  )
                            }%`,
                          } as CSSProperties
                        }
                        aria-hidden="true"
                      />
                      <strong>{decisionShownValue(row.ttk)}</strong>
                    </span>
                    <span
                      className="shortlist-metric metric-damage"
                      data-label="Infantry damage"
                    >
                      <span
                        className="metric-wash"
                        style={
                          {
                            '--metric-fill': `${
                              weaponSortableValue(row.damage) === null
                                ? 0
                                : relativeBarPercent(
                                    weaponSortableValue(row.damage)!,
                                    weaponRows
                                      .map((item) =>
                                        weaponSortableValue(item.damage),
                                      )
                                      .filter(
                                        (item): item is number => item !== null,
                                      ),
                                    false,
                                  )
                            }%`,
                          } as CSSProperties
                        }
                        aria-hidden="true"
                      />
                      <strong>{decisionShownValue(row.damage)}</strong>
                    </span>
                    <span
                      className="shortlist-metric metric-ideal-ttk"
                      data-label="Ideal TTK · semi-auto"
                    >
                      <strong>
                        {row.idealTtk === null
                          ? 'Not recorded'
                          : `${row.idealTtk.toFixed(3)} s`}
                      </strong>
                    </span>
                    <span
                      className="shortlist-metric metric-rpm"
                      data-label="Cyclic RPM"
                    >
                      <strong>{decisionShownValue(row.rpm)}</strong>
                    </span>
                    <span
                      className="shortlist-metric metric-dps"
                      data-label="Ideal DPS"
                    >
                      <strong>{decisionShownValue(row.dps)}</strong>
                    </span>
                    <span
                      className="shortlist-metric metric-reload"
                      data-label="Reload"
                    >
                      <span
                        className="metric-wash"
                        style={
                          {
                            '--metric-fill': `${
                              weaponSortableValue(row.reload) === null
                                ? 0
                                : relativeBarPercent(
                                    weaponSortableValue(row.reload)!,
                                    weaponRows
                                      .map((item) =>
                                        weaponSortableValue(item.reload),
                                      )
                                      .filter(
                                        (item): item is number => item !== null,
                                      ),
                                    true,
                                  )
                            }%`,
                          } as CSSProperties
                        }
                        aria-hidden="true"
                      />
                      <strong>{decisionShownValue(row.reload)}</strong>
                      {typeof row.reload === 'number' && <small>s</small>}
                    </span>
                    <span
                      className="shortlist-metric metric-magazine"
                      data-label="Mag"
                    >
                      <span
                        className="metric-wash"
                        style={
                          {
                            '--metric-fill': `${
                              weaponSortableValue(row.magazine) === null
                                ? 0
                                : relativeBarPercent(
                                    weaponSortableValue(row.magazine)!,
                                    weaponRows
                                      .map((item) =>
                                        weaponSortableValue(item.magazine),
                                      )
                                      .filter(
                                        (item): item is number => item !== null,
                                      ),
                                    false,
                                  )
                            }%`,
                          } as CSSProperties
                        }
                        aria-hidden="true"
                      />
                      <strong>{decisionShownValue(row.magazine)}</strong>
                    </span>
                    <div className="compare-check">
                      <Checkbox
                        aria-label={`Compare ${row.weapon.name}`}
                        checked={selected.includes(row.weapon.id)}
                        disabled={
                          selected.length >= 3 &&
                          !selected.includes(row.weapon.id)
                        }
                        onCheckedChange={() => toggleWeapon(row.weapon.id)}
                      />
                    </div>
                  </div>
                ))}
                {!weaponRows.length && <NoResults />}
              </section>
              <aside className="armory-detail" data-open={Boolean(detailId)}>
                {detailId ? (
                  <WeaponDossier
                    weapon={catalog.weapons.find(
                      (weapon) => weapon.id === detailId,
                    )!}
                    catalog={catalog}
                    selected={selected}
                    barrel={barrel}
                    mode={mode}
                    onCompare={() => toggleWeapon(detailId)}
                    onClose={() => setDetailId(null)}
                    onOpenRealWorldReference={(id) => {
                      setRealWorldReferenceId(id);
                      setTab('wiki');
                    }}
                  />
                ) : weaponSort === 'name' ? (
                  <div className="detail-placeholder">
                    <Crosshair aria-hidden="true" />
                    <h2>Pick a weapon</h2>
                    <p>
                      Its decision metrics, full test record, attachments, and
                      sources will stay here while you browse.
                    </p>
                  </div>
                ) : (
                  <WeaponRankChart
                    rows={weaponRows}
                    metric={weaponSort}
                    onSelect={setDetailId}
                  />
                )}
              </aside>
            </div>
            <div className="selection-footer">
              <span>Select up to 3 weapons for a direct comparison.</span>
              <strong>{selected.length} / 3 selected</strong>
            </div>
            {selectedWeapons.length > 0 && (
              <section
                id="comparison"
                className="comparison"
                aria-label="Weapon comparison"
              >
                <div className="split-line">
                  <h2>Compare historical results</h2>
                  <button
                    className="text-button"
                    onClick={() => setSelected([])}
                  >
                    Clear comparison
                  </button>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Picker
                    label="Reported mode"
                    value={mode}
                    options={['Non-tier', 'Tier One']}
                    onChange={setMode}
                  />
                </div>
                <p className="muted small mt-3">
                  Unidad Heavy · body hits · semi-auto column. The ideal TTK
                  below is derived from that STK and recorded RPM; the archived
                  measured TTK remains separate in Damage Lab.
                </p>
                <div className="compare-grid">
                  {selectedWeapons.map((w) => {
                    const measurement = findMeasurement(
                      catalog,
                      w.id,
                      barrelId,
                      mode,
                    );
                    const comparisonConfig = catalog.weaponSheetStats
                      .find((entry) => entry.weaponId === w.id)
                      ?.configurations.find(
                        (configuration) =>
                          configuration.barrel.toLowerCase() ===
                          barrel.toLowerCase(),
                      );
                    const comparisonBodyHits =
                      mode === 'Tier One'
                        ? comparisonConfig?.tierOne.semiAuto.body
                        : comparisonConfig?.nonTier.semiAuto.body;
                    const comparisonIdealTtk = calculatedIdealBodyTtk(
                      comparisonBodyHits,
                      comparisonConfig?.rpm,
                    );
                    return (
                      <article className="compare-card" key={w.id}>
                        <div className="split-line">
                          <h3>{w.name}</h3>
                          <button
                            className="text-button"
                            onClick={() => toggleWeapon(w.id)}
                            aria-label={`Remove ${w.name}`}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="metric">
                          <strong>{measurement?.value ?? '—'}</strong>
                          <div className="muted small">
                            {measurement
                              ? 'body shots to kill · reported'
                              : 'No measurement for this combination'}
                          </div>
                        </div>
                        <div className="metric mt-3">
                          <strong>
                            {formatSeconds(comparisonIdealTtk)}
                          </strong>
                          <div className="muted small">
                            calculated ideal body TTK · semi-auto · first shot
                            at time zero
                          </div>
                        </div>
                        {measurement && (
                          <>
                            <div className="row-meta mb-2">
                              {measurement.sourceLocator}
                            </div>
                            <SourceLinks
                              ids={measurement.sourceIds}
                              catalog={catalog}
                            />
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
                <Note>
                  Distance, alert state, weapon level, platform, full loadout
                  and sample count are not established in these imported rows.
                  Do not extrapolate to stealth, vehicles, Ghost War or the
                  current build.
                </Note>
              </section>
            )}
          </TabsContent>
          <TabsContent value="attachments">
            <div className="topline">
              <div>
                <h1>Attachments & their effects</h1>
                <p className="muted">
                  Inspect the evidence before choosing a setup.
                </p>
              </div>
              <span className="pill neutral">
                {catalog.attachments.length} cataloged attachment types
              </span>
            </div>
            <div className="filters">
              <div className="field search">
                <label htmlFor="attachment-search">
                  Search attachments or slots
                </label>
                <div className="searchbox">
                  <Search aria-hidden="true" />
                  <Input
                    id="attachment-search"
                    value={attachmentQuery}
                    onChange={(e) => setAttachmentQuery(e.target.value)}
                    placeholder="Barrel, grip, suppressor…"
                  />
                </div>
              </div>
            </div>
            <Note>
              Only explicit weapon–attachment pairs are listed as reported
              compatible. An unlisted pair means unknown. General attachment
              reports are not applied as automatic stat bonuses.
            </Note>
            <div className="tableframe">
              <Table aria-label="Attachments">
                <TableHeader>
                  <TableRow>
                    <TableHead>Attachment</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Reported on</TableHead>
                    <TableHead>Evidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalog.attachments
                    .filter((a) =>
                      `${a.name} ${a.slot}`
                        .toLowerCase()
                        .includes(attachmentQuery.toLowerCase()),
                    )
                    .map((a) => {
                      const pairs = catalog.compatibility.filter(
                        (c) => c.attachmentId === a.id,
                      );
                      const claims = catalog.claims.filter(
                        (c) => c.attachmentId === a.id,
                      );
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            {a.name}
                          </TableCell>
                          <TableCell className="muted">{a.slot}</TableCell>
                          <TableCell>
                            {pairs.length ? (
                              <div className="flex flex-wrap gap-3">
                                {pairs.map((p) => (
                                  <button
                                    key={p.id}
                                    className="text-button"
                                    onClick={() => setDetailId(p.weaponId)}
                                  >
                                    {
                                      catalog.weapons.find(
                                        (w) => w.id === p.weaponId,
                                      )?.name
                                    }
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="muted">
                                Compatibility not yet documented
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-lg whitespace-normal">
                            {claims.map((c) => (
                              <p className="small mb-2" key={c.id}>
                                {c.summary}
                              </p>
                            ))}
                            <SourceLinks ids={a.sourceIds} catalog={catalog} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              {!catalog.attachments.some((a) =>
                `${a.name} ${a.slot}`
                  .toLowerCase()
                  .includes(attachmentQuery.toLowerCase()),
              ) && <NoResults />}
            </div>
          </TabsContent>
          <TabsContent value="missions">
            <div className="topline">
              <div>
                <h1>Mission reference</h1>
                <p className="muted">
                  Itacua starter set · {catalog.missions.length} missions · base
                  campaign
                </p>
              </div>
              <span className="pill warning">
                Full campaign & DLC import pending
              </span>
            </div>
            <div className="filters">
              <div className="field search">
                <label htmlFor="mission-search">
                  Search mission titles or province
                </label>
                <div className="searchbox">
                  <Search aria-hidden="true" />
                  <Input
                    id="mission-search"
                    placeholder="Amaru, Itacua…"
                    value={missionQuery}
                    onChange={(e) => setMissionQuery(e.target.value)}
                  />
                </div>
              </div>
              <label className="checklabel" htmlFor="show-spoilers">
                <Checkbox
                  id="show-spoilers"
                  checked={showSpoilers}
                  onCheckedChange={(v) => setShowSpoilers(v === true)}
                />
                Show summaries (spoilers)
              </label>
            </div>
            <div className="tableframe">
              <Table aria-label="Missions">
                <TableHeader>
                  <TableRow>
                    <TableHead>Mission</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Objective</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalog.missions
                    .filter((m) =>
                      `${m.name} ${m.province}`
                        .toLowerCase()
                        .includes(missionQuery.toLowerCase()),
                    )
                    .map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>{m.province}</TableCell>
                        <TableCell>
                          {showSpoilers ? m.objective : 'Hidden'}
                        </TableCell>
                        <TableCell className="whitespace-normal max-w-md">
                          {showSpoilers ? (
                            m.summary
                          ) : (
                            <span className="muted">
                              Enable summaries to reveal mission details.
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {!catalog.missions.some((m) =>
                `${m.name} ${m.province}`
                  .toLowerCase()
                  .includes(missionQuery.toLowerCase()),
              ) && <NoResults />}
            </div>
            <div className="mt-4">
              <SourceLinks ids={['missions']} catalog={catalog} />
            </div>
          </TabsContent>
          <TabsContent value="apparel">
            <div className="topline">
              <div>
                <h1>Apparel & cosmetics</h1>
                <p className="muted">Inventory research queue</p>
              </div>
              <span className="pill warning">0 records imported</span>
            </div>
            <Empty className="border">
              <Shirt size={32} className="muted" />
              <EmptyTitle>Apparel catalog has not been audited yet</EmptyTitle>
              <EmptyDescription>
                Next: headwear, tops, vests, pants, footwear, accessories,
                costumes and camouflages. Each item needs its exact name, unlock
                route, source and availability date.
              </EmptyDescription>
            </Empty>
            <Note>
              Historical store and event rewards need an availability check. No
              item is marked obtainable without evidence for the relevant
              version.
            </Note>
          </TabsContent>
          <TabsContent value="sources">
            <div className="topline sources-hero">
              <div>
                <span className="eyebrow">PROVENANCE / CREDITS / LINKS</span>
                <h1>Sources</h1>
                <p className="muted">
                  Who did the work, where it originated, and exactly what this
                  app used from it.
                </p>
              </div>
              <span className="pill neutral">
                <BookOpen size={13} />
                {catalog.sources.length} linked resources
              </span>
            </div>

            <section className="provenance-strip" aria-label="Data lineage">
              <div>
                <span>01</span>
                <strong>Community work</strong>
                <small>Testing, guides, captures, and research</small>
              </div>
              <div>
                <span>02</span>
                <strong>Original publication</strong>
                <small>Linked intact with contributor credit</small>
              </div>
              <div>
                <span>03</span>
                <strong>Preserved evidence</strong>
                <small>Workbook tabs, rows, notes, and uncertainty</small>
              </div>
              <div>
                <span>04</span>
                <strong>Normalized record</strong>
                <small>Source ID and locator retained in the app</small>
              </div>
            </section>

            <article className="lineage-card">
              <div>
                <span className="eyebrow">FEATURED LINEAGE</span>
                <h2>Historical Wildlands damage research</h2>
                <p>
                  The imported workbook is credited to Tsuyara /
                  Wildlands_Ghost. A Steam community thread preserves the
                  attribution trail to Darkdally’s scale-testing work. The app
                  keeps those as separate links because contribution lineage
                  matters and indirect credit should not be flattened into one
                  author claim. Siim’s independent 117-weapon field guide is
                  also retained as a separate test methodology and qualitative
                  cross-check.
                </p>
              </div>
              <div className="lineage-links">
                <SourceLinks
                  ids={[
                    'damage',
                    'damage-method',
                    'darkdally-steam',
                    'siim-numeric-data',
                  ]}
                  catalog={catalog}
                />
              </div>
            </article>

            <div className="source-groups">
              {sourceGroups.map((group) => (
                <section className="source-group" key={group.id}>
                  <div className="source-group-heading">
                    <div>
                      <h2>{group.title}</h2>
                      <p>{group.description}</p>
                    </div>
                    <span className="pill neutral">{group.sources.length}</span>
                  </div>
                  <div className="source-ledger">
                    {group.sources.map((source) => (
                      <article className="source-entry" key={source.id}>
                        <div className="source-entry-main">
                          <div className="source-entry-title">
                            <span
                              className={`pill ${source.kind === 'research_lead' ? 'warning' : 'neutral'}`}
                            >
                              {source.kind.replaceAll('_', ' ')}
                            </span>
                            <h3>{source.title}</h3>
                          </div>
                          <p>{source.notes}</p>
                        </div>
                        <div className="source-entry-use">
                          <span>USED FOR</span>
                          <strong>{sourceContribution(source)}</strong>
                        </div>
                        <div className="source-entry-meta">
                          <span>{source.era}</span>
                          <span>Accessed {source.accessedAt}</span>
                          <a href={source.url} target="_blank" rel="noreferrer">
                            Open source <ArrowUpRight aria-hidden="true" />
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <Note>
              We link and credit the original work, import only the fields we
              can trace, preserve uncertainty markers, and keep research leads
              separate from evidence already used by the app.
            </Note>
          </TabsContent>
          <TabsContent value="wiki">
            <div className="topline wiki-hero">
              <div>
                <span className="eyebrow">FIELD WIKI / REAL-WORLD REFERENCE</span>
                <h1>Wildlands weapons with confirmed real-world matches</h1>
                <p className="muted">
                  This list is intentionally narrow: it includes only weapons
                  represented directly in Wildlands. Similar platforms, family
                  relatives, and absent firearms are not listed as matches.
                </p>
              </div>
              <span className="pill warning">Direct matches only</span>
            </div>

            <section className="real-world-reference-wiki" aria-label="Confirmed real-world weapon references">
              {catalog.realWorldWeapons.map((weapon) => (
                <RealWorldReferenceCard
                  key={weapon.id}
                  weapon={weapon}
                  catalog={catalog}
                  active={realWorldReferenceId === weapon.id}
                  onOpenWildlandsWeapon={(id) => {
                    setDetailId(id);
                    setTab('weapons');
                  }}
                />
              ))}
            </section>

            <Note>
              The M110 SASS, AN-94, and other weapons that are not represented
              directly in Wildlands are deliberately excluded from this wiki.
              A shared manufacturer, caliber, role, or weapon family is not an
              exact in-game match.
            </Note>

            <div className="stat-grid">
              <div className="stat">
                <span>Cataloged weapons</span>
                <strong>{catalog.weapons.length}</strong>
                <span>Case inventory plus workbook records</span>
              </div>
              <div className="stat">
                <span>Measured weapon records</span>
                <strong>{measuredCount}</strong>
                <span>Archived source-sheet configurations</span>
              </div>
              <div className="stat">
                <span>Weapon-case baseline</span>
                <strong>{caseCount}</strong>
                <span>Audited Bolivia case entries</span>
              </div>
              <div className="stat">
                <span>Evidence sources</span>
                <strong>{catalog.sources.length}</strong>
                <span>Guides, tests, references, and leads</span>
              </div>
            </div>

            <div className="wiki-grid">
              <article className="wiki-card">
                <span className="eyebrow">01 / Mission brief</span>
                <h2>Pick a weapon for the job</h2>
                <p>
                  The Weapons view is built for a quick loadout decision: pick a
                  priority, filter a class, scan the compact metrics, then open
                  a dossier when the tradeoff matters.
                </p>
                <p>
                  Standard configuration is the baseline. Attachment-specific
                  comparisons belong in the Damage Lab and future build views,
                  so the primary list stays readable on a phone.
                </p>
              </article>
              <article className="wiki-card">
                <span className="eyebrow">02 / Metric legend</span>
                <h2>What the numbers mean</h2>
                <dl className="wiki-definitions">
                  <div>
                    <dt>Hits</dt>
                    <dd>
                      The armory uses the archived semi-auto body-hit column for
                      the selected Tier Mode and leaves a missing value unknown.
                      Damage Lab retains semi-auto and full-auto records
                      separately.
                    </dd>
                  </div>
                  <div>
                    <dt>Damage</dt>
                    <dd>
                      Source damage value or range for the standard barrel. A
                      “?” or “+” stays visible because it is part of the source
                      evidence.
                    </dd>
                  </div>
                  <div>
                    <dt>RPM / DPS</dt>
                    <dd>
                      Workbook cadence and calculated damage-per-second where a
                      numeric source value exists.
                    </dd>
                  </div>
                  <div>
                    <dt>Reload / Mag</dt>
                    <dd>
                      Measured reload seconds and the largest recorded magazine
                      across the source configurations.
                    </dd>
                  </div>
                </dl>
              </article>
              <article className="wiki-card">
                <span className="eyebrow">03 / Evidence rules</span>
                <h2>How we avoid fake precision</h2>
                <ul className="wiki-list">
                  <li>
                    Every imported record keeps a source ID and a source
                    locator.
                  </li>
                  <li>
                    Blank cells stay “Not recorded”; they are not guessed from
                    the in-game bar.
                  </li>
                  <li>
                    When numeric body hits exist, a clearly labeled damage band
                    is derived from the workbook’s 1,000-HP reference target; it
                    is never presented as a direct measurement.
                  </li>
                  <li>
                    Historical workbook values are labeled as historical,
                    theoretical, or uncertain when applicable.
                  </li>
                  <li>
                    Case inventory and workbook-only variants are intentionally
                    separated.
                  </li>
                </ul>
              </article>
              <article className="wiki-card">
                <span className="eyebrow">04 / Test context</span>
                <h2>Semi-auto vs full-auto</h2>
                <p>
                  The archived sheet reports both modes, but full-auto is a
                  cadence model—not a promise of field performance. Recoil,
                  burst control, misses, target movement, attachments, and range
                  falloff can change the result.
                </p>
                <p className="muted">
                  Use the values to compare a test condition, not to erase your
                  trigger-control experience.
                </p>
              </article>
            </div>

            <section className="wiki-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">CREDITS / RESEARCH TRAIL</span>
                  <h2>People and resources behind the index</h2>
                </div>
                <span className="row-meta">
                  See Sources for the full ledger
                </span>
              </div>
              <div className="wiki-credit-list">
                {catalog.sources.map((source) => (
                  <a
                    className="wiki-credit"
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    key={source.id}
                  >
                    <span>
                      <strong>{source.title}</strong>
                      <small>
                        {source.kind.replaceAll('_', ' ')} · {source.era}
                      </small>
                    </span>
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                ))}
              </div>
            </section>

            <Note>
              This is a living research index, not an official Ubisoft data
              source. If a value conflicts with your in-game test, keep the test
              context and report the discrepancy rather than silently
              overwriting the evidence trail.
            </Note>
          </TabsContent>
          <TabsContent value="experiments">
            <ExperimentPanel
              catalog={catalog}
              query={experimentQuery}
              onQueryChange={setExperimentQuery}
              statusFilter={experimentStatusFilter}
              onStatusFilterChange={setExperimentStatusFilter}
              priorityFilter={experimentPriorityFilter}
              onPriorityFilterChange={setExperimentPriorityFilter}
              onOpenWeapon={(id) => {
                setDetailId(id);
                setTab('weapons');
              }}
            />
          </TabsContent>
          <TabsContent value="damage-lab">
            <DamageLab
              catalog={catalog}
              workbook={damageWorkbook}
              loading={damageWorkbookLoading}
              error={damageWorkbookError}
            />
          </TabsContent>
        </Tabs>
        {tab === 'weapons' && selected.length > 0 && (
          <a className="compare-jump" href="#comparison">
            Compare {selected.length} selected{' '}
            {selected.length === 1 ? 'weapon' : 'weapons'} ↓
          </a>
        )}
        <footer>
          <span>
            Independent fan project. Ghost Recon and Wildlands are Ubisoft
            trademarks.
          </span>
          <span>
            Data snapshot {catalog.updatedAt} · {storage}
          </span>
        </footer>
      </main>
    </>
  );
}
