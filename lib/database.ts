import { Client } from 'pg';
import type { Catalog, DamageWorkbook } from './catalog';
import { validateCatalog } from './validate-catalog.mjs';
// A request-scoped client also works in Workers; never share sockets across requests.
export async function readCatalog(): Promise<Catalog> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  });
  try {
    await client.connect();
    const result = await client.query<{ snapshot: Catalog }>(
      `SELECT r.snapshot FROM published_catalogs p
       JOIN catalog_releases r ON r.id = p.release_id AND r.game_id = p.game_id
       WHERE p.game_id = $1`,
      ['wildlands'],
    );
    const catalog = result.rows[0]?.snapshot;
    if (!catalog) throw new Error('No published Wildlands release');
    validateCatalog(catalog);
    return catalog;
  } finally {
    await client.end();
  }
}

export async function readDamageWorkbook(): Promise<DamageWorkbook> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  });
  try {
    await client.connect();
    const result = await client.query<{ snapshot: DamageWorkbook }>(
      `SELECT w.snapshot FROM damage_workbooks w
       JOIN published_catalogs p ON p.release_id = w.release_id
       WHERE p.game_id = $1`,
      ['wildlands'],
    );
    const workbook = result.rows[0]?.snapshot;
    if (!workbook) throw new Error('No published Wildlands damage workbook');
    return workbook;
  } finally {
    await client.end();
  }
}
