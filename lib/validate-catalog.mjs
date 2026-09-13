/** Validate the curated release before it can become a published snapshot. */
export function validateCatalog(data) {
  const fail = (message) => {
    throw new Error(`Invalid catalog: ${message}`);
  };
  const nonempty = (value) =>
    typeof value === 'string' && value.trim().length > 0;
  if (
    !data ||
    data.schemaVersion !== 1 ||
    data.gameId !== 'wildlands' ||
    !nonempty(data.release)
  )
    fail('unsupported schema, game or release');
  if (!nonempty(data.updatedAt) || !nonempty(data.coverageNote))
    fail('missing release metadata');
  const tables = [
    'sources',
    'weapons',
    'attachments',
    'compatibility',
    'measurements',
    'claims',
    'missions',
    'apparel',
  ];
  for (const key of tables) {
    if (!Array.isArray(data[key])) fail(`${key} must be an array`);
    const seen = new Set();
    for (const row of data[key]) {
      if (!row || !nonempty(row.id) || seen.has(row.id))
        fail(`${key}: missing or duplicate ID`);
      seen.add(row.id);
      if (key !== 'sources' && key !== 'claims' && row.gameId !== data.gameId)
        fail(`${key}: cross-game record`);
    }
  }
  const sources = new Set(data.sources.map((s) => s.id));
  for (const s of data.sources) {
    let url;
    try {
      url = new URL(s.url);
    } catch {
      fail(`source ${s.id}: invalid URL`);
    }
    if (url.protocol !== 'https:' || !nonempty(s.title))
      fail(`source ${s.id}: invalid title or protocol`);
    if (
      ![
        'official',
        'guide',
        'community_test',
        'research_lead',
        'game_capture',
        'extracted',
      ].includes(s.kind)
    )
      fail('unknown source kind');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.accessedAt))
      fail('missing source access date');
  }
  for (const key of tables.filter((t) => t !== 'sources'))
    for (const row of data[key]) {
      if (
        !Array.isArray(row.sourceIds) ||
        !row.sourceIds.length ||
        row.sourceIds.some((id) => !sources.has(id))
      )
        fail(`${key}/${row.id}: missing source`);
      if (new Set(row.sourceIds).size !== row.sourceIds.length)
        fail(`${key}/${row.id}: duplicate source`);
    }
  const weapons = new Set(data.weapons.map((w) => w.id));
  const attachments = new Map(data.attachments.map((a) => [a.id, a]));
  for (const w of data.weapons) {
    if (
      ![w.name, w.category, w.province, w.acquisition, w.variant].every(
        nonempty,
      ) ||
      !Array.isArray(w.aliases) ||
      w.aliases.some((a) => !nonempty(a))
    )
      fail(`weapon ${w.id}: invalid fields`);
  }
  for (const a of data.attachments)
    if (!nonempty(a.name) || !nonempty(a.slot)) fail('invalid attachment');
  const pairs = new Map();
  for (const c of data.compatibility) {
    const key = `${c.weaponId}/${c.attachmentId}`;
    if (!weapons.has(c.weaponId) || !attachments.has(c.attachmentId))
      fail('dangling compatibility link');
    if (pairs.has(key)) fail('duplicate compatibility pair');
    if (
      !['reported', 'verified', 'incompatible', 'disputed'].includes(
        c.status,
      ) ||
      !nonempty(c.sourceLocator)
    )
      fail('invalid compatibility evidence');
    pairs.set(key, c.status);
  }
  const observations = new Set();
  for (const m of data.measurements) {
    if (
      !['reported', 'verified'].includes(
        pairs.get(`${m.weaponId}/${m.attachmentId}`),
      )
    )
      fail('measurement without supported compatibility');
    if (attachments.get(m.attachmentId).slot !== 'Barrel')
      fail('schema v1 measurement needs a barrel configuration');
    if (
      m.metric !== 'body_shots_to_kill' ||
      m.unit !== 'shots' ||
      !Number.isInteger(m.value) ||
      m.value <= 0
    )
      fail('invalid shot count or unit');
    if (
      !['Non-tier', 'Tier One'].includes(m.mode) ||
      !nonempty(m.sourceLocator) ||
      m.evidence !== 'community_test'
    )
      fail('invalid measurement context');
    if (
      m.target !== 'Unidad Heavy' ||
      m.hitZone !== 'Body' ||
      m.fireMode !== 'Semi-auto column'
    )
      fail(
        'schema v1 comparator requires the documented target and firing context',
      );
    const key = `${m.weaponId}/${m.attachmentId}/${m.mode}`;
    if (observations.has(key))
      fail(
        'ambiguous comparison: multiple observations for one v1 comparison cell',
      );
    observations.add(key);
    for (const field of [
      'distanceM',
      'alertState',
      'platform',
      'gameBuild',
      'weaponLevel',
      'suppressor',
      'skills',
      'fullLoadout',
      'sampleCount',
    ]) {
      if (!(field in m)) fail(`missing explicit condition ${field}`);
    }
    if (
      m.distanceM !== null &&
      (!Number.isFinite(m.distanceM) || m.distanceM < 0)
    )
      fail('invalid distance');
    if (
      m.sampleCount !== null &&
      (!Number.isInteger(m.sampleCount) || m.sampleCount <= 0)
    )
      fail('invalid trial count');
  }
  for (const c of data.claims)
    if (
      !attachments.has(c.attachmentId) ||
      !nonempty(c.summary) ||
      !nonempty(c.scope)
    )
      fail('invalid attachment claim');
  for (const m of data.missions)
    if (
      ![m.name, m.province, m.content, m.summary, m.objective].every(
        nonempty,
      ) ||
      typeof m.spoiler !== 'boolean'
    )
      fail('invalid mission');
  for (const a of data.apparel)
    if (![a.name, a.category].every(nonempty)) fail('invalid apparel');
  return data;
}
