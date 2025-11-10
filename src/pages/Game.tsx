import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chess, Square, Move } from "chess.js";
import Chessboard from "chessboardjsx";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, ArrowLeft } from "lucide-react";

import MoveExplanation from "@/components/MoveExplanation";
import GameResult from "@/components/GameResult";
import MoveHistory from "@/components/MoveHistory";
import EvaluationBar from "@/components/EvaluationBar";
import GameControls from "@/components/GameControls";
import PromotionDialog from "@/components/PromotionDialog";
import PlayerCard from "@/components/PlayerCard";
import CapturedPieces from "@/components/CapturedPieces";
import GameTimer from "@/components/GameTimer";
import { useStockfish } from "@/hooks/useStockfish";
import { useSoundEffects } from "@/hooks/useSoundEffects";

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [game, setGame] = useState<any | null>(null);
  const [chess] = useState(new Chess());
  const [playerColor, setPlayerColor] = useState<'w' | 'b' | null>(null);
  const [lastMove, setLastMove] = useState<any>(null);
  const [gameOver, setGameOver] = useState(false);
  const [position, setPosition] = useState(chess.fen());
  const [moves, setMoves] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState(0);
  const [mateIn, setMateIn] = useState<number | undefined>(undefined);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<Square[]>([]);
  const [pendingMove, setPendingMove] = useState<{ from: Square; to: Square } | null>(null);
  const [showPromotion, setShowPromotion] = useState(false);
  const [lastMoveSquares, setLastMoveSquares] = useState<{ from: Square; to: Square } | null>(null);
  const [whiteCaptured, setWhiteCaptured] = useState<string[]>([]);
  const [blackCaptured, setBlackCaptured] = useState<string[]>([]);
  const { isReady: stockfishReady, evaluatePosition } = useStockfish();
  const { playSound } = useSoundEffects();

  useEffect(() => {
    if (!gameId) return;

    // Load game
    loadGame();
    loadMoves();

    // Subscribe to game updates
    const channel = supabase
      .channel('game-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log('Game update:', payload);
            if (payload.new && typeof payload.new === 'object') {
              const newGame = payload.new as any;
              setGame(newGame);
              if (newGame.board_state) {
                chess.load(newGame.board_state);
                setPosition(newGame.board_state);
              }
              
              if (newGame.game_status === 'finished') {
                setGameOver(true);
              }
            }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moves',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          loadMoves();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const loadGame = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Game not found",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setGame(data);
    chess.load(data.board_state);
    setPosition(data.board_state);

    // Get or create player ID
    const storageKey = `player_${gameId}`;
    let playerId = localStorage.getItem(storageKey);
    
    const hasWhite = !!data.white_player_id;
    const hasBlack = !!data.black_player_id;
    
    if (!hasWhite) {
      await joinAsWhite(data, storageKey);
    } else if (!hasBlack) {
      await joinAsBlack(data, storageKey);
    } else {
      // Both players already in game - determine color from stored player ID
      if (playerId === data.white_player_id) {
        setPlayerColor('w');
      } else if (playerId === data.black_player_id) {
        setPlayerColor('b');
      } else {
        // Spectator - set to white for viewing
        setPlayerColor('w');
      }
    }
  };

  const loadMoves = async () => {
    const { data } = await supabase
      .from('moves')
      .select('*')
      .eq('game_id', gameId)
      .order('move_number', { ascending: true });

    if (data) {
      setMoves(data);
      
      // Calculate captured pieces correctly
      const startingPieces = {
        'p': 8, 'n': 2, 'b': 2, 'r': 2, 'q': 1, 'k': 1
      };
      
      const currentPieces = chess.board().flat().filter(p => p !== null);
      const whitePieces = currentPieces.filter(p => p?.color === 'w');
      const blackPieces = currentPieces.filter(p => p?.color === 'b');
      
      // Count current pieces
      const whiteCount: Record<string, number> = {};
      const blackCount: Record<string, number> = {};
      
      whitePieces.forEach(p => {
        if (p?.type) whiteCount[p.type] = (whiteCount[p.type] || 0) + 1;
      });
      
      blackPieces.forEach(p => {
        if (p?.type) blackCount[p.type] = (blackCount[p.type] || 0) + 1;
      });
      
      // Calculate captured (what white captured from black)
      const whiteCapturedPieces: string[] = [];
      const blackCapturedPieces: string[] = [];
      
      Object.entries(startingPieces).forEach(([piece, startCount]) => {
        if (piece === 'k') return; // Skip king
        
        const blackRemaining = blackCount[piece] || 0;
        const whiteRemaining = whiteCount[piece] || 0;
        
        const blackCaptured = startCount - blackRemaining;
        const whiteCaptured = startCount - whiteRemaining;
        
        for (let i = 0; i < blackCaptured; i++) {
          whiteCapturedPieces.push(piece);
        }
        
        for (let i = 0; i < whiteCaptured; i++) {
          blackCapturedPieces.push(piece);
        }
      });
      
      setWhiteCaptured(whiteCapturedPieces);
      setBlackCaptured(blackCapturedPieces);
    }
  };

  const joinAsWhite = async (gameData: any, storageKey: string) => {
    const playerId = crypto.randomUUID();
    localStorage.setItem(storageKey, playerId);
    
    await supabase
      .from('games')
      .update({ white_player_id: playerId })
      .eq('id', gameId);
    
    setPlayerColor('w');
  };

  const joinAsBlack = async (gameData: any, storageKey: string) => {
    const playerId = crypto.randomUUID();
    localStorage.setItem(storageKey, playerId);
    
    await supabase
      .from('games')
      .update({ 
        black_player_id: playerId,
        game_status: 'playing'
      })
      .eq('id', gameId);
    
    setPlayerColor('b');
  };


  const handleSquareClick = useCallback((square: Square) => {
    if (!game || !playerColor) return;
    
    const currentTurn = chess.turn();
    if (currentTurn !== playerColor) return;

    const piece = chess.get(square);

    // If clicking on own piece, select it and show legal moves
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true }) as Move[];
      setHighlightedSquares(moves.map(m => m.to as Square));
    } 
    // If a square is already selected, try to move
    else if (selectedSquare) {
      attemptMove(selectedSquare, square);
    }
  }, [game, playerColor, selectedSquare, chess]);

  const attemptMove = (from: Square, to: Square) => {
    // Clear highlights
    setSelectedSquare(null);
    setHighlightedSquares([]);

    // Check if this is a pawn promotion
    const piece = chess.get(from);
    if (piece && piece.type === 'p') {
      const toRank = to[1];
      if ((piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1')) {
        // Show promotion dialog
        setPendingMove({ from, to });
        setShowPromotion(true);
        return;
      }
    }

    // Try regular move
    makeMove(from, to, 'q');
  };

  const handlePromotion = (piece: 'q' | 'r' | 'b' | 'n') => {
    setShowPromotion(false);
    if (pendingMove) {
      makeMove(pendingMove.from, pendingMove.to, piece);
      setPendingMove(null);
    }
  };

  const makeMove = (sourceSquare: Square, targetSquare: Square, promotion: 'q' | 'r' | 'b' | 'n' = 'q') => {
    if (!game || !playerColor) {
      console.log('Cannot move: game or playerColor not set', { game: !!game, playerColor });
      return;
    }
    
    const currentTurn = chess.turn();
    console.log('Move attempt:', { currentTurn, playerColor, sourceSquare, targetSquare });
    
    // Check if it's player's turn
    if (currentTurn !== playerColor) {
      toast({
        title: "Not your turn",
        description: "Please wait for your opponent",
      });
      return;
    }

    const move = chess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: promotion,
    });

    if (!move) {
      console.log('Invalid move attempted');
      // Reset position to prevent piece from disappearing
      setPosition(chess.fen());
      playSound('illegal');
      toast({
        title: "Illegal Move",
        description: "That move is not allowed",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Move successful:', move.san);
    const newFen = chess.fen();
    setPosition(newFen);
    setLastMoveSquares({ from: sourceSquare, to: targetSquare });

    // Play appropriate sound
    if (promotion !== 'q' && move.san.includes('=')) {
      playSound('promote');
    } else if (move.san.includes('O-O')) {
      playSound('castle');
    } else if (move.san.includes('+')) {
      playSound('check');
    } else if (move.captured) {
      playSound('capture');
    } else {
      playSound('move');
    }

    // Evaluate new position with Stockfish
    if (stockfishReady) {
      evaluatePosition(newFen, (evalData) => {
        setEvaluation(evalData.score);
        setMateIn(evalData.mate);
      });
    }

    // Update game state async
    (async () => {
      try {
        const { error } = await supabase
          .from('games')
          .update({
            board_state: newFen,
            current_turn: chess.turn(),
          })
          .eq('id', gameId);

        if (error) throw error;

        // Save move to database
        const { data: moveData } = await supabase
          .from('moves')
          .insert({
            game_id: gameId,
            move_number: chess.moveNumber(),
            move_notation: move.san,
            board_state_after: newFen,
            player_color: playerColor,
          })
          .select()
          .single();

        // Get AI explanation
        if (moveData) {
          const { data: explanation } = await supabase.functions.invoke('explain-move', {
            body: {
              move: move.san,
              fen: newFen,
              playerColor: playerColor,
            }
          });

          if (explanation?.explanation) {
            await supabase
              .from('moves')
              .update({ explanation: explanation.explanation })
              .eq('id', moveData.id);
            
            setLastMove({
              notation: move.san,
              explanation: explanation.explanation,
            });
          }
        }

        // Check for game over
        if (chess.isGameOver()) {
          let winner = null;
          if (chess.isCheckmate()) {
            winner = chess.turn() === 'w' ? 'black' : 'white';
          }
          
          // Get all moves for analysis
          const { data: allMoves } = await supabase
            .from('moves')
            .select('move_notation, player_color')
            .eq('game_id', gameId)
            .order('move_number', { ascending: true });

          if (allMoves && allMoves.length > 0) {
            const moves = allMoves.map(m => m.move_notation);
            
            // Analyze the game
            const { data: analysis } = await supabase.functions.invoke('analyze-game', {
              body: {
                moves: moves,
              }
            });

            if (analysis) {
              await supabase
                .from('games')
                .update({
                  game_status: 'finished',
                  winner: winner,
                  white_accuracy: analysis.whiteAccuracy,
                  black_accuracy: analysis.blackAccuracy,
                  white_playstyle: analysis.whitePlaystyle,
                  black_playstyle: analysis.blackPlaystyle,
                  game_analysis: analysis.summary,
                })
                .eq('id', gameId);
            } else {
              await supabase
                .from('games')
                .update({
                  game_status: 'finished',
                  winner: winner,
                })
                .eq('id', gameId);
            }
          } else {
            await supabase
              .from('games')
              .update({
                game_status: 'finished',
                winner: winner,
              })
              .eq('id', gameId);
          }
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    })();
  };

  const handleResign = async () => {
    if (!playerColor) return;
    
    const winner = playerColor === 'w' ? 'black' : 'white';
    
    await supabase
      .from('games')
      .update({
        game_status: 'finished',
        winner: winner,
        resignation_by: playerColor === 'w' ? 'white' : 'black',
      })
      .eq('id', gameId);

    toast({
      title: "Game Over",
      description: "You resigned",
    });
  };

  const handleOfferDraw = async () => {
    if (!playerColor) return;
    
    await supabase
      .from('games')
      .update({
        draw_offered_by: playerColor === 'w' ? 'white' : 'black',
      })
      .eq('id', gameId);

    toast({
      title: "Draw Offered",
      description: "Waiting for opponent response",
    });
  };

  const handleAcceptDraw = async () => {
    await supabase
      .from('games')
      .update({
        game_status: 'finished',
        winner: 'draw',
      })
      .eq('id', gameId);

    toast({
      title: "Draw Accepted",
      description: "Game ended in a draw",
    });
  };

  const copyJoinCode = () => {
    if (game?.join_code) {
      navigator.clipboard.writeText(game.join_code);
      toast({
        title: "Copied!",
        description: "Join code copied to clipboard",
      });
    }
  };

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    );
  }

  if (gameOver) {
    return <GameResult game={game} moves={moves} onPlayAgain={() => navigate('/')} />;
  }

  return (
    <div className="min-h-screen bg-[#312e2b] p-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 text-[#b5b5b5] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          
          {game.game_status === 'waiting' && (
            <Card className="px-4 py-2 bg-[#262421] border-[#3d3935]">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#b5b5b5]">Join Code:</span>
                <Badge variant="secondary" className="text-lg font-mono bg-[#3d3935] text-white">
                  {game.join_code}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyJoinCode}
                  className="h-8 w-8 p-0 hover:bg-[#3d3935]"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-[auto_400px] gap-6">
          <div className="space-y-4">
            {/* Opponent Card */}
            <PlayerCard
              color={playerColor === 'b' ? 'white' : 'black'}
              timeRemaining={playerColor === 'b' ? game.white_time_remaining : game.black_time_remaining}
              isActive={game.current_turn !== playerColor}
              capturedPieces={playerColor === 'w' ? whiteCaptured : blackCaptured}
            />

            {/* Chess Board */}
            <div className="relative bg-[#262421] rounded-lg p-4">
              <div className="relative" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Chessboard
                  position={position}
                  draggable={true}
                  onDrop={({ sourceSquare, targetSquare }) => {
                    // Prevent flicker (snap back then forward) and disappearing on illegal drops
                    // 1) Only allow moves on player's turn
                    const isPlayersTurn = chess.turn() === playerColor;
                    if (!isPlayersTurn) {
                      playSound('illegal');
                      return 'snapback';
                    }

                    // 2) Check move legality without mutating the live game first
                    const tentative = new Chess(chess.fen());
                    const tentativeMove = tentative.move({
                      from: sourceSquare as Square,
                      to: targetSquare as Square,
                      promotion: 'q',
                    });

                    if (!tentativeMove) {
                      // Illegal: tell board to snap back; do NOT change position state
                      playSound('illegal');
                      return 'snapback';
                    }

                    // Legal: perform the real move which updates state and DB
                    attemptMove(sourceSquare as Square, targetSquare as Square);
                    // Return undefined to let chessboard keep the piece where dropped without extra snap animation
                    return undefined;
                  }}
                  onSquareClick={handleSquareClick}
                  orientation={playerColor === 'b' ? 'black' : 'white'}
                  lightSquareStyle={{ backgroundColor: '#eeeed2' }}
                  darkSquareStyle={{ backgroundColor: '#769656' }}
                  squareStyles={{
                    ...(selectedSquare ? { [selectedSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' } } : {}),
                    ...(lastMoveSquares ? {
                      [lastMoveSquares.from]: { backgroundColor: 'rgba(155, 199, 0, 0.41)' },
                      [lastMoveSquares.to]: { backgroundColor: 'rgba(155, 199, 0, 0.41)' }
                    } : {}),
                    ...highlightedSquares.reduce((acc, square) => {
                      const piece = chess.get(square);
                      if (piece) {
                        acc[square] = { 
                          background: 'radial-gradient(circle, rgba(0, 0, 0, 0.15) 85%, transparent 85%)',
                        };
                      } else {
                        acc[square] = { 
                          background: 'radial-gradient(circle, rgba(0, 0, 0, 0.15) 25%, transparent 25%)',
                        };
                      }
                      return acc;
                    }, {} as Record<string, any>)
                  }}
                  transitionDuration={120}
                />
              </div>
            </div>

            {/* Player Card */}
            <PlayerCard
              color={playerColor === 'w' ? 'white' : 'black'}
              timeRemaining={playerColor === 'w' ? game.white_time_remaining : game.black_time_remaining}
              isActive={game.current_turn === playerColor}
              capturedPieces={playerColor === 'b' ? whiteCaptured : blackCaptured}
            />
            
            {/* Game Timer (hidden, updates in background) */}
            {game.game_status === 'playing' && gameId && (
              <div className="hidden">
                <GameTimer
                  gameId={gameId}
                  timeLimit={game.time_limit}
                  whiteTime={game.white_time_remaining}
                  blackTime={game.black_time_remaining}
                  currentTurn={game.current_turn}
                />
              </div>
            )}
          </div>

          <div className="space-y-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <EvaluationBar evaluation={evaluation} mate={mateIn} />
            
            {game.game_status === 'playing' && (
              <GameControls
                onResign={handleResign}
                onOfferDraw={handleOfferDraw}
                drawOfferedBy={game.draw_offered_by}
                playerColor={playerColor}
                onAcceptDraw={handleAcceptDraw}
              />
            )}

            {game.game_status === 'waiting' && (
              <Card className="p-6 text-center bg-[#262421] border-[#3d3935]">
                <div className="w-12 h-12 mx-auto mb-3 text-primary animate-pulse">⏳</div>
                <h3 className="text-lg font-semibold mb-2 text-white">Waiting for opponent...</h3>
                <p className="text-sm text-[#b5b5b5]">
                  Share the join code with your friend
                </p>
              </Card>
            )}

            {lastMove && (
              <MoveExplanation
                move={lastMove.notation}
                explanation={lastMove.explanation}
              />
            )}

            {moves.length > 0 && (
              <MoveHistory moves={moves} />
            )}
          </div>
        </div>
      </div>
      
      <PromotionDialog
        isOpen={showPromotion}
        onSelect={handlePromotion}
        color={playerColor || 'w'}
      />
    </div>
  );
};

export default Game;