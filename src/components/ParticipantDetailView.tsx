'use client';

import { ParticipantDetail, getParticipantCalibrationScores } from '@/app/actions/participants';
import { useEffect, useState } from 'react';
import CalibrationScoresDisplay from './CalibrationScoresDisplay';
import WaveformPlayer from './WaveformPlayer';
import ExportParticipantDataButton from './ExportParticipantDataButton';

interface ParticipantDetailViewProps {
  participant: ParticipantDetail;
  experimentId: number;
}

interface CalibrationScores {
  [dialectLabel: string]: number;
}

export default function ParticipantDetailView({ participant, experimentId }: ParticipantDetailViewProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<(typeof participant.annotations)[0] | null>(
    participant.annotations.length > 0 ? participant.annotations[0] : null
  );
  const [calibrationScores, setCalibrationScores] = useState<CalibrationScores | null>(null);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresError, setScoresError] = useState<string | null>(null);

  useEffect(() => {
    if (participant.completedCalibration) {
      const fetchScores = async () => {
        setScoresLoading(true);
        setScoresError(null);
        try {
          const scores = await getParticipantCalibrationScores(experimentId, participant.userId);
          setCalibrationScores(scores);
        } catch (err) {
          setScoresError(err instanceof Error ? err.message : 'Failed to load calibration scores');
        } finally {
          setScoresLoading(false);
        }
      };
      fetchScores();
    }
  }, [experimentId, participant.userId, participant.completedCalibration]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{participant.userId}</h2>
          <ExportParticipantDataButton experimentId={experimentId} userId={participant.userId} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded p-4">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className="text-lg font-semibold text-gray-900">Joined</div>
            <div className="text-xs text-gray-600 mt-2">
              {new Date(participant.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="bg-green-50 rounded p-4">
            <div className="text-sm text-gray-600 mb-1">Onboarding</div>
            <div className="text-lg font-semibold text-green-600">
              {participant.completedOnboarding ? '✓ Completed' : '○ Pending'}
            </div>
          </div>
          <div className="bg-blue-50 rounded p-4">
            <div className="text-sm text-gray-600 mb-1">Calibration</div>
            <div className="text-lg font-semibold text-blue-600">
              {participant.completedCalibration ? '✓ Completed' : '○ Pending'}
            </div>
          </div>
          <div className="bg-purple-50 rounded p-4">
            <div className="text-sm text-gray-600 mb-1">Annotations</div>
            <div className="text-3xl font-bold text-purple-600">{participant.annotationCount}</div>
          </div>
        </div>
      </div>

      {/* Onboarding Data */}
      {participant.completedOnboarding && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Onboarding Data</h3>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm whitespace-pre-wrap break-words">
            <code>{JSON.stringify(participant.onboardingAnswers, null, 2)}</code>
          </div>
        </div>
      )}

      {/* Calibration Data */}
      {participant.completedCalibration && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Calibration Data</h3>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm whitespace-pre-wrap break-words">
            <code>{JSON.stringify(participant.calibrationAnswers, null, 2)}</code>
          </div>
        </div>
      )}

      {/* Calibration Scores */}
      {participant.completedCalibration && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Calibration Scores</h3>
          {scoresLoading && <div className="text-gray-600">Loading scores...</div>}
          {scoresError && <div className="text-red-600">Error: {scoresError}</div>}
          {calibrationScores && Object.keys(calibrationScores).length > 0 ? (
            <CalibrationScoresDisplay dialectScores={calibrationScores} />
          ) : (
            <div className="text-gray-600">No calibration scores available</div>
          )}
        </div>
      )}

      {/* Annotations */}
      {participant.annotationCount > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Annotations List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Annotations ({participant.annotationCount})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {participant.annotations.map((annotation) => (
                <button
                  key={annotation.id}
                  onClick={() => setSelectedAnnotation(annotation)}
                  className={`w-full text-left p-3 rounded border-2 transition-colors ${
                    selectedAnnotation?.id === annotation.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{annotation.externalId}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Rating: <span className="font-semibold">{annotation.rating}</span> | Dialect:{' '}
                    <span className="font-semibold">{annotation.dialectLabel}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(annotation.createdAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Annotation Details */}
          {selectedAnnotation && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Details</h4>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">External ID</div>
                  <div className="font-medium text-gray-900 break-all">{selectedAnnotation.externalId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Rating</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedAnnotation.rating}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Confidence</div>
                  <div className="text-2xl font-bold text-gray-900">{selectedAnnotation.confidence}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Dialect</div>
                  <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {selectedAnnotation.dialectLabel}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Timestamp</div>
                  <div className="text-sm text-gray-900">{new Date(selectedAnnotation.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Audio</div>
                  {(() => {
                    const fileExtension = selectedAnnotation.fileName.substring(selectedAnnotation.fileName.lastIndexOf('.'));
                    const src = `/public/datasets/${selectedAnnotation.datasetId}/${selectedAnnotation.externalId}${fileExtension}`;
                    return <WaveformPlayer src={src} showWaveform={false} playMode='stop' />;
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {participant.annotationCount === 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">No annotations yet</p>
        </div>
      )}
    </div>
  );
}
