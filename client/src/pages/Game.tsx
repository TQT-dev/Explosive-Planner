import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGameEngine } from "@/hooks/use-game-engine";
import { Die } from "@/components/Die";
import { ScoreBoard } from "@/components/ScoreBoard";
import { GameOverDialog } from "@/components/GameOverDialog";
import { RulesCard } from "@/components/RulesCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dices, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Game() {
  const [location, setLocation] = useLocation();
  const {
    dice,
    gameState,
    score,
    isRolling,
    keptFaces,
    rollDice,
    keepDice,
    startNewGame,
    bankScore
  } = useGameEngine();

  // Auto-start new game on mount
  useEffect(() => {
    startNewGame();
  }, []);

  const activeDice = dice.filter(d => d.status === 'active');
  const keptDice = dice.filter(d => d.status === 'kept');
  const lockedDice = dice.filter(d => d.status === 'locked');

  const canRoll = gameState === 'playing' && activeDice.length > 0 && !isRolling;
  const canBank = gameState === 'playing' && score > 0 && !isRolling;

  return (
    <div className="min-h-screen pb-12 pt-6 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-primary gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Quit
        </Button>
        <h1 className="text-2xl md:text-3xl font-display text-primary hidden md:block">
          Thousand Bombs & Grenades
        </h1>
        <div className="w-24" /> {/* Spacer */}
      </header>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        {/* Main Game Area */}
        <main className="space-y-8">
          <ScoreBoard score={score} gameState={gameState} />

          {/* Locked / Skulls Area */}
          <AnimatePresence>
            {lockedDice.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-black/20 rounded-xl p-4 border border-destructive/20"
              >
                <h4 className="text-destructive font-pirate mb-3 flex items-center gap-2">
                  <span className="text-xl">☠️</span> Dead Men's Chest ({lockedDice.length}/3)
                </h4>
                <div className="flex flex-wrap gap-4">
                  {lockedDice.map(die => (
                    <Die key={die.id} die={die} disabled />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Rolling Area */}
          <div className="wood-texture rounded-2xl p-6 min-h-[200px] relative">
            <div className="absolute top-0 left-0 bg-primary/20 text-primary px-4 py-1 rounded-br-xl font-pirate text-sm border-b border-r border-primary/30">
              Rolling Area ({activeDice.length})
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-6">
              {activeDice.length === 0 && gameState !== 'bust' && gameState !== 'finished' && (
                 <div className="text-muted-foreground italic font-pirate py-8">
                   All dice kept! Bank your loot or risk it all?
                 </div>
              )}
              
              {activeDice.map(die => (
                <Die 
                  key={die.id} 
                  die={die} 
                  selectable={gameState === 'playing' && !keptFaces.has(die.face)}
                  onClick={() => keepDice(die.face)}
                  disabled={isRolling || keptFaces.has(die.face)}
                />
              ))}
            </div>
          </div>

          {/* Kept Dice Area */}
          <div className="bg-card/40 border border-primary/10 rounded-2xl p-6">
            <h4 className="text-primary font-pirate mb-3">Kept Loot</h4>
            <div className="flex flex-wrap gap-4 min-h-[80px]">
              {keptDice.length === 0 && (
                <span className="text-muted-foreground/50 text-sm italic">Select dice from above to keep them...</span>
              )}
              {keptDice.map(die => (
                <Die key={die.id} die={die} disabled />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={rollDice}
              disabled={!canRoll}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xl font-pirate px-12 py-8 shadow-xl border-2 border-secondary-foreground/10"
            >
              <Dices className={`mr-3 w-6 h-6 ${isRolling ? 'animate-spin' : ''}`} />
              {activeDice.length < 8 ? "Roll Again" : "Roll Dice"}
            </Button>
            
            <Button
              size="lg"
              onClick={bankScore}
              disabled={!canBank}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xl font-pirate px-12 py-8 shadow-xl"
            >
              <Save className="mr-3 w-6 h-6" />
              Bank Score
            </Button>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="space-y-6">
           <RulesCard />
           
           <div className="bg-card p-6 rounded-xl border border-border">
             <h3 className="font-display text-lg mb-4 text-center">Current Status</h3>
             <div className="space-y-4 text-sm">
               <div className="flex justify-between border-b border-border pb-2">
                 <span className="text-muted-foreground">Dice Remaining</span>
                 <span className="font-bold">{activeDice.length}</span>
               </div>
               <div className="flex justify-between border-b border-border pb-2">
                 <span className="text-muted-foreground">Kept Dice</span>
                 <span className="font-bold">{keptDice.length}</span>
               </div>
               <div className="flex justify-between border-b border-border pb-2">
                 <span className="text-muted-foreground">Skulls</span>
                 <span className={`${lockedDice.length >= 2 ? 'text-destructive' : 'font-bold'}`}>
                   {lockedDice.length} / 3
                 </span>
               </div>
             </div>
           </div>
        </aside>
      </div>

      <GameOverDialog 
        isOpen={gameState === 'bust' || gameState === 'finished'} 
        score={score}
        onRestart={startNewGame}
      />
    </div>
  );
}
