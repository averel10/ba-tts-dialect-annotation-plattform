'use client';

import { useState } from 'react';
import { updateExperiment } from '@/app/actions/experiment';
import { Experiment } from '@/lib/model/experiment';

interface EditableExperimentHeaderProps {
  experiment: Experiment;
}

const ANNOTATION_TOOLS = [
  { value: 'quality-choice', label: 'Quality Choice' },
  { value: 'binary', label: 'Binary' },
  // Future tools can be added here
];

export default function EditableExperimentHeader({
  experiment,
}: EditableExperimentHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(experiment.name);
  const [description, setDescription] = useState(experiment.description || '');
  const [annotationTool, setAnnotationTool] = useState(experiment.annotationTool || 'quality-choice');
  const [published, setPublished] = useState(experiment.published || false);
  const [onboardingEnabled, setOnboardingEnabled] = useState(experiment.onboardingEnabled || false);
  const [calibrationEnabled, setCalibrationEnabled] = useState(experiment.calibrationEnabled || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError('Experiment name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateExperiment(experiment.id, { 
        name: name.trim(),
        description: description.trim() || undefined,
        annotationTool: annotationTool,
        published: published,
        onboardingEnabled: onboardingEnabled,
        calibrationEnabled: calibrationEnabled
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update experiment');
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setName(experiment.name);
    setAnnotationTool(experiment.annotationTool || 'quality-choice');
    setPublished(experiment.published || false);
    setDescription(experiment.description || '');
    setOnboardingEnabled(experiment.onboardingEnabled || false);
    setCalibrationEnabled(experiment.calibrationEnabled || false);
    setError(null);
    setIsEditing(false);
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      {isEditing ? (
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Experiment Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            disabled={loading}
          />

          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
            rows={3}
            disabled={loading}
          />

          <label htmlFor="annotationTool" className="block text-sm font-medium mb-2">
            Annotation Tool
          </label>
          <select
            id="annotationTool"
            value={annotationTool}
            onChange={(e) => setAnnotationTool(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            disabled={loading}
          >
            {ANNOTATION_TOOLS.map((tool) => (
              <option key={tool.value} value={tool.value}>
                {tool.label}
              </option>
            ))}
          </select>

          <div className="flex items-center mb-4">
            <input
              id="published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="published" className="ml-2 text-sm font-medium text-gray-700">
              Published
            </label>
          </div>

          <div className="flex items-center mb-4">
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

          <div className="flex items-center mb-4">
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
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold mb-2">{experiment.name}</h1>
          <p className="text-lg text-gray-600 mb-4">{experiment.description}</p>
          <p className="text-sm text-gray-500 mb-4">
            ID: {experiment.id} | Dataset ID: {experiment.datasetId}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Annotation Tool: {ANNOTATION_TOOLS.find(t => t.value === (experiment.annotationTool || 'single-choice'))?.label || 'Single Choice'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Status: {experiment.published ? 'Published' : 'Draft'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Onboarding: {experiment.onboardingEnabled ? 'Enabled' : 'Disabled'} | Calibration: {experiment.calibrationEnabled ? 'Enabled' : 'Disabled'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Created: {new Date(experiment.createdAt).toLocaleDateString()} | 
            Updated: {new Date(experiment.updatedAt).toLocaleDateString()}
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
