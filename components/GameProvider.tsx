"use client";

import { createContext, useContext, type ReactNode, type RefObject } from "react";
import { useCall, type CallController, type SceneGameEvent } from "@/components/useCall";

type GameContextValue = CallController & { eventsRef: RefObject<SceneGameEvent[]> };
const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const game = useCall();
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used inside <GameProvider>");
  return value;
}
