'use client';

import { useState } from 'react';
import { removeAllDatasetEntries } from '@/app/actions/remove-dataset-entries';

interface RemoveAllEntriesButtonProps {
  datasetId: number;
}

export default function RemoveAllEntriesButton({ datasetId }: RemoveAllEntriesButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    try {
      await removeAllDatasetEntries(datasetId);
      setIsConfirming(false);
      // Show success message and reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove entries';
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
            Remove all entries?
          </h3>
          <p className="text-gray-600 mb-4">
            This will permanently delete all dataset entries and their files. This action cannot be undone.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsConfirming(false);
                setError(null);
              }}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Deleting...' : 'Delete All'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
    >
      🗑️ Remove All Entries
    </button>
  );
}
