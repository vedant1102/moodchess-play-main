import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GameTimerProps {
  gameId: string;
  timeLimit: number;
  whiteTime: number;
  blackTime: number;
  currentTurn: string;
}

const GameTimer = ({ gameId, timeLimit, whiteTime, blackTime, currentTurn }: GameTimerProps) => {
  const [wTime, setWTime] = useState(whiteTime);
  const [bTime, setBTime] = useState(blackTime);

  useEffect(() => {
    setWTime(whiteTime);
    setBTime(blackTime);
  }, [whiteTime, blackTime]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentTurn === 'w' && wTime > 0) {
        const newTime = wTime - 1;
        setWTime(newTime);
        
        if (newTime === 0) {
          await supabase
            .from('games')
            .update({ 
              game_status: 'finished',
              winner: 'black'
            })
            .eq('id', gameId);
        } else {
          await supabase
            .from('games')
            .update({ white_time_remaining: newTime })
            .eq('id', gameId);
        }
      } else if (currentTurn === 'b' && bTime > 0) {
        const newTime = bTime - 1;
        setBTime(newTime);
        
        if (newTime === 0) {
          await supabase
            .from('games')
            .update({ 
              game_status: 'finished',
              winner: 'white'
            })
            .eq('id', gameId);
        } else {
          await supabase
            .from('games')
            .update({ black_time_remaining: newTime })
            .eq('id', gameId);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTurn, wTime, bTime, gameId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-4 shadow-elegant bg-card/50 backdrop-blur">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Game Clock</h3>
      </div>
      
      <div className="space-y-3">
        <div className={`p-3 rounded-lg ${currentTurn === 'w' ? 'bg-primary/10 border border-primary' : 'bg-secondary'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">White</span>
            <span className={`text-lg font-mono font-semibold ${wTime < 30 ? 'text-destructive' : ''}`}>
              {formatTime(wTime)}
            </span>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg ${currentTurn === 'b' ? 'bg-primary/10 border border-primary' : 'bg-secondary'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Black</span>
            <span className={`text-lg font-mono font-semibold ${bTime < 30 ? 'text-destructive' : ''}`}>
              {formatTime(bTime)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GameTimer;