import { useState } from "react";
import { useCreateScore } from "@/hooks/use-scores";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface GameOverDialogProps {
  score: number;
  isOpen: boolean;
  onRestart: () => void;
}

export function GameOverDialog({ score, isOpen, onRestart }: GameOverDialogProps) {
  const [name, setName] = useState("");
  const createScore = useCreateScore();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      await createScore.mutateAsync({ playerName: name, score });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { if(submitted) onRestart(); }}>
      <DialogContent className="sm:max-w-md bg-card border-2 border-primary/20 text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-3xl font-display text-primary text-center">
            {score > 0 ? "Adventure Complete!" : "Walk the Plank!"}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            You secured <span className="font-bold text-foreground">{score}</span> points.
          </DialogDescription>
        </DialogHeader>
        
        {!submitted ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                Enter your pirate name:
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Captain Jack..."
                className="bg-background/50 border-primary/20 text-lg py-6"
              />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-xl font-pirate text-green-500">Score recorded in the chronicles!</p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!submitted && score > 0 && (
            <Button 
              onClick={handleSubmit} 
              disabled={createScore.isPending || !name}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createScore.isPending ? "Scribing..." : "Save Score"}
            </Button>
          )}
          <Button 
            onClick={onRestart}
            variant={submitted ? "default" : "secondary"}
            className="w-full"
          >
            New Voyage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
