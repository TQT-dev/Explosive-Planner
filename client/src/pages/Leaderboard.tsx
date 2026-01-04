import { useScores } from "@/hooks/use-scores";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Medal } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: scores, isLoading } = useScores();

  // Sort scores desc
  const sortedScores = scores?.sort((a, b) => b.score - a.score) || [];

  return (
    <div className="min-h-screen py-12 px-4 max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-primary gap-2">
            <ArrowLeft className="w-5 h-5" /> Back to Port
          </Button>
        </Link>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display text-primary mb-4">Legendary Pirates</h1>
        <p className="text-lg text-muted-foreground">The richest scoundrels on the seven seas</p>
      </div>

      <div className="bg-card/80 backdrop-blur-md border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">
            Consulting the archives...
          </div>
        ) : sortedScores.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No legends yet. Be the first!
          </div>
        ) : (
          <div className="divide-y divide-primary/10">
            {sortedScores.map((entry, index) => (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center p-6 hover:bg-white/5 transition-colors"
              >
                <div className="w-12 text-2xl font-bold text-muted-foreground/50 font-display flex-shrink-0">
                  #{index + 1}
                </div>
                
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-xl font-bold text-foreground truncate">{entry.playerName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(entry.createdAt!).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {index === 0 && <Trophy className="w-6 h-6 text-yellow-500" />}
                  {index === 1 && <Medal className="w-6 h-6 text-gray-400" />}
                  {index === 2 && <Medal className="w-6 h-6 text-amber-600" />}
                  
                  <span className="text-2xl font-black font-mono text-primary tabular-nums">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
