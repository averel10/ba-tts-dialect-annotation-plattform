'use client';

import { useState, useEffect } from 'react';
import WaveformPlayer from '../WaveformPlayer';
import { type DatasetEntryForAnnotation, DIALECT_LABELS } from '@/lib/dialects';
import { type EntryViewProps } from './AnnotationPageView';

const AUTO_ADVANCE_DELAY_MS = 600;



export default function SingleChoiceEntryView({
  entry,
  index,
  onSave,
  isSaving,
  ratingOptions,
  confidenceOptions,
  question,
}: EntryViewProps) {
  const [answerRating, setAnswerRating] = useState<number | null>(null);
  const [answerConfidence, setAnswerConfidence] = useState<number | null>(null);
  const [fullyPlayed, setFullyPlayed] = useState<boolean>(false);

  const fileExt = entry.fileName.substring(entry.fileName.lastIndexOf('.'));
  const audioSrc = `/public/datasets/${entry.datasetId}/${entry.externalId}${fileExt}`;

  // Auto-save when both answer and confidence are selected
  useEffect(() => {
    if (answerRating === null || answerConfidence === null || isSaving) return;
    if (answerRating === entry.annotation && answerConfidence === entry.confidence) return; // No change, don't save

    const timer = setTimeout(() => {
      onSave(answerRating, answerConfidence);
    }, AUTO_ADVANCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [answerRating, answerConfidence, onSave, entry.annotation, entry.confidence, isSaving]);

  useEffect(() => {
    // Reset state when entry changes
    setAnswerRating(entry.annotation);
    setAnswerConfidence(entry.confidence);
    setFullyPlayed(entry.annotation !== null && entry.confidence !== null); // If already annotated, mark as fully played to allow changing answer
  }, [entry]);

  return (
    <div
      className={`border rounded-xl p-5 bg-white shadow-sm transition-colors duration-300 mt-4 ${
        fullyPlayed && answerRating !== null && answerConfidence !== null ? 'border-green-300' : 'border-gray-200'
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
      {!fullyPlayed && (
        <p className="text-xs text-gray-400 mt-2">
          Bitte die Aufnahme vollständig anhören, bevor du eine Bewertung abgibst.
        </p>
      )}

      {/* Utterance text */}
      {entry.utteranceText && (
        <div className="mt-4 mb-4 p-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Transkription</p>
          <p className="text-sm text-gray-800 italic">"{entry.utteranceText}"</p>
        </div>
      )}

      {/* Questions container */}
      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        {/* Rating question */}
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            {question}
          </div>
          <div className="flex flex-col gap-2">
            {ratingOptions?.map(({ value, label }) => {
              const selected = answerRating === value;
              const disabled = !fullyPlayed || isSaving;
              return (
                <button
                  key={value}
                  disabled={disabled}
                  onClick={() => setAnswerRating(value)}
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
                    {selected ? '✓' : ''}
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Confidence question */}
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            Wie sicher bist du?
          </div>
          <div className="flex flex-col gap-2">
            {confidenceOptions?.map(({ value, label }) => {
              const selected = answerConfidence === value;
              const disabled = !fullyPlayed || isSaving;
              return (
                <button
                  key={value}
                  disabled={disabled}
                  onClick={() => setAnswerConfidence(value)}
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
                    {selected ? '✓' : ''}
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footnote */}
      <p className="text-xs text-gray-400 mt-8 pt-3 border-t border-gray-100">
        Vertrau deinem ersten Eindruck – klingt die Aufnahme authentisch nach diesem Dialekt? Es gibt keine richtige oder falsche Antwort.
      </p>
    </div>
  );
}
