'use client';

import { exportParticipantDataAsJson } from '@/app/actions/participants';
import { useState } from 'react';

interface ExportParticipantDataButtonProps {
  experimentId: number;
  userId: string;
}

export default function ExportParticipantDataButton({
  experimentId,
  userId,
}: ExportParticipantDataButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { jsonData, filename } = await exportParticipantDataAsJson(experimentId, userId);

      // Create blob and trigger download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        {isLoading ? 'Exporting...' : 'Export as JSON'}
      </button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}
