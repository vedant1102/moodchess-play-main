import { useEffect, useRef, useState, useCallback } from 'react';

interface StockfishEvaluation {
  score: number; // centipawns (positive = white advantage)
  mate?: number; // moves to mate (positive = white mates, negative = black mates)
  bestMove?: string;
  depth?: number;
}

export const useStockfish = () => {
  const engineRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [evaluation, setEvaluation] = useState<StockfishEvaluation>({ score: 0 });
  const pendingCallbackRef = useRef<((evaluation: StockfishEvaluation) => void) | null>(null);

  useEffect(() => {
    // Load Stockfish.js from CDN
    const loadStockfish = async () => {
      try {
        // @ts-ignore - Stockfish is loaded from CDN
        const Stockfish = await import('https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish.js');
        const engine = Stockfish();
        
        let currentEval: StockfishEvaluation = { score: 0 };
        
        engine.onmessage = (line: string) => {
          console.log('Stockfish:', line);
          
          if (line.includes('uciok')) {
            engine.postMessage('isready');
          } else if (line.includes('readyok')) {
            setIsReady(true);
          } else if (line.startsWith('info') && line.includes('score')) {
            // Parse evaluation from info line
            const depthMatch = line.match(/depth (\d+)/);
            const scoreMatch = line.match(/score cp (-?\d+)/);
            const mateMatch = line.match(/score mate (-?\d+)/);
            const pv = line.match(/pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
            
            if (depthMatch) {
              const depth = parseInt(depthMatch[1]);
              
              if (mateMatch) {
                currentEval = {
                  score: parseInt(mateMatch[1]) > 0 ? 999 : -999,
                  mate: parseInt(mateMatch[1]),
                  depth,
                  bestMove: pv ? pv[1] : undefined
                };
              } else if (scoreMatch) {
                currentEval = {
                  score: parseInt(scoreMatch[1]) / 100, // Convert centipawns to pawns
                  depth,
                  bestMove: pv ? pv[1] : undefined
                };
              }
            }
          } else if (line.startsWith('bestmove')) {
            // Final evaluation ready
            setEvaluation(currentEval);
            if (pendingCallbackRef.current) {
              pendingCallbackRef.current(currentEval);
              pendingCallbackRef.current = null;
            }
          }
        };
        
        engineRef.current = engine;
        engine.postMessage('uci');
      } catch (error) {
        console.error('Failed to load Stockfish:', error);
        // Fallback to ready state for development
        setIsReady(true);
      }
    };

    loadStockfish();

    return () => {
      if (engineRef.current) {
        engineRef.current.terminate?.();
      }
    };
  }, []);

  const evaluatePosition = useCallback((fen: string, callback?: (evaluation: StockfishEvaluation) => void, depth: number = 15) => {
    if (!isReady) {
      console.warn('Engine not ready');
      return;
    }

    if (!engineRef.current) {
      console.warn('Engine not initialized');
      return;
    }

    pendingCallbackRef.current = callback || null;

    // Send position to Stockfish
    engineRef.current.postMessage('position fen ' + fen);
    engineRef.current.postMessage(`go depth ${depth}`);
  }, [isReady]);

  const getBestMove = useCallback((fen: string, callback: (move: string) => void, depth: number = 15) => {
    evaluatePosition(fen, (evaluation) => {
      if (evaluation.bestMove) {
        callback(evaluation.bestMove);
      }
    }, depth);
  }, [evaluatePosition]);

  return {
    isReady,
    evaluation,
    evaluatePosition,
    getBestMove,
  };
};
