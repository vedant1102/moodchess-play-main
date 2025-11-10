import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flag, Handshake } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GameControlsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  drawOfferedBy: string | null;
  playerColor: 'w' | 'b' | null;
  onAcceptDraw: () => void;
}

const GameControls = ({ 
  onResign, 
  onOfferDraw, 
  drawOfferedBy, 
  playerColor,
  onAcceptDraw 
}: GameControlsProps) => {
  const opponentOfferedDraw = drawOfferedBy && 
    ((playerColor === 'w' && drawOfferedBy === 'black') || 
     (playerColor === 'b' && drawOfferedBy === 'white'));

  return (
    <Card className="p-3 bg-[#262421] border-[#3d3935]">
      <h3 className="text-sm font-semibold mb-3 text-white">Game Controls</h3>
      
      {opponentOfferedDraw && (
        <div className="mb-3 p-3 bg-primary/20 border border-primary rounded-lg">
          <p className="text-sm mb-2 font-semibold text-white">Draw Offered</p>
          <p className="text-xs text-[#b5b5b5] mb-3">
            Your opponent has offered a draw
          </p>
          <Button
            onClick={onAcceptDraw}
            className="w-full bg-[#81b64c] hover:bg-[#72a644] text-white"
            size="sm"
          >
            <Handshake className="w-4 h-4 mr-2" />
            Accept Draw
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-2 bg-[#cc0000] hover:bg-[#b30000]"
            >
              <Flag className="w-4 h-4" />
              Resign
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#262421] border-[#3d3935]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Resign Game?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#b5b5b5]">
                Are you sure you want to resign? This will end the game and your opponent will win.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#3d3935] border-[#3d3935] text-white hover:bg-[#4a4642]">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onResign} className="bg-[#cc0000] hover:bg-[#b30000]">Resign</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          onClick={onOfferDraw}
          variant="outline"
          size="sm"
          className="w-full gap-2 border-[#3d3935] bg-[#3d3935] hover:bg-[#4a4642] text-white"
          disabled={drawOfferedBy === (playerColor === 'w' ? 'white' : 'black')}
        >
          <Handshake className="w-4 h-4" />
          {drawOfferedBy === (playerColor === 'w' ? 'white' : 'black') ? 'Draw Offered' : 'Offer Draw'}
        </Button>
      </div>
    </Card>
  );
};

export default GameControls;
