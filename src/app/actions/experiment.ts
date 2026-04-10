'use server';

import db from '@/lib/db';
import { experiment } from '@/lib/model/experiment';
import { experiment_calibration } from '@/lib/model/experiment_calibration';
import { annotation } from '@/lib/model/annotation';
import { participant } from '@/lib/model/participant';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { and, eq, count, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth, requireAdmin } from '@/lib/auth';
import { isParticipantCalibrationDone } from './calibration-scoring';
import { headers } from 'next/headers';

export async function createExperiment({ 
  name, 
  description,
  datasetId,
  annotationTool,
  published = false,
  onboardingEnabled = false,
  calibrationEnabled = false
}: { 
  name: string; 
  description?: string;
  datasetId: number;
  annotationTool?: string;
  published?: boolean;
  onboardingEnabled?: boolean;
  calibrationEnabled?: boolean;
}) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  if (!name || !name.trim()) {
    throw new Error('Experiment name is required');
  }

  try {
    const result = await db.insert(experiment).values({ 
      name: name.trim(),
      description: description?.trim() || null,
      datasetId,
      annotationTool: annotationTool?.trim(),
      published,
      onboardingEnabled,
      calibrationEnabled,
    });
    revalidatePath('/admin/experiments');
    return result;
  } catch (error) {
    console.error('Error creating experiment:', error);
    throw new Error('Failed to create experiment');
  }
}

export async function updateExperiment(
  id: number,
  updates: { name?: string; description?: string, annotationTool?: string, published?: boolean, onboardingEnabled?: boolean, calibrationEnabled?: boolean }
) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  if (updates.name !== undefined && !updates.name.trim()) {
    throw new Error('Experiment name cannot be empty');
  }

  try {
    const updateData: any = {};
    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description.trim() || null;
    }
    if (updates.annotationTool !== undefined) {
      updateData.annotationTool = updates.annotationTool?.trim();
    }
    if (updates.published !== undefined) {
      updateData.published = updates.published;
    }
    if (updates.onboardingEnabled !== undefined) {
      updateData.onboardingEnabled = updates.onboardingEnabled;
    }
    if (updates.calibrationEnabled !== undefined) {
      updateData.calibrationEnabled = updates.calibrationEnabled;
    }
    updateData.updatedAt = new Date();

    const result = await db
      .update(experiment)
      .set(updateData)
      .where(eq(experiment.id, id));
    revalidatePath(`/admin/experiments/${id}`);
    revalidatePath('/admin/experiments');
    return result;
  } catch (error) {
    console.error('Error updating experiment:', error);
    throw new Error('Failed to update experiment');
  }
}

export async function deleteExperiment(id: number) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Delete all child records first (FK constraints)
    await db.delete(annotation).where(eq(annotation.experimentId, id));
    await db.delete(participant).where(eq(participant.experimentId, id));
    await db.delete(experiment_calibration).where(eq(experiment_calibration.experimentId, id));

    // Delete the experiment
    await db.delete(experiment).where(eq(experiment.id, id));

    revalidatePath('/admin/experiments');
    return { success: true };
  } catch (error) {
    console.error('Error deleting experiment:', error);
    throw new Error('Failed to delete experiment');
  }
}

export async function getExperimentsByDataset(datasetId: number) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    const experiments = await db
      .select()
      .from(experiment)
      .where(eq(experiment.datasetId, datasetId));
    return experiments;
  } catch (error) {
    console.error('Error fetching experiments:', error);
    throw new Error('Failed to fetch experiments');
  }
}

export async function getExperimentById(id: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Nicht angemeldet');


  try {    const experimentData = await db
      .select()
      .from(experiment)
      .where(
        and(
          eq(experiment.id, id), 
          eq(experiment.published, true)
        ))
      .limit(1);
    return experimentData[0] || null;
  }
    catch (error) {
    console.error('Error fetching experiment:', error);
    throw new Error('Failed to fetch experiment');
  } 
}

export async function clearExperimentData(id: number) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Delete all annotations for this experiment
    await db.delete(annotation).where(eq(annotation.experimentId, id));

    // Delete all participants for this experiment
    await db.delete(participant).where(eq(participant.experimentId, id));

    revalidatePath(`/admin/experiments/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error clearing experiment data:', error);
    throw new Error('Failed to clear experiment data');
  }
}

export async function getExperimentStatistics(id: number) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Get the experiment with dataset
    const exp = await db
      .select()
      .from(experiment)
      .where(eq(experiment.id, id))
      .limit(1);

    if (!exp || exp.length === 0) {
      throw new Error('Experiment not found');
    }

    const datasetId = exp[0].datasetId;

    // Get all participants
    const allParticipants = await db
      .select()
      .from(participant)
      .where(eq(participant.experimentId, id));

    // Count onboarding completion (simple check for non-null)
    const completedOnboarding = allParticipants.filter(
      (p) => p.onboardingAnswers !== null && p.onboardingAnswers !== undefined
    ).length;

    // Check calibration completion using the proper validation
    let completedCalibration = 0;
    for (const p of allParticipants) {
      if (await isParticipantCalibrationDone(id, p)) {
        completedCalibration++;
      }
    }

    // Count total dataset entries
    const totalEntriesResult = await db
      .select({ total: count().as('total') })
      .from(dataset_entry)
      .where(eq(dataset_entry.datasetId, datasetId));

    const totalEntries = totalEntriesResult[0]?.total || 0;

    // Get annotation statistics
    const annotationStats = await db
      .select({
        total: count().as('total'),
        entriesWithAnnotations: count(sql`DISTINCT ${annotation.datasetEntryId}`).as('entriesWithAnnotations'),
      })
      .from(annotation)
      .where(eq(annotation.experimentId, id));

    // Get per-entry annotation counts
    const perEntryAnnotations = await db
      .select({
        datasetEntryId: annotation.datasetEntryId,
        annotationCount: count().as('annotationCount'),
      })
      .from(annotation)
      .where(eq(annotation.experimentId, id))
      .groupBy(annotation.datasetEntryId);

    // Calculate statistics
    const totalAnnotations = annotationStats[0]?.total || 0;
    const entriesWithAnnotations = annotationStats[0]?.entriesWithAnnotations || 0;
    const entriesWithoutAnnotations = Math.max(0, totalEntries - entriesWithAnnotations);
    const averageAnnotationsPerEntry = totalEntries > 0 ? (totalAnnotations / totalEntries).toFixed(2) : '0';

    // Find max and min annotations per entry
    let maxAnnotationsPerEntry = 0;
    let minAnnotationsPerEntry = 0;
    if (perEntryAnnotations.length > 0) {
      const counts = perEntryAnnotations.map(p => p.annotationCount || 0);
      maxAnnotationsPerEntry = Math.max(...counts);
      minAnnotationsPerEntry = Math.min(...counts);
    }

    return {
      participants: {
        total: allParticipants.length,
        completedOnboarding,
        completedCalibration,
      },
      entries: {
        total: totalEntries,
      },
      annotations: {
        total: totalAnnotations,
        entriesWithAnnotations,
        entriesWithoutAnnotations,
        averagePerEntry: parseFloat(averageAnnotationsPerEntry),
        maxPerEntry: maxAnnotationsPerEntry,
        minPerEntry: minAnnotationsPerEntry,
      },
    };
  } catch (error) {
    console.error('Error fetching experiment statistics:', error);
    throw new Error('Failed to fetch experiment statistics');
  }
}
