'use server';

import db from '@/lib/db';
import { dataset } from '@/lib/model/dataset';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createDataset({ name }: { name: string }) {
  if (!name || !name.trim()) {
    throw new Error('Dataset name is required');
  }

  try {
    const result = await db.insert(dataset).values({ name: name.trim() });
    revalidatePath('/admin');
    return result;
  } catch (error) {
    console.error('Error creating dataset:', error);
    throw new Error('Failed to create dataset');
  }
}

export async function updateDataset(
  id: number,
  updates: { name?: string }
) {
  if (updates.name !== undefined && !updates.name.trim()) {
    throw new Error('Dataset name cannot be empty');
  }

  try {
    const result = await db
      .update(dataset)
      .set({
        name: updates.name?.trim(),
        updatedAt: new Date(),
      })
      .where(eq(dataset.id, id));
    revalidatePath(`/admin/datasets/${id}`);
    revalidatePath('/admin');
    return result;
  } catch (error) {
    console.error('Error updating dataset:', error);
    throw new Error('Failed to update dataset');
  }
}
