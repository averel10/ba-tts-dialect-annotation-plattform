'use client';

import { useState } from 'react';
import { processDatasetEntries } from '@/app/actions/upload';
import Modal from '@/components/Modal';

interface UploadDatasetEntriesModalProps {
  datasetId: number;
}

export default function UploadDatasetEntriesModal({
  datasetId,
}: UploadDatasetEntriesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [entriesCreated, setEntriesCreated] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [tempDir, setTempDir] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!file) {
      setError('Please select a ZIP file');
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Upload and extract ZIP via API route
      setStatus('Uploading and extracting ZIP file...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('datasetId', datasetId.toString());

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload ZIP file');
      }

      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success) {
        throw new Error('Failed to upload ZIP file');
      }

      setTempDir(uploadResult.tempDir);
      setStatus(`${uploadResult.message} Now processing...`);

      // Step 2: Process the extracted data (server action)
      setStatus('Processing entries and copying audio files...');
      const processResult = await processDatasetEntries(datasetId, uploadResult.tempDir);

      setSuccess(true);
      setEntriesCreated(processResult.entriesCreated);
      setStatus(processResult.message);
      setFile(null);
      setTempDir(null);

      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
        setStatus('');
        window.location.reload();
      }, 2500);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to upload and process dataset entries';
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
      setTempDir(null);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mb-6 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
      >
        + Upload Entries
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Upload Dataset Entries"
        actions={[
          {
            label: 'Cancel',
            onClick: handleClose,
            variant: 'secondary',
            disabled: loading,
          },
          {
            label: loading ? 'Uploading & Processing...' : 'Upload',
            onClick: () => {
              const form = document.getElementById(
                'uploadForm'
              ) as HTMLFormElement;
              form?.dispatchEvent(new Event('submit', { bubbles: true }));
            },
            variant: 'primary',
            disabled: loading || !file,
          },
        ]}
      >
        <form id="uploadForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2">
              ZIP File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="file"
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer block">
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Click to select or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">ZIP file only</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">ZIP file should contain:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <code className="bg-blue-100 px-1 rounded">metadata.csv</code>{' '}
                with columns: id, audio_file, duration_ms, utt_id, speaker,
                model, dialect, iteration
              </li>
              <li>Audio files (.wav) referenced in metadata.csv</li>
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {status && (
            <div className={`p-3 rounded text-sm ${success ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-blue-100 border border-blue-400 text-blue-700'}`}>
              {status}
            </div>
          )}
        </form>
      </Modal>
    </>
  );
}
