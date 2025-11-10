import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import Chessboard from "chessboardjsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Swords, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useStockfish } from "@/hooks/useStockfish";

interface GameResultProps {
  game: any;
  moves: any[];
  onPlayAgain: () => void;
}

const GameResult = ({ game, moves, onPlayAgain }: GameResultProps) => {
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(moves.length - 1);
  const [chess] = useState(new Chess());
  const [moveEvaluations, setMoveEvaluations] = useState<Array<{ score: number; mate?: number }>>([]);
  const { evaluatePosition, isReady } = useStockfish();
  
  // Calculate evaluations for all moves
  useEffect(() => {
    if (!isReady || moves.length === 0) return;
    
    const evaluations: Array<{ score: number; mate?: number }> = [];
    const tempChess = new Chess();
    
    // Initial position evaluation
    evaluatePosition(tempChess.fen(), (evalData) => {
      evaluations.push({ score: evalData.score, mate: evalData.mate });
    }, 12); // Lower depth for faster analysis
    
    // Evaluate each move position
    moves.forEach((move, index) => {
      if (move.board_state_after) {
        tempChess.load(move.board_state_after);
        evaluatePosition(tempChess.fen(), (evalData) => {
          evaluations[index + 1] = { score: evalData.score, mate: evalData.mate };
          if (index === moves.length - 1) {
            setMoveEvaluations([...evaluations]);
          }
        }, 12);
      }
    });
  }, [isReady, moves, evaluatePosition]);
  
  const getResultText = () => {
    if (!game.winner) return "It's a draw!";
    return `${game.winner.charAt(0).toUpperCase() + game.winner.slice(1)} wins!`;
  };
  
  const calculateEloChange = (won: boolean, accuracy: number) => {
    const baseChange = won ? 10 : -10;
    const accuracyBonus = Math.round((accuracy - 50) / 10);
    return baseChange + accuracyBonus;
  };
  
  const whiteEloChange = calculateEloChange(game.winner === 'white', game.white_accuracy || 50);
  const blackEloChange = calculateEloChange(game.winner === 'black', game.black_accuracy || 50);
  
  const getCurrentPosition = () => {
    if (selectedMoveIndex < 0) {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    return moves[selectedMoveIndex]?.board_state_after || game.board_state;
  };
  
  const getCurrentEvaluation = () => {
    if (selectedMoveIndex < 0) return moveEvaluations[0];
    return moveEvaluations[selectedMoveIndex + 1];
  };
  
  
  const goToMove = (index: number) => {
    setSelectedMoveIndex(Math.max(-1, Math.min(moves.length - 1, index)));
  };
  
  const getEvalBar = () => {
    const currentEval = getCurrentEvaluation();
    if (!currentEval) return null;
    
    return (
      <Card className="p-3 bg-[#262421] border-[#3d3935] mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#b5b5b5]">Position Evaluation</span>
          <span className="text-xs font-mono font-semibold text-white">
            {currentEval.mate ? `M${Math.abs(currentEval.mate)}` : `${currentEval.score > 0 ? '+' : ''}${currentEval.score.toFixed(1)}`}
          </span>
        </div>
        <div className="relative h-2 bg-[#1a1a1a] rounded-sm overflow-hidden">
          <div 
            className="absolute top-0 right-0 h-full bg-white transition-all duration-300"
            style={{ 
              width: `${currentEval.mate 
                ? (currentEval.mate > 0 ? 100 : 0)
                : Math.max(0, Math.min(100, ((Math.max(-10, Math.min(10, currentEval.score)) + 10) / 20) * 100))
              }%` 
            }}
          />
        </div>
      </Card>
    );
  };
  
  const getEvaluationGraph = () => {
    if (moveEvaluations.length === 0) return null;
    
    return (
      <Card className="p-4 bg-[#262421] border-[#3d3935] mb-4">
        <h3 className="text-sm font-semibold mb-3 text-white">Evaluation Graph</h3>
        <div className="relative h-24 bg-[#1a1a1a] rounded">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-[#3d3935]" />
          </div>
          <svg className="w-full h-full" viewBox={`0 0 ${moveEvaluations.length * 10} 100`} preserveAspectRatio="none">
            <polyline
              points={moveEvaluations.map((evalData, index) => {
                const x = index * 10;
                const y = 50 - (Math.max(-10, Math.min(10, evalData.score)) * 4);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#81b64c"
              strokeWidth="0.5"
            />
            {selectedMoveIndex >= -1 && (
              <circle
                cx={(selectedMoveIndex + 1) * 10}
                cy={50 - (Math.max(-10, Math.min(10, moveEvaluations[selectedMoveIndex + 1]?.score || 0)) * 4)}
                r="1"
                fill="#81b64c"
              />
            )}
          </svg>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#312e2b] p-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          {getResultText()}
        </h2>
        
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Analysis Board */}
          <div className="space-y-4">
            {getEvalBar()}
            {getEvaluationGraph()}
            
            <Card className="p-4 bg-[#262421] border-[#3d3935]">
              <div className="relative" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Chessboard
                  position={getCurrentPosition()}
                  draggable={false}
                  lightSquareStyle={{ backgroundColor: '#eeeed2' }}
                  darkSquareStyle={{ backgroundColor: '#769656' }}
                />
              </div>
              
              {/* Move Navigation */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => goToMove(-1)}
                  disabled={selectedMoveIndex === -1}
                  className="text-white hover:bg-[#3d3935]"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => goToMove(selectedMoveIndex - 1)}
                  disabled={selectedMoveIndex === -1}
                  className="text-white hover:bg-[#3d3935]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-[#b5b5b5] min-w-[100px] text-center">
                  {selectedMoveIndex === -1 ? 'Start' : `Move ${selectedMoveIndex + 1} / ${moves.length}`}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => goToMove(selectedMoveIndex + 1)}
                  disabled={selectedMoveIndex === moves.length - 1}
                  className="text-white hover:bg-[#3d3935]"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => goToMove(moves.length - 1)}
                  disabled={selectedMoveIndex === moves.length - 1}
                  className="text-white hover:bg-[#3d3935]"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Game Stats & Analysis */}
          <div className="space-y-4">
            <Card className="p-6 bg-[#262421] border-[#3d3935] text-center">
              <div className="mb-4">
                {game.winner ? (
                  <Trophy className="w-12 h-12 mx-auto text-[#81b64c]" />
                ) : (
                  <Swords className="w-12 h-12 mx-auto text-[#b5b5b5]" />
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-[#3d3935] rounded-lg">
                    <p className="text-xs text-[#b5b5b5] mb-1">White</p>
                    <div className="flex items-baseline gap-2 justify-center">
                      <p className="text-2xl font-bold text-white">{game.white_accuracy || 0}%</p>
                    </div>
                    <p className="text-xs text-[#b5b5b5]">accuracy</p>
                    {game.white_playstyle && (
                      <p className="text-xs mt-1 capitalize text-[#81b64c]">{game.white_playstyle}</p>
                    )}
                    <div className="mt-2">
                      <span className={`text-sm font-semibold ${whiteEloChange >= 0 ? 'text-[#81b64c]' : 'text-red-400'}`}>
                        {whiteEloChange >= 0 ? '+' : ''}{whiteEloChange} ELO
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-[#3d3935] rounded-lg">
                    <p className="text-xs text-[#b5b5b5] mb-1">Black</p>
                    <div className="flex items-baseline gap-2 justify-center">
                      <p className="text-2xl font-bold text-white">{game.black_accuracy || 0}%</p>
                    </div>
                    <p className="text-xs text-[#b5b5b5]">accuracy</p>
                    {game.black_playstyle && (
                      <p className="text-xs mt-1 capitalize text-[#81b64c]">{game.black_playstyle}</p>
                    )}
                    <div className="mt-2">
                      <span className={`text-sm font-semibold ${blackEloChange >= 0 ? 'text-[#81b64c]' : 'text-red-400'}`}>
                        {blackEloChange >= 0 ? '+' : ''}{blackEloChange} ELO
                      </span>
                    </div>
                  </div>
                </div>
                
                {game.game_analysis && (
                  <div className="p-4 bg-[#3d3935]/50 rounded-lg text-left">
                    <p className="text-sm text-[#b5b5b5] mb-2">Game Analysis</p>
                    <p className="text-sm leading-relaxed text-white">{game.game_analysis}</p>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="w-full bg-[#81b64c] hover:bg-[#72a042] text-white"
                onClick={onPlayAgain}
              >
                Play Again
              </Button>
            </Card>

            {moves.length > 0 && (
              <Card className="p-4 bg-[#262421] border-[#3d3935]">
                <h3 className="text-sm font-semibold mb-3 text-white">Move History</h3>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {moves.map((move, index) => {
                      const evalData = moveEvaluations[index + 1];
                      const prevEval = moveEvaluations[index];
                      let evalChange = null;
                      
                      if (evalData && prevEval) {
                        const diff = move.player_color === 'w' 
                          ? evalData.score - prevEval.score 
                          : prevEval.score - evalData.score;
                        evalChange = diff;
                      }
                      
                      return (
                        <div 
                          key={move.id} 
                          className={`p-3 rounded cursor-pointer transition-colors ${
                            selectedMoveIndex === index 
                              ? 'bg-[#81b64c]/20 border border-[#81b64c]' 
                              : 'bg-[#3d3935] hover:bg-[#4d4945]'
                          }`}
                          onClick={() => setSelectedMoveIndex(index)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono text-white border-[#b5b5b5]">
                              {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move.move_notation}
                            </Badge>
                            <Badge className={move.player_color === 'w' ? 'bg-white text-black' : 'bg-black text-white'}>
                              {move.player_color === 'w' ? 'White' : 'Black'}
                            </Badge>
                            {evalData && (
                              <Badge variant="outline" className="font-mono text-xs border-[#81b64c] text-[#81b64c]">
                                {evalData.mate ? `M${Math.abs(evalData.mate)}` : `${evalData.score > 0 ? '+' : ''}${evalData.score.toFixed(1)}`}
                              </Badge>
                            )}
                            {evalChange !== null && Math.abs(evalChange) > 0.5 && (
                              <Badge 
                                variant="outline" 
                                className={`font-mono text-xs ${
                                  evalChange < -1 ? 'border-red-400 text-red-400' : 
                                  evalChange < -0.5 ? 'border-yellow-400 text-yellow-400' : 
                                  'border-[#b5b5b5] text-[#b5b5b5]'
                                }`}
                              >
                                {evalChange < -2 ? '??' : evalChange < -1 ? '?' : evalChange < -0.5 ? '?!' : ''}
                              </Badge>
                            )}
                          </div>
                          {move.explanation && (
                            <p className="text-xs text-[#b5b5b5] leading-relaxed">
                              {move.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameResult;