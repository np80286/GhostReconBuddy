-- PostgreSQL only. Immutable catalog releases preserve corrections and prior evidence.
CREATE TABLE games (
  id text PRIMARY KEY,
  name text NOT NULL
);
INSERT INTO games (id, name) VALUES ('wildlands', 'Ghost Recon Wildlands');

CREATE TABLE catalog_releases (
  id text PRIMARY KEY,
  game_id text NOT NULL REFERENCES games(id),
  schema_version integer NOT NULL CHECK (schema_version > 0),
  content_sha256 text NOT NULL CHECK (length(content_sha256) = 64),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, game_id)
);
CREATE TABLE published_catalogs (
  game_id text PRIMARY KEY REFERENCES games(id),
  release_id text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (release_id, game_id) REFERENCES catalog_releases(id, game_id)
);
CREATE TABLE sources (
  release_id text NOT NULL REFERENCES catalog_releases(id),
  id text NOT NULL,
  title text NOT NULL,
  url text NOT NULL CHECK (url ~ '^https://'),
  kind text NOT NULL CHECK (kind IN ('official', 'guide', 'community_test', 'research_lead', 'game_capture', 'extracted')),
  accessed_at date NOT NULL,
  metadata jsonb NOT NULL,
  PRIMARY KEY (release_id, id)
);
CREATE TABLE weapons (
  release_id text NOT NULL,
  game_id text NOT NULL,
  id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  province text,
  variant text NOT NULL,
  metadata jsonb NOT NULL,
  PRIMARY KEY (release_id, id),
  FOREIGN KEY (release_id, game_id) REFERENCES catalog_releases(id, game_id)
);
CREATE INDEX weapons_category_idx ON weapons (release_id, category);
CREATE INDEX weapons_search_idx ON weapons USING gin (to_tsvector('simple', name || ' ' || coalesce(province, '')));
CREATE TABLE attachments (
  release_id text NOT NULL,
  game_id text NOT NULL,
  id text NOT NULL,
  name text NOT NULL,
  slot text NOT NULL,
  metadata jsonb NOT NULL,
  PRIMARY KEY (release_id, id),
  FOREIGN KEY (release_id, game_id) REFERENCES catalog_releases(id, game_id)
);
CREATE TABLE compatibility (
  release_id text NOT NULL,
  id text NOT NULL,
  weapon_id text NOT NULL,
  attachment_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('reported', 'verified', 'incompatible', 'disputed')),
  source_locator text NOT NULL,
  PRIMARY KEY (release_id, id),
  UNIQUE (release_id, weapon_id, attachment_id),
  FOREIGN KEY (release_id, weapon_id) REFERENCES weapons(release_id, id),
  FOREIGN KEY (release_id, attachment_id) REFERENCES attachments(release_id, id)
);
CREATE TABLE measurements (
  release_id text NOT NULL,
  id text NOT NULL,
  weapon_id text NOT NULL,
  attachment_id text NOT NULL,
  metric text NOT NULL,
  value numeric NOT NULL CHECK (value > 0 AND value < 'Infinity'::numeric),
  unit text NOT NULL,
  mode text NOT NULL,
  evidence text NOT NULL,
  conditions jsonb NOT NULL CHECK (jsonb_typeof(conditions) = 'object'),
  source_locator text NOT NULL,
  PRIMARY KEY (release_id, id),
  FOREIGN KEY (release_id, weapon_id, attachment_id) REFERENCES compatibility(release_id, weapon_id, attachment_id)
);
CREATE INDEX measurement_lookup_idx ON measurements (release_id, weapon_id, mode, metric);
CREATE TABLE missions (
  release_id text NOT NULL,
  game_id text NOT NULL,
  id text NOT NULL,
  name text NOT NULL,
  province text NOT NULL,
  content text NOT NULL,
  summary text NOT NULL,
  metadata jsonb NOT NULL,
  PRIMARY KEY (release_id, id),
  FOREIGN KEY (release_id, game_id) REFERENCES catalog_releases(id, game_id)
);
CREATE TABLE apparel (
  release_id text NOT NULL,
  game_id text NOT NULL,
  id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  metadata jsonb NOT NULL,
  PRIMARY KEY (release_id, id),
  FOREIGN KEY (release_id, game_id) REFERENCES catalog_releases(id, game_id)
);
CREATE TABLE attachment_claims (
  release_id text NOT NULL,
  id text NOT NULL,
  attachment_id text NOT NULL,
  metric text NOT NULL,
  summary text NOT NULL,
  status text NOT NULL,
  scope text NOT NULL,
  PRIMARY KEY (release_id, id),
  FOREIGN KEY (release_id, attachment_id) REFERENCES attachments(release_id, id)
);
-- Citation joins keep the source and object in the same immutable release.
CREATE TABLE weapon_sources (
  release_id text NOT NULL, entity_id text NOT NULL, source_id text NOT NULL,
  PRIMARY KEY (release_id, entity_id, source_id),
  FOREIGN KEY (release_id, entity_id) REFERENCES weapons(release_id, id),
  FOREIGN KEY (release_id, source_id) REFERENCES sources(release_id, id)
);
CREATE TABLE attachment_sources (
  release_id text NOT NULL, entity_id text NOT NULL, source_id text NOT NULL,
  PRIMARY KEY (release_id, entity_id, source_id),
  FOREIGN KEY (release_id, entity_id) REFERENCES attachments(release_id, id),
  FOREIGN KEY (release_id, source_id) REFERENCES sources(release_id, id)
);
CREATE TABLE compatibility_sources (
  release_id text NOT NULL, entity_id text NOT NULL, source_id text NOT NULL,
  PRIMARY KEY (release_id, entity_id, source_id),
  FOREIGN KEY (release_id, entity_id) REFERENCES compatibility(release_id, id),
  FOREIGN KEY (release_id, source_id) REFERENCES sources(release_id, id)
);
CREATE TABLE measurement_sources (
  release_id text NOT NULL, entity_id text NOT NULL, source_id text NOT NULL,
  PRIMARY KEY (release_id, entity_id, source_id),
  FOREIGN KEY (release_id, entity_id) REFERENCES measurements(release_id, id),
  FOREIGN KEY (release_id, source_id) REFERENCES sources(release_id, id)
);
CREATE TABLE mission_sources (
  release_id text NOT NULL, entity_id text NOT NULL, source_id text NOT NULL,
  PRIMARY KEY (release_id, entity_id, source_id),
  FOREIGN KEY (release_id, entity_id) REFERENCES missions(release_id, id),
  FOREIGN KEY (release_id, source_id) REFERENCES sources(release_id, id)
);
CREATE TABLE apparel_sources (
  release_id text NOT NULL, entity_id text NOT NULL, source_id text NOT NULL,
  PRIMARY KEY (release_id, entity_id, source_id),
  FOREIGN KEY (release_id, entity_id) REFERENCES apparel(release_id, id),
  FOREIGN KEY (release_id, source_id) REFERENCES sources(release_id, id)
);
CREATE TABLE claim_sources (
  release_id text NOT NULL, entity_id text NOT NULL, source_id text NOT NULL,
  PRIMARY KEY (release_id, entity_id, source_id),
  FOREIGN KEY (release_id, entity_id) REFERENCES attachment_claims(release_id, id),
  FOREIGN KEY (release_id, source_id) REFERENCES sources(release_id, id)
);
-- Corrections require a new release; readers never observe half an import.
CREATE FUNCTION reject_catalog_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Catalog evidence is append-only; publish a new release';
END;
$$;
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['catalog_releases','sources','weapons','attachments','compatibility','measurements','missions','apparel','attachment_claims','weapon_sources','attachment_sources','compatibility_sources','measurement_sources','mission_sources','apparel_sources','claim_sources']
  LOOP
    EXECUTE format('CREATE TRIGGER immutable_rows BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION reject_catalog_mutation()', table_name);
  END LOOP;
END;
$$;
