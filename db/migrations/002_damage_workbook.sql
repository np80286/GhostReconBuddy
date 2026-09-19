-- Full workbook payload is stored separately from the frequently-read catalog.
CREATE TABLE damage_workbooks (
  release_id text PRIMARY KEY REFERENCES catalog_releases(id),
  archive_sha256 text NOT NULL CHECK (length(archive_sha256) = 64),
  content_sha256 text NOT NULL CHECK (length(content_sha256) = 64),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER immutable_damage_workbooks
BEFORE UPDATE OR DELETE ON damage_workbooks
FOR EACH ROW EXECUTE FUNCTION reject_catalog_mutation();
