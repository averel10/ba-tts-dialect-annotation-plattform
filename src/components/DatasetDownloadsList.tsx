'use client';

import { useEffect, useState } from 'react';
import { getAvailableDownloads, deleteDownload } from '@/app/actions/get-available-downloads';

interface DownloadFile {
  name: string;
  url: string;
}

interface DatasetDownloadsListProps {
  datasetId: number;
}

export default function DatasetDownloadsList({ datasetId }: DatasetDownloadsListProps) {
  const [downloads, setDownloads] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDownloads = async () => {
    try {
      setError(null);
      const files = await getAvailableDownloads(datasetId);
      setDownloads(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load downloads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, [datasetId]);

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

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading available downloads...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-sm">Error: {error}</div>;
  }

  if (downloads.length === 0) {
    return <div className="text-gray-500 text-sm">No downloads available for this dataset</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Available Downloads</h2>
      <div className="space-y-2">
        {downloads.map((download) => (
          <div key={download.name} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
            <span className="text-gray-700 text-sm truncate flex-1">{download.name}</span>
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
    </div>
  );
}
