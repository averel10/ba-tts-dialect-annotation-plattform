'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { getAvailableDownloads, deleteDownload } from '@/app/actions/get-available-downloads';

interface DownloadFile {
  name: string;
  url: string;
  size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface DatasetDownloadsModalProps {
  datasetId: number;
}

export default function DatasetDownloadsModal({ datasetId }: DatasetDownloadsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      setError(null);
      const files = await getAvailableDownloads(datasetId);
      setDownloads(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load downloads');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsOpen(true);
    if (downloads.length === 0) {
      fetchDownloads();
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setDeleting(fileName);
    try {
      await deleteDownload(fileName);
      setDownloads(downloads.filter(d => d.name !== fileName));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete download');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
      >
        View Downloads
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Available Downloads">
        {loading ? (
          <div className="text-gray-500 text-sm">Loading available downloads...</div>
        ) : error ? (
          <div className="text-red-500 text-sm">Error: {error}</div>
        ) : downloads.length === 0 ? (
          <div className="text-gray-500 text-sm">No downloads available for this dataset</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {downloads.map((download) => (
              <div
                key={download.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 truncate">
                  <div className="text-gray-700 text-sm truncate">{download.name}</div>
                  <div className="text-gray-500 text-xs">{formatFileSize(download.size)}</div>
                </div>
                <div className="ml-4 flex gap-2">
                  <a
                    href={download.url}
                    download
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors whitespace-nowrap"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => handleDelete(download.name)}
                    disabled={deleting === download.name}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-sm rounded transition-colors whitespace-nowrap"
                  >
                    {deleting === download.name ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
