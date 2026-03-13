'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WaveformPlayerProps {
  src: string;
  durationMs?: number | null;
  /** When false the player should stop if it was playing */
  isActive: boolean;
  onPlay: () => void;
  onFullyPlayed: () => void;
}

const BAR_COUNT = 120;

export default function WaveformPlayer({
  src,
  durationMs,
  isActive,
  onPlay,
  onFullyPlayed,
}: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(durationMs ? durationMs / 1000 : 0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const fullyPlayedRef = useRef(false);

  // Stop if another player became active
  useEffect(() => {
    if (!isActive && isPlaying) {
      audioRef.current?.pause();
      cancelAnimationFrame(rafRef.current);
      setIsPlaying(false);
    }
  }, [isActive, isPlaying]);

  // Decode audio and generate waveform peaks
  useEffect(() => {
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
  }, [src]);

  // Draw waveform on canvas whenever peaks or playback position change
  useEffect(() => {
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
  }, [peaks, currentTime, duration]);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    onPlay();
    audio.play();
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  };

  const handlePause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
    if (!fullyPlayedRef.current) {
      fullyPlayedRef.current = true;
      onFullyPlayed();
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

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
          onClick={isPlaying ? handlePause : handlePlay}
          className={`flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title={isPlaying ? 'Pause' : 'Abspielen'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <rect x="5" y="4" width="3" height="12" rx="1" />
              <rect x="12" y="4" width="3" height="12" rx="1" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
        </button>

        {/* Waveform canvas */}
        <canvas
          ref={canvasRef}
          width={480}
          height={48}
          className="flex-1 rounded"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Duration */}
        <span className="flex-shrink-0 text-sm text-gray-500 w-10 text-right tabular-nums">
          {fmt(duration)}
        </span>
      </div>
    </div>
  );
}
