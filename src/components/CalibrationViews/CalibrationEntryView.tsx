'use client';

import { useState, useEffect } from 'react';
import WaveformPlayer from '../WaveformPlayer';
import { DIALECT_LABELS_WITHOUT_DE } from '@/lib/dialects';
import { ExperimentCalibration } from '@/lib/model/experiment_calibration';

interface CalibrationEntryViewProps {
  entry: ExperimentCalibration;
  onDialectSelect: (dialectLabel: string) => Promise<void>;
  onConfidenceSelect: (confidence: number) => Promise<void>;
  isSaving: boolean;
  existingAnswer?: { dialectLabel: string; confidence: number } | null;
}

const CONFIDENCE_OPTIONS = [
  { value: 1, label: 'Sehr unsicher' },
  { value: 2, label: 'Eher unsicher' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Eher sicher' },
  { value: 5, label: 'Sehr sicher' },
];

export default function CalibrationEntryView({
  entry,
  onDialectSelect,
  onConfidenceSelect,
  isSaving,
  existingAnswer,
}: CalibrationEntryViewProps) {
  const [selectedDialect, setSelectedDialect] = useState<string | null>(existingAnswer?.dialectLabel || null);
  const [selectedConfidence, setSelectedConfidence] = useState<number | null>(existingAnswer?.confidence || null);
  const [fullyPlayed, setFullyPlayed] = useState<boolean>(existingAnswer ? true : false);

  const audioSrc = "/public/" + entry.file;

  const handleDialectChange = async (dialect: string) => {
    setSelectedDialect(dialect);
    await onDialectSelect(dialect);
  };

  const handleConfidenceChange = async (confidence: number) => {
    setSelectedConfidence(confidence);
    await onConfidenceSelect(confidence);
  };

  useEffect(() => {
    // Reset state when entry changes
    setSelectedDialect(existingAnswer?.dialectLabel || null);
    setSelectedConfidence(existingAnswer?.confidence || null);
    setFullyPlayed(existingAnswer ? true : false);
  }, [entry, existingAnswer]);

  useEffect(() => {
    // Scroll to top when entry changes
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [entry.id]);

  return (
    <div
      className={`border rounded-xl p-5 bg-white shadow-sm transition-colors duration-300 ${
        fullyPlayed && selectedDialect !== null && selectedConfidence !== null
          ? 'border-green-300'
          : 'border-gray-200'
      }`}
    >
      {/* Sample header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Kalibrierungssample - {entry.order}
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
      />

      {/* Must-listen hint */}
      {!fullyPlayed && (
        <p className="text-xs text-amber-600 mt-2">
          Bitte das Sample vollständig anhören, bevor Sie eine Bewertung abgeben.
        </p>
      )}

      {/* Questions container */}
      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        {/* Dialect question */}
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            Welcher Dialekt ist es?
          </div>
          <div className="flex flex-col gap-2">
            {Object.entries(DIALECT_LABELS_WITHOUT_DE).map(([dialectKey, dialectName]) => {
              const selected = selectedDialect === dialectKey;
              const disabled = !fullyPlayed || isSaving;
              return (
                <button
                  key={dialectKey}
                  disabled={disabled}
                  onClick={() => handleDialectChange(dialectKey)}
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
                  <span>{dialectName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Confidence question */}
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-700 mb-3">
            Wie sicher sind Sie?
          </div>
          <div className="flex flex-col gap-2">
            {CONFIDENCE_OPTIONS.map(({ value, label }) => {
              const selected = selectedConfidence === value;
              const disabled = !fullyPlayed || isSaving;
              return (
                <button
                  key={value}
                  disabled={disabled}
                  onClick={() => handleConfidenceChange(value)}
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
    </div>
  );
}
