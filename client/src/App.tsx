import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScoreTracker from "@/pages/ScoreTracker";

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <ScoreTracker />
    </TooltipProvider>
  );
}

export default App;
