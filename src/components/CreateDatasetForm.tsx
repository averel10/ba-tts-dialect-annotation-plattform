'use client';

import { useState } from 'react';
import { createDataset } from '@/app/actions/datasets';

export default function CreateDatasetForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('Dataset name is required');
      return;
    }

    setLoading(true);
    try {
      await createDataset({ 
        name: name.trim(),
        description: description.trim() || undefined
      });
      setName('');
      setDescription('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      // Refresh the page to show the new dataset
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dataset');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 mb-8">
      <h2 className="text-2xl font-bold mb-4">Create New Dataset</h2>
      <form onSubmit={handleSubmit} className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm max-w-md">
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Dataset Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter dataset name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter dataset description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Dataset created successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Dataset'}
        </button>
      </form>
    </div>
  );
}
