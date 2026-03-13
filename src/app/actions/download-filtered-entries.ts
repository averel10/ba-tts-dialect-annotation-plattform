'use server';

import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { eq, and } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface FilterParams {
  speakerId?: string;
  modelName?: string;
  dialect?: string;
  iteration?: number;
  utteranceId?: string;
}

export async function downloadFilteredEntries(
  datasetId: number,
  filters: FilterParams
) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }
  // Build the where clause based on active filters
  const conditions = [eq(dataset_entry.datasetId, datasetId)];

  if (filters.speakerId) {
    conditions.push(eq(dataset_entry.speakerId, filters.speakerId));
  }
  if (filters.modelName) {
    conditions.push(eq(dataset_entry.modelName, filters.modelName));
  }
  if (filters.dialect) {
    conditions.push(eq(dataset_entry.dialect, filters.dialect));
  }
  if (filters.iteration !== undefined) {
    conditions.push(eq(dataset_entry.iteration, filters.iteration));
  }
  if (filters.utteranceId) {
    conditions.push(eq(dataset_entry.utteranceId, filters.utteranceId));
  }

  // Fetch all matching entries
  const entries = await db
    .select()
    .from(dataset_entry)
    .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

  // Create CSV content
  const headers = [
    'id',    
    'audio_file',
    'duration_ms',
    'utt_id',
    'text',
    'speaker',
    'model',
    'dialect',
    'iteration',
  ];

  const csvLines = [headers.join(',')];
  entries.forEach((entry) => {
    const row = [
      `"${entry.externalId}"`,
      entry.fileName,
      entry.durationMs?.toString() || '',
      entry.utteranceId || '',
      `"${(entry.utteranceText || '').replace(/"/g, '""')}"`,
      entry.speakerId,
      entry.modelName,
      entry.dialect,
      entry.iteration,
    ];
    csvLines.push(row.join(','));
  });

  const csvContent = csvLines.join('\n');

  // Create filter metadata JSON
  const filterMetadata = {
    exportedAt: new Date().toISOString(),
    datasetId,
    filters,
    entriesCount: entries.length,
  };

  const metadataContent = JSON.stringify(filterMetadata, null, 2);

  // Return the data that will be zipped on the client
  return {
    csvContent,
    metadataContent,
    entriesCount: entries.length,
    entries: entries.map(entry => ({
      id: entry.externalId,
      fileName: entry.fileName,
    })),
  };
}
