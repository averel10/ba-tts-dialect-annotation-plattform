'use client';

import { useState, useEffect } from 'react';
import { createExperiment } from '@/app/actions/experiment';
import Modal from '@/components/Modal';
import { Dataset } from '@/lib/model/dataset';
import { getAllDatasets } from '@/app/actions/datasets';

const ANNOTATION_TOOLS = [
  { value: 'quality-choice', label: 'Quality Choice' },
  { value: 'binary', label: 'Binary' },
  // Future tools can be added here
];

interface CreateExperimentModalProps {
  datasetId?: number;
}

export default function CreateExperimentModal({ datasetId }: CreateExperimentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | ''>(datasetId || '');
  const [annotationTool, setAnnotationTool] = useState('quality-choice');
  const [onboardingEnabled, setOnboardingEnabled] = useState(false);
  const [calibrationEnabled, setCalibrationEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  useEffect(() => {
    if (isOpen && !datasetId) {
      // Fetch datasets if not pre-selected
      fetchDatasets();
    }
  }, [isOpen, datasetId]);

  async function fetchDatasets() {
    try {
      setDatasetsLoading(true);
      const data = await getAllDatasets();
      setDatasets(data);
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
      setError('Failed to load datasets');
    } finally {
      setDatasetsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('Experiment name is required');
      return;
    }

    if (!selectedDatasetId) {
      setError('Dataset is required');
      return;
    }

    setLoading(true);
    try {
      await createExperiment({ 
        name: name.trim(),
        description: description.trim() || undefined,
        datasetId: Number(selectedDatasetId),
        annotationTool,
        onboardingEnabled,
        calibrationEnabled
      });
      setName('');
      setDescription('');
      setSelectedDatasetId(datasetId || '');
      setAnnotationTool('quality-choice');
      setOnboardingEnabled(false);
      setCalibrationEnabled(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        // Refresh the page to show the new experiment
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create experiment');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setIsOpen(false);
      setName('');
      setDescription('');
      setSelectedDatasetId(datasetId || '');
      setAnnotationTool('quality-choice');
      setOnboardingEnabled(false);
      setCalibrationEnabled(false);
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
        + Create New Experiment
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Create New Experiment"
        actions={[
          {
            label: 'Cancel',
            onClick: handleClose,
            variant: 'secondary',
            disabled: loading,
          },
          {
            label: loading ? 'Creating...' : 'Create',
            onClick: () => {
              const form = document.getElementById('experimentForm') as HTMLFormElement;
              form?.dispatchEvent(new Event('submit', { bubbles: true }));
            },
            variant: 'primary',
            disabled: loading,
          },
        ]}
      >
        <form id="experimentForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Experiment Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter experiment name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter experiment description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="annotationTool" className="block text-sm font-medium mb-2">
              Annotation Tool
            </label>
            <select
              id="annotationTool"
              value={annotationTool}
              onChange={(e) => setAnnotationTool(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {ANNOTATION_TOOLS.map((tool) => (
                <option key={tool.value} value={tool.value}>
                  {tool.label}
                </option>
              ))}
            </select>
          </div>

          {!datasetId && (
            <div>
              <label htmlFor="datasetId" className="block text-sm font-medium mb-2">
                Dataset
              </label>
              {datasetsLoading ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  Loading datasets...
                </div>
              ) : datasets.length === 0 ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  No datasets available
                </div>
              ) : (
                <select
                  id="datasetId"
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">-- Select a Dataset --</option>
                  {datasets.map((ds) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.name} (ID: {ds.id})
                      {ds.description ? ` - ${ds.description}` : ''}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">Select the dataset for this experiment</p>
            </div>
          )}

          <div className="flex items-center">
            <input
              id="onboardingEnabled"
              type="checkbox"
              checked={onboardingEnabled}
              onChange={(e) => setOnboardingEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="onboardingEnabled" className="ml-2 text-sm font-medium text-gray-700">
              Enable Onboarding
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="calibrationEnabled"
              type="checkbox"
              checked={calibrationEnabled}
              onChange={(e) => setCalibrationEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="calibrationEnabled" className="ml-2 text-sm font-medium text-gray-700">
              Enable Calibration
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              Experiment created successfully!
            </div>
          )}
        </form>
      </Modal>
    </>
  );
}
