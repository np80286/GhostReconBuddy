# Ghost Recon Buddy

A source-backed Ghost Recon Wildlands reference focused on weapon configuration and actual gameplay performance. Desktop-first, searchable, compact. PostgreSQL is the application database; no SQLite/D1 application storage.

This is a working foundation, not the complete Wildlands database.

## Included in the first research release

- 51 weapons available through audited Bolivia weapon cases, with class,
  province, source and aliases where collected.
- Historical Tier One and non-tier results for all 51 case weapons across 102
  barrel/configuration rows in six weapon-class tabs.
- A separate historical damage and DPS chart for 50 matching weapons, with
  barrel values and target-band data where the workbook provides them.
- Structured PostgreSQL tables for all 102 class-tab configurations and 50
  damage profiles, each tied to its weapon, source row and catalog release.
- A full archive of the source damage workbook: all 11 tabs, 13,748 populated
  cells and 2,911 formulas, browsable in the on-demand Damage Lab.
- 14 attachment types; 12 explicitly reported weapon/barrel pairs.
- 24 curated body-shot observations retained for the comparison tool; these
  older community tests have incomplete conditions.
- Search, class/province filters, weapon dossiers and a three-weapon comparison.
- Six Itacua mission entries with optional spoiler summaries.
- A source/coverage view and an honest empty apparel research queue.
- PostgreSQL schema, transactional migrations/imports, immutable catalog releases, source references, and a read API.

Unknown data stays unknown. Missing compatibility never means incompatible. All performance observations in this seed are historical community reports with incomplete conditions. No current-build measurements, global weapon ranking or per-attachment stat calculator is claimed.

## Start locally

Requirements: Node 22.13+ and npm. Dependencies have been installed and a lockfile is included.

```sh
cd GhostReconBuddy
npm run dev
```

Open the local address printed by the server, normally http://localhost:3000. Without DATABASE_URL, the page uses the bundled curated JSON snapshot. That is a preview mode, not a running PostgreSQL instance. If a configured database fails, the API returns 503 and the page identifies its fallback snapshot.

## Your checks

The initial implementation has not passed these checks yet:

```sh
npm run check
```

This validates catalog and workbook archive integrity, runs the data guardrail tests, checks types, runs lint and builds the production bundle. Send the output back before publishing.

## Free public deployment

The public app is deployed to GitHub Pages by [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). Every push to `main` builds the bundled catalog as a static site and publishes it at `https://np80286.github.io/GhostReconBuddy/`. No paid hosting service, database account, or subscription is required for the public snapshot.

The PostgreSQL path is optional local or self-hosted infrastructure for larger datasets. The static public site uses the bundled JSON snapshot and does not expose database credentials.

Manual checks:

1. Search `SR-25`; SR25 should appear through its alias.
2. Filter to Sniper rifle and Montuyoc; HTI and MSR should appear.
3. Enable measurements-only; all 51 base-map weapons should remain.
4. Expand 5.7 USG. Confirm the 20-round standard and 30-round extended magazines, Tier One/non-tier hit counts, reload, source rows, and explicit “Not recorded” labels for blank workbook cells.
5. Compare M40A5, MSR and G28 in the separate curated comparison tool. Switch barrel and mode; missing configurations must say no measurement, never zero.
6. Read weapon source links and historical-condition warnings.
7. Open Damage Lab and inspect each of the 11 source tabs. Search an item, browse pages, and toggle formula display; formula cells should retain their cached values and source coordinates.
8. Toggle mission spoilers and search an unmatched title.
9. Navigate tabs, filters and dossiers with keyboard only. Check at 200% zoom and narrow widths.
10. Repeat after database setup; the source panel should show PostgreSQL. Stop PostgreSQL and reload to confirm the explicit fallback warning.

## PostgreSQL setup

Requires Docker with Compose. These commands start a local database; they do not publish the website.

```sh
cp -n .env.example .env
```

Edit `.env`: replace the example password in both values. Use a URI-safe local password or URL-encode it in DATABASE_URL. Never post the connection string or commit `.env`.

```sh
docker compose up -d --wait
npm run db:migrate
npm run db:seed
npm run dev
```

The migration and seed have not been executed against PostgreSQL in this session. Re-running an unchanged seed is a no-op and does not republish an older release. Changing content under an existing release ID is rejected: increment `release` instead. To inspect counts:

```sh
docker compose exec -T postgres psql -U ghost_recon_buddy -d ghost_recon_buddy -c "SELECT (SELECT count(*) FROM weapons) AS weapons, (SELECT count(*) FROM compatibility) AS pairs, (SELECT count(*) FROM measurements) AS measurements;"
```

Expected for the current release: 51 weapons, 12 pairs, 24 curated measurements, 102 damage-sheet configurations and 50 damage profiles. Counts
across tables accumulate as new releases are imported; filter by release for
current inventory.

Weapon-sheet rows are also queryable in `weapon_sheet_configs`; barrel damage,
DPS and target bands are in `weapon_damage_profiles`. Both tables are immutable
per release. To add corrected or newly measured values, update the catalog with
source locators, increment the release ID and re-run the migration and seed
commands above.

## Repository and workspace

- GitHub: https://github.com/np80286/GhostReconBuddy
- Primary branch: `main`.

The repository contains source, the curated catalog, database migrations, setup examples and documentation. Dependencies, local environment files, generated output, raw imports and backups are ignored. The initial source snapshot is not a claim that the application checks have passed; run the checks above and review their output before deployment.

## Project map

- `data/catalog.json`: reviewed starter facts and source references.
- `data/damage-workbook.json`: compact cell archive, loaded on demand.
- `resources/workbooks_spreadsheets/Wildlands Damage Sheet.xlsx`: preserved original workbook.
- `lib/validate-catalog.mjs`: publication invariants and scope checks.
- `db/migrations`: PostgreSQL schema history.
- `scripts/db.mjs`: migration/import transaction and release publication.
- `lib/database.ts`: database read path; credentials stay server-side.
- `app/api/catalog/route.ts`: read-only catalog endpoint.
- `app/api/damage-workbook/route.ts`: read-only workbook archive endpoint.
- `components/database-app.tsx`: search, comparison and dossiers.
- `docs/RESEARCH.md`: public source audit, gaps and collection order.
- `docs/TESTING-PROTOCOL.md`: controlled in-game evidence collection.
- `docs/ARCHITECTURE.md`: data model, resilience and roadmap.

## Next useful milestone

The 51 Bolivia weapon cases and all source workbook tabs are now cataloged.
Next, complete the Gunsmith matrix, starting with the user's platform and
favorite weapons, and gather controlled configuration evidence.
Apparel and full mission chains follow. Scenario recommendations need
applicable measurements before they should influence a player's choice.
