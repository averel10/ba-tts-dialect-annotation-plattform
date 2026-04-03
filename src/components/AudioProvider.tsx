'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface AudioContextType {
  currentAudioId: string | null;
  setCurrentAudio: (id: string | null) => void;
  playerCount: number;
  registerPlayer: (id: string) => void;
  unregisterPlayer: (id: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(0);

  const registerPlayer = useCallback((id: string) => {
    setPlayerCount((prev) => prev + 1);
  }, []);

  const unregisterPlayer = useCallback((id: string) => {
    setPlayerCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <AudioContext.Provider
      value={{
        currentAudioId,
        setCurrentAudio: setCurrentAudioId,
        playerCount,
        registerPlayer,
        unregisterPlayer,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}
