'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import WaveformPlayer from '../WaveformPlayer';
import { saveAnnotations } from '@/app/actions/annotations';
import { type AnnotationEntry, DIALECT_LABELS } from '@/lib/dialects';

const PAGE_SIZE = 1;
const AUTO_ADVANCE_DELAY_MS = 600;

const RATING_OPTIONS = (dialectLabel: string) => [
  { value: 1, label: `Klingt überhaupt nicht nach ${dialectLabel}` },
  { value: 2, label: `Klingt eher nicht nach ${dialectLabel}` },
  { value: 3, label: 'Schwer zu beurteilen' },
  { value: 4, label: `Klingt eher nach ${dialectLabel}` },
  { value: 5, label: `Klingt eindeutig nach ${dialectLabel}` },
];

interface SingleChoiceViewProps {
  entries: AnnotationEntry[];
  datasetId: number;
}

export default function SingleChoiceView({ entries, datasetId }: SingleChoiceViewProps) {

  const [isPending, startTransition] = useTransition();

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [fullyPlayed, setFullyPlayed] = useState<Set<number>>(new Set());
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const totalPages = Math.ceil(entries.length / PAGE_SIZE);
  const pageEntries = entries.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const progressPct = Math.round((currentPage / totalPages) * 100);

  const allCurrentDone =
    pageEntries.length > 0 &&
    pageEntries.every((e) => fullyPlayed.has(e.id) && answers[e.id] !== undefined);

  useEffect(() => {
    if (!allCurrentDone || isPending) return;

    const timer = setTimeout(() => {
      const batch = pageEntries.map((e) => ({ entryId: e.id, rating: answers[e.id], dialectLabel: e.dialect }));
      startTransition(async () => {
        await saveAnnotations(batch);
        if (currentPage + 1 >= totalPages) {
          setIsComplete(true);
        } else {
          setCurrentPage((p) => p + 1);
          setActivePlayerId(null);
        }
      });
    }, AUTO_ADVANCE_DELAY_MS);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCurrentDone]);

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
          <span className="text-sm text-gray-500">
            Sample {currentPage + 1} von {totalPages}
          </span>
          <Link
            href="/"
            className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1 text-right">{progressPct}% abgeschlossen</div>
      </div>

      {/* ── Sample cards ────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        {pageEntries.map((entry, idx) => {
          const dialectLabel = DIALECT_LABELS[entry.dialect] ?? entry.dialect;
          const fileExt = entry.fileName.substring(entry.fileName.lastIndexOf('.'));
          const audioSrc = `/public/datasets/${datasetId}/${entry.externalId}${fileExt}`;
          const isListened = fullyPlayed.has(entry.id);
          const currentRating = answers[entry.id] ?? null;

          return (
            <div
              key={entry.id}
              className={`border rounded-xl p-5 bg-white shadow-sm transition-colors duration-300 ${
                isListened && currentRating !== null
                  ? 'border-green-300'
                  : 'border-gray-200'
              }`}
            >
              {/* Sample header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Sample {currentPage * PAGE_SIZE + idx + 1}
                </span>
                {isListened && (
                  <span className="text-xs text-green-600 font-medium">
                    ✓ Gehört
                  </span>
                )}
              </div>

              {/* Waveform player */}
              <WaveformPlayer
                src={audioSrc}
                durationMs={entry.durationMs}
                isActive={activePlayerId === entry.id}
                onPlay={() => setActivePlayerId(entry.id)}
                onFullyPlayed={() =>
                  setFullyPlayed((prev) => {
                    const next = new Set(prev);
                    next.add(entry.id);
                    return next;
                  })
                }
              />

              {/* Must-listen hint */}
              {!isListened && (
                <p className="text-xs text-amber-600 mt-2">
                  Bitte das Sample vollständig anhören, bevor Sie eine Bewertung abgeben.
                </p>
              )}

              {/* Dialect + question */}
              <div className="mt-4 mb-3">
                <p className="text-sm font-semibold text-gray-700">
                  Wie authentisch klingt dieses Sample nach dem Dialekt der Region{' '}
                  <span className="text-blue-600">{dialectLabel}</span>?
                </p>
              </div>

              {/* Rating buttons */}
              <div className="flex flex-col gap-2">
                {RATING_OPTIONS(dialectLabel).map(({ value, label }) => {
                  const selected = currentRating === value;
                  const disabled = !isListened || isPending;
                  return (
                    <button
                      key={value}
                      disabled={disabled}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [entry.id]: value }))
                      }
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
        })}
      </div>
    </div>
  );
}
