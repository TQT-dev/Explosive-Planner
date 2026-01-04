import { motion } from "framer-motion";
import { Skull, CircleDollarSign, Gem, Sword, Bird, PawPrint } from "lucide-react";
import { type DieState, type DieFace } from "@/hooks/use-game-engine";
import { cn } from "@/lib/utils";

interface DieProps {
  die: DieState;
  onClick?: () => void;
  disabled?: boolean;
  selectable?: boolean;
}

const FaceIcon = ({ face, className }: { face: DieFace; className?: string }) => {
  switch (face) {
    case "skull": return <Skull className={cn("text-gray-900", className)} strokeWidth={2.5} />;
    case "coin": return <CircleDollarSign className={cn("text-yellow-500 drop-shadow-md", className)} strokeWidth={2.5} />;
    case "diamond": return <Gem className={cn("text-cyan-400 drop-shadow-md", className)} strokeWidth={2.5} />;
    case "saber": return <Sword className={cn("text-red-600", className)} strokeWidth={2.5} />;
    case "parrot": return <Bird className={cn("text-green-500", className)} strokeWidth={2.5} />;
    case "monkey": return <PawPrint className={cn("text-amber-700", className)} strokeWidth={2.5} />;
  }
};

const FaceBgColor = (face: DieFace) => {
  switch (face) {
    case "skull": return "bg-gray-200 border-gray-400";
    case "coin": return "bg-yellow-50/90 border-yellow-300";
    case "diamond": return "bg-cyan-50/90 border-cyan-300";
    case "saber": return "bg-red-50/90 border-red-300";
    case "parrot": return "bg-green-50/90 border-green-300";
    case "monkey": return "bg-amber-50/90 border-amber-300";
  }
};

export function Die({ die, onClick, disabled, selectable }: DieProps) {
  return (
    <motion.div
      layout
      animate={{ 
        rotate: die.rotation,
        scale: die.status === 'kept' ? 0.9 : 1
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      whileHover={!disabled && selectable ? { scale: 1.1, y: -5 } : {}}
      whileTap={!disabled && selectable ? { scale: 0.95 } : {}}
      onClick={!disabled && selectable ? onClick : undefined}
      className={cn(
        "relative w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center cursor-default shadow-lg transition-colors duration-300",
        "border-b-4 border-r-4", // 3D effect border
        FaceBgColor(die.face),
        selectable && !disabled ? "cursor-pointer ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
        disabled && "opacity-80 grayscale-[0.2]",
        die.status === 'locked' && die.face === 'skull' && "bg-gray-300 border-gray-500 opacity-100 ring-2 ring-destructive ring-offset-2 ring-offset-background"
      )}
    >
      <FaceIcon face={die.face} className="w-8 h-8 md:w-10 md:h-10" />
      
      {/* Glossy highlight for 3D feel */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
    </motion.div>
  );
}
