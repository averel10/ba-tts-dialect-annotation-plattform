'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAudio } from './AudioProvider';

interface WaveformPlayerProps {
  // Audio source URL (required)
  src: string;
  
  // Audio playback options
  onPlay?: () => void;
  onFullyPlayed?: () => void;
  
  // Display options
  showWaveform?: boolean; // defaults to true; if false, shows simple player button
  playMode?: 'pause' | 'stop'; // defaults to 'pause'; determines play/pause vs play/stop behavior
}

const BAR_COUNT = 120;

export default function WaveformPlayer({
  src,
  onPlay,
  onFullyPlayed,
  showWaveform = true,
  playMode = 'pause',
}: WaveformPlayerProps) {
  const { currentAudioId, setCurrentAudio } = useAudio();
  
  // Generate unique ID for this player instance
  const playerId = useRef(Math.random().toString(36).slice(2)).current;
  const isActive = currentAudioId === playerId;

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const fullyPlayedRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);

  // Stop if another player became active
  useEffect(() => {
    if (!isActive && isPlaying) {
      audioRef.current?.pause();
      cancelAnimationFrame(rafRef.current);
      setIsPlaying(false);
    }
  }, [isActive, isPlaying]);

  // Reset state when src changes
  useEffect(() => {
    setPeaks([]);
    setCurrentTime(0);
    setDuration(0);
    fullyPlayedRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
  }, [src]);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentAudio(playerId);
    onPlay?.();
    // Only reset to start if in stop mode; in pause mode, resume from paused position
    if (playMode === 'stop') {
      audio.currentTime = 0;
    }
    audio.play();
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [playerId, onPlay, tick, playMode]);

  const handlePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const handleStop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentAudio(null);
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
    if (!fullyPlayedRef.current) {
      fullyPlayedRef.current = true;
      onFullyPlayed?.();
    }
  }, [onFullyPlayed]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  }, []);

  // Decode audio and generate waveform peaks (only if showWaveform is true)
  useEffect(() => {
    if (!showWaveform) return;
    
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src);
        const buf = await res.arrayBuffer();
        const actx = new AudioContext();
        const decoded = await actx.decodeAudioData(buf);
        if (cancelled) return;

        const data = decoded.getChannelData(0);
        const blockSize = Math.floor(data.length / BAR_COUNT);
        const raw: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(data[i * blockSize + j]);
          }
          raw.push(sum / blockSize);
        }
        const max = Math.max(...raw, 0.001);
        if (!cancelled) setPeaks(raw.map((v) => v / max));
        await actx.close();
      } catch {
        if (!cancelled) setPeaks(Array(BAR_COUNT).fill(0.5));
      }
    })();
    return () => { cancelled = true; };
  }, [src, showWaveform]);

  // Reset peaks when src changes
  useEffect(() => {
    setPeaks([]);
  }, [src]);

  // Draw waveform on canvas whenever peaks or playback position change
  useEffect(() => {
    if (!showWaveform) return;
    
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
    const barW = Math.max(1, width / BAR_COUNT - 1);

    peaks.forEach((peak, i) => {
      const x = (i / BAR_COUNT) * width;
      const barH = Math.max(2, peak * height * 0.85);
      const y = (height - barH) / 2;
      const played = i / BAR_COUNT < progress;
      ctx.fillStyle = played ? '#3b82f6' : '#d1d5db';
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 2);
      ctx.fill();
    });
  }, [peaks, currentTime, duration, showWaveform]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Simple player button (no waveform)
  if (!showWaveform) {
    return (
      <div className="flex items-center gap-2">
        <audio
          ref={audioRef}
          src={src}
          onEnded={handleEnded}
        />
        <button
          onClick={isPlaying ? (playMode === 'stop' ? handleStop : handlePause) : handlePlay}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title={isPlaying ? (playMode === 'stop' ? 'Stop' : 'Pause') : 'Play'}
        >
          {isPlaying ? (
            playMode === 'stop' ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="5" y="5" width="10" height="10" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="6" y="4" width="2" height="12" />
                <rect x="12" y="4" width="2" height="12" />
              </svg>
            )
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  // Waveform player with visualization
  return (
    <div className="flex flex-col gap-2">
      <audio
        ref={audioRef}
        src={src}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
      />
      <div className="flex items-center gap-3">
        {/* Play / Pause button */}
        <button
          onClick={isPlaying ? (playMode === 'stop' ? handleStop : handlePause) : handlePlay}
          className={`flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title={isPlaying ? (playMode === 'stop' ? 'Stop' : 'Pause') : 'Abspielen'}
        >
          {isPlaying ? (
            playMode === 'stop' ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="5" y="5" width="10" height="10" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="5" y="4" width="3" height="12" rx="1" />
                <rect x="12" y="4" width="3" height="12" rx="1" />
              </svg>
            )
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
        </button>

        {/* Waveform canvas - hidden on small screens */}
        <canvas
          ref={canvasRef}
          width={480}
          height={48}
          className="hidden sm:flex flex-1 rounded"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Time display - shown on small screens instead of waveform */}
        <div className="sm:hidden text-sm text-gray-500 tabular-nums">
          {fmt(currentTime)}/{fmt(duration)}
        </div>

        {/* Duration - hidden on small screens */}
        <span className="hidden sm:flex flex-shrink-0 text-sm text-gray-500 w-10 text-right tabular-nums">
          {fmt(duration)}
        </span>
      </div>
    </div>
  );
}
