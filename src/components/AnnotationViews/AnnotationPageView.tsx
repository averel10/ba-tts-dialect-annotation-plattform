'use client';

import { useState, useMemo, useTransition, JSX, useEffect } from 'react';
import Link from 'next/link';
import { saveAnnotations } from '@/app/actions/annotations';
import { getDialectScoresFromCalibration } from '@/app/actions/calibration-scoring';
import { DIALECT_LABELS, type DatasetEntryForAnnotation } from '@/lib/dialects';
import SingleChoiceEntryView from './SingleChoiceEntryView';
import SingleChoiceBinaryEntryView from './SingleChoiceBinaryEntryView';
import AnnotationSidebarNavigation from './AnnotationSidebarNavigation';
import CalibrationScoresModal from '@/components/CalibrationScoresModal';

export interface EntryViewProps {
  entry: DatasetEntryForAnnotation;
  index: number;
  onSave: (rating: number, confidence: number) => Promise<void>;
  isSaving: boolean;
  ratingOptions?: { value: number; label: JSX.Element | string }[];
  confidenceOptions?: { value: number; label: JSX.Element | string }[];
  question?: JSX.Element | string;
}

interface AnnotationPageViewProps {
  entries: DatasetEntryForAnnotation[];
  experimentId: number;
  viewType: string;
  onShowIntro?: () => void;
}

export default function AnnotationPageView({
  entries,
  experimentId,
  viewType,
  onShowIntro,
}: AnnotationPageViewProps) {

  const [isPending, startTransition] = useTransition();
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [dialectScores, setDialectScores] = useState<Record<string, number>>({});

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  // Load calibration scores on component mount
  useEffect(() => {
    const loadScores = async () => {
      try {
        const scores = await getDialectScoresFromCalibration(experimentId);
        setDialectScores(scores);
      } catch (error) {
        console.error('Error loading calibration scores:', error);
      }
    };
    loadScores();
  }, [experimentId]);


  const getAnnotationConfig = (dialectLabel: string) => {
    switch (viewType) {
      case 'quality-choice':
        return {
          ratingOptions: [
            { value: 1, label: `Klingt überhaupt nicht nach ${DIALECT_LABELS[dialectLabel]}` },
            { value: 2, label: `Klingt eher nicht nach ${DIALECT_LABELS[dialectLabel]}` },
            { value: 3, label: `Klingt eher nach ${DIALECT_LABELS[dialectLabel]}` },
            { value: 4, label: `Klingt eindeutig nach ${DIALECT_LABELS[dialectLabel]}` },
          ],
          question: <div>Wie authentisch klingt diese Aufnahme nach dem Dialekt der Region <span className="text-blue-600">{DIALECT_LABELS[dialectLabel]}</span>?</div>,
          confidenceOptions: [
            { value: 1, label: 'Sehr unsicher' },
            { value: 2, label: 'Eher unsicher' },
            { value: 3, label: 'Eher sicher' },
            { value: 4, label: 'Sehr sicher' },
          ]
        };
      case 'binary':
        return {
          ratingOptions: [
            { value: 0, label: 'Ja' },
            { value: 2, label: 'Unklar' },
            { value: 1, label: 'Nein' },
          ],
          question: <div>Klingt diese Aufnahme nach dem Dialekt der Region <span className="text-blue-600">{DIALECT_LABELS[dialectLabel]}</span>?</div>,
        };
      default:
        return {
          ratingOptions: [{ value: 1, label: '' }],
          question: <div />,
        };
    }
  };

  // Determine which view component to use based on viewType
  const getViewComponent = () => {
  const config = getAnnotationConfig(currentEntry.dialect);
      switch (viewType) {
        case 'quality-choice':
              return (
      <SingleChoiceEntryView
        entry={currentEntry}
        index={currentIndex}
        onSave={handleSaveEntry}
        isSaving={isPending}
        ratingOptions={config.ratingOptions}
        question={config.question}
        confidenceOptions={config.confidenceOptions}
      />
    );
        case 'binary':
    return (
      <SingleChoiceBinaryEntryView
        entry={currentEntry}
        index={currentIndex}
        onSave={handleSaveEntry}
        isSaving={isPending}
        ratingOptions={config.ratingOptions}
        question={config.question}
      />
    );
        default:
          return null;
      }
  };

  // Find the first unannotated entry to start from
  const startingIndex = useMemo(() => {
    const firstUnannotatedIndex = entries.findIndex((e) => e.annotation === null);
    return firstUnannotatedIndex === -1 ? 0 : firstUnannotatedIndex;
  }, [entries]);

  const [currentIndex, setCurrentIndex] = useState(startingIndex);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentEntry = entries[currentIndex];
  const isComplete = entries.every((e) => e.annotation !== null);
  
  // Smooth scroll to top when current entry changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);


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

  const handleSaveEntry = async (rating: number, confidence: number) => {
    startTransition(async () => {
      const batch = [{ entryId: currentEntry!.id, rating, dialectLabel: currentEntry!.dialect, confidence }]; // Using max confidence for now, can be changed to user input if needed
      await saveAnnotations(batch, experimentId);
      const isNewAnnotation = entries[currentIndex].annotation === null && entries[currentIndex].confidence === null; // Check if this is the first time annotating this entry
      entries[currentIndex].annotation = rating; // Update local state optimistically
      entries[currentIndex].confidence = confidence; // Update confidence in local state
      if (isNewAnnotation) {
        handleNext();
      }
    });
  };
  // Calculate progress: count already-annotated entries
  const annotatedCount = entries.filter((e) => e.annotation !== null).length;
  const progressPct = Math.round(((annotatedCount) / entries.length) * 100);

  // Check if view type is valid
  const viewElement = getViewComponent();
  if (!viewElement) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar with transition */}
          <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`}>
            <AnnotationSidebarNavigation
              entries={entries}
              currentIndex={currentIndex}
              onSelectEntry={setCurrentIndex}
              annotatedCount={annotatedCount}
            />
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toggle button */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden md:block text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                title={sidebarOpen ? 'Sidebar ausblenden' : 'Sidebar anzeigen'}
              >
                {sidebarOpen ? '✕' : '☰'}
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600">Unbekannter Annotation-Typ: {viewType}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar with transition */}
          <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`}>
            <AnnotationSidebarNavigation
              entries={entries}
              currentIndex={currentIndex}
              onSelectEntry={setCurrentIndex}
              annotatedCount={annotatedCount}
            />
          </div>
          
          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toggle button */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden md:block text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                title={sidebarOpen ? 'Sidebar ausblenden' : 'Sidebar anzeigen'}
              >
                {sidebarOpen ? '✕' : '☰'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto text-center py-20">
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with transition */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`}>
          <AnnotationSidebarNavigation
            entries={entries}
            currentIndex={currentIndex}
            onSelectEntry={setCurrentIndex}
            annotatedCount={annotatedCount}
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="sticky top-1 z-40 bg-white border-b border-gray-200 pb-5 px-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {/* Toggle and Home buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden md:flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
                  title={sidebarOpen ? 'Sidebar ausblenden' : 'Sidebar anzeigen'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    {sidebarOpen && <rect x="3" y="3" width="6" height="18" rx="2" fill="currentColor" stroke="none"/>}
                  </svg>
                </button>

                {onShowIntro && (
                  <button
                    onClick={onShowIntro}
                    className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    ← Einführung
                  </button>
                )}

                {Object.keys(dialectScores).length > 0 && (
                  <button
                    onClick={() => setIsCalibrationModalOpen(true)}
                    className="text-sm px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors"
                    title="Kalibrierungsergebnisse anzeigen"
                  >
                    📊 Kalibrierung
                  </button>
                )}
              </div>
              <div className="flex gap-3">
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
          </div>

          {/* Sample content - scrollable */}
          <div className="flex-1 overflow-y-auto m-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col gap-4">
                {viewElement}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calibration Scores Modal */}
      <CalibrationScoresModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
        dialectScores={dialectScores}
      />
    </div>
  );
}

