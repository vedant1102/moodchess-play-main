-- Add draw offer and resignation support
ALTER TABLE games ADD COLUMN IF NOT EXISTS draw_offered_by text;
ALTER TABLE games ADD COLUMN IF NOT EXISTS resignation_by text;
ALTER TABLE games ALTER COLUMN time_limit SET DEFAULT 600;
ALTER TABLE games ALTER COLUMN white_time_remaining SET DEFAULT 600;
ALTER TABLE games ALTER COLUMN black_time_remaining SET DEFAULT 600;

-- Add move evaluation for analysis
ALTER TABLE moves ADD COLUMN IF NOT EXISTS evaluation numeric;