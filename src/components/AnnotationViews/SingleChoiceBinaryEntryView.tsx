'use client';

import { useState, useEffect } from 'react';
import WaveformPlayer from '../WaveformPlayer';
import { type EntryViewProps } from './AnnotationPageView';

const AUTO_ADVANCE_DELAY_MS = 600;

export default function SingleChoiceBinaryEntryView({
  entry,
  index,
  onSave,
  isSaving,
  ratingOptions,
  question,
}: EntryViewProps) {
  const [answer, setAnswer] = useState<number | null>(null);
  const [fullyPlayed, setFullyPlayed] = useState<boolean>(false);

  const fileExt = entry.fileName.substring(entry.fileName.lastIndexOf('.'));
  const audioSrc = `/public/datasets/${entry.datasetId}/${entry.externalId}${fileExt}`;

  // Auto-save when answer is selected
  useEffect(() => {
    if (answer === null || isSaving) return;
    if (answer === entry.annotation) return; // No change, don't save

    const timer = setTimeout(() => {
      onSave(answer, -1); // Using max confidence for now, can be changed to user input if needed
    }, AUTO_ADVANCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [answer, onSave, entry.annotation, isSaving]);

  useEffect(() => {
    // Reset state when entry changes
    setAnswer(entry.annotation);
    setFullyPlayed(entry.annotation !== null); // If already annotated, mark as fully played to allow changing answer
  }, [entry]);

  return (
    <div
      className={`border rounded-xl p-5 bg-white shadow-sm transition-colors duration-300 mt-4 ${
        fullyPlayed && answer !== null ? 'border-green-300' : 'border-gray-200'
      }`}
    >
      {/* Sample header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Aufnahme {index + 1}
        </span>
        {fullyPlayed && (
          <span className="text-xs text-green-600 font-medium">
            ✓ Gehört
          </span>
        )}
      </div>

      {/* Waveform player */}
      <WaveformPlayer
        src={audioSrc}
        onFullyPlayed={() => setFullyPlayed(true)}
        playMode='pause'
      />

      {/* Must-listen hint */}
        <p className="text-xs text-gray-400 mt-2">
          Bitte die Aufnahme vollständig anhören, bevor du eine Bewertung abgibst.
        </p>
      

      {/* Utterance text */}
      {entry.utteranceText && (
        <div className="mt-4 mb-4 p-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Transkription</p>
          <p className="text-sm text-gray-800 italic">"{entry.utteranceText}"</p>
        </div>
      )}

      {/* Dialect + question */}
      <div className="mt-4 mb-3">
        <div className="text-s font-semibold text-gray-700">
          {question}
        </div>
      </div>

      {/* Radio Select */}
      <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-200 w-fit mt-4">
        {ratingOptions?.map(({ value, label }) => {
          const selected = answer === value;
          const disabled = !fullyPlayed || isSaving;
          return (
            <button
              key={value}
              disabled={disabled}
              onClick={() => setAnswer(value)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                disabled
                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                  : selected
                  ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
