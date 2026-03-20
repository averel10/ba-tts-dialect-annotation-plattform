'use server';

import db from '@/lib/db';
import { dataset } from '@/lib/model/dataset';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { removeAllDatasetEntries } from './remove-dataset-entries';
import { requireAdmin } from '@/lib/auth';

export async function getAllDatasets() {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    const datasets = await db
      .select()
      .from(dataset)
      .orderBy(dataset.name);
    return datasets;
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw new Error('Failed to fetch datasets');
  }
}

export async function createDataset({ name, description }: { name: string; description?: string }) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  if (!name || !name.trim()) {
    throw new Error('Dataset name is required');
  }

  try {
    const result = await db.insert(dataset).values({ 
      name: name.trim(),
      description: description?.trim() || null
    });
    revalidatePath('/admin');
    return result;
  } catch (error) {
    console.error('Error creating dataset:', error);
    throw new Error('Failed to create dataset');
  }
}

export async function updateDataset(
  id: number,
  updates: { name?: string; description?: string }
) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  if (updates.name !== undefined && !updates.name.trim()) {
    throw new Error('Dataset name cannot be empty');
  }

  try {
    const updateData: any = {};
    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description.trim() || null;
    }
    updateData.updatedAt = new Date();

    const result = await db
      .update(dataset)
      .set(updateData)
      .where(eq(dataset.id, id));
    revalidatePath(`/admin/datasets/${id}`);
    revalidatePath('/admin');
    return result;
  } catch (error) {
    console.error('Error updating dataset:', error);
    throw new Error('Failed to update dataset');
  }
}

export async function deleteDataset(id: number) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Remove all entries and their files using the existing action
    await removeAllDatasetEntries(id);

    // Then delete the dataset itself
    await db.delete(dataset).where(eq(dataset.id, id));

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error deleting dataset:', error);
    throw new Error('Failed to delete dataset');
  }
}
