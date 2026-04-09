'use client';

import { useEffect, useState } from 'react';
import { getExperimentStatistics } from '@/app/actions/experiment';
import AnnotationDistribution from './AnnotationDistribution';

interface ExperimentStatisticsProps {
  experimentId: number;
  onboardingEnabled: boolean;
  calibrationEnabled: boolean;
}

interface Statistics {
  participants: {
    total: number;
    completedOnboarding: number;
    completedCalibration: number;
  };
  entries: {
    total: number;
  };
  annotations: {
    total: number;
    entriesWithAnnotations: number;
    entriesWithoutAnnotations: number;
    averagePerEntry: number;
    maxPerEntry: number;
    minPerEntry: number;
  };
}

export default function ExperimentStatistics({
  experimentId,
  onboardingEnabled,
  calibrationEnabled,
}: ExperimentStatisticsProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const stats = await getExperimentStatistics(experimentId);
        setStatistics(stats);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [experimentId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-600">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-gray-600">No statistics available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-900">Statistics</h2>

      {/* Participants Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Participants</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded p-4">
            <div className="text-sm text-gray-600 mb-1">Total Participants</div>
            <div className="text-3xl font-bold text-blue-600">
              {statistics.participants.total}
            </div>
          </div>

          {onboardingEnabled && (
            <div className="bg-green-50 rounded p-4">
              <div className="text-sm text-gray-600 mb-1">Completed Onboarding</div>
              <div className="text-3xl font-bold text-green-600">
                {statistics.participants.completedOnboarding}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {statistics.participants.total > 0
                  ? (
                      (statistics.participants.completedOnboarding /
                        statistics.participants.total) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          )}

          {calibrationEnabled && (
            <div className="bg-purple-50 rounded p-4">
              <div className="text-sm text-gray-600 mb-1">Completed Calibration</div>
              <div className="text-3xl font-bold text-purple-600">
                {statistics.participants.completedCalibration}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {statistics.participants.total > 0
                  ? (
                      (statistics.participants.completedCalibration /
                        statistics.participants.total) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Annotations Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Sample Annotations</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Total Samples</span>
            <span className="font-bold text-gray-900">{statistics.entries.total}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Total Annotations</span>
            <span className="font-bold text-gray-900">{statistics.annotations.total}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Samples with Annotations</span>
            <span className="font-bold text-gray-900">
              {statistics.annotations.entriesWithAnnotations}
              <span className="text-sm text-gray-500 ml-2">
                ({statistics.entries.total > 0
                  ? (
                      (statistics.annotations.entriesWithAnnotations /
                        statistics.entries.total) *
                      100
                    ).toFixed(1)
                  : 0}
                %)
              </span>
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Samples without Annotations</span>
            <span className="font-bold text-gray-900">
              {statistics.annotations.entriesWithoutAnnotations}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Average Annotations per Sample</span>
            <span className="font-bold text-gray-900">
              {statistics.annotations.averagePerEntry.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Annotation Distribution Diagram */}
      <div className="mt-8 border-t pt-8">
        <AnnotationDistribution experimentId={experimentId} />
      </div>
    </div>
  );
}
