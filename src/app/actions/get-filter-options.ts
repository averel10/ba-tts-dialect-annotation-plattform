'use server';

import db from '@/lib/db';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { eq } from 'drizzle-orm';

export async function getFilterOptions(datasetId: number) {
  const entries = await db
    .select()
    .from(dataset_entry)
    .where(eq(dataset_entry.datasetId, datasetId));

  // Extract unique values for each filter
  const speakerIds = [...new Set(entries.map(e => e.speakerId))].sort();
  const modelNames = [...new Set(entries.map(e => e.modelName))].sort();
  const dialects = [...new Set(entries.map(e => e.dialect))].sort();
  const iterations = [...new Set(entries.map(e => e.iteration))].sort((a, b) => a - b);

  return {
    speakerIds,
    modelNames,
    dialects,
    iterations,
  };
}
