import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MoodSelectorProps {
  onMoodSelected: (mood: string) => void;
}

const moods = [
  { emoji: '😎', label: 'Confident', description: 'Aggressive openings' },
  { emoji: '😌', label: 'Calm', description: 'Positional play' },
  { emoji: '😤', label: 'Determined', description: 'Tactical focus' },
  { emoji: '😅', label: 'Cautious', description: 'Defensive structures' },
];

const MoodSelector = ({ onMoodSelected }: MoodSelectorProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-subtle">
      <Card className="p-8 max-w-2xl w-full shadow-elegant bg-card/50 backdrop-blur">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
            Choose Your Mood
          </h2>
          <p className="text-muted-foreground">
            Select how you're feeling to personalize your game experience
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {moods.map((mood) => (
            <Button
              key={mood.emoji}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-smooth"
              onClick={() => onMoodSelected(mood.emoji)}
            >
              <span className="text-5xl">{mood.emoji}</span>
              <div className="text-center">
                <p className="font-semibold">{mood.label}</p>
                <p className="text-xs text-muted-foreground">{mood.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default MoodSelector;