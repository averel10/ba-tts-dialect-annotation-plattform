'use server';

import db from '@/lib/db';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { count, eq, and, like, asc, desc, getTableColumns } from 'drizzle-orm';

const ENTRIES_PER_PAGE = 20;
const SORT_COLUMNS = getTableColumns(dataset_entry);

interface FilterParams {
  speakerId?: string;
  modelName?: string;
  dialect?: string;
  iteration?: number;
  utteranceId?: string;
}

interface SortParams {
  sortBy?: keyof typeof SORT_COLUMNS;
  sortOrder?: 'asc' | 'desc';
}

export async function getDatasetEntries(
  datasetId: number,
  page: number = 1,
  filters?: FilterParams,
  sort?: SortParams
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

  if (filters?.utteranceId) {
    conditions.push(like(dataset_entry.utteranceId, `%${filters.utteranceId}%`));
  }

  const whereClause = and(...conditions);

  // Build sort clause
  const sortFn = sort?.sortOrder === 'desc' ? desc : asc;
  const sortColumn = sort?.sortBy && sort.sortBy in SORT_COLUMNS
    ? sortFn(SORT_COLUMNS[sort.sortBy as keyof typeof SORT_COLUMNS])
    : asc(dataset_entry.externalId);

  const entries = await db
    .select()
    .from(dataset_entry)
    .where(whereClause)
    .orderBy(sortColumn)
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
