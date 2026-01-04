import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Scroll } from "lucide-react";

export function RulesCard() {
  return (
    <div className="bg-card/50 border border-primary/10 rounded-xl overflow-hidden backdrop-blur-sm">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5">
            <div className="flex items-center gap-2 font-display text-lg text-primary">
              <Scroll className="w-5 h-5" />
              Pirate's Code (Rules)
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-muted-foreground space-y-2 font-body leading-relaxed">
            <p>1. Roll all 8 dice to start your turn.</p>
            <p>2. <strong className="text-foreground">Skulls</strong> are locked immediately. Collect 3 skulls and you bust (0 points)!</p>
            <p>3. Choose a symbol to keep. You must keep ALL dice of that symbol.</p>
            <p>4. You cannot choose a symbol you've already kept this turn.</p>
            <p>5. Score points for sets: 3 of a kind = 100, 4 = 200, etc.</p>
            <p>6. <strong className="text-yellow-500">Coins</strong> and <strong className="text-cyan-400">Diamonds</strong> give +100 bonus points each!</p>
            <p>7. Decide: Roll remaining dice for more points, or Bank your score to save it.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
