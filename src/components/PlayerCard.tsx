import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface PlayerCardProps {
  color: 'white' | 'black';
  timeRemaining: number;
  isActive: boolean;
  capturedPieces: string[];
}

const PlayerCard = ({ color, timeRemaining, isActive, capturedPieces }: PlayerCardProps) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  
  const pieceUnicode: Record<string, string> = {
    'p': '♟',
    'n': '♞',
    'b': '♝',
    'r': '♜',
    'q': '♛',
  };

  const pieceValues: Record<string, number> = {
    'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9
  };

  const materialAdvantage = capturedPieces.reduce((sum, piece) => {
    return sum + (pieceValues[piece.toLowerCase()] || 0);
  }, 0);

  return (
    <Card className={`p-3 transition-all ${
      isActive 
        ? 'bg-primary/10 border-primary shadow-glow' 
        : 'bg-card/50 backdrop-blur'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
            color === 'white' ? 'bg-white text-black' : 'bg-black text-white'
          }`}>
            {color === 'white' ? '♔' : '♚'}
          </div>
          <div>
            <p className="font-semibold capitalize">{color}</p>
            {capturedPieces.length > 0 && (
              <div className="flex gap-1 items-center">
                {capturedPieces.map((piece, idx) => (
                  <span key={idx} className="text-lg opacity-70">
                    {pieceUnicode[piece.toLowerCase()]}
                  </span>
                ))}
                {materialAdvantage > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">+{materialAdvantage}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-lg font-bold ${
          isActive 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground'
        } ${timeRemaining < 60 && isActive ? 'animate-pulse' : ''}`}>
          <Clock className="w-4 h-4" />
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
    </Card>
  );
};

export default PlayerCard;
