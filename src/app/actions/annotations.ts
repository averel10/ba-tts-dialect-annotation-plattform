'use server';

import db from '@/lib/db';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { dataset } from '@/lib/model/dataset';
import { annotation } from '@/lib/model/annotation';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { DatasetEntryForAnnotation } from '@/lib/dialects';
import { experiment } from '@/lib/model/experiment';
import { getDialectScoresFromCalibration, isCalibrationDone } from '@/app/actions/calibration-scoring';


/**
 * Sorts entries by weighted dialect score with fuzzy interleaving (deterministic round-robin).
 * Higher-scoring dialects appear more frequently based on their relative performance.
 */
function sortEntriesByWeightedDialectScore(
  entries: DatasetEntryForAnnotation[],
  dialectScores: Record<string, number>
): DatasetEntryForAnnotation[] {
  const dialectGroups = new Map<string, DatasetEntryForAnnotation[]>();
  
  // Group entries by dialect
  for (const entry of entries) {
    if (!dialectGroups.has(entry.dialect)) {
      dialectGroups.set(entry.dialect, []);
    }
    dialectGroups.get(entry.dialect)!.push(entry);
  }

  // Sort groups by dialect score (highest first)
  const sortedGroups = Array.from(dialectGroups.entries())
    .sort((a, b) => {
      const aScore = dialectScores[a[0]] || 0;
      const bScore = dialectScores[b[0]] || 0;
      return bScore - aScore;
    });

  // Calculate weight multipliers based on scores (higher score = more samples per cycle)
  const maxScore = Math.max(...sortedGroups.map(g => dialectScores[g[0]] || 0), 0.1);
  const groupWeights = sortedGroups.map(([dialect, entries]) => {
    const score = dialectScores[dialect] || 0;
    const weight = Math.max(1, Math.round((score / maxScore) * 5)); // 1-5x multiplier based on score
    return { dialect, entries, weight, index: 0 }; // Track current position in group
  });

  // Interleave entries with weighted round-robin for fuzzy distribution
  const result: DatasetEntryForAnnotation[] = [];
  const totalEntries = entries.length;
  
  while (result.length < totalEntries) {
    for (const group of groupWeights) {
      // Add 'weight' entries from this group (or until we run out)
      for (let w = 0; w < group.weight && group.index < group.entries.length && result.length < totalEntries; w++) {
        result.push(group.entries[group.index]);
        group.index++;
      }
    }
  }

  return result;
}

/**
 * Returns unannotated entries for the given dataset and authenticated user.
 * Sorts entries by calibration performance - dialects the user identified correctly and confidently appear first.
 */
export async function getAnnotationEntries(experimentId: number): Promise<DatasetEntryForAnnotation[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Nicht angemeldet');

  const currentExperiments = await db
    .select()
    .from(experiment)
    .where(eq(experiment.id, experimentId))
    .leftJoin(dataset, eq(experiment.datasetId, dataset.id))
    .limit(1);

  if (currentExperiments.length === 0) {
    throw new Error('Experiment nicht gefunden');
  }

  if(!currentExperiments[0].dataset) {
    throw new Error('Experiment hat kein zugeordnetes Dataset');
  }

  const allDatasetEntries = await db
    .select()
    .from(dataset_entry)
    .where(eq(dataset_entry.datasetId, currentExperiments[0].dataset.id));

  if (allDatasetEntries.length === 0) return [];

  // Find entries already annotated by this user in this dataset (via join)
  const annotationEntries = await db
    .select()
    .from(annotation)
    .where(
      and(
        eq(annotation.userId, session.user.id),
        eq(annotation.experimentId, experimentId)
      )
    );

  // Get dialect scores from calibration
  const dialectScores = await getDialectScoresFromCalibration(experimentId);

  const mapped: DatasetEntryForAnnotation[] = allDatasetEntries.map((e) => ({
    id: e.id,
    externalId: e.externalId,
    fileName: e.fileName,
    dialect: e.dialect,
    durationMs: e.durationMs,
    experimentId: experimentId,
    datasetId: e.datasetId,
    annotation: annotationEntries.find((a) => a.datasetEntryId === e.id)?.rating || null,
  }));

  return sortEntriesByWeightedDialectScore(mapped, dialectScores);
}

/**
 * Persists a batch of ratings for the authenticated user.
 * Updates existing annotations with the same userId, experimentId, and datasetEntryId.
 */
export async function saveAnnotations(
  ratings: { entryId: number; rating: number; dialectLabel: string }[],
  experimentId: number
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Nicht angemeldet');

  if (ratings.length === 0) return;

  for (const { entryId, rating, dialectLabel } of ratings) {
    await db
      .insert(annotation)
      .values({experimentId, datasetEntryId: entryId, userId: session.user.id, rating, dialectLabel })
      .onConflictDoUpdate({
        target: [annotation.userId, annotation.experimentId, annotation.datasetEntryId],
        set: {
          rating,
          dialectLabel,
        }
      });
  }
}

/** Returns all datasets (for the home page). */
export async function getAllExperiments() {
  return db.select().from(experiment).where(eq(experiment.published, true)).orderBy(experiment.id);
}

/** Returns annotation progress for the current user in a dataset. */
export async function getAnnotationProgress(
  experimentId: number
): Promise<{ total: number; done: number }> {
  const session = await auth.api.getSession({ headers: await headers() });

  const datasetIdResult = await db
    .select({ datasetId: experiment.datasetId })
    .from(experiment)
    .where(eq(experiment.id, experimentId))
    .limit(1);

  const datasetId = datasetIdResult[0]?.datasetId;

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
        eq(annotation.experimentId, experimentId)
      )
    );

  return { total: allEntries.length, done: annotated.length };
}

