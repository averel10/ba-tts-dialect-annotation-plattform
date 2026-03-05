'use client';

import { useState } from 'react';
import { updateDataset } from '@/app/actions/datasets';
import { Dataset } from '@/lib/model/dataset';

interface EditableDatasetHeaderProps {
  dataset: Dataset;
}

export default function EditableDatasetHeader({
  dataset,
}: EditableDatasetHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(dataset.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError('Dataset name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateDataset(dataset.id, { name: name.trim() });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dataset');
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setName(dataset.name);
    setError(null);
    setIsEditing(false);
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      {isEditing ? (
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Dataset Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            disabled={loading}
          />

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{dataset.name}</h1>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Dataset ID</p>
              <p className="text-lg font-semibold">{dataset.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-lg font-semibold">
                {new Date(dataset.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-lg font-semibold">
                {new Date(dataset.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
