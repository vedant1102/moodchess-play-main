-- Create games table for multiplayer chess matches
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  join_code TEXT NOT NULL UNIQUE,
  white_player_id UUID,
  black_player_id UUID,
  current_turn TEXT DEFAULT 'w',
  board_state TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  time_limit INTEGER NOT NULL DEFAULT 300,
  white_time_remaining INTEGER NOT NULL DEFAULT 300,
  black_time_remaining INTEGER NOT NULL DEFAULT 300,
  white_mood TEXT,
  black_mood TEXT,
  game_status TEXT DEFAULT 'waiting',
  winner TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create moves table for move history and explanations
CREATE TABLE public.moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  move_notation TEXT NOT NULL,
  board_state_after TEXT NOT NULL,
  player_color TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;

-- Create policies for games table (public access for multiplayer)
CREATE POLICY "Anyone can view games"
ON public.games FOR SELECT
USING (true);

CREATE POLICY "Anyone can create games"
ON public.games FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update games"
ON public.games FOR UPDATE
USING (true);

-- Create policies for moves table (public access)
CREATE POLICY "Anyone can view moves"
ON public.moves FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert moves"
ON public.moves FOR INSERT
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_games_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moves;