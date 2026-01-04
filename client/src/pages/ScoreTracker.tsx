import { useMemo, useState } from "react";
import { useScoreTracker, Player, ScoreState } from "@/hooks/use-score-tracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Download,
  Loader2,
  RotateCcw,
  Save,
  Skull,
  Upload,
  UserPlus,
  Zap,
} from "lucide-react";

const accentPalette = ["#f97316", "#0ea5e9", "#22c55e", "#a855f7", "#eab308", "#ec4899"];

function playerAccent(player: Player, index: number) {
  return player.color || accentPalette[index % accentPalette.length];
}

function localId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function downloadState(state: ScoreState) {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "1000-bommen-granaten-score.json";
  link.click();
  URL.revokeObjectURL(url);
}

function validateImportedState(raw: unknown): ScoreState | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<ScoreState>;
  if (!Array.isArray(data.players)) return null;
  const players = data.players
    .filter((p) => p && typeof p === "object" && typeof (p as Player).name === "string")
    .map((p) => ({
      id: (p as Player).id || localId(),
      name: (p as Player).name.trim(),
      score: Number.isFinite((p as Player).score) ? Math.trunc((p as Player).score) : 0,
      color: (p as Player).color,
      icon: (p as Player).icon,
    }))
    .filter((p) => p.name);

  if (players.length === 0) return null;

  const currentPlayerId = players.some((p) => p.id === data.currentPlayerId) ? data.currentPlayerId! : players[0].id;

  return {
    players,
    currentPlayerId,
    settings: {
      penaltyValue:
        Number.isFinite(data.settings?.penaltyValue) && data.settings?.penaltyValue !== undefined
          ? Math.max(0, Math.abs(Math.trunc(data.settings.penaltyValue)))
          : 100,
      sortByScore: Boolean(data.settings?.sortByScore),
    },
    history: Array.isArray(data.history) ? data.history.slice(0, 20) : [],
  };
}

export default function ScoreTracker() {
  const {
    state,
    sortedPlayers,
    addPlayer,
    adjustScore,
    applyPenalty,
    canUndo,
    goToNextPlayer,
    importState,
    removePlayer,
    reorderPlayer,
    resetAll,
    resetScores,
    setCurrentPlayer,
    setPenalty,
    undo,
  } = useScoreTracker();

  const [newPlayer, setNewPlayer] = useState({ name: "", color: "", icon: "" });
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [customPenalty, setCustomPenalty] = useState("");
  const currentPlayer = useMemo(
    () => state.players.find((p) => p.id === state.currentPlayerId) ?? state.players[0] ?? null,
    [state.currentPlayerId, state.players],
  );

  const currentPlayerActions = [100, 500, 1000];

  const handleAddPlayer = () => {
    if (!newPlayer.name.trim()) {
      toast({ title: "Naam is verplicht", description: "Voer een spelersnaam in." });
      return;
    }
    addPlayer({
      name: newPlayer.name,
      color: newPlayer.color || undefined,
      icon: newPlayer.icon || undefined,
    });
    setNewPlayer({ name: "", color: "", icon: "" });
    toast({ title: "Speler toegevoegd", description: `${newPlayer.name} staat klaar om te spelen.` });
  };

  const handleCustomChange = (playerId: string, raw: string) => {
    setCustomValues((prev) => ({ ...prev, [playerId]: raw }));
  };

  const applyCustomDelta = (playerId: string) => {
    const raw = customValues[playerId] ?? "";
    const value = Number(raw);
    if (!Number.isInteger(value)) {
      toast({ title: "Ongeldige waarde", description: "Gebruik een geheel getal (bijv. -12 of 37)." });
      return;
    }
    adjustScore(playerId, value);
    setCustomValues((prev) => ({ ...prev, [playerId]: "" }));
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validated = validateImportedState(parsed);
      if (!validated) {
        toast({
          title: "Import mislukt",
          description: "Het bestand heeft niet het juiste formaat.",
        });
        return;
      }
      importState(validated);
      toast({ title: "Gegevens geïmporteerd", description: "Je lokale data is bijgewerkt." });
    } catch (error) {
      console.error(error);
      toast({ title: "Import mislukt", description: "Controleer het JSON-bestand en probeer opnieuw." });
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemovePlayer = (player: Player) => {
    if (window.confirm(`Speler ${player.name} verwijderen?`)) {
      removePlayer(player.id);
    }
  };

  const handleResetScores = () => {
    if (state.players.length === 0) return;
    if (window.confirm("Scores resetten naar 0 voor alle spelers?")) {
      resetScores();
    }
  };

  const handleResetAll = () => {
    if (window.confirm("Alle spelers en geschiedenis wissen?")) {
      resetAll();
    }
  };

  const onApplyPenalty = (penaltyOverride?: number) => {
    if (!currentPlayer) {
      toast({ title: "Geen speler geselecteerd" });
      return;
    }
    const valueToUse = penaltyOverride ?? state.settings.penaltyValue;
    applyPenalty(currentPlayer.id, valueToUse);
    if (penaltyOverride !== undefined) {
      setPenalty(Math.abs(penaltyOverride));
    }
    toast({
      title: "Doodshoofdeiland uitgevoerd",
      description: `- ${Math.abs(valueToUse)} voor iedereen behalve ${currentPlayer.name}`,
    });
  };

  const onAdjustScore = (playerId: string, delta: number) => {
    adjustScore(playerId, delta);
  };

  const onCustomPenaltyApply = () => {
    const parsed = Number(customPenalty);
    if (!Number.isFinite(parsed) || parsed === 0) {
      toast({ title: "Ongeldige penalty", description: "Gebruik een geheel getal anders dan 0." });
      return;
    }
    const magnitude = Math.abs(Math.trunc(parsed));
    setPenalty(magnitude);
    onApplyPenalty(magnitude);
    setCustomPenalty("");
  };

  const ranking = useMemo(
    () => [...state.players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)),
    [state.players],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 pb-12">
      <div className="max-w-6xl mx-auto py-8 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-primary/80 font-semibold">Score Tracker</p>
            <h1 className="text-3xl md:text-4xl font-bold">1000 Bommen & Granaten</h1>
            <p className="text-muted-foreground max-w-xl mt-1">
              Houd spelers, beurten en snelle scoreacties lokaal bij. Werkt offline en is PWA-ready.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">Local first</Badge>
              <Badge variant="outline">Undo</Badge>
              <Badge variant="outline">Export / Import</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
            <Button variant="secondary" onClick={() => downloadState(state)} className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
            <label className="relative inline-flex">
              <input
                type="file"
                accept="application/json"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => handleImport(e.target.files?.[0])}
                disabled={isImporting}
              />
              <Button variant="outline" className="gap-2" disabled={isImporting}>
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
              </Button>
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" onClick={undo} disabled={!canUndo} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Undo
                </Button>
              </TooltipTrigger>
              <TooltipContent>Laatste actie ongedaan maken</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] lg:grid-cols-[1.2fr_0.8fr]">
          <main className="space-y-4">
            <Card className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Huidige speler</CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                {currentPlayer ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center text-xl font-semibold"
                        style={{ background: playerAccent(currentPlayer, 0) }}
                      >
                        {currentPlayer.icon || currentPlayer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{currentPlayer.name}</p>
                        <p className="text-3xl font-black text-primary">{currentPlayer.score}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[100, -100].map((value) => (
                        <Button
                          key={`cp-${value}`}
                          onClick={() => onAdjustScore(currentPlayer.id, value)}
                          className="gap-1"
                          size="lg"
                          variant={value > 0 ? "default" : "secondary"}
                        >
                          <Zap className="h-4 w-4" /> {value > 0 ? "+" : ""}
                          {value}
                        </Button>
                      ))}
                      {currentPlayerActions.map((value) => (
                        <Button
                          key={value}
                          onClick={() => onAdjustScore(currentPlayer.id, value)}
                          className="gap-1"
                          size="lg"
                          variant="default"
                        >
                          <Zap className="h-4 w-4" /> +{value}
                        </Button>
                      ))}
                      <Button variant="outline" onClick={goToNextPlayer} className="gap-2">
                        Volgende speler <ArrowLeftRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Voeg spelers toe om te starten.</p>
                )}
                <Separator className="bg-slate-700" />
                <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Spelernaam"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer((p) => ({ ...p, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Emoji / icoon"
                      value={newPlayer.icon}
                      maxLength={4}
                      onChange={(e) => setNewPlayer((p) => ({ ...p, icon: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newPlayer.color}
                      onChange={(e) => setNewPlayer((p) => ({ ...p, color: e.target.value }))}
                      title="Spelerkleur"
                    />
                    <Button onClick={handleAddPlayer} className="gap-2 w-full">
                      <UserPlus className="h-4 w-4" /> Speler toevoegen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="bg-slate-900/70 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Doodshoofdeiland</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-2">
                    {[100, 500, 1000].map((value) => (
                      <Button
                        key={`penalty-${value}`}
                        variant="destructive"
                        className="gap-2 justify-center"
                        onClick={() => onApplyPenalty(value)}
                      >
                        <Skull className="h-4 w-4" /> -{value}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <div>
                      <Label htmlFor="penalty">Custom penalty</Label>
                      <Input
                        id="penalty"
                        type="number"
                        value={customPenalty}
                        onChange={(e) => setCustomPenalty(e.target.value)}
                        placeholder="-250"
                      />
                    </div>
                    <Button variant="destructive" className="gap-2" onClick={onCustomPenaltyApply}>
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Trek de penalty af bij alle spelers behalve de huidige speler. Positieve waarden worden als penalty gebruikt.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/70 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">Spelbeheer</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={handleResetScores} className="gap-2" disabled={state.players.length === 0}>
                    <Save className="h-4 w-4" /> Nieuw spel
                  </Button>
                  <Button variant="outline" onClick={handleResetAll} className="gap-2" disabled={state.players.length === 0}>
                    <TrashIcon /> Reset alles
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <Card
                  key={player.id}
                  className={`border ${state.currentPlayerId === player.id ? "border-primary shadow-lg shadow-primary/20" : "border-slate-800"} bg-slate-900/60`}
                >
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-11 w-11 rounded-full flex items-center justify-center text-lg font-semibold"
                          style={{ background: playerAccent(player, index) }}
                        >
                          {player.icon || player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{player.name}</p>
                          <p className="text-xs text-muted-foreground">Positie {state.players.findIndex((p) => p.id === player.id) + 1}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-black text-primary">{player.score}</p>
                        {state.currentPlayerId === player.id && (
                          <Badge variant="secondary" className="mt-1">Aan de beurt</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button onClick={() => onAdjustScore(player.id, 100)} className="h-12 text-lg">
                        +100
                      </Button>
                      <Button variant="secondary" onClick={() => onAdjustScore(player.id, -100)} className="h-12 text-lg">
                        -100
                      </Button>
                      <Button onClick={() => onAdjustScore(player.id, 500)} className="h-12 text-lg">
                        +500
                      </Button>
                      <Button onClick={() => onAdjustScore(player.id, 1000)} className="h-12 text-lg">
                        +1000
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Custom (+37 of -12)"
                        value={customValues[player.id] ?? ""}
                        onChange={(e) => handleCustomChange(player.id, e.target.value)}
                      />
                      <Button variant="outline" onClick={() => applyCustomDelta(player.id)}>
                        Toepassen
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setCurrentPlayer(player.id)}
                        className="gap-2"
                      >
                        <Zap className="h-4 w-4" /> Zet aan beurt
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => reorderPlayer(player.id, "up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => reorderPlayer(player.id, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemovePlayer(player)}
                      >
                        Verwijderen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {sortedPlayers.length === 0 && (
                <Card className="border-dashed border-slate-700 bg-slate-900/50">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nog geen spelers. Voeg er één toe om te starten.
                  </CardContent>
                </Card>
              )}
            </div>
          </main>

          <aside className="space-y-4">
            <Card className="bg-slate-900/70 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Live ranking</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground">
                    <tr className="text-left">
                      <th className="py-1 pr-2">#</th>
                      <th className="py-1 pr-2">Naam</th>
                      <th className="py-1 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {ranking.map((player, index) => (
                      <tr
                        key={`rank-${player.id}`}
                        className={`${
                          state.currentPlayerId === player.id
                            ? "bg-primary/10 text-primary"
                            : index === 0
                              ? "text-foreground"
                              : "text-muted-foreground"
                        }`}
                      >
                        <td className="py-1 pr-2 font-semibold">{index + 1}</td>
                        <td className="py-1 pr-2">{player.name}</td>
                        <td className="py-1 text-right font-semibold">{player.score}</td>
                      </tr>
                    ))}
                    {ranking.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-2 text-muted-foreground">
                          Nog geen spelers.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/70 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Actielog (laatste 20)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[320px] pr-2">
                  <ul className="space-y-3 text-sm">
                    {state.history.map((entry) => (
                      <li key={entry.id} className="border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                        <p className="font-semibold text-foreground">{entry.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </p>
                      </li>
                    ))}
                    {state.history.length === 0 && (
                      <p className="text-muted-foreground">Nog geen acties geregistreerd.</p>
                    )}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/70 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Gebruik de grote + en - knoppen tijdens het spel voor snelheid.</p>
                <p>Undo draait zowel scores als log terug.</p>
                <p>Alle data blijft lokaal in je browser (localStorage).</p>
                <p>Exporteer regelmatig om een veilige kopie te bewaren.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}
