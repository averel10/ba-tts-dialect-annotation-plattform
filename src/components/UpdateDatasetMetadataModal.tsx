'use client';

import { useState } from 'react';
import { updateDatasetEntriesMetadata } from '@/app/actions/upload';
import Modal from '@/components/Modal';

interface UpdateDatasetMetadataModalProps {
  datasetId: number;
}

export default function UpdateDatasetMetadataModal({
  datasetId,
}: UpdateDatasetMetadataModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<{ file: File; status: 'pending' | 'uploading' | 'completed' | 'failed'; message?: string; progress: number }>>([]);
  const [status, setStatus] = useState<string>('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setError(null);
      // Initialize queue with pending status and 0 progress
      setUploadQueue(selectedFiles.map(file => ({ file, status: 'pending', progress: 0 })));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (files.length === 0) {
      setError('Please select at least one CSV file');
      return;
    }

    setLoading(true);
    
    try {
      // Process each file in the queue sequentially
      const newQueue = [...uploadQueue];
      
      for (let i = 0; i < newQueue.length; i++) {
        const item = newQueue[i];
        item.status = 'uploading';
        item.progress = 0;
        setUploadQueue([...newQueue]);
        setStatus(`Processing file ${i + 1} of ${newQueue.length}: ${item.file.name}`);

        try {
          // Upload with progress tracking
          const uploadResult = await uploadFileWithProgress(item.file, i, newQueue);

          // Update the metadata
          const updateResult = await updateDatasetEntriesMetadata(datasetId, uploadResult.tempDir);

          if (!updateResult.success) {
            item.status = 'failed';
            item.progress = 0;
            item.message = `✗ ${updateResult.error || 'Update failed'}`;
          } else {
            item.status = 'completed';
            item.progress = 100;
            item.message = `✓ Updated (${updateResult.entriesUpdated} entries)`;
          }
        } catch (err) {
          item.status = 'failed';
          item.progress = 0;
          item.message = `✗ ${err instanceof Error ? err.message : 'Network error'}`;
        }

        setUploadQueue([...newQueue]);
      }

      const failedCount = newQueue.filter(item => item.status === 'failed').length;
      const completedCount = newQueue.filter(item => item.status === 'completed').length;

      if (failedCount === 0) {
        setSuccess(true);
        setStatus(`All files processed! (${completedCount}/${newQueue.length} completed)`);
      } else if (completedCount > 0) {
        setStatus(`Completed with errors: ${completedCount} succeeded, ${failedCount} failed`);
      } else {
        setError(`All files failed to process`);
      }

      setFiles([]);

      if (failedCount === 0) {
        setTimeout(() => {
          setSuccess(false);
          setIsOpen(false);
          setStatus('');
          setUploadQueue([]);
          window.location.reload();
        }, 2500);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process updates';
      setError(errorMsg);
      setStatus('');
    } finally {
      setLoading(false);
    }
  }

  function uploadFileWithProgress(
    file: File,
    index: number,
    queue: Array<{ file: File; status: 'pending' | 'uploading' | 'completed' | 'failed'; progress: number; message?: string }>
  ): Promise<{ tempDir: string }> {
    const MAX_RETRIES = 3;

    return (async () => {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await uploadAttempt(file, index, queue, attempt, MAX_RETRIES);
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');

          if (attempt < MAX_RETRIES) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, attempt - 1) * 1000;
            queue[index].message = `Retrying in ${delay / 1000}s... (attempt ${attempt}/${MAX_RETRIES})`;
            setUploadQueue([...queue]);

            await new Promise(resolve => setTimeout(resolve, delay));
            queue[index].progress = 0; // Reset progress for next attempt
            setUploadQueue([...queue]);
          }
        }
      }

      throw lastError || new Error('Upload failed after all retries');
    })();
  }

  function uploadAttempt(
    file: File,
    index: number,
    queue: Array<{ file: File; status: 'pending' | 'uploading' | 'completed' | 'failed'; progress: number; message?: string }>,
    attempt: number,
    maxRetries: number
  ): Promise<{ tempDir: string }> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('datasetId', datasetId.toString());

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          queue[index].progress = progress;
          if (attempt > 1) {
            queue[index].message = `Uploading (retry ${attempt}/${maxRetries})`;
          }
          setUploadQueue([...queue]);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.success) {
              resolve(result);
            } else {
              reject(new Error(result.error || 'Upload failed'));
            }
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('POST', '/api/update-metadata');
      xhr.send(formData);
    });
  }

  function handleClose() {
    if (!loading) {
      setIsOpen(false);
      setFiles([]);
      setError(null);
      setSuccess(false);
      setStatus('');
      setUploadQueue([]);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        ⟳ Update Metadata
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Update Dataset Metadata"
        actions={[
          {
            label: 'Cancel',
            onClick: handleClose,
            variant: 'secondary',
            disabled: loading,
          },
          {
            label: loading ? `Processing ${uploadQueue.filter(f => f.status !== 'pending').length}/${uploadQueue.length}...` : 'Upload & Update',
            onClick: () => {
              const form = document.getElementById(
                'updateMetadataForm'
              ) as HTMLFormElement;
              form?.dispatchEvent(new Event('submit', { bubbles: true }));
            },
            variant: 'primary',
            disabled: loading || files.length === 0,
          },
        ]}
      >
        <form id="updateMetadataForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2">
              CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="file"
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer block">
                {files.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      {files.length} file{files.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="mt-2 text-xs text-gray-600 max-h-24 overflow-y-auto">
                      {files.map((f, idx) => (
                        <div key={idx} className="py-1">
                          {f.name} ({(f.size / 1024).toFixed(2)} KB)
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Click to select or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">CSV files only (multiple allowed)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">CSV file format:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                Columns: <code className="bg-blue-100 px-1 rounded">id, speaker, model, utt_id, text, dialect, iteration, duration_ms, rms_value, longest_pause, utmos_score, wer_score</code>
              </li>
              <li>Entry IDs in the CSV must match existing dataset entries to update</li>
            </ul>
          </div>

          {uploadQueue.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <p className="font-semibold text-sm text-gray-700">Upload Queue:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadQueue.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-medium ${
                        item.status === 'completed' ? 'text-green-600' :
                        item.status === 'failed' ? 'text-red-600' :
                        item.status === 'uploading' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {item.status === 'completed' ? '✓' :
                         item.status === 'failed' ? '✗' :
                         item.status === 'uploading' ? '⟳' :
                         '○'}
                      </span>
                      <span className="flex-1 truncate">{item.file.name}</span>
                      {item.progress > 0 && item.progress < 100 && (
                        <span className="text-gray-500">{item.progress}%</span>
                      )}
                      {item.message && <span className="text-gray-500 text-xs">{item.message}</span>}
                    </div>
                    {item.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.status === 'completed' && (
                      <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-green-500 h-full w-full" />
                      </div>
                    )}
                    {item.status === 'failed' && (
                      <div className="w-full bg-red-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-red-500 h-full w-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
