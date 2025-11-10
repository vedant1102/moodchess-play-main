import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface MoveExplanationProps {
  move: string;
  explanation: string;
}

const MoveExplanation = ({ move, explanation }: MoveExplanationProps) => {
  return (
    <Card className="p-4 shadow-elegant bg-card/50 backdrop-blur animate-in slide-in-from-right">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold">Last Move:</h3>
            <code className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-sm font-mono">
              {move}
            </code>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {explanation}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MoveExplanation;