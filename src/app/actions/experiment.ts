'use server';

import db from '@/lib/db';
import { experiment } from '@/lib/model/experiment';
import { annotation } from '@/lib/model/annotation';
import { participant } from '@/lib/model/participant';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth, requireAdmin } from '@/lib/auth';
import { headers } from 'next/headers';

export async function createExperiment({ 
  name, 
  description,
  datasetId,
  annotationTool,
  published = false
}: { 
  name: string; 
  description?: string;
  datasetId: number;
  annotationTool?: string;
  published?: boolean;
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
  updates: { name?: string; description?: string, annotationTool?: string, published?: boolean }
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
