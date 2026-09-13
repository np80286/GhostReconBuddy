'use client';

import { useEffect, useState } from 'react';
import {
  Crosshair,
  Search,
  Info,
  ArrowUpRight,
  Database,
  Layers,
  Map,
  BookOpen,
  Shirt,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Empty, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import {
  filterWeapons,
  findMeasurement,
  type Catalog,
  type Weapon,
} from '@/lib/catalog';

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
      {ids.map((id) => {
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

export function DatabaseApp({ initialCatalog }: { initialCatalog: Catalog }) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [storage, setStorage] = useState('Curated snapshot');
  const [storageError, setStorageError] = useState(false);
  const [tab, setTab] = useState('weapons');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All classes');
  const [province, setProvince] = useState('All provinces');
  const [measuredOnly, setMeasuredOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [mode, setMode] = useState('Non-tier');
  const [barrel, setBarrel] = useState('Standard barrel');
  const [attachmentQuery, setAttachmentQuery] = useState('');
  const [missionQuery, setMissionQuery] = useState('');
  const [showSpoilers, setShowSpoilers] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/catalog', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Catalog unavailable');
        const result = await response.json();
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

  const weapons = filterWeapons(
    catalog,
    query,
    category,
    province,
    measuredOnly,
  );
  const detail = catalog.weapons.find((w) => w.id === detailId);
  const selectedWeapons = catalog.weapons.filter((w) =>
    selected.includes(w.id),
  );
  const barrelId = barrel.toLowerCase().replaceAll(' ', '-');
  const measuredCount = new Set(catalog.measurements.map((m) => m.weaponId))
    .size;
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
    setProvince('All provinces');
    setMeasuredOnly(false);
  }
  function detailMeasurements(w: Weapon) {
    return catalog.measurements.filter(
      (m) => m.weaponId === w.id && m.mode === mode,
    );
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
            <small>Wildlands / Field reference</small>
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
              <Map />
              Missions
            </TabsTrigger>
            <TabsTrigger value="apparel">
              <Shirt />
              Apparel
            </TabsTrigger>
            <TabsTrigger value="sources">
              <BookOpen />
              Sources & coverage
            </TabsTrigger>
          </TabsList>
          {storageError && (
            <Note>
              Live database unavailable. Showing the bundled research snapshot;
              these records may be older than the live database.
            </Note>
          )}
          <TabsContent value="weapons">
            <div className="topline">
              <div>
                <h1>Find your next loadout.</h1>
                <p className="muted">
                  Search weapons, inspect reported attachments, and compare
                  measured results.
                </p>
              </div>
              <span className="pill warning">
                Partial catalog · current-build testing pending
              </span>
            </div>
            <div className="weapons-layout">
              <div>
                <div className="filters">
                  <div className="field search">
                    <label htmlFor="weapon-search">
                      Weapon, alias or province
                    </label>
                    <div className="searchbox">
                      <Search aria-hidden="true" />
                      <Input
                        id="weapon-search"
                        placeholder="Try M4A1, SR-25 or Montuyoc…"
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
                    label="Location"
                    value={province}
                    options={[
                      'All provinces',
                      ...[
                        ...new Set(catalog.weapons.map((w) => w.province)),
                      ].sort(),
                    ]}
                    onChange={setProvince}
                  />
                  <label className="checklabel">
                    <Checkbox
                      checked={measuredOnly}
                      onCheckedChange={(v) => setMeasuredOnly(v === true)}
                    />
                    Has measurements
                  </label>
                </div>
                <div className="resultsline">
                  <span aria-live="polite">
                    {weapons.length} of {catalog.weapons.length} cataloged
                    weapons
                  </span>
                  <button className="text-button" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>
                <div className="tableframe">
                  <Table aria-label="Wildlands weapons">
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <span className="sr-only">Compare</span>
                        </TableHead>
                        <TableHead>Weapon</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Found in</TableHead>
                        <TableHead>Evidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weapons.map((w) => (
                        <TableRow
                          key={w.id}
                          data-picked={selected.includes(w.id)}
                        >
                          <TableCell>
                            <Checkbox
                              aria-label={`Compare ${w.name}`}
                              checked={selected.includes(w.id)}
                              disabled={
                                selected.length >= 3 && !selected.includes(w.id)
                              }
                              onCheckedChange={() => toggleWeapon(w.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              className="weapon-name"
                              onClick={() => setDetailId(w.id)}
                            >
                              {w.name}
                            </button>
                            <div className="row-meta">{w.variant}</div>
                          </TableCell>
                          <TableCell className="muted">{w.category}</TableCell>
                          <TableCell>
                            {w.province}
                            <div className="row-meta">{w.acquisition}</div>
                          </TableCell>
                          <TableCell>
                            {catalog.measurements.some(
                              (m) => m.weaponId === w.id,
                            ) ? (
                              <span className="pill">
                                Historical measurements
                              </span>
                            ) : (
                              <span className="muted small">Catalog only</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {!weapons.length && <NoResults />}
                </div>
                <div className="resultsline" style={{ border: 0 }}>
                  <span>
                    Select up to 3 weapons to compare. Open a weapon name for
                    details.
                  </span>
                  <span>{selected.length} / 3 selected</span>
                </div>
              </div>
              <aside className="context-aside">
                <div className="aside-block">
                  <span className="eyebrow">What do we know?</span>
                  <h3 style={{ marginTop: 12 }}>
                    {measuredCount} weapons with test data
                  </h3>
                  <p>
                    Historical body-shot results against Unidad Heavy targets.
                    Exact build and several test conditions are unknown.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => {
                      clearFilters();
                      setMeasuredOnly(true);
                    }}
                  >
                    Show measured weapons →
                  </button>
                </div>
                <div className="aside-block">
                  <h3>Beyond the stat bars</h3>
                  <p>
                    Displayed stats, community claims, and measured outcomes
                    belong in separate records. Missing values stay unknown.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setTab('sources')}
                  >
                    Inspect sources & gaps →
                  </button>
                </div>
              </aside>
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
                  <Picker
                    label="Reported barrel"
                    value={barrel}
                    options={['Standard barrel', 'Short barrel', 'Long barrel']}
                    onChange={setBarrel}
                  />
                </div>
                <p className="muted small mt-3">
                  Unidad Heavy · body hits · semi-auto column · lower shot count
                  is better. This is a source comparison, not a general weapon
                  ranking.
                </p>
                <div className="compare-grid">
                  {selectedWeapons.map((w) => {
                    const measurement = findMeasurement(
                      catalog,
                      w.id,
                      barrelId,
                      mode,
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
              <label className="checklabel">
                <Checkbox
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
            <div className="topline">
              <div>
                <h1>A database you can question.</h1>
                <p className="muted">
                  Every imported record points to its evidence. Coverage is
                  counted, not assumed.
                </p>
              </div>
              <span className="pill neutral">
                <Database size={13} />
                {storage}
              </span>
            </div>
            <div className="stat-grid">
              <div className="stat">
                <span>Weapons cataloged</span>
                <strong>{catalog.weapons.length}</strong>
                <span>Whole-game total not audited</span>
              </div>
              <div className="stat">
                <span>Reported compatible pairs</span>
                <strong>{catalog.compatibility.length}</strong>
                <span>Barrel observations only</span>
              </div>
              <div className="stat">
                <span>Historical measurements</span>
                <strong>{catalog.measurements.length}</strong>
                <span>{measuredCount} weapons · 2 modes</span>
              </div>
              <div className="stat">
                <span>Current-build retests</span>
                <strong>0</strong>
                <span>Independent validation pending</span>
              </div>
            </div>
            <Note>
              {catalog.coverageNote} Current gaps include the full attachment
              matrix, unique and store variants, all mission chains, apparel,
              ballistics, and controlled current-build tests.
            </Note>
            <div className="source-list">
              {catalog.sources.map((s) => (
                <article className="source-card" key={s.id}>
                  <div className="split-line">
                    <span
                      className={`pill ${s.kind === 'research_lead' ? 'warning' : 'neutral'}`}
                    >
                      {s.kind.replaceAll('_', ' ')}
                    </span>
                    <span className="row-meta">{s.era}</span>
                  </div>
                  <h3 className="mt-4">{s.title}</h3>
                  <p>{s.notes}</p>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    Open original source{' '}
                    <ArrowUpRight className="inline size-3" />
                  </a>
                  <div className="row-meta mt-3">Accessed {s.accessedAt}</div>
                </article>
              ))}
            </div>
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
      <Sheet
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      >
        <SheetContent
          className="!w-full !max-w-xl overflow-y-auto !p-6"
          side="right"
        >
          {detail && (
            <>
              <SheetHeader className="!p-0 !mb-4">
                <span className="eyebrow">Weapon dossier / Wildlands</span>
                <SheetTitle className="!text-3xl">{detail.name}</SheetTitle>
                <SheetDescription>
                  {detail.category} · {detail.variant}
                </SheetDescription>
              </SheetHeader>
              <div className="panel-section">
                <h3>Where to find it</h3>
                <p>
                  {detail.province} · {detail.acquisition}
                </p>
                <p className="muted small my-3">
                  Province-level reference. Exact map coordinates and current
                  availability have not been audited.
                </p>
                <SourceLinks ids={detail.sourceIds} catalog={catalog} />
              </div>
              <div className="panel-section">
                <h3>Reported attachment compatibility</h3>
                <div className="flex flex-wrap gap-2">
                  {catalog.compatibility
                    .filter((c) => c.weaponId === detail.id)
                    .map((c) => (
                      <span className="pill neutral" key={c.id}>
                        {
                          catalog.attachments.find(
                            (a) => a.id === c.attachmentId,
                          )?.name
                        }
                      </span>
                    ))}
                </div>
                <p className="muted small mt-3">
                  {catalog.compatibility.some((c) => c.weaponId === detail.id)
                    ? 'These barrel configurations appear in the historical damage sheet. Other slots have not been cataloged.'
                    : 'No weapon-specific attachment pairs documented yet. This does not mean the weapon has no attachments.'}
                </p>
              </div>
              <div className="panel-section">
                <h3>Historical barrel comparison</h3>
                <Picker
                  label="Reported mode"
                  value={mode}
                  options={['Non-tier', 'Tier One']}
                  onChange={setMode}
                />
                <p className="muted small my-3">
                  Unidad Heavy · body shots to kill · semi-auto column
                </p>
                {detailMeasurements(detail).length ? (
                  <>
                    <Table aria-label={`${detail.name} barrel measurements`}>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Configuration</TableHead>
                          <TableHead className="number">Shots</TableHead>
                          <TableHead>Source row</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailMeasurements(detail).map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>
                              {
                                catalog.attachments.find(
                                  (a) => a.id === m.attachmentId,
                                )?.name
                              }
                            </TableCell>
                            <TableCell className="number">{m.value}</TableCell>
                            <TableCell>
                              {m.sourceLocator.split('row ')[1]}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-3">
                      <SourceLinks
                        ids={['damage', 'damage-method']}
                        catalog={catalog}
                      />
                    </div>
                  </>
                ) : (
                  <p className="muted">
                    No measurements imported for this weapon.
                  </p>
                )}
                <Note>
                  Exact build, platform, distance, alert state, weapon level,
                  skills, suppressor state, full loadout and trial count are
                  unknown. These results are not independently reproduced.
                </Note>
              </div>
              <div className="panel-section">
                <h3>Displayed game statistics</h3>
                <p className="muted small">
                  Not yet captured. No damage, accuracy or handling bar has been
                  estimated or converted to a performance score.
                </p>
              </div>
              <button
                className="text-button mt-4"
                disabled={selected.length >= 3 && !selected.includes(detail.id)}
                onClick={() => {
                  toggleWeapon(detail.id);
                  setTab('weapons');
                  setDetailId(null);
                }}
              >
                {selected.includes(detail.id)
                  ? 'Remove from comparison'
                  : selected.length >= 3
                    ? 'Comparison full (3 weapons)'
                    : 'Add to comparison →'}
              </button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
