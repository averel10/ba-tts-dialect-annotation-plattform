'use client';

import { useState, useEffect } from 'react';
import type { Dataset } from '@/lib/model/dataset';
import Link from 'next/link';
import { getAllDatasets } from '@/app/actions/datasets';
import DuplicateDatasetModal from '@/components/DuplicateDatasetModal';

export default function DatasetsList() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [selectedDatasetName, setSelectedDatasetName] = useState('');

  useEffect(() => {
    async function loadDatasets() {
      try {
        const result = await getAllDatasets();
        setDatasets(result);
      } catch (error) {
        console.error('Failed to load datasets:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDatasets();
  }, []);

  function handleOpenDuplicateModal(id: number, name: string) {
    setSelectedDatasetId(id);
    setSelectedDatasetName(name);
  }

  function handleCloseDuplicateModal() {
    setSelectedDatasetId(null);
    setSelectedDatasetName('');
  }

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Datasets</h2>
        <p className="text-gray-500">Loading datasets...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Datasets</h2>
        {datasets.length === 0 ? (
          <p className="text-gray-500">No datasets found.</p>
        ) : (
          <div className="grid gap-4">
            {datasets.map((ds) => (
              <div
                key={ds.id}
                className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <Link
                    href={`/admin/datasets/${ds.id}`}
                    className="flex-1 hover:text-blue-600 transition-colors"
                  >
                    <h3 className="text-lg font-semibold">{ds.name}</h3>
                  </Link>
                  <button
                    onClick={() => handleOpenDuplicateModal(ds.id, ds.name)}
                    className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                    title="Duplicate this dataset with filtering and replication"
                  >
                    ⎘ Duplicate
                  </button>
                </div>
                <p className="text-md text-gray-600">{ds.description}</p>
                <p className="text-sm text-gray-600 mt-2">ID: {ds.id}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Created: {new Date(ds.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDatasetId && (
        <DuplicateDatasetModal
          datasetId={selectedDatasetId}
          datasetName={selectedDatasetName}
          isOpen={selectedDatasetId !== null}
          onClose={handleCloseDuplicateModal}
        />
      )}
    </>
  );
}
