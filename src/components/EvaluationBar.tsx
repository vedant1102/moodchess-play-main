import { Card } from "@/components/ui/card";

interface EvaluationBarProps {
  evaluation: number; // Positive favors white, negative favors black (in pawns)
  mate?: number; // Moves to mate
}

const EvaluationBar = ({ evaluation, mate }: EvaluationBarProps) => {
  // For mate scores, show extreme advantage
  let displayEval = evaluation;
  let clampedEval = evaluation;
  
  if (mate !== undefined && mate !== null) {
    displayEval = mate > 0 ? 999 : -999;
    clampedEval = mate > 0 ? 10 : -10;
  } else {
    // Clamp evaluation between -10 and +10 for display
    clampedEval = Math.max(-10, Math.min(10, evaluation));
  }
  
  // Convert to percentage (0-100, where 50 is equal)
  const whitePercentage = ((clampedEval + 10) / 20) * 100;
  
  const getEvalText = () => {
    if (mate !== undefined && mate !== null) {
      return `M${Math.abs(mate)}`;
    }
    if (Math.abs(evaluation) > 5) {
      return evaluation > 0 ? "White winning" : "Black winning";
    } else if (Math.abs(evaluation) > 2) {
      return evaluation > 0 ? "White better" : "Black better";
    }
    return "Equal";
  };
  
  const getDisplayValue = () => {
    if (mate !== undefined && mate !== null) {
      return `M${Math.abs(mate)}`;
    }
    return `${evaluation > 0 ? '+' : ''}${evaluation.toFixed(1)}`;
  };

  return (
    <Card className="p-3 bg-[#262421] border-[#3d3935]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#b5b5b5]">Evaluation</span>
        <span className="text-xs font-semibold text-white">{getEvalText()}</span>
      </div>
      <div className="relative h-2 bg-[#1a1a1a] rounded-sm overflow-hidden">
        <div 
          className="absolute top-0 right-0 h-full bg-white transition-all duration-300"
          style={{ width: `${whitePercentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-black rounded-sm"></div>
          <span className="text-xs text-[#b5b5b5]">Black</span>
        </div>
        <span className="text-xs font-mono font-semibold text-white">{getDisplayValue()}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#b5b5b5]">White</span>
          <div className="w-3 h-3 bg-white rounded-sm"></div>
        </div>
      </div>
    </Card>
  );
};

export default EvaluationBar;
