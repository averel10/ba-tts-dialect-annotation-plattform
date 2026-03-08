'use server';

import db from '@/lib/db';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { count, eq, and, like } from 'drizzle-orm';

const ENTRIES_PER_PAGE = 20;

interface FilterParams {
  speakerId?: string;
  modelName?: string;
  dialect?: string;
  iteration?: number;
}

export async function getDatasetEntries(
  datasetId: number,
  page: number = 1,
  filters?: FilterParams
) {
  const offset = (page - 1) * ENTRIES_PER_PAGE;

  // Build where conditions
  const conditions = [eq(dataset_entry.datasetId, datasetId)];

  if (filters?.speakerId) {
    conditions.push(like(dataset_entry.speakerId, `%${filters.speakerId}%`));
  }

  if (filters?.modelName) {
    conditions.push(like(dataset_entry.modelName, `%${filters.modelName}%`));
  }

  if (filters?.dialect) {
    conditions.push(like(dataset_entry.dialect, `%${filters.dialect}%`));
  }

  if (filters?.iteration !== undefined) {
    conditions.push(eq(dataset_entry.iteration, filters.iteration));
  }

  const whereClause = and(...conditions);

  const entries = await db
    .select()
    .from(dataset_entry)
    .where(whereClause)
    .limit(ENTRIES_PER_PAGE)
    .offset(offset);

  const totalResult = await db
    .select({ count: count() })
    .from(dataset_entry)
    .where(whereClause);

  const total = totalResult[0]?.count || 0;
  const hasMore = offset + ENTRIES_PER_PAGE < total;

  return {
    entries,
    hasMore,
    total,
    page,
  };
}
