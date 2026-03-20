'use client';

import { useState } from 'react';
import { deleteExperiment } from '@/app/actions/experiment';
import { useRouter } from 'next/navigation';

interface DeleteExperimentButtonProps {
  experimentId: number;
  experimentName: string;
}

export default function DeleteExperimentButton({ experimentId, experimentName }: DeleteExperimentButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    try {
      await deleteExperiment(experimentId);
      setIsConfirming(false);
      // Redirect to experiments page after deletion
      router.push('/admin/experiments');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete experiment';
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
            Delete experiment "{experimentName}"?
          </h3>
          <p className="text-gray-600 mb-4">
            This will permanently delete the experiment. This action cannot be undone.
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
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
    >
      Delete Experiment
    </button>
  );
}
