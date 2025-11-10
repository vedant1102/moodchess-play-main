interface CapturedPiecesProps {
  pieces: string[];
  color: 'w' | 'b';
}

const CapturedPieces = ({ pieces, color }: CapturedPiecesProps) => {
  const pieceUnicode: Record<string, string> = {
    'p': color === 'w' ? '♟' : '♙',
    'n': color === 'w' ? '♞' : '♘',
    'b': color === 'w' ? '♝' : '♗',
    'r': color === 'w' ? '♜' : '♖',
    'q': color === 'w' ? '♛' : '♕',
  };

  const pieceValues: Record<string, number> = {
    'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9
  };

  // Sort pieces by value
  const sortedPieces = [...pieces].sort((a, b) => {
    return (pieceValues[b.toLowerCase()] || 0) - (pieceValues[a.toLowerCase()] || 0);
  });

  const materialValue = pieces.reduce((sum, piece) => {
    return sum + (pieceValues[piece.toLowerCase()] || 0);
  }, 0);

  if (pieces.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sortedPieces.map((piece, idx) => (
        <span key={idx} className="text-xl opacity-80">
          {pieceUnicode[piece.toLowerCase()]}
        </span>
      ))}
      {materialValue > 0 && (
        <span className="text-sm text-primary ml-1 font-bold">+{materialValue}</span>
      )}
    </div>
  );
};

export default CapturedPieces;
