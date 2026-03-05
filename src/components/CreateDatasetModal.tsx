'use client';

import { useState } from 'react';
import { createDataset } from '@/app/actions/datasets';
import Modal from '@/components/Modal';

export default function CreateDatasetModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
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
      await createDataset({ name: name.trim() });
      setName('');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        // Refresh the page to show the new dataset
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dataset');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setIsOpen(false);
      setName('');
      setError(null);
      setSuccess(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mb-6 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
      >
        + Create New Dataset
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Create New Dataset"
        actions={[
          {
            label: 'Cancel',
            onClick: handleClose,
            variant: 'secondary',
            disabled: loading,
          },
          {
            label: loading ? 'Creating...' : 'Create',
            onClick: (e) => {
              const form = document.getElementById('datasetForm') as HTMLFormElement;
              form?.dispatchEvent(new Event('submit', { bubbles: true }));
            },
            variant: 'primary',
            disabled: loading,
          },
        ]}
      >
        <form id="datasetForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
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
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              Dataset created successfully!
            </div>
          )}
        </form>
      </Modal>
    </>
  );
}
