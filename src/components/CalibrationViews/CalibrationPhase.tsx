'use client';

import { useEffect, useState } from 'react';
import { getCalibrationEntries, getCalibrationAnswers } from '@/app/actions/calibration';
import { ExperimentCalibration } from '@/lib/model/experiment_calibration';
import CalibrationPageView from './CalibrationPageView';
import CalibrationInfoView from './CalibrationInfoView';

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

interface CalibrationPhaseProps {
  experimentId: number;
}

export default function CalibrationPhase({ experimentId }: CalibrationPhaseProps) {
  const [entries, setEntries] = useState<ExperimentCalibration[]>([]);
  const [showInfoPage, setShowInfoPage] = useState(true);
  const [hasExistingAnswers, setHasExistingAnswers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Load calibration entries
        const entriesResult = await getCalibrationEntries(experimentId);
        if (entriesResult.success && entriesResult.data) {
          // Sort by order
          const sorted = [...entriesResult.data].sort((a, b) => a.order - b.order);
          setEntries(sorted);
        }

        // Load existing answers to check if user has seen the info page before
        const answersResult = await getCalibrationAnswers(experimentId);
        if (answersResult.success && answersResult.data) {
          const answers = answersResult.data as Record<number, any> | null;
          if (answers && Object.keys(answers).length > 0) {
            setHasExistingAnswers(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [experimentId]);

  // Show loading view
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calibration...</p>
        </div>
      </div>
    );
  }

  // Show info page first
  if (showInfoPage) {
    return (
      <CalibrationInfoView
        onContinue={() => {
          scrollToTop();
          setShowInfoPage(false);
        }}
        hasExistingAnswers={hasExistingAnswers}
      />
    );
  }

  return <CalibrationPageView entries={entries} experimentId={experimentId} />;
}
