import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Crown } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      const code = generateCode();
      const { data, error } = await supabase
        .from('games')
        .insert({
          join_code: code,
          game_status: 'waiting',
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/game/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a join code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select()
        .eq('join_code', joinCode.toUpperCase())
        .single();

      if (error || !data) {
        throw new Error("Game not found");
      }

      navigate(`/game/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gradient-subtle">
      <div className="absolute top-0 left-0 right-0 h-64 gradient-glow pointer-events-none" />
      
      <div className="relative z-10 text-center space-y-8 max-w-2xl w-full">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Crown className="w-12 h-12 text-primary animate-pulse" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
              ChessMate
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Play chess with friends in real-time
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="p-8 space-y-6 shadow-elegant hover:shadow-glow transition-smooth bg-card/50 backdrop-blur">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Create Game</h2>
              <p className="text-sm text-muted-foreground">
                Start a new match and share the code
              </p>
            </div>
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleCreateGame}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create New Game"}
            </Button>
          </Card>

          <Card className="p-8 space-y-6 shadow-elegant hover:shadow-glow transition-smooth bg-card/50 backdrop-blur">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Join Game</h2>
              <p className="text-sm text-muted-foreground">
                Enter the code to join a match
              </p>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Enter 6-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-lg font-mono bg-input/50"
              />
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleJoinGame}
                disabled={isJoining}
              >
                {isJoining ? "Joining..." : "Join Game"}
              </Button>
            </div>
          </Card>
        </div>

        <div className="pt-8 space-y-3 text-sm text-muted-foreground">
          <p>✨ AI-powered move explanations</p>
          <p>🎭 Emotional chess mode</p>
          <p>⏱️ Multiple time controls</p>
        </div>
      </div>
    </div>
  );
};

export default Home;