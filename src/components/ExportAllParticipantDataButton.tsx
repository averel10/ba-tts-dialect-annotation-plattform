'use client';

import { exportAllParticipantDataAsZip } from '@/app/actions/participants';
import { useState } from 'react';

interface ExportAllParticipantDataButtonProps {
  experimentId: number;
}

export default function ExportAllParticipantDataButton({
  experimentId,
}: ExportAllParticipantDataButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { base64Data, filename } = await exportAllParticipantDataAsZip(experimentId);

      // Convert base64 back to Blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/zip' });
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
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Exporting...' : 'Export all Data as ZIP'}
      </button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}
