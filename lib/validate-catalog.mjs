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
  const caseAudit = data.coverage?.boliviaWeaponCaseInventory;
  if (
    !caseAudit ||
    !nonempty(caseAudit.auditSourceId) ||
    !Number.isInteger(caseAudit.recordCount) ||
    caseAudit.recordCount < 1
  )
    fail('missing or invalid Bolivia weapon-case coverage audit');
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
  if (!sources.has(caseAudit.auditSourceId))
    fail(
      `weapon-case audit references unknown source: ${caseAudit.auditSourceId}`,
    );
  const sheetAudit = data.coverage.weaponDamageSheet;
  if (
    !sheetAudit ||
    !nonempty(sheetAudit.sourceId) ||
    !Number.isInteger(sheetAudit.weaponCount) ||
    !Number.isInteger(sheetAudit.configurationCount) ||
    !Number.isInteger(sheetAudit.damageProfileCount) ||
    !nonempty(sheetAudit.scope) ||
    !sources.has(sheetAudit.sourceId)
  )
    fail('missing or invalid weapon damage-sheet coverage audit');
  const workbookAudit = data.coverage.damageWorkbook;
  if (
    !workbookAudit ||
    workbookAudit.sourceId !== 'damage' ||
    !sources.has(workbookAudit.sourceId) ||
    workbookAudit.sheetCount !== 11 ||
    !Number.isInteger(workbookAudit.cellCount) ||
    workbookAudit.cellCount < 1 ||
    !Number.isInteger(workbookAudit.formulaCount) ||
    workbookAudit.formulaCount < 0 ||
    !/^[a-f0-9]{64}$/.test(workbookAudit.archiveSha256) ||
    !/^[a-f0-9]{64}$/.test(workbookAudit.snapshotSha256) ||
    !nonempty(workbookAudit.scope)
  )
    fail('missing or invalid full damage workbook coverage audit');
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
  if (!Array.isArray(data.realWorldWeapons))
    fail('realWorldWeapons must be an array');
  const realWeaponIds = new Set();
  for (const weapon of data.realWorldWeapons) {
    if (
      !weapon ||
      !nonempty(weapon.id) ||
      realWeaponIds.has(weapon.id) ||
      ![weapon.name, weapon.manufacturer, weapon.caliber, weapon.weaponClass, weapon.family, weapon.notes].every(nonempty) ||
      ![weapon.referenceUrl, weapon.referenceLabel].every(nonempty) ||
      !Array.isArray(weapon.aliases) ||
      weapon.aliases.some((alias) => !nonempty(alias)) ||
      weapon.relationship !== 'DIRECT' ||
      !Array.isArray(weapon.sourceIds) ||
      !weapon.sourceIds.length ||
      weapon.sourceIds.some((id) => !sources.has(id)) ||
      new Set(weapon.sourceIds).size !== weapon.sourceIds.length
    )
      fail(`invalid real-world weapon mapping: ${weapon?.id ?? 'unknown'}`);
    for (const url of [weapon.referenceUrl, weapon.thumbnailUrl, weapon.imagePageUrl].filter(Boolean)) {
      try {
        if (new URL(url).protocol !== 'https:') throw new Error();
      } catch {
        fail(`real-world weapon has an invalid reference URL: ${weapon.id}`);
      }
    }
    realWeaponIds.add(weapon.id);
    if (!weapons.has(weapon.wildlandsWeaponId)) {
      fail(`real-world weapon has an unknown Wildlands match: ${weapon.id}`);
    }
  }
  if (!Array.isArray(data.weaponSheetStats))
    fail('weaponSheetStats must be an array');
  const sheetWeaponIds = new Set();
  let sheetConfigurationCount = 0;
  for (const entry of data.weaponSheetStats) {
    if (
      !weapons.has(entry.weaponId) ||
      sheetWeaponIds.has(entry.weaponId) ||
      !Array.isArray(entry.sourceIds) ||
      !entry.sourceIds.includes(sheetAudit.sourceId) ||
      !Array.isArray(entry.configurations) ||
      !entry.configurations.length
    )
      fail(`invalid weapon damage-sheet record: ${entry.weaponId}`);
    sheetWeaponIds.add(entry.weaponId);
    for (const configuration of entry.configurations) {
      if (
        !nonempty(configuration.barrel) ||
        !nonempty(configuration.sourceLocator)
      )
        fail(`invalid weapon damage-sheet configuration: ${entry.weaponId}`);
      sheetConfigurationCount += 1;
    }
  }
  if (
    sheetWeaponIds.size !== sheetAudit.weaponCount ||
    sheetConfigurationCount !== sheetAudit.configurationCount
  )
    fail(
      `weapon damage-sheet coverage count mismatch: expected ${sheetAudit.weaponCount} weapons / ${sheetAudit.configurationCount} configurations, found ${sheetWeaponIds.size} / ${sheetConfigurationCount}`,
    );
  if (!Array.isArray(data.damageProfiles))
    fail('damageProfiles must be an array');
  const damageProfileIds = new Set();
  for (const profile of data.damageProfiles) {
    if (
      !weapons.has(profile.weaponId) ||
      damageProfileIds.has(profile.weaponId) ||
      !nonempty(profile.sourceLocator)
    )
      fail(`invalid weapon damage profile: ${profile.weaponId}`);
    damageProfileIds.add(profile.weaponId);
  }
  if (damageProfileIds.size !== sheetAudit.damageProfileCount)
    fail(
      `weapon damage profile count mismatch: expected ${sheetAudit.damageProfileCount}, found ${damageProfileIds.size}`,
    );
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
  const weaponCaseRecords = data.weapons.filter((weapon) =>
    weapon.acquisition.startsWith('Weapon case'),
  );
  if (weaponCaseRecords.length !== caseAudit.recordCount)
    fail(
      `weapon-case coverage count mismatch: expected ${caseAudit.recordCount}, found ${weaponCaseRecords.length}`,
    );
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
