import { useEffect, useMemo, useReducer } from "react";

export type Player = {
  id: string;
  name: string;
  score: number;
  color?: string;
  icon?: string;
};

export type HistoryEntry = {
  id: string;
  timestamp: number;
  message: string;
  type: "score" | "player" | "penalty" | "game" | "import";
};

type Settings = {
  penaltyValue: number;
  sortByScore: boolean;
};

export type ScoreState = {
  players: Player[];
  currentPlayerId: string | null;
  settings: Settings;
  history: HistoryEntry[];
};

type StateWithHistory = {
  past: ScoreState[];
  present: ScoreState;
};

const STORAGE_KEY = "bombs-granaten-score-state";

const defaultState: ScoreState = {
  players: [],
  currentPlayerId: null,
  settings: {
    penaltyValue: 10,
    sortByScore: false,
  },
  history: [],
};

type Action =
  | { type: "ADD_PLAYER"; payload: { name: string; color?: string; icon?: string } }
  | { type: "REMOVE_PLAYER"; payload: { playerId: string } }
  | { type: "REORDER_PLAYER"; payload: { playerId: string; direction: "up" | "down" } }
  | { type: "SET_CURRENT_PLAYER"; payload: { playerId: string } }
  | { type: "NEXT_PLAYER" }
  | { type: "ADJUST_SCORE"; payload: { playerId: string; delta: number } }
  | { type: "SET_PENALTY"; payload: { penaltyValue: number } }
  | { type: "APPLY_PENALTY"; payload: { currentPlayerId: string } }
  | { type: "NEW_GAME" }
  | { type: "RESET_ALL" }
  | { type: "IMPORT_STATE"; payload: ScoreState }
  | { type: "UNDO" }
  | { type: "TOGGLE_SORT" };

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function clampHistory(history: HistoryEntry[]) {
  return history.slice(0, 20);
}

function sanitizeHistory(rawHistory: unknown[]): HistoryEntry[] {
  return clampHistory(
    rawHistory
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const casted = item as Partial<HistoryEntry>;
        return {
          id: casted.id || randomId(),
          timestamp: casted.timestamp && Number.isFinite(casted.timestamp) ? Number(casted.timestamp) : Date.now(),
          message: casted.message || "Onbekende actie",
          type: (casted.type as HistoryEntry["type"]) || "game",
        };
      }),
  );
}

function withHistory(state: StateWithHistory, next: ScoreState): StateWithHistory {
  return {
    past: [...state.past.slice(-19), state.present],
    present: next,
  };
}

function appendHistory(state: ScoreState, entry: HistoryEntry): ScoreState {
  return {
    ...state,
    history: clampHistory([entry, ...state.history]),
  };
}

function ensureCurrentPlayer(players: Player[], currentId: string | null) {
  if (players.length === 0) return null;
  if (currentId && players.some((p) => p.id === currentId)) return currentId;
  return players[0]?.id ?? null;
}

function reducer(state: StateWithHistory, action: Action): StateWithHistory {
  switch (action.type) {
    case "ADD_PLAYER": {
      const trimmed = action.payload.name.trim();
      if (!trimmed) return state;
      const newPlayer: Player = {
        id: randomId(),
        name: trimmed,
        color: action.payload.color,
        icon: action.payload.icon,
        score: 0,
      };
      const nextPlayers = [...state.present.players, newPlayer];
      const nextState = appendHistory(
        {
          ...state.present,
          players: nextPlayers,
          currentPlayerId: state.present.currentPlayerId ?? newPlayer.id,
        },
        {
          id: randomId(),
          timestamp: Date.now(),
          type: "player",
          message: `Speler ${newPlayer.name} toegevoegd`,
        },
      );
      return withHistory(state, nextState);
    }
    case "REMOVE_PLAYER": {
      const target = state.present.players.find((p) => p.id === action.payload.playerId);
      if (!target) return state;
      const nextPlayers = state.present.players.filter((p) => p.id !== target.id);
      const nextState = appendHistory(
        {
          ...state.present,
          players: nextPlayers,
          currentPlayerId: ensureCurrentPlayer(nextPlayers, state.present.currentPlayerId === target.id ? null : state.present.currentPlayerId),
        },
        {
          id: randomId(),
          timestamp: Date.now(),
          type: "player",
          message: `Speler ${target.name} verwijderd`,
        },
      );
      return withHistory(state, nextState);
    }
    case "REORDER_PLAYER": {
      const currentIndex = state.present.players.findIndex((p) => p.id === action.payload.playerId);
      if (currentIndex === -1) return state;
      const delta = action.payload.direction === "up" ? -1 : 1;
      const targetIndex = currentIndex + delta;
      if (targetIndex < 0 || targetIndex >= state.present.players.length) return state;
      const nextPlayers = [...state.present.players];
      const [moved] = nextPlayers.splice(currentIndex, 1);
      nextPlayers.splice(targetIndex, 0, moved);
      const nextState: ScoreState = { ...state.present, players: nextPlayers };
      return withHistory(state, nextState);
    }
    case "SET_CURRENT_PLAYER": {
      if (!state.present.players.some((p) => p.id === action.payload.playerId)) return state;
      const nextState: ScoreState = { ...state.present, currentPlayerId: action.payload.playerId };
      return withHistory(state, nextState);
    }
    case "NEXT_PLAYER": {
      if (state.present.players.length === 0) return state;
      const currentIndex = state.present.players.findIndex((p) => p.id === state.present.currentPlayerId);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % state.present.players.length;
      const nextState: ScoreState = { ...state.present, currentPlayerId: state.present.players[nextIndex].id };
      return withHistory(state, nextState);
    }
    case "ADJUST_SCORE": {
      const target = state.present.players.find((p) => p.id === action.payload.playerId);
      if (!target || !Number.isInteger(action.payload.delta)) return state;
      const updatedPlayers = state.present.players.map((p) =>
        p.id === target.id ? { ...p, score: p.score + action.payload.delta } : p,
      );
      const deltaLabel = action.payload.delta > 0 ? `+${action.payload.delta}` : `${action.payload.delta}`;
      const nextState = appendHistory(
        { ...state.present, players: updatedPlayers },
        {
          id: randomId(),
          timestamp: Date.now(),
          type: "score",
          message: `${target.name} ${deltaLabel}`,
        },
      );
      return withHistory(state, nextState);
    }
    case "SET_PENALTY": {
      const penaltyValue = Number.isFinite(action.payload.penaltyValue)
        ? Math.max(0, Math.trunc(action.payload.penaltyValue))
        : state.present.settings.penaltyValue;
      const nextState: ScoreState = {
        ...state.present,
        settings: { ...state.present.settings, penaltyValue },
      };
      return withHistory(state, nextState);
    }
    case "APPLY_PENALTY": {
      if (state.present.players.length === 0) return state;
      const keeper = state.present.players.find((p) => p.id === action.payload.currentPlayerId);
      if (!keeper) return state;
      const penalty = Math.max(0, Math.trunc(state.present.settings.penaltyValue));
      const updatedPlayers = state.present.players.map((p) =>
        p.id === keeper.id ? p : { ...p, score: p.score - penalty },
      );
      const nextState = appendHistory(
        { ...state.present, players: updatedPlayers, currentPlayerId: keeper.id },
        {
          id: randomId(),
          timestamp: Date.now(),
          type: "penalty",
          message: `Doodshoofdeiland: iedereen -${penalty} behalve ${keeper.name}`,
        },
      );
      return withHistory(state, nextState);
    }
    case "NEW_GAME": {
      const resetPlayers = state.present.players.map((p) => ({ ...p, score: 0 }));
      const nextState = appendHistory(
        { ...state.present, players: resetPlayers },
        {
          id: randomId(),
          timestamp: Date.now(),
          type: "game",
          message: "Nieuw spel: scores terug naar 0",
        },
      );
      return withHistory(state, nextState);
    }
    case "RESET_ALL": {
      return withHistory(state, {
        ...defaultState,
      });
    }
    case "IMPORT_STATE": {
      const normalizedPlayers = action.payload.players.map((p) => ({
        id: p.id || randomId(),
        name: p.name.trim(),
        score: Math.trunc(p.score) || 0,
        color: p.color,
        icon: p.icon,
      }));
      const sanitized: ScoreState = {
        players: normalizedPlayers,
        currentPlayerId: ensureCurrentPlayer(normalizedPlayers, action.payload.currentPlayerId),
        settings: {
          penaltyValue: Math.max(0, Math.trunc(action.payload.settings?.penaltyValue ?? defaultState.settings.penaltyValue)),
          sortByScore: Boolean(action.payload.settings?.sortByScore),
        },
        history: Array.isArray(action.payload.history) ? sanitizeHistory(action.payload.history) : [],
      };
      return { past: [], present: sanitized };
    }
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
      };
    }
    case "TOGGLE_SORT": {
      const nextState: ScoreState = {
        ...state.present,
        settings: {
          ...state.present.settings,
          sortByScore: !state.present.settings.sortByScore,
        },
      };
      return withHistory(state, nextState);
    }
    default:
      return state;
  }
}

function getInitialState(): StateWithHistory {
  if (typeof window === "undefined") return { past: [], present: defaultState };
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return { past: [], present: defaultState };
  try {
    const parsed = JSON.parse(stored) as ScoreState;
    const players = Array.isArray(parsed.players) ? parsed.players : [];
    const normalizedPlayers = players
      .filter((p) => typeof p?.name === "string" && p.name.trim())
      .map((p) => ({
        id: p.id || randomId(),
        name: p.name.trim(),
        score: Math.trunc(Number(p.score)) || 0,
        color: p.color,
        icon: p.icon,
      }));

    return {
      past: [],
      present: {
        players: normalizedPlayers,
        currentPlayerId: ensureCurrentPlayer(normalizedPlayers, parsed.currentPlayerId ?? null),
        settings: {
          penaltyValue: Math.max(0, Math.trunc(parsed.settings?.penaltyValue ?? defaultState.settings.penaltyValue)),
          sortByScore: Boolean(parsed.settings?.sortByScore),
        },
        history: Array.isArray(parsed.history) ? sanitizeHistory(parsed.history) : [],
      },
    };
  } catch (error) {
    console.error("Failed to parse stored state", error);
    return { past: [], present: defaultState };
  }
}

export function useScoreTracker() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  useEffect(() => {
    const handle = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.present));
    }, 150);
    return () => clearTimeout(handle);
  }, [state.present]);

  const sortedPlayers = useMemo(() => {
    if (!state.present.settings.sortByScore) return state.present.players;
    return [...state.present.players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }, [state.present.players, state.present.settings.sortByScore]);

  return {
    state: state.present,
    sortedPlayers,
    canUndo: state.past.length > 0,
    addPlayer: (payload: { name: string; color?: string; icon?: string }) =>
      dispatch({ type: "ADD_PLAYER", payload }),
    removePlayer: (playerId: string) => dispatch({ type: "REMOVE_PLAYER", payload: { playerId } }),
    reorderPlayer: (playerId: string, direction: "up" | "down") =>
      dispatch({ type: "REORDER_PLAYER", payload: { playerId, direction } }),
    setCurrentPlayer: (playerId: string) => dispatch({ type: "SET_CURRENT_PLAYER", payload: { playerId } }),
    goToNextPlayer: () => dispatch({ type: "NEXT_PLAYER" }),
    adjustScore: (playerId: string, delta: number) => dispatch({ type: "ADJUST_SCORE", payload: { playerId, delta } }),
    setPenalty: (penaltyValue: number) => dispatch({ type: "SET_PENALTY", payload: { penaltyValue } }),
    applyPenalty: (currentPlayerId: string) => dispatch({ type: "APPLY_PENALTY", payload: { currentPlayerId } }),
    resetScores: () => dispatch({ type: "NEW_GAME" }),
    resetAll: () => dispatch({ type: "RESET_ALL" }),
    importState: (payload: ScoreState) => dispatch({ type: "IMPORT_STATE", payload }),
    undo: () => dispatch({ type: "UNDO" }),
    toggleSort: () => dispatch({ type: "TOGGLE_SORT" }),
  };
}
