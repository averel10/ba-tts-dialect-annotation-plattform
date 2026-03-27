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
import { experiment_calibration } from '@/lib/model/experiment_calibration';
import { participant } from '@/lib/model/participant';

/**
 * Returns unannotated entries for the given dataset and authenticated user.
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

  return mapped;
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

/**
 * Checks if calibration is required and completed for the current user in an experiment.
 * Returns true if calibration is completed or not required, false if calibration is pending.
 */
export async function isCalibrationDone(experimentId: number): Promise<boolean> {
  console.log('Checking calibration status for experimentId:', experimentId);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Nicht angemeldet');

  // Get calibration items for this experiment
  const calibrationItems = await db
    .select()
    .from(experiment_calibration)
    .where(eq(experiment_calibration.experimentId, experimentId));

  // If no calibration items are defined, calibration is not required
  if (calibrationItems.length === 0) {
    return true;
  }

  // Check if participant exists for this user and experiment
  const participantRecord = await db
    .select()
    .from(participant)
    .where(
      and(
        eq(participant.experimentId, experimentId),
        eq(participant.userId, session.user.id)
      )
    )
    .limit(1);

  // If no participant record exists, calibration is not done
  if (participantRecord.length === 0) {
    return false;
  }

  // Check if calibration answers are filled
  const calibrationAnswers = participantRecord[0].calibrationAnswers as Record<number, { dialectLabel: string; confidence: number }> | null;
  
  if (!calibrationAnswers) {
    return false;
  }

  // Verify that all calibration items have complete answers
  for (const item of calibrationItems) {
    const answer = calibrationAnswers[item.id];
    
    // Check if answer exists and has both required fields
    if (!answer || !answer.dialectLabel || !answer.confidence) {
      return false;
    }
  }

  return true;
}

