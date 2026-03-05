'use client';

import { useState, useRef, useEffect } from 'react';
import { useAudio } from './AudioProvider';

interface AudioPlayerProps {
  fileName: string;
  datasetId: number;
  externalId?: string;
}

export default function AudioPlayer({ fileName, datasetId, externalId }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentAudioId, setCurrentAudio } = useAudio();
  const audioId = `${datasetId}-${externalId}`;

  // Extract file extension from original fileName and construct URL using externalId
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
  const audioPath = `/datasets/${datasetId}/${externalId}${fileExtension}`;

  // Stop playing if another audio started
  useEffect(() => {
    if (currentAudioId !== audioId && audioRef.current && isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [currentAudioId, audioId, isPlaying]);

  const handlePlay = () => {
    if (audioRef.current) {
      setCurrentAudio(audioId);
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  };

  const handlePlaybackEnd = () => {
    setIsPlaying(false);
    setCurrentAudio(null);
  };

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={audioPath}
        onEnded={handlePlaybackEnd}
      />
      <button
        onClick={isPlaying ? handleStop : handlePlay}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
          isPlaying
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        title={isPlaying ? 'Stop' : 'Play'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <rect x="6" y="4" width="2" height="12" />
            <rect x="12" y="4" width="2" height="12" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        )}
      </button>
    </div>
  );
}
