import { motion } from "framer-motion";
import { Trophy, Skull } from "lucide-react";

interface ScoreBoardProps {
  score: number;
  gameState: "ready" | "playing" | "bust" | "finished";
}

export function ScoreBoard({ score, gameState }: ScoreBoardProps) {
  return (
    <div className="w-full max-w-md mx-auto mb-8 relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-yellow-200 to-primary rounded-2xl blur opacity-30 animate-pulse"></div>
      <div className="relative bg-card border-2 border-primary/30 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
        
        <h3 className="text-muted-foreground font-pirate text-xl mb-1">Current Loot</h3>
        
        <motion.div
          key={score}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl md:text-6xl font-display font-black text-primary drop-shadow-sm flex items-center gap-3"
        >
          {gameState === 'bust' ? (
            <span className="text-destructive flex items-center gap-2">
              <Skull className="w-12 h-12" /> BUST!
            </span>
          ) : (
            <>
              {score} <span className="text-2xl text-muted-foreground">pts</span>
            </>
          )}
        </motion.div>

        {score > 0 && gameState === 'playing' && (
          <div className="mt-2 flex gap-2 text-sm font-medium text-accent">
            <Trophy className="w-4 h-4" /> Potential Winnings
          </div>
        )}
      </div>
    </div>
  );
}
