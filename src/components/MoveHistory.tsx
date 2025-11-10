import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Move {
  move_notation: string;
  player_color: string;
  explanation?: string;
}

interface MoveHistoryProps {
  moves: Move[];
}

const MoveHistory = ({ moves }: MoveHistoryProps) => {
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <Card className="p-3 bg-[#262421] border-[#3d3935]">
      <h3 className="text-sm font-semibold mb-3 text-white">Moves</h3>
      <ScrollArea className="h-[400px]">
        <div className="space-y-1">
          {movePairs.map((pair) => (
            <div key={pair.number} className="flex items-center gap-2 text-sm hover:bg-[#3d3935] rounded px-2 py-1 transition-colors">
              <span className="text-[#b5b5b5] w-6 text-right">
                {pair.number}.
              </span>
              <div className="flex gap-3 flex-1">
                <span className="font-mono text-white flex-1">
                  {pair.white.move_notation}
                </span>
                {pair.black && (
                  <span className="font-mono text-white flex-1">
                    {pair.black.move_notation}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default MoveHistory;
