# Architecture and resilience

## Current implementation

React and TypeScript render a compact read-only reference using Vinext and accessible UI primitives. A bundled source-backed snapshot opens without infrastructure. The page checks the read API once on mount; no polling or hidden write endpoints are present. PostgreSQL stores both normalized research tables and an immutable JSON representation of the same release. One transaction imports both and switches the published release pointer. Readers query the published snapshot, so partially imported rows cannot leak into the page.

The catalog API returns the curated release. The full damage workbook is stored in a separate immutable PostgreSQL sidecar row and is requested only when the Damage Lab opens. Static builds dynamically load its compact cell snapshot as a separate chunk. The original XLSX remains in `resources/workbooks_spreadsheets/`; its SHA-256 is tied to the release audit. The cell snapshot preserves workbook coordinates, merged ranges, formulas and cached results. It does not recalculate formulas or claim the historical observations are current-build facts.

When the catalog grows, expose paginated filtered read endpoints, a small search index and per-weapon queries. PostgreSQL has a basic full-text index ready for that work. Do not send video, screenshots or raw spreadsheets in a catalog response.

The application does not use SQLite or Cloudflare D1. Development tooling may keep local caches; those are not the application database.

## Durable data model

Each game has a distinct ID. Each catalog release is tied to one game, immutable after import, and identified by a SHA-256 content hash. The current schema and validator support Wildlands only. Adding another game requires extending the validator, not relabeling Wildlands data.

Weapons, attachments, compatibility, measurements, missions, apparel and general attachment claims occupy separate tables. Citation joins enforce source references within the same release. Measurements refer to explicit compatible pairs. Database foreign keys prevent missing/cross-release relationships. Application validation preserves unknown test context and rejects unsupported or ambiguous comparison cells.

Current source links attach to records, with exact row locators for observations. Field-level assertions, weapon variant ancestry, full loadout fingerprints, attachment exclusions, mission prerequisites, availability history and multiple conflicting observations are the next model extension. Those features are designed priorities, not already implemented functionality.

Keep four kinds of evidence separate in that extension: displayed game values, empirical observations, extracted internal values and subjective claims. Derived calculations must link to their inputs and formula. Public catalog counts should always derive from imported records, with known scope.

## Import safety

Migrations run transactionally and record their checksums. A PostgreSQL advisory lock serializes migrations and imports. Existing migration files cannot be changed after application. Releases cannot be overwritten. An unchanged repeated seed is a no-op and leaves the published pointer alone. Corrections create new releases. Data changes and the published pointer commit together. SQL values are parameterized; dynamically selected citation table names are fixed program constants.

This seed importer accepts only the repository's reviewed catalog schema and its audited workbook snapshot. It is not a general web crawler or arbitrary spreadsheet uploader. A larger collection pipeline should stage source-specific imports, retain extraction metadata and original references, validate into canonical entities, produce a human-readable diff, then publish a reviewed release.

## Database deployment

Compose provides one local PostgreSQL 17 instance with a named volume, restart policy, health check and loopback-only port. That improves local durability but is NOT high availability or a backup system. No managed service, replica, automatic backup schedule or recovery exercise has been provisioned.

For production choose managed PostgreSQL with TLS, pooled/request-limited connections, automated backups, point-in-time recovery, monitoring and a documented restore drill. Use separate runtime read-only and importer roles. Keep database credentials out of frontend bundles and Git. The current local Compose user is for development only.

PostgreSQL supports logical backups through [pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html). Point-in-time recovery needs base backups and continuous WAL archiving or the managed provider's equivalent; a JSON snapshot or ordinary SQL dump alone does not provide it. See [PostgreSQL backup documentation](https://www.postgresql.org/docs/17/backup.html).

Local backup commands for the user:

```sh
mkdir -p backups
docker compose exec -T postgres pg_dump -U ghost_recon_buddy -d ghost_recon_buddy -Fc > backups/ghost-recon-buddy.dump
```

Copy the backup to a separate failure domain. To verify restoration, use a new disposable database, never overwrite the live one:

```sh
docker compose exec -T postgres createdb -U ghost_recon_buddy ghost_recon_restore_check
docker compose exec -T postgres pg_restore -U ghost_recon_buddy -d ghost_recon_restore_check --exit-on-error < backups/ghost-recon-buddy.dump
docker compose exec -T postgres psql -U ghost_recon_buddy -d ghost_recon_restore_check -c "SELECT game_id, release_id FROM published_catalogs;"
```

These commands are instructions, not executed verification. Use a fresh database name on another restore exercise. Production backup retention and recovery objectives need explicit operational setup.

## Publication status

The repository is source-ready for public collaboration. Production build output, hosting configuration and deployment remain environment-specific. Dependency updates from the original scaffold address reported advisories; compatibility must be checked with the provided command before publication. PostgreSQL connectivity must also be tested in the target runtime before switching a hosted app from its snapshot to the live database.

The dependency installation after upgrading the affected framework/runtime packages reported zero known vulnerabilities on September 12, 2026. This is a dependency advisory result, not a production build or security review.
