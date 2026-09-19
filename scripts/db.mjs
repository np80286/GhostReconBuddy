import { Client } from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateCatalog } from '../lib/validate-catalog.mjs';

const command = process.argv[2];
if (!['migrate', 'seed'].includes(command))
  throw new Error('Use npm run db:migrate or npm run db:seed');
if (!process.env.DATABASE_URL)
  throw new Error('Set DATABASE_URL in .env first');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});
const hash = (value) => createHash('sha256').update(value).digest('hex');
try {
  await client.connect();
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(604413271)');
  if (command === 'migrate') {
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const directory = new URL('../db/migrations/', import.meta.url);
    for (const file of (await readdir(directory))
      .filter((f) => f.endsWith('.sql'))
      .sort()) {
      const sql = await readFile(new URL(file, directory), 'utf8');
      const existing = await client.query(
        'SELECT sha256 FROM schema_migrations WHERE name=$1',
        [file],
      );
      if (existing.rowCount) {
        if (existing.rows[0].sha256 !== hash(sql))
          throw new Error(`Applied migration changed: ${file}`);
        continue;
      }
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (name, sha256) VALUES ($1,$2)',
        [file, hash(sql)],
      );
      console.log(`Applied ${file}`);
    }
  } else {
    const raw = await readFile(
      new URL('../data/catalog.json', import.meta.url),
      'utf8',
    );
    const d = JSON.parse(raw);
    validateCatalog(d);
    const workbook = JSON.parse(
      await readFile(
        new URL('../data/damage-workbook.json', import.meta.url),
        'utf8',
      ),
    );
    const workbookAudit = d.coverage.damageWorkbook;
    const workbookCellCount = workbook.sheets.reduce(
      (sum, sheet) =>
        sum + sheet.rows.reduce((rows, row) => rows + row.cells.length, 0),
      0,
    );
    const workbookFormulaCount = workbook.sheets.reduce(
      (sum, sheet) =>
        sum +
        sheet.rows.reduce(
          (rows, row) => rows + row.cells.filter((cell) => cell.formula).length,
          0,
        ),
      0,
    );
    if (
      workbook.sha256 !== workbookAudit.archiveSha256 ||
      workbook.sheetCount !== workbookAudit.sheetCount ||
      workbook.cellCount !== workbookAudit.cellCount ||
      workbook.formulaCount !== workbookAudit.formulaCount ||
      workbookCellCount !== workbookAudit.cellCount ||
      workbookFormulaCount !== workbookAudit.formulaCount
    )
      throw new Error(
        'Invalid catalog: full workbook snapshot does not match its audit',
      );
    const workbookDigest = hash(JSON.stringify(workbook));
    if (workbookDigest !== workbookAudit.snapshotSha256)
      throw new Error('Invalid catalog: full workbook snapshot hash mismatch');
    const digest = hash(JSON.stringify(d));
    const existing = await client.query(
      'SELECT content_sha256 FROM catalog_releases WHERE id=$1',
      [d.release],
    );
    if (existing.rowCount) {
      if (existing.rows[0].content_sha256 !== digest)
        throw new Error(
          'Release content changed: increment catalog.release to preserve history',
        );
      console.log(
        `Release ${d.release} already imported; published pointer unchanged.`,
      );
      const archivedWorkbook = await client.query(
        'SELECT content_sha256 FROM damage_workbooks WHERE release_id=$1',
        [d.release],
      );
      if (archivedWorkbook.rows[0]?.content_sha256 !== workbookDigest)
        throw new Error(
          'Invalid catalog: published damage workbook snapshot mismatch',
        );
    } else {
      await client.query(
        'INSERT INTO catalog_releases (id,game_id,schema_version,content_sha256,snapshot) VALUES ($1,$2,$3,$4,$5)',
        [d.release, d.gameId, d.schemaVersion, digest, JSON.stringify(d)],
      );
      for (const s of d.sources)
        await client.query(
          'INSERT INTO sources VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [
            d.release,
            s.id,
            s.title,
            s.url,
            s.kind,
            s.accessedAt,
            JSON.stringify(s),
          ],
        );
      for (const w of d.weapons)
        await client.query(
          'INSERT INTO weapons VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [
            d.release,
            w.gameId,
            w.id,
            w.name,
            w.category,
            w.province,
            w.variant,
            JSON.stringify(w),
          ],
        );
      for (const weapon of d.weaponSheetStats)
        for (const [index, config] of weapon.configurations.entries())
          await client.query(
            `INSERT INTO weapon_sheet_configs
              (release_id,weapon_id,config_index,barrel,tier_one,non_tier,rpm,rounds_per_second,shot_interval_seconds,time_to_kill,tier_one_damage,magazine,reload_seconds,aim_delay,aim_sensitivity,source_locator)
             VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,$16)`,
            [
              d.release,
              weapon.weaponId,
              index + 1,
              config.barrel,
              JSON.stringify(config.tierOne),
              JSON.stringify(config.nonTier),
              JSON.stringify(config.rpm),
              JSON.stringify(config.roundsPerSecond),
              JSON.stringify(config.shotIntervalSeconds),
              JSON.stringify(config.timeToKill),
              JSON.stringify(config.tierOneDamage),
              JSON.stringify(config.magazine),
              JSON.stringify(config.reloadSeconds),
              JSON.stringify(config.aimDelay),
              JSON.stringify(config.aimSensitivity),
              config.sourceLocator,
            ],
          );
      for (const profile of d.damageProfiles)
        await client.query(
          `INSERT INTO weapon_damage_profiles
            (release_id,weapon_id,source_name,damage_by_barrel,rpm,dps_by_barrel,target_bands,source_locator)
           VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8)`,
          [
            d.release,
            profile.weaponId,
            profile.sourceName,
            JSON.stringify(profile.damageByBarrel),
            JSON.stringify(profile.rpm),
            JSON.stringify(profile.dpsByBarrel),
            JSON.stringify(profile.targetBands),
            profile.sourceLocator,
          ],
        );
      for (const a of d.attachments)
        await client.query(
          'INSERT INTO attachments VALUES ($1,$2,$3,$4,$5,$6)',
          [d.release, a.gameId, a.id, a.name, a.slot, JSON.stringify(a)],
        );
      for (const c of d.compatibility)
        await client.query(
          'INSERT INTO compatibility VALUES ($1,$2,$3,$4,$5,$6)',
          [
            d.release,
            c.id,
            c.weaponId,
            c.attachmentId,
            c.status,
            c.sourceLocator,
          ],
        );
      for (const m of d.measurements) {
        const {
          id,
          weaponId,
          attachmentId,
          metric,
          value,
          unit,
          mode,
          evidence,
          sourceLocator,
          ...conditions
        } = m;
        await client.query(
          'INSERT INTO measurements VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
          [
            d.release,
            id,
            weaponId,
            attachmentId,
            metric,
            value,
            unit,
            mode,
            evidence,
            JSON.stringify(conditions),
            sourceLocator,
          ],
        );
      }
      for (const m of d.missions)
        await client.query(
          'INSERT INTO missions VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [
            d.release,
            m.gameId,
            m.id,
            m.name,
            m.province,
            m.content,
            m.summary,
            JSON.stringify(m),
          ],
        );
      for (const a of d.apparel)
        await client.query('INSERT INTO apparel VALUES ($1,$2,$3,$4,$5,$6)', [
          d.release,
          a.gameId,
          a.id,
          a.name,
          a.category,
          JSON.stringify(a),
        ]);
      for (const c of d.claims)
        await client.query(
          'INSERT INTO attachment_claims VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [
            d.release,
            c.id,
            c.attachmentId,
            c.metric,
            c.summary,
            c.status,
            c.scope,
          ],
        );
      // Table names are fixed program constants; only values come from the data file.
      for (const [table, records] of [
        ['weapon_sources', d.weapons],
        ['attachment_sources', d.attachments],
        ['compatibility_sources', d.compatibility],
        ['measurement_sources', d.measurements],
        ['mission_sources', d.missions],
        ['apparel_sources', d.apparel],
        ['claim_sources', d.claims],
      ]) {
        for (const row of records)
          for (const source of row.sourceIds)
            await client.query(`INSERT INTO ${table} VALUES ($1,$2,$3)`, [
              d.release,
              row.id,
              source,
            ]);
      }
      await client.query(
        'INSERT INTO published_catalogs (game_id,release_id) VALUES ($1,$2) ON CONFLICT (game_id) DO UPDATE SET release_id=EXCLUDED.release_id,published_at=now()',
        [d.gameId, d.release],
      );
      await client.query(
        'INSERT INTO damage_workbooks (release_id,archive_sha256,content_sha256,snapshot) VALUES ($1,$2,$3,$4)',
        [d.release, workbook.sha256, workbookDigest, JSON.stringify(workbook)],
      );
      console.log(`Imported and published ${d.release}`);
    }
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  // Avoid printing connection strings or server detail that may contain credentials.
  const reason =
    /^(Invalid catalog:|Applied migration changed:|Release content changed:)/.test(
      error.message,
    )
      ? error.message
      : (error.code ?? 'check configuration / migration / catalog');
  console.error(`Database ${command} failed (${reason}).`);
  process.exitCode = 1;
} finally {
  await client.end();
}
