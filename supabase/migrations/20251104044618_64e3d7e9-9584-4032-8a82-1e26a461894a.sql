-- Remove mood columns and add game analysis columns
ALTER TABLE games 
  DROP COLUMN IF EXISTS white_mood,
  DROP COLUMN IF EXISTS black_mood,
  ADD COLUMN IF NOT EXISTS white_accuracy integer,
  ADD COLUMN IF NOT EXISTS black_accuracy integer,
  ADD COLUMN IF NOT EXISTS white_playstyle text,
  ADD COLUMN IF NOT EXISTS black_playstyle text,
  ADD COLUMN IF NOT EXISTS game_analysis text;