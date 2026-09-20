# Ghost Recon Buddy

A source-backed Ghost Recon Wildlands reference focused on weapon configuration and actual gameplay performance. Desktop-first, searchable, compact. PostgreSQL is the application database; no SQLite/D1 application storage.

This is a working research index, not a claim that every Wildlands value has
been independently measured on the current build.

## Included in the current research release

- 182 Wildlands weapons and variants from the complete archived workbook
  inventory, including the audited 51-weapon Bolivia case baseline.
- Historical Tier One and non-tier results across 251 weapon/configuration
  rows in the six weapon-class tabs.
- 70 directly recorded damage profiles from the workbook's damage/DPS chart.
- Clearly marked damage bands for 104 otherwise-partial records, calculated
  from recorded body hits against the workbook's 1,000-HP reference target.
  Seven of those also expose theoretical DPS bands where RPM is recorded.
- Structured PostgreSQL tables for all configurations and direct damage
  profiles, each tied to its weapon, source row and immutable catalog release.
- A full archive of the source damage workbook: all 11 tabs, 13,748 populated
  cells and 2,911 formulas, browsable in the on-demand Damage Lab.
- 14 attachment types; 12 explicitly reported weapon/barrel pairs.
- 24 curated body-shot observations retained for the comparison tool; these
  older community tests have incomplete conditions.
- A compact weapon decision workspace with search, class/mode filters,
  task-oriented ranking, visual comparisons, dossiers, and three-weapon
  comparison.
- Six Itacua mission entries with optional spoiler summaries.
- A Sources provenance ledger with direct links, contributor credit, stated
  usage, access dates, and separate evidence/reference/research-lead groups.
- A Field Wiki explaining metrics, evidence rules, limitations, and testing
  context, plus an honest empty apparel research queue.
- PostgreSQL schema, transactional migrations/imports, immutable catalog releases, source references, and a read API.

Unknown data stays unknown. Missing compatibility never means incompatible.
Derived bands are calculations, not direct measurements, and carry an asterisk
in compact tables. All performance observations in this seed are historical
community reports with incomplete conditions. No current-build measurement or
per-attachment stat calculator is claimed.

## Start locally

Requirements: Node 22.13+ and npm. Dependencies have been installed and a lockfile is included.

```sh
cd GhostReconBuddy
npm run dev
```

Open the local address printed by the server, normally http://localhost:3000. Without DATABASE_URL, the page uses the bundled curated JSON snapshot. That is a preview mode, not a running PostgreSQL instance. If a configured database fails, the API returns 503 and the page identifies its fallback snapshot.

## Checks

```sh
npm run check
```

This validates catalog and workbook archive integrity, runs the data guardrail
tests, checks types, runs lint, and builds the production bundle. The command
passes for release `0.4.8-derived-damage-bands`.

## Free public deployment

The public app is deployed to GitHub Pages by [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). Every push to `main` builds the bundled catalog as a static site and publishes it at `https://np80286.github.io/GhostReconBuddy/`. No paid hosting service, database account, or subscription is required for the public snapshot.

The PostgreSQL path is optional local or self-hosted infrastructure for larger datasets. The static public site uses the bundled JSON snapshot and does not expose database credentials.

Manual checks:

1. Search `His AK-47`; confirm four body hits, `250–333*` damage,
   `2450–3263*` theoretical DPS, 588 RPM, and a 20-round magazine.
2. Open that weapon and confirm the dossier explicitly labels the damage and
   DPS as derived from the 1,000-HP reference rather than measured values.
3. Switch between fewest hits, damage, reload, magazine, and A–Z ranking;
   lower-is-better metrics must not render backward bars.
4. Compare M40A5, MSR, and G28. Switch mode; missing values must remain “Not
   recorded,” never zero.
5. Open Sources. Confirm all resources retain contributor credit, stated use,
   access date, and a direct original link, including Darkdally and Siim.
6. Open Field Wiki and verify the metric and evidence explanations.
7. Open Damage Lab and inspect each of the 11 source tabs. Search an item,
   browse pages, and toggle formula display; formula cells should retain cached
   values and source coordinates.
8. Toggle mission spoilers and search an unmatched title.
9. Navigate tabs, filters, ranking rows, and dossiers with keyboard only. Check
   at 200% zoom and a 390-pixel-wide viewport.
10. Repeat after database setup; the footer should show PostgreSQL. Stop
    PostgreSQL and reload to confirm the explicit bundled-snapshot warning.

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

Re-running an unchanged seed is a no-op and does not republish an older
release. Changing content under an existing release ID is rejected: increment
`release` instead. To inspect counts:

```sh
docker compose exec -T postgres psql -U ghost_recon_buddy -d ghost_recon_buddy -c "SELECT (SELECT count(*) FROM weapons) AS weapons, (SELECT count(*) FROM compatibility) AS pairs, (SELECT count(*) FROM measurements) AS measurements;"
```

Expected for the current release: 182 weapons, 12 pairs, 24 curated
measurements, 251 damage-sheet configurations, and 70 direct damage profiles. Counts
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

The repository contains source, the curated catalog, database migrations,
setup examples, and documentation. Dependencies, local environment files,
generated output, raw imports, and backups are ignored. Run the checks above
and review their output before deployment.

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

Direct measurements still beat inferred ranges. Prioritize controlled retests
for high-interest partial records, then complete the Gunsmith matrix starting
with the user's most-used weapons. Record exact build, platform, target, range,
mode, attachments, and trial evidence. Apparel and full mission chains follow.
Scenario recommendations should become more assertive only when matching
evidence exists.
