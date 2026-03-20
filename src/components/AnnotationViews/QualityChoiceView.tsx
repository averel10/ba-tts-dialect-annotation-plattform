'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { saveAnnotations } from '@/app/actions/annotations';
import { type DatasetEntryForAnnotation } from '@/lib/dialects';
import QualityChoiceEntryView from './QualityChoiceEntryView';

interface QualityChoiceViewProps {
  entries: DatasetEntryForAnnotation[];
  experimentId: number;
}

export default function QualityChoicePage({ entries, experimentId }: QualityChoiceViewProps) {

  const [isPending, startTransition] = useTransition();

  // Find the first unannotated entry to start from
  const startingIndex = useMemo(() => {
    const firstUnannotatedIndex = entries.findIndex((e) => e.annotation === null);
    return firstUnannotatedIndex === -1 ? 0 : firstUnannotatedIndex;
  }, [entries]);

  const [currentIndex, setCurrentIndex] = useState(startingIndex);

  const currentEntry = entries[currentIndex];
  const isComplete = entries.every((e) => e.annotation !== null);
  
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

  const handleSaveEntry = async (rating: number) => {
    startTransition(async () => {
      const batch = [{ entryId: currentEntry!.id, rating, dialectLabel: currentEntry!.dialect }];
      await saveAnnotations(batch, experimentId);
      entries[currentIndex].annotation = rating; // Update local state optimistically
      handleNext();
    });
  };
  
  // Calculate progress: count already-annotated entries
  const annotatedCount = entries.filter((e) => e.annotation !== null).length;
  const progressPct = Math.round(((annotatedCount) / entries.length) * 100);

  if (isComplete) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-3xl font-bold text-green-600 mb-3">Fertig!</h1>
        <p className="text-gray-600 mb-8">
          Alle Samples wurden erfolgreich bewertet. Vielen Dank!
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Zurück zur Startseite
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="sticky top-[72px] z-40 bg-white border-b border-gray-200 pt-4 pb-3 mb-6">
        <div className="flex items-center justify-between mb-2">
            <Link
              href="/"
              className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              ← Startseite
            </Link>
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isPending}
              className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 rounded-md transition-colors"
            >
              ← Zurück
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= entries.length - 1 || isPending}
              className="text-sm px-3 py-1.5 bg-blue-100 hover:bg-blue-200 disabled:opacity-40 disabled:cursor-not-allowed text-blue-700 rounded-md transition-colors"
            >
              Weiter →
            </button>

          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between">
        <div className="text-xs text-gray-400 mt-1 text-left">{annotatedCount}/{entries.length} annotiert</div>
        <div className="text-xs text-gray-400 mt-1 text-right">{progressPct}% abgeschlossen</div>
        </div>
      </div>

      {/* ── Sample entry ────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        {currentEntry && (
          <QualityChoiceEntryView
            entry={currentEntry}
            onSave={handleSaveEntry}
            isSaving={isPending}
          />
        )}
      </div>
    </div>
  );
}
