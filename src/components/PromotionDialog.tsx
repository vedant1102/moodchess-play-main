import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PromotionDialogProps {
  isOpen: boolean;
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  color: 'w' | 'b';
}

const PromotionDialog = ({ isOpen, onSelect, color }: PromotionDialogProps) => {
  const pieces = [
    { type: 'q', name: 'Queen', unicode: color === 'w' ? '♕' : '♛' },
    { type: 'r', name: 'Rook', unicode: color === 'w' ? '♖' : '♜' },
    { type: 'b', name: 'Bishop', unicode: color === 'w' ? '♗' : '♝' },
    { type: 'n', name: 'Knight', unicode: color === 'w' ? '♘' : '♞' },
  ];

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Promotion Piece</DialogTitle>
          <DialogDescription>
            Select which piece you want to promote your pawn to
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {pieces.map((piece) => (
            <button
              key={piece.type}
              onClick={() => onSelect(piece.type as 'q' | 'r' | 'b' | 'n')}
              className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all"
            >
              <span className="text-6xl mb-2">{piece.unicode}</span>
              <span className="text-sm font-medium">{piece.name}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionDialog;
