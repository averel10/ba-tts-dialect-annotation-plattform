'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AudioPlayer from './AudioPlayer';
import { getDatasetEntries } from '@/app/actions/get-dataset-entries';
import { getFilterOptions } from '@/app/actions/get-filter-options';
import { downloadFilteredEntriesAsZip } from '@/lib/download-utils';

interface DatasetEntriesListProps {
  datasetId: number;
}

interface DatasetEntry {
  id: number;
  datasetId: number;
  externalId: string;
  speakerId: string;
  modelName: string;
  utteranceId: string | null;
  utteranceText: string | null;
  fileName: string;
  dialect: string;
  iteration: number;
  durationMs: number | null;
  rmsValue: number | null;
  longestPause: number | null;
  utmosScore: number | null;
  werScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FilterOptions {
  speakerIds: string[];
  modelNames: string[];
  dialects: string[];
  iterations: number[];
  utteranceIds: string[];
}

export default function DatasetEntriesList({
  datasetId,
}: DatasetEntriesListProps) {
  const [entries, setEntries] = useState<DatasetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    speakerId: '',
    modelName: '',
    dialect: '',
    iteration: '',
    utteranceId: '',
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    speakerIds: [],
    modelNames: [],
    dialects: [],
    iterations: [],
    utteranceIds: [],
  });

  // Sort state
  const [sortBy, setSortBy] = useState<keyof DatasetEntry>('externalId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load filter options on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const options = await getFilterOptions(datasetId);
        setFilterOptions(options);
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    }
    loadFilterOptions();
  }, [datasetId]);

  useEffect(() => {
    setPage(1);
    loadEntries(1);
  }, [filters, sortBy, sortOrder]);

  async function loadEntries(pageNum: number = page) {
    setLoading(true);
    try {
      const filterParams = {
        speakerId: filters.speakerId || undefined,
        modelName: filters.modelName || undefined,
        dialect: filters.dialect || undefined,
        iteration: filters.iteration ? parseInt(filters.iteration, 10) : undefined,
        utteranceId: filters.utteranceId || undefined,
      };

      const sortParams = {
        sortBy: sortBy as keyof DatasetEntry,
        sortOrder: sortOrder,
      };

      const result = await getDatasetEntries(datasetId, pageNum, filterParams, sortParams);
      if (pageNum === 1) {
        setEntries(result.entries);
      } else {
        setEntries((prev) => [...prev, ...result.entries]);
      }
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    setLoading(true);
    try {
      const filterParams = {
        speakerId: filters.speakerId || undefined,
        modelName: filters.modelName || undefined,
        dialect: filters.dialect || undefined,
        iteration: filters.iteration ? parseInt(filters.iteration, 10) : undefined,
        utteranceId: filters.utteranceId || undefined,
      };

      const sortParams = {
        sortBy: sortBy as keyof DatasetEntry,
        sortOrder: sortOrder,
      };

      const result = await getDatasetEntries(datasetId, page + 1, filterParams, sortParams);
      setEntries((prev) => [...prev, ...result.entries]);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(page + 1);
    } catch (error) {
      console.error('Error loading more entries:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(field: string, value: string) {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleClearFilters() {
    setFilters({
      speakerId: '',
      modelName: '',
      dialect: '',
      iteration: '',
      utteranceId: '',
    });
  }

  function handleSort(column: keyof DatasetEntry) {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column to sort by, default to ascending
      setSortBy(column);
      setSortOrder('asc');
    }
  }

  async function handleDownloadFiltered() {
    setDownloading(true);
    try {
      const filterParams = {
        speakerId: filters.speakerId || undefined,
        modelName: filters.modelName || undefined,
        dialect: filters.dialect || undefined,
        iteration: filters.iteration ? parseInt(filters.iteration, 10) : undefined,
        utteranceId: filters.utteranceId || undefined,
      };

      await downloadFilteredEntriesAsZip(datasetId, filterParams);
    } catch (error) {
      console.error('Error downloading entries:', error);
      alert('Failed to download entries. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  if (entries.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Dataset Entries</h2>

        {/* Filter Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadFiltered}
                disabled={downloading || total === 0}
                className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {downloading ? 'Downloading...' : 'Download as ZIP'}
              </button>
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Clear all
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Speaker ID
            </label>
            <select
              value={filters.speakerId}
              onChange={(e) => handleFilterChange('speakerId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All speakers</option>
              {filterOptions.speakerIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Name
            </label>
            <select
              value={filters.modelName}
              onChange={(e) => handleFilterChange('modelName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All models</option>
              {filterOptions.modelNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dialect
            </label>
            <select
              value={filters.dialect}
              onChange={(e) => handleFilterChange('dialect', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All dialects</option>
              {filterOptions.dialects.map((dialect) => (
                <option key={dialect} value={dialect}>
                  {dialect}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Iteration
            </label>
            <select
              value={filters.iteration}
              onChange={(e) => handleFilterChange('iteration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All iterations</option>
              {filterOptions.iterations.map((iter) => (
                <option key={iter} value={iter.toString()}>
                  {iter}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utterance ID
            </label>
            <select
              value={filters.utteranceId}
              onChange={(e) => handleFilterChange('utteranceId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All utterance IDs</option>
              {filterOptions.utteranceIds.map((utt) => (
                <option key={utt} value={utt}>
                  {utt}
                </option>
              ))}
            </select>
          </div>
        </div>
        </div>

        <p className="text-gray-500">No entries found for this dataset.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Dataset Entries</h2>

      {/* Filter Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadFiltered}
              disabled={downloading || total === 0}
              className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {downloading ? 'Downloading...' : 'Download as ZIP'}
            </button>
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Clear all
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Speaker ID
            </label>
            <select
              value={filters.speakerId}
              onChange={(e) => handleFilterChange('speakerId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All speakers</option>
              {filterOptions.speakerIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Name
            </label>
            <select
              value={filters.modelName}
              onChange={(e) => handleFilterChange('modelName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All models</option>
              {filterOptions.modelNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dialect
            </label>
            <select
              value={filters.dialect}
              onChange={(e) => handleFilterChange('dialect', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All dialects</option>
              {filterOptions.dialects.map((dialect) => (
                <option key={dialect} value={dialect}>
                  {dialect}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Iteration
            </label>
            <select
              value={filters.iteration}
              onChange={(e) => handleFilterChange('iteration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All iterations</option>
              {filterOptions.iterations.map((iter) => (
                <option key={iter} value={iter.toString()}>
                  {iter}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utterance ID
            </label>
            <select
              value={filters.utteranceId}
              onChange={(e) => handleFilterChange('utteranceId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All utterance IDs</option>
              {filterOptions.utteranceIds.map((utt) => (
                <option key={utt} value={utt}>
                  {utt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results info */}
      <div className="mb-4 text-sm text-gray-600">
        Found {total} {total === 1 ? 'entry' : 'entries'}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Play</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('externalId')}>
                External ID {sortBy === 'externalId' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('speakerId')}>
                Speaker ID {sortBy === 'speakerId' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('modelName')}>
                Model Name {sortBy === 'modelName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('utteranceId')}>
                Utterance ID {sortBy === 'utteranceId' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('dialect')}>
                Dialect {sortBy === 'dialect' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('iteration')}>
                Iteration {sortBy === 'iteration' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('durationMs')}>
                Duration (ms) {sortBy === 'durationMs' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('rmsValue')}>
                RMS Value {sortBy === 'rmsValue' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('longestPause')}>
                Longest Pause (s) {sortBy === 'longestPause' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('utmosScore')}>
                UTMOS Score {sortBy === 'utmosScore' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('werScore')}>
                WER Score {sortBy === 'werScore' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-blue-50 transition-colors border-b border-gray-200">
                <td className="py-3 px-4">
                  <AudioPlayer datasetId={datasetId} fileName={entry.fileName} externalId={entry.externalId} />
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/admin/datasets/${datasetId}/entries/${entry.id}`}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    {entry.externalId}
                  </Link>
                </td>
                <td className="py-3 px-4">{entry.speakerId}</td>
                <td className="py-3 px-4">{entry.modelName}</td>
                <td className="py-3 px-4">{entry.utteranceId || '-'}</td>
                <td className="py-3 px-4">{entry.dialect}</td>
                <td className="py-3 px-4">{entry.iteration}</td>
                <td className="py-3 px-4">{entry.durationMs?.toLocaleString() || '-'}</td>
                <td className="py-3 px-4">{entry.rmsValue?.toFixed(3) || '-'}</td>
                <td className="py-3 px-4">{entry.longestPause?.toFixed(3) || '-'}</td>
                <td className="py-3 px-4">{entry.utmosScore?.toFixed(3) || '-'}</td>
                <td className="py-3 px-4">{entry.werScore?.toFixed(3) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
          <span className="text-sm text-gray-600">
            Showing {entries.length} of {total} entries
          </span>
        </div>
      )}

      {!hasMore && entries.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          All {total} entries loaded
        </div>
      )}
    </div>
  );
}
