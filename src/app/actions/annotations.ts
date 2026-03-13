'use server';

import db from '@/lib/db';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { dataset } from '@/lib/model/dataset';
import { annotation } from '@/lib/model/annotation';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { AnnotationEntry } from '@/lib/dialects';

/**
 * Returns unannotated entries for the given dataset and authenticated user.
 */
export async function getAnnotationEntries(datasetId: number): Promise<AnnotationEntry[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Nicht angemeldet');

  const allEntries = await db
    .select()
    .from(dataset_entry)
    .where(eq(dataset_entry.datasetId, datasetId));

  if (allEntries.length === 0) return [];

  // Find entries already annotated by this user in this dataset (via join)
  const annotated = await db
    .select({ entryId: annotation.datasetEntryId })
    .from(annotation)
    .innerJoin(dataset_entry, eq(annotation.datasetEntryId, dataset_entry.id))
    .where(
      and(
        eq(annotation.userId, session.user.id),
        eq(dataset_entry.datasetId, datasetId)
      )
    );

  const annotatedIds = new Set(annotated.map((a) => a.entryId));
  const remaining = allEntries.filter((e) => !annotatedIds.has(e.id));

  const mapped: AnnotationEntry[] = remaining.map((e) => ({
    id: e.id,
    externalId: e.externalId,
    fileName: e.fileName,
    dialect: e.dialect,
    durationMs: e.durationMs,
    datasetId: e.datasetId,
  }));

  return mapped;
}

/**
 * Persists a batch of ratings for the authenticated user.
 * Silently ignores duplicates (onConflictDoNothing).
 */
export async function saveAnnotations(
  ratings: { entryId: number; rating: number; dialectLabel: string }[]
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Nicht angemeldet');

  if (ratings.length === 0) return;

  for (const { entryId, rating, dialectLabel } of ratings) {
    await db
      .insert(annotation)
      .values({ datasetEntryId: entryId, userId: session.user.id, rating, dialectLabel })
      .onConflictDoNothing();
  }
}

/** Returns all datasets (for the home page). */
export async function getAllDatasets() {
  return db.select().from(dataset).orderBy(dataset.name);
}

/** Returns annotation progress for the current user in a dataset. */
export async function getAnnotationProgress(
  datasetId: number
): Promise<{ total: number; done: number }> {
  const session = await auth.api.getSession({ headers: await headers() });

  const allEntries = await db
    .select({ id: dataset_entry.id })
    .from(dataset_entry)
    .where(eq(dataset_entry.datasetId, datasetId));

  if (!session || allEntries.length === 0) {
    return { total: allEntries.length, done: 0 };
  }

  const annotated = await db
    .select({ entryId: annotation.datasetEntryId })
    .from(annotation)
    .innerJoin(dataset_entry, eq(annotation.datasetEntryId, dataset_entry.id))
    .where(
      and(
        eq(annotation.userId, session.user.id),
        eq(dataset_entry.datasetId, datasetId)
      )
    );

  return { total: allEntries.length, done: annotated.length };
}

