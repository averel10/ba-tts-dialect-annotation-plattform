'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { saveCalibrationAnswers, getCalibrationAnswers } from '@/app/actions/calibration';
import { ExperimentCalibration } from '@/lib/model/experiment_calibration';
import CalibrationEntryView from './CalibrationEntryView';

interface CalibrationPageViewProps {
  entries: ExperimentCalibration[];
  experimentId: number;
}

interface CalibrationAnswers {
  [key: number]: {
    calibrationItemId: number;
    dialectLabel: string;
    confidence: number;
  };
}

export default function CalibrationPageView({
  entries,
  experimentId,
}: CalibrationPageViewProps) {
  const [isPending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<CalibrationAnswers>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load existing answers on component mount
  useEffect(() => {
    const loadExistingAnswers = async () => {
      try {
        const result = await getCalibrationAnswers(experimentId);
        if (result.success && result.data) {
          setAnswers(result.data as CalibrationAnswers);
          
          // Find the first unanswered entry
          const firstUnanswered = entries.findIndex((e) => {
            const answer = (result.data as CalibrationAnswers)[e.id];
            return !answer || !answer.dialectLabel || !answer.confidence;
          });
          
          if (firstUnanswered !== -1) {
            setCurrentIndex(firstUnanswered);
          }
        }
      } catch (error) {
        console.error('Error loading calibration answers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingAnswers();
  }, [experimentId, entries]);

  const currentEntry = entries[currentIndex];
  
  // Count only complete answers (both dialect and confidence filled)
  const completeAnswers = Object.values(answers).filter(
    (answer) => answer.dialectLabel && answer.confidence > 0
  );
  const isComplete = entries.length > 0 && completeAnswers.length === entries.length;
  const progressPct = Math.round((completeAnswers.length / entries.length) * 100);
  
  // Check if current entry has complete answers
  const currentEntryComplete = currentEntry && 
    answers[currentEntry.id]?.dialectLabel && 
    answers[currentEntry.id]?.confidence > 0;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < entries.length) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleSaveEntry = async (dialectLabel: string, confidence: number) => {
    startTransition(async () => {
      // Build updated answers
      const updatedAnswers = { ...answers };
      
      // Initialize entry if it doesn't exist
      if (!updatedAnswers[currentEntry.id]) {
        updatedAnswers[currentEntry.id] = {
          calibrationItemId: currentEntry.id,
          dialectLabel: '',
          confidence: 0,
        };
      }

      // Update with new values (keep existing values if not provided)
      if (dialectLabel) {
        updatedAnswers[currentEntry.id].dialectLabel = dialectLabel;
      }
      if (confidence > 0) {
        updatedAnswers[currentEntry.id].confidence = confidence;
      }

      setAnswers(updatedAnswers);

      // Save to database immediately
      try {
        await saveCalibrationAnswers(experimentId, updatedAnswers);
      } catch (error) {
        console.error('Error saving calibration answers:', error);
      }

      // Auto-advance to next entry only if both answers are selected
      const entry = updatedAnswers[currentEntry.id];
      if (entry.dialectLabel && entry.confidence > 0) {
        // Don't auto-advance if it's the last entry
        if (currentIndex < entries.length - 1) {
          handleNext();
        }
      }
    });
  };

  const handleDialectSelect = async (dialect: string) => {
    const currentConfidence = answers[currentEntry.id]?.confidence || 0;
    await handleSaveEntry(dialect, currentConfidence);
  };

  const handleConfidenceSelect = async (confidence: number) => {
    const currentDialect = answers[currentEntry.id]?.dialectLabel || '';
    await handleSaveEntry(currentDialect, confidence);
  };

  const handleCompleteCalibration = async () => {
    startTransition(async () => {
      // All answers are already saved, just trigger a page reload or redirect
      // Reload the page to check calibration status again
      window.location.reload();
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-gray-600">Laden Sie Ihre vorherigen Antworten...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto text-center py-20">
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-green-600 mb-3">
                Kalibrierung abgeschlossen!
              </h1>
              <p className="text-gray-600 mb-8">
                Sie haben alle Kalibrierungssamples bewertet. Vielen Dank! Sie können jetzt mit der
                Annotation beginnen.
              </p>
              <button
                onClick={handleCompleteCalibration}
                disabled={isPending}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {isPending ? 'Wird gespeichert...' : 'Zur Annotation'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with progress */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-800">Kalibrierungsphase</h1>
            <span className="text-sm text-gray-600">
              {completeAnswers.length} / {entries.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-8 px-4">
            {currentEntry && (
              <CalibrationEntryView
                entry={currentEntry}
                onDialectSelect={handleDialectSelect}
                onConfidenceSelect={handleConfidenceSelect}
                isSaving={isPending}
                existingAnswer={answers[currentEntry.id]}
              />
            )}
          </div>
        </div>

        {/* Navigation footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isPending}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Vorherige
          </button>
          <button
            onClick={handleNext}
            disabled={isPending || !currentEntryComplete}
            title={!currentEntryComplete ? 'Bitte beantworten Sie beide Fragen, bevor Sie fortfahren' : ''}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {currentIndex === entries.length - 1 ? 'Fertig' : 'Nächste →'}
          </button>
        </div>
      </div>
    </div>
  );
}
