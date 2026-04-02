'use server';

import db from '@/lib/db';
import { dataset } from '@/lib/model/dataset';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { removeAllDatasetEntries } from './remove-dataset-entries';
import { requireAdmin } from '@/lib/auth';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

/**
 * Duplicates a dataset with filtered and prioritized entries.
 * 
 * @param sourceDatasetId - ID of the source dataset to duplicate from
 * @param newDatasetName - Name for the new duplicated dataset
 * @param newDatasetDescription - Description for the new dataset
 * @param iterations - Number of times to replicate selected entries
 * @param prioritizationMetric - Metric to prioritize entries by ('utmos' or 'wer')
 * @param filters - Filtering criteria (all AND-ed together)
 * @returns Object with success status and details
 */
export async function duplicateDatasetWithCriteria(
  sourceDatasetId: number,
  newDatasetName: string,
  newDatasetDescription: string | undefined,
  iterations: number,
  prioritizationMetric: 'utmos' | 'wer',
  filters?: {
    utmosMin?: number;
    utmosMax?: number;
    werMin?: number;
    werMax?: number;
    durationMsMin?: number;
    durationMsMax?: number;
  }
) {
  const authResult = await requireAdmin();
  if (!authResult.authenticated || !authResult.admin) {
    throw new Error('Unauthorized');
  }

  if (!newDatasetName || !newDatasetName.trim()) {
    throw new Error('Dataset name is required');
  }

  if (iterations < 1) {
    throw new Error('Iterations must be at least 1');
  }

  try {
    // Step 1: Fetch all entries from source dataset
    const sourceEntries = await db
      .select()
      .from(dataset_entry)
      .where(eq(dataset_entry.datasetId, sourceDatasetId));

    if (sourceEntries.length === 0) {
      throw new Error('Source dataset has no entries');
    }

    // Step 2: Apply filters (all AND-ed together)
    const filteredEntries = sourceEntries.filter((entry) => {
      // UTMOS filter
      if (filters?.utmosMin !== undefined && entry.utmosScore !== null) {
        if (entry.utmosScore < filters.utmosMin) return false;
      }
      if (filters?.utmosMax !== undefined && entry.utmosScore !== null) {
        if (entry.utmosScore > filters.utmosMax) return false;
      }

      // WER filter
      if (filters?.werMin !== undefined && entry.werScore !== null) {
        if (entry.werScore < filters.werMin) return false;
      }
      if (filters?.werMax !== undefined && entry.werScore !== null) {
        if (entry.werScore > filters.werMax) return false;
      }

      // Duration filter
      if (filters?.durationMsMin !== undefined && entry.durationMs !== null) {
        if (entry.durationMs < filters.durationMsMin) return false;
      }
      if (filters?.durationMsMax !== undefined && entry.durationMs !== null) {
        if (entry.durationMs > filters.durationMsMax) return false;
      }

      return true;
    });

    if (filteredEntries.length === 0) {
      throw new Error('No entries match the specified filter criteria');
    }

    // Step 3: Group entries by speaker, utterance, dialect, and model
    const groupedEntries = new Map<string, typeof sourceEntries[0][]>();
    for (const entry of filteredEntries) {
      const groupKey = `${entry.speakerId}|${entry.utteranceId}|${entry.dialect}|${entry.modelName}`;
      if (!groupedEntries.has(groupKey)) {
        groupedEntries.set(groupKey, []);
      }
      groupedEntries.get(groupKey)!.push(entry);
    }

    // Step 4: Sort each group by prioritization metric and select top iteration count entries
    const selectedEntries: typeof sourceEntries = [];
    for (const [, groupEntries] of groupedEntries) {
      // Sort by the prioritization metric
      const sorted = groupEntries.sort((a, b) => {
        if (prioritizationMetric === 'utmos') {
          // Higher UTMOS is better
          const aScore = a.utmosScore ?? Number.NEGATIVE_INFINITY;
          const bScore = b.utmosScore ?? Number.NEGATIVE_INFINITY;
          return bScore - aScore;
        } else {
          // Lower WER is better
          const aScore = a.werScore ?? Number.POSITIVE_INFINITY;
          const bScore = b.werScore ?? Number.POSITIVE_INFINITY;
          return aScore - bScore;
        }
      });

      // Take the top entries from the group
      selectedEntries.push(...sorted.slice(0, iterations));
    }

    // Step 5: Create new dataset
    const newDatasetResult = await db.insert(dataset).values({
      name: newDatasetName.trim(),
      description: newDatasetDescription?.trim() || null,
    });

    if (!newDatasetResult.lastInsertRowid) {
      throw new Error('Failed to create new dataset');
    }

    const newDatasetId = Number(newDatasetResult.lastInsertRowid);

    // Step 6: Create dataset directory for new dataset
    const sourceDatasetDir = join(process.cwd(), 'public', 'datasets', sourceDatasetId.toString());
    const newDatasetDir = join(process.cwd(), 'public', 'datasets', newDatasetId.toString());

    await mkdir(newDatasetDir, { recursive: true });

    // Step 7: Copy audio files and create entries for each iteration
    const newEntries: typeof dataset_entry.$inferInsert[] = [];

      for (const entry of selectedEntries) {
        // Copy audio file
        const audioFileExtension = entry.fileName.substring(entry.fileName.lastIndexOf('.'));
        const sourceAudioPath = join(sourceDatasetDir, `${entry.externalId}${audioFileExtension}`);
        const newAudioPath = join(newDatasetDir, `${entry.externalId}${audioFileExtension}`);

        // Only copy if file exists
        if (existsSync(sourceAudioPath)) {
          const audioBuffer = await readFile(sourceAudioPath);
          await writeFile(newAudioPath, audioBuffer);
        }

        // Create entry with updated iteration number
        newEntries.push({
          datasetId: newDatasetId,
          externalId: entry.externalId,
          speakerId: entry.speakerId,
          modelName: entry.modelName,
          utteranceId: entry.utteranceId,
          utteranceText: entry.utteranceText,
          fileName: entry.fileName,
          dialect: entry.dialect,
          iteration: entry.iteration,
          durationMs: entry.durationMs,
          rmsValue: entry.rmsValue,
          longestPause: entry.longestPause,
          utmosScore: entry.utmosScore,
          werScore: entry.werScore,
        });
      }
    

    // Step 8: Insert all entries into new dataset
    await db.insert(dataset_entry).values(newEntries);

    revalidatePath('/admin');
    revalidatePath('/admin/datasets');

    return {
      success: true,
      newDatasetId,
      newDatasetName: newDatasetName.trim(),
      sourceEntriesCount: sourceEntries.length,
      filteredEntriesCount: filteredEntries.length,
      selectedEntriesCount: selectedEntries.length,
      totalEntriesCreated: newEntries.length,
      message: `Successfully created new dataset '${newDatasetName.trim()}' with ${selectedEntries.length} unique entries replicated ${iterations} time(s) (total: ${newEntries.length} entries).`,
    };
  } catch (error) {
    console.error('Error duplicating dataset:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate dataset';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
