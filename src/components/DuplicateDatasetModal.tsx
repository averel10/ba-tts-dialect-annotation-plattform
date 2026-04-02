'use client';

import { useState } from 'react';
import { duplicateDatasetWithCriteria } from '@/app/actions/datasets';
import Modal from '@/components/Modal';

interface DuplicateDatasetModalProps {
  datasetId: number;
  datasetName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DuplicateDatasetModal({
  datasetId,
  datasetName,
  isOpen,
  onClose,
}: DuplicateDatasetModalProps) {
  const [newName, setNewName] = useState(`${datasetName} - Copy`);
  const [description, setDescription] = useState('');
  const [iterations, setIterations] = useState(1);
  const [prioritizationMetric, setPrioritizationMetric] = useState<'utmos' | 'wer'>('utmos');

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [utmosMin, setUtmosMin] = useState<number | ''>('');
  const [utmosMax, setUtmosMax] = useState<number | ''>('');
  const [werMin, setWerMin] = useState<number | ''>('');
  const [werMax, setWerMax] = useState<number | ''>('');
  const [durationMsMin, setDurationMsMin] = useState<number | ''>('');
  const [durationMsMax, setDurationMsMax] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!newName.trim()) {
      setError('Dataset name is required');
      return;
    }

    if (iterations < 1) {
      setError('Iterations must be at least 1');
      return;
    }

    setLoading(true);
    try {
      const filters: any = {};
      if (utmosMin !== '') filters.utmosMin = Number(utmosMin);
      if (utmosMax !== '') filters.utmosMax = Number(utmosMax);
      if (werMin !== '') filters.werMin = Number(werMin);
      if (werMax !== '') filters.werMax = Number(werMax);
      if (durationMsMin !== '') filters.durationMsMin = Number(durationMsMin);
      if (durationMsMax !== '') filters.durationMsMax = Number(durationMsMax);

      const res = await duplicateDatasetWithCriteria(
        datasetId,
        newName.trim(),
        description.trim() || undefined,
        iterations,
        prioritizationMetric,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      if (res.success) {
        setResult(res);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          handleClose();
          // Refresh the page to show the new dataset
          window.location.reload();
        }, 2000);
      } else {
        setError((res as any).error || 'Failed to duplicate dataset');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate dataset');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      onClose();
      setNewName(`${datasetName} - Copy`);
      setDescription('');
      setIterations(1);
      setPrioritizationMetric('utmos');
      setUtmosMin('');
      setUtmosMax('');
      setWerMin('');
      setWerMax('');
      setDurationMsMin('');
      setDurationMsMax('');
      setError(null);
      setSuccess(false);
      setResult(null);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Duplicate Dataset: ${datasetName}`}
      actions={[
        {
          label: 'Cancel',
          onClick: handleClose,
          variant: 'secondary',
          disabled: loading,
        },
        {
          label: loading ? 'Duplicating...' : 'Duplicate',
          onClick: () => {
            const form = document.getElementById('duplicateDatasetForm') as HTMLFormElement;
            form?.dispatchEvent(new Event('submit', { bubbles: true }));
          },
          variant: 'primary',
          disabled: loading || !newName.trim(),
        },
      ]}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && result && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          <p className="font-semibold">{result.message}</p>
          <p className="text-sm mt-2">
            Created {result.totalEntriesCreated} entries ({result.selectedEntriesCount} unique × {iterations})
          </p>
        </div>
      )}

      <form id="duplicateDatasetForm" onSubmit={handleSubmit} className="space-y-4">
        {/* Dataset Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Dataset Name *</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={loading || success}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Enter dataset name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading || success}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Enter dataset description (optional)"
          />
        </div>

        {/* Replication & Prioritization */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Iterations *</label>
            <input
              type="number"
              min="1"
              value={iterations}
              onChange={(e) => setIterations(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={loading || success}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioritization</label>
            <select
              value={prioritizationMetric}
              onChange={(e) => setPrioritizationMetric(e.target.value as 'utmos' | 'wer')}
              disabled={loading || success}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="utmos">UTMOS (higher better)</option>
              <option value="wer">WER (lower better)</option>
            </select>
          </div>
        </div>

        {/* Filters Section */}
        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            disabled={loading || success}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 underline disabled:text-gray-400"
          >
            {showFilters ? '▼ Hide' : '▶ Show'} Filters (optional)
          </button>

          {showFilters && (
            <div className="mt-4 space-y-4 bg-gray-50 p-3 rounded-md">
              {/* UTMOS Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">UTMOS Score Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Min"
                    value={utmosMin}
                    onChange={(e) => setUtmosMin(e.target.value ? Number(e.target.value) : '')}
                    disabled={loading || success}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Max"
                    value={utmosMax}
                    onChange={(e) => setUtmosMax(e.target.value ? Number(e.target.value) : '')}
                    disabled={loading || success}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* WER Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">WER Score Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Min"
                    value={werMin}
                    onChange={(e) => setWerMin(e.target.value ? Number(e.target.value) : '')}
                    disabled={loading || success}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Max"
                    value={werMax}
                    onChange={(e) => setWerMax(e.target.value ? Number(e.target.value) : '')}
                    disabled={loading || success}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Duration Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Duration Range (ms)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={durationMsMin}
                    onChange={(e) => setDurationMsMin(e.target.value ? Number(e.target.value) : '')}
                    disabled={loading || success}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={durationMsMax}
                    onChange={(e) => setDurationMsMax(e.target.value ? Number(e.target.value) : '')}
                    disabled={loading || success}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
