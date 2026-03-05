'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AudioContextType {
  currentAudioId: string | null;
  setCurrentAudio: (id: string | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);

  return (
    <AudioContext.Provider value={{ currentAudioId, setCurrentAudio: setCurrentAudioId }}>
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
