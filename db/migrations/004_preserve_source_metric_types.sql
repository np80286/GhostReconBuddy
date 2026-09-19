-- Preserve workbook placeholders such as "-" alongside numeric observations.
ALTER TABLE weapon_sheet_configs
  ALTER COLUMN rounds_per_second TYPE jsonb
  USING to_jsonb(rounds_per_second);
ALTER TABLE weapon_sheet_configs
  ALTER COLUMN shot_interval_seconds TYPE jsonb
  USING to_jsonb(shot_interval_seconds);
