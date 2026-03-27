'use server';

import db from '@/lib/db';
import { experiment_calibration } from '@/lib/model/experiment_calibration';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function getCalibrationEntries(experimentId: number) {
  try {
    const entries = await db
      .select()
      .from(experiment_calibration)
      .where(eq(experiment_calibration.experimentId, experimentId));
    
    return { success: true, data: entries };
  } catch (error) {
    console.error('Error fetching calibration entries:', error);
    throw new Error('Failed to fetch calibration entries');
  }
}

export async function deleteCalibrationEntry(calibrationId: number, experimentId: number) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Get the entry to find the file path
    const entries = await db
      .select()
      .from(experiment_calibration)
      .where(
        and(
          eq(experiment_calibration.id, calibrationId),
          eq(experiment_calibration.experimentId, experimentId)
        )
      );

    if (entries.length === 0) {
      throw new Error('Calibration entry not found');
    }

    const filePath = entries[0].file;

    // Delete from database
    await db
      .delete(experiment_calibration)
      .where(eq(experiment_calibration.id, calibrationId));

    // Delete the audio file
    try {
      const fullPath = join(process.cwd(), 'public', filePath);
      await unlink(fullPath);
    } catch (err) {
      console.warn('Could not delete audio file:', err);
      // Don't fail the operation if file deletion fails
    }

    revalidatePath(`/admin/experiments/${experimentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting calibration entry:', error);
    throw new Error('Failed to delete calibration entry');
  }
}

export async function updateCalibrationOrder(experimentId: number, orderMap: Record<number, number>) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Update all entries with new order values
    const updates = Object.entries(orderMap).map(([calibrationId, newOrder]) =>
      db
        .update(experiment_calibration)
        .set({ order: newOrder })
        .where(
          and(
            eq(experiment_calibration.id, parseInt(calibrationId)),
            eq(experiment_calibration.experimentId, experimentId)
          )
        )
    );

    await Promise.all(updates);
    revalidatePath(`/admin/experiments/${experimentId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating calibration order:', error);
    throw new Error('Failed to update calibration order');
  }
}

export async function deleteAllCalibrationEntries(experimentId: number) {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Get all entries to delete files
    const entries = await db
      .select()
      .from(experiment_calibration)
      .where(eq(experiment_calibration.experimentId, experimentId));

    // Delete audio files
    for (const entry of entries) {
      try {
        const fullPath = join(process.cwd(), 'public', entry.file);
        await unlink(fullPath);
      } catch (err) {
        console.warn('Could not delete audio file:', err);
        // Don't fail the operation if file deletion fails
      }
    }

    // Delete all entries from database
    await db
      .delete(experiment_calibration)
      .where(eq(experiment_calibration.experimentId, experimentId));

    revalidatePath(`/admin/experiments/${experimentId}`);
    return { success: true, deletedCount: entries.length };
  } catch (error) {
    console.error('Error deleting all calibration entries:', error);
    throw new Error('Failed to delete all calibration entries');
  }
}
