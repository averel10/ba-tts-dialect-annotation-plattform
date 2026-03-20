'use client';

import { useState, useEffect } from 'react';
import WaveformPlayer from '../WaveformPlayer';
import { type DatasetEntryForAnnotation, DIALECT_LABELS } from '@/lib/dialects';
import { type EntryViewProps } from './AnnotationPageView';

const AUTO_ADVANCE_DELAY_MS = 600;

export default function SingleChoiceEntryView({
  entry,
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
      onSave(answer);
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
      className={`border rounded-xl p-5 bg-white shadow-sm transition-colors duration-300 ${
        fullyPlayed && answer !== null ? 'border-green-300' : 'border-gray-200'
      }`}
    >
      {/* Sample header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Sample - {entry.externalId}
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
        durationMs={entry.durationMs}
        onFullyPlayed={() => setFullyPlayed(true)}
      />

      {/* Must-listen hint */}
      {!fullyPlayed && (
        <p className="text-xs text-amber-600 mt-2">
          Bitte das Sample vollständig anhören, bevor Sie eine Bewertung abgeben.
        </p>
      )}

      {/* Dialect + question */}
      <div className="mt-4 mb-3">
        <p className="text-sm font-semibold text-gray-700">
          {question}
        </p>
      </div>

      {/* Rating buttons */}
      <div className="flex flex-col gap-2">
        {ratingOptions?.map(({ value, label }) => {
          const selected = answer === value;
          const disabled = !fullyPlayed || isSaving;
          return (
            <button
              key={value}
              disabled={disabled}
              onClick={() => setAnswer(value)}
              className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                disabled
                  ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                  : selected
                  ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
              }`}
            >
              <span
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                  selected
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}
              >
                {value}
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
