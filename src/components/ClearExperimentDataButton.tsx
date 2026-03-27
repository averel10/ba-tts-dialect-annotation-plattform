'use client';

import { useState } from 'react';
import { clearExperimentData } from '@/app/actions/experiment';

interface ClearExperimentDataButtonProps {
  experimentId: number;
  experimentName: string;
}

export default function ClearExperimentDataButton({ experimentId, experimentName }: ClearExperimentDataButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await clearExperimentData(experimentId);
      setIsConfirming(false);
      setSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear experiment data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (isConfirming) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Clear all data for "{experimentName}"?
          </h3>
          <p className="text-gray-600 mb-4">
            This will permanently delete all annotations and participant data for this experiment. This action cannot be undone.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsConfirming(false)}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-400"
            >
              {loading ? 'Clearing...' : 'Clear Data'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsConfirming(true)}
        className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
      >
        Clear All Data
      </button>
      {success && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Data cleared successfully
        </div>
      )}
    </>
  );
}
