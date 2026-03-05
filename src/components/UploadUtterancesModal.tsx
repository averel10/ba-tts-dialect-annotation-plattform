'use client';

import { useState } from 'react';
import { uploadDatasetUtterances } from '@/app/actions/upload-utterances';
import Modal from '@/components/Modal';

interface UploadUtterancesModalProps {
  datasetId: number;
}

export default function UploadUtterancesModal({
  datasetId,
}: UploadUtterancesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [utterancesCreated, setUtterancesCreated] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setStatus('Preparing upload...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadDatasetUtterances(datasetId, formData);

      setSuccess(true);
      setUtterancesCreated(result.utterancesCreated);
      setStatus(`Successfully created ${result.utterancesCreated} utterances!`);
      setFile(null);

      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setStatus('');
        window.location.reload();
      }, 2500);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to upload utterances';
      setError(errorMsg);
      setStatus('');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setIsOpen(false);
      setFile(null);
      setError(null);
      setSuccess(false);
      setStatus('');
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
      >
        📝 Upload Utterances
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Upload Utterances CSV"
        actions={[
          {
            label: 'Cancel',
            onClick: handleClose,
            variant: 'secondary',
            disabled: loading,
          },
          {
            label: loading ? 'Uploading...' : 'Upload',
            onClick: () => {
              const form = document.getElementById(
                'uploadUtterancesForm'
              ) as HTMLFormElement;
              form?.dispatchEvent(new Event('submit', { bubbles: true }));
            },
            variant: 'primary',
            disabled: loading || !file,
          },
        ]}
      >
        <form id="uploadUtterancesForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="utterances-file" className="block text-sm font-medium mb-2">
              CSV File
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                id="utterances-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
              />
              <label htmlFor="utterances-file" className="cursor-pointer block">
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Click to select or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">CSV file only</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">CSV file should contain:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <code className="bg-blue-100 px-1 rounded">id</code> column with
                utterance IDs (e.g., utt_001)
              </li>
              <li>
                <code className="bg-blue-100 px-1 rounded">text</code> column with the
                utterance text
              </li>
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              {status}
            </div>
          )}
        </form>
      </Modal>
    </>
  );
}
