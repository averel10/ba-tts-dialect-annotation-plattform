'use server';

import db from '@/lib/db';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAdmin } from '@/lib/auth';

export async function removeAllDatasetEntries(datasetId: number) {
  try {
    const result = await requireAdmin();
    if (!result.authenticated || !result.admin) {
      throw new Error('Unauthorized');
    }
    // Delete all entries from database
    await db.delete(dataset_entry).where(eq(dataset_entry.datasetId, datasetId));

    // Delete dataset files from public folder
    const datasetDir = join(process.cwd(), 'public', 'datasets', datasetId.toString());
    if (existsSync(datasetDir)) {
      await rm(datasetDir, { recursive: true, force: true });
    }

    revalidatePath(`/admin/datasets/${datasetId}`);

    return {
      success: true,
      message: 'All dataset entries have been removed',
    };
  } catch (error) {
    console.error('Error removing dataset entries:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to remove dataset entries'
    );
  }
}
