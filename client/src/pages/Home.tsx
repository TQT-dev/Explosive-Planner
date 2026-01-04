import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Play, Trophy, ScrollText } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center overflow-hidden relative">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 max-w-2xl"
      >
        <div className="mb-8 relative inline-block">
           <h1 className="text-5xl md:text-7xl font-display font-black text-primary drop-shadow-lg leading-tight">
             Thousand<br />
             <span className="text-foreground">Bombs &</span><br />
             Grenades
           </h1>
           <div className="absolute -right-8 -top-8 text-6xl animate-bounce delay-700">🦜</div>
        </div>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 font-pirate max-w-lg mx-auto">
          Roll the dice, push your luck, and become the richest pirate on the high seas!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/game">
            <Button size="lg" className="text-xl h-16 px-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-transform hover:-translate-y-1">
              <Play className="mr-2 w-6 h-6" /> Start Adventure
            </Button>
          </Link>
          
          <Link href="/leaderboard">
            <Button size="lg" variant="secondary" className="text-xl h-16 px-10 shadow-lg border border-primary/10 transition-transform hover:-translate-y-1">
              <Trophy className="mr-2 w-6 h-6" /> Hall of Fame
            </Button>
          </Link>
        </div>

        <div className="mt-16 text-sm text-muted-foreground/60 flex items-center justify-center gap-2">
          <ScrollText className="w-4 h-4" />
          <span>A digital tribute to the classic dice game by 999 Games</span>
        </div>
      </motion.div>
    </div>
  );
}
