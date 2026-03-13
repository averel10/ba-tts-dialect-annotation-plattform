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
 * Returns shuffled unannotated entries for the given dataset and authenticated user.
 * Consecutive entries will never share the same externalId.
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

  return shuffleWithConstraint(mapped);
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fisher-Yates shuffle with a greedy fix for consecutive same externalId. */
function shuffleWithConstraint(entries: AnnotationEntry[]): AnnotationEntry[] {
  if (entries.length <= 1) return entries;

  const arr = [...entries];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // Single-pass greedy fix
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].externalId === arr[i - 1].externalId) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[j].externalId !== arr[i - 1].externalId) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          break;
        }
      }
    }
  }

  return arr;
}
