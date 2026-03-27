'use client';

import { useEffect, useState } from 'react';
import { getCalibrationEntries } from '@/app/actions/calibration';
import { ExperimentCalibration } from '@/lib/model/experiment_calibration';
import CalibrationPageView from './CalibrationPageView';

interface CalibrationPhaseProps {
  experimentId: number;
}

export default function CalibrationPhase({ experimentId }: CalibrationPhaseProps) {
  const [entries, setEntries] = useState<ExperimentCalibration[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getCalibrationEntries(experimentId);
        if (result.success && result.data) {
          // Sort by order
          const sorted = [...result.data].sort((a, b) => a.order - b.order);
          setEntries(sorted);
        }
      } catch (err) {
        setError('Fehler beim Laden der Kalibrierungssamples');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [experimentId]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold mb-4">Lädt Kalibrierungssamples...</h1>
        <p className="text-gray-600">Bitte warten Sie...</p>
      </div>
    );
  }

  if (error || !entries || entries.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold mb-4">Kalibrierung nicht verfügbar</h1>
        <p className="text-gray-600 mb-8">
          {error || 'Für dieses Experiment sind keine Kalibrierungssamples vorhanden.'}
        </p>
      </div>
    );
  }

  return <CalibrationPageView entries={entries} experimentId={experimentId} />;
}
