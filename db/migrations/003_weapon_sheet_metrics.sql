-- Structured, source-located weapon test rows are versioned with each catalog.
CREATE TABLE weapon_sheet_configs (
  release_id text NOT NULL REFERENCES catalog_releases(id),
  weapon_id text NOT NULL,
  config_index integer NOT NULL CHECK (config_index > 0),
  barrel text NOT NULL,
  tier_one jsonb NOT NULL CHECK (jsonb_typeof(tier_one) = 'object'),
  non_tier jsonb NOT NULL CHECK (jsonb_typeof(non_tier) = 'object'),
  rpm jsonb,
  rounds_per_second numeric,
  shot_interval_seconds numeric,
  time_to_kill jsonb NOT NULL CHECK (jsonb_typeof(time_to_kill) = 'object'),
  tier_one_damage jsonb NOT NULL CHECK (jsonb_typeof(tier_one_damage) = 'object'),
  magazine jsonb NOT NULL CHECK (jsonb_typeof(magazine) = 'object'),
  reload_seconds jsonb,
  aim_delay jsonb,
  aim_sensitivity jsonb,
  source_locator text NOT NULL,
  PRIMARY KEY (release_id, weapon_id, config_index),
  FOREIGN KEY (release_id, weapon_id) REFERENCES weapons(release_id, id)
);
CREATE INDEX weapon_sheet_configs_weapon_idx
  ON weapon_sheet_configs (release_id, weapon_id, barrel);

CREATE TABLE weapon_damage_profiles (
  release_id text NOT NULL REFERENCES catalog_releases(id),
  weapon_id text NOT NULL,
  source_name text NOT NULL,
  damage_by_barrel jsonb NOT NULL CHECK (jsonb_typeof(damage_by_barrel) = 'object'),
  rpm jsonb,
  dps_by_barrel jsonb NOT NULL CHECK (jsonb_typeof(dps_by_barrel) = 'object'),
  target_bands jsonb NOT NULL CHECK (jsonb_typeof(target_bands) = 'object'),
  source_locator text NOT NULL,
  PRIMARY KEY (release_id, weapon_id),
  FOREIGN KEY (release_id, weapon_id) REFERENCES weapons(release_id, id)
);

CREATE TRIGGER immutable_weapon_sheet_configs
BEFORE UPDATE OR DELETE ON weapon_sheet_configs
FOR EACH ROW EXECUTE FUNCTION reject_catalog_mutation();
CREATE TRIGGER immutable_weapon_damage_profiles
BEFORE UPDATE OR DELETE ON weapon_damage_profiles
FOR EACH ROW EXECUTE FUNCTION reject_catalog_mutation();
