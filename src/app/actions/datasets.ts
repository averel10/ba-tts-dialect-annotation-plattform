'use server';

import db from '@/lib/db';
import { dataset } from '@/lib/model/dataset';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

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
