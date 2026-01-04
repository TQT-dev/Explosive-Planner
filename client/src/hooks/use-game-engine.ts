import { useState, useCallback } from "react";
import confetti from "canvas-confetti";

export type DieFace = "skull" | "coin" | "diamond" | "parrot" | "monkey" | "saber";
export type DieStatus = "active" | "kept" | "locked";

export interface DieState {
  id: number;
  face: DieFace;
  status: DieStatus;
  rotation: number; // For animation
}

const FACES: DieFace[] = ["skull", "coin", "diamond", "parrot", "monkey", "saber"];

// Base scoring: 3=100, 4=200, 5=500, 6=1000, 7=2000, 8=4000
const SCORING_TABLE: Record<number, number> = {
  3: 100,
  4: 200,
  5: 500,
  6: 1000,
  7: 2000,
  8: 4000,
};

export function useGameEngine() {
  const [dice, setDice] = useState<DieState[]>(
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      face: "coin",
      status: "active",
      rotation: 0
    }))
  );
  const [isRolling, setIsRolling] = useState(false);
  const [gameState, setGameState] = useState<"ready" | "playing" | "bust" | "finished">("ready");
  const [keptFaces, setKeptFaces] = useState<Set<DieFace>>(new Set());
  const [score, setScore] = useState(0);

  const calculateScore = (currentDice: DieState[]) => {
    // Only count kept dice and locked dice? No, only kept dice usually count for score.
    // In this game, you keep sets.
    const counts: Record<string, number> = {};
    let newScore = 0;
    let coinsOrDiamonds = 0;

    currentDice.forEach(d => {
      if (d.status === "kept") {
        counts[d.face] = (counts[d.face] || 0) + 1;
        if (d.face === "coin" || d.face === "diamond") {
          coinsOrDiamonds++;
        }
      }
    });

    // Base score from sets
    Object.values(counts).forEach(count => {
      if (SCORING_TABLE[count]) {
        newScore += SCORING_TABLE[count];
      }
    });

    // Bonus for coins/diamonds (simplified rule: +100 for each kept coin/diamond)
    newScore += coinsOrDiamonds * 100;

    // Full chest bonus (all 8 dice kept)
    const totalKept = currentDice.filter(d => d.status === "kept").length;
    if (totalKept === 8) {
      newScore += 500;
    }

    return newScore;
  };

  const rollDice = useCallback(async () => {
    if (isRolling) return;
    setIsRolling(true);

    // Animation delay
    await new Promise(r => setTimeout(r, 600));

    setDice(prev => {
      const newDice = prev.map(d => {
        if (d.status !== "active") return d;
        // Weighted roll? No, fair die.
        const newFace = FACES[Math.floor(Math.random() * FACES.length)];
        return {
          ...d,
          face: newFace,
          rotation: d.rotation + 360 + Math.random() * 360, // Spin animation
        };
      });

      // Check for skulls
      let skullsCount = 0;
      let totalSkulls = 0; // Skulls locked from previous turns + new ones

      // Count existing locked skulls
      prev.forEach(d => {
        if (d.face === "skull" && d.status === "locked") totalSkulls++;
      });

      // Process new roll
      const processedDice = newDice.map(d => {
        if (d.status === "active" && d.face === "skull") {
          skullsCount++;
          return { ...d, status: "locked" as DieStatus };
        }
        return d;
      });
      
      totalSkulls += skullsCount;

      // Check Bust
      if (totalSkulls >= 3) {
        setGameState("bust");
        // Check if we have a "Chest of the Dead" or other advanced rules? 
        // MVP: Bust = 0 score.
        setScore(0);
      } else {
        setGameState("playing");
      }

      return processedDice;
    });

    setIsRolling(false);
  }, [isRolling]);

  const keepDice = (face: DieFace) => {
    if (gameState !== "playing") return;
    if (keptFaces.has(face)) return; // Already kept this symbol type
    if (face === "skull") return; // Cannot keep skulls voluntarily

    setDice(prev => {
      const newDice = prev.map(d => {
        if (d.status === "active" && d.face === face) {
          return { ...d, status: "kept" as DieStatus };
        }
        return d;
      });
      
      const newScore = calculateScore(newDice);
      setScore(newScore);
      return newDice;
    });

    setKeptFaces(prev => new Set(prev).add(face));
  };

  const startNewGame = () => {
    setDice(Array.from({ length: 8 }, (_, i) => ({
      id: i,
      face: "coin",
      status: "active",
      rotation: 0
    })));
    setKeptFaces(new Set());
    setScore(0);
    setGameState("playing");
    rollDice(); // Auto roll first turn
  };

  const bankScore = () => {
    setGameState("finished");
    if (score > 1000) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  return {
    dice,
    gameState,
    score,
    isRolling,
    keptFaces,
    rollDice,
    keepDice,
    startNewGame,
    bankScore
  };
}
