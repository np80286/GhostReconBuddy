# Ghost Recon Buddy

A source-backed Ghost Recon Wildlands reference focused on weapon configuration and actual gameplay performance. Desktop-first, searchable, compact. PostgreSQL is the application database; no SQLite/D1 application storage.

This is a working foundation, not the complete Wildlands database.

## Included in the first research release

- 28 weapon entries, with class, province, source and aliases where collected.
- 14 attachment types; 12 explicitly reported weapon/barrel pairs.
- 24 historical body-shot observations across five sniper rifles and two modes.
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

This validates catalog integrity, runs the data guardrail tests, checks types, runs lint and builds the production bundle. Send the output back before publishing.

## Free public deployment

The public app is deployed to GitHub Pages by [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). Every push to `main` builds the bundled catalog as a static site and publishes it at `https://np80286.github.io/GhostReconBuddy/`. No paid hosting service, database account, or subscription is required for the public snapshot.

The PostgreSQL path is optional local or self-hosted infrastructure for larger datasets. The static public site uses the bundled JSON snapshot and does not expose database credentials.

Manual checks:

1. Search `SR-25`; SR25 should appear through its alias.
2. Filter to Sniper rifle and Montuyoc; HTI and MSR should appear.
3. Enable measurements-only; five weapon entries should remain after clearing other filters.
4. Compare M40A5, MSR and G28. Switch barrel and mode; missing configurations must say no measurement, never zero.
5. Read weapon source links and historical-condition warnings.
6. Toggle mission spoilers and search an unmatched title.
7. Navigate tabs, filters and dossiers with keyboard only. Check at 200% zoom and narrow widths.
8. Repeat after database setup; the source panel should show PostgreSQL. Stop PostgreSQL and reload to confirm the explicit fallback warning.

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

Expected after one initial import: 28 weapons, 12 pairs, 24 measurements. Counts across tables accumulate as new releases are imported; filter by release for current inventory.

## Repository and workspace

- GitHub: https://github.com/np80286/GhostReconBuddy
- Primary branch: `main`.

The repository contains source, the curated catalog, database migrations, setup examples and documentation. Dependencies, local environment files, generated output, raw imports and backups are ignored. The initial source snapshot is not a claim that the application checks have passed; run the checks above and review their output before deployment.

## Project map

- `data/catalog.json`: reviewed starter facts and source references.
- `lib/validate-catalog.mjs`: publication invariants and scope checks.
- `db/migrations`: PostgreSQL schema history.
- `scripts/db.mjs`: migration/import transaction and release publication.
- `lib/database.ts`: database read path; credentials stay server-side.
- `app/api/catalog/route.ts`: read-only catalog endpoint.
- `components/database-app.tsx`: search, comparison and dossiers.
- `docs/RESEARCH.md`: public source audit, gaps and collection order.
- `docs/TESTING-PROTOCOL.md`: controlled in-game evidence collection.
- `docs/ARCHITECTURE.md`: data model, resilience and roadmap.

## Next useful milestone

Complete the weapon inventory and Gunsmith matrix, starting with the user's platform and favorite weapons. Audit the remaining spreadsheet tabs and gather controlled configuration evidence. Apparel and full mission chains follow. Scenario recommendations need applicable measurements before they should influence a player's choice.
