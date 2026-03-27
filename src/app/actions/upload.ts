'use server';

import db from '@/lib/db';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { experiment_calibration } from '@/lib/model/experiment_calibration';
import { parseCSVLine } from '@/lib/csv-parser';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAdmin } from '@/lib/auth';

/**
 * Helper: Parse metadata.csv from extracted directory
 * Returns structured data for both insert and update operations
 */
async function parseMetadataFromDirectory(
  tempDir: string
): Promise<{
  headers: string[];
  rows: Record<string, string>[];
}> {
  const metadataPath = join(tempDir, 'metadata.csv');
  if (!existsSync(metadataPath)) {
    throw new Error('metadata.csv not found in extracted files');
  }

  const metadataContent = await readFile(metadataPath, 'utf-8');
  const lines = metadataContent.split('\n').filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error('metadata.csv is empty or invalid');
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length !== headers.length) {
      continue; // Skip malformed lines
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Convert metadata row to dataset_entry insert object
 */
function rowToDatasetEntry(
  row: Record<string, string>,
  datasetId: number
): typeof dataset_entry.$inferInsert {
  return {
    datasetId,
    externalId: row.id,
    speakerId: row.speaker,
    modelName: row.model,
    utteranceId: row.utt_id,
    utteranceText: row.text,
    fileName: row.audio_file,
    dialect: row.dialect,
    iteration: parseInt(row.iteration, 10),
    durationMs: row.duration_ms ? parseInt(row.duration_ms, 10) : undefined,
    rmsValue: row.rms_value ? parseFloat(row.rms_value) : undefined,
    longestPause: row.longest_pause ? parseFloat(row.longest_pause) : undefined,
    utmosScore: row.utmos_score ? parseFloat(row.utmos_score) : undefined,
    werScore: row.wer_score ? parseFloat(row.wer_score) : undefined,
  };
}

/**
 * Step 2: Process the extracted ZIP data and insert into database
 * Copies audio files and creates database entries
 */
export async function processDatasetEntries(
  datasetId: number,
  tempDir: string
) {
  try {
    const result = await requireAdmin();
    if (!result.authenticated || !result.admin) {
      return {
        success: false,
        error: 'Unauthorized',
        entriesCreated: 0,
      };
    }

    const datasetDir = join(process.cwd(), 'public', 'datasets', datasetId.toString());

    // Validate temp directory exists
    if (!existsSync(tempDir)) {
      return {
        success: false,
        error: 'Temporary extraction directory not found',
        entriesCreated: 0,
      };
    }

    // Parse metadata from directory
    const { rows } = await parseMetadataFromDirectory(tempDir);

    const entries: typeof dataset_entry.$inferInsert[] = [];

    // Create dataset directory
    await mkdir(datasetDir, { recursive: true });

    // Process each row
    for (const row of rows) {
      const audioFile = row.audio_file as string;
      const relativePath = audioFile.replace(/\\/g, '/');
      const audioPath = join(tempDir, relativePath);

      if (existsSync(audioPath)) {
        // Copy audio file to dataset directory with external ID as filename
        const audioBuffer = await readFile(audioPath);
        const fileExtension = audioFile.substring(audioFile.lastIndexOf('.'));
        const destPath = join(datasetDir, `${row.id}${fileExtension}`);

        await writeFile(destPath, audioBuffer);

        entries.push(rowToDatasetEntry(row, datasetId));
      }
    }

    if (entries.length === 0) {
      return {
        success: false,
        error: 'No valid audio files found for entries',
        entriesCreated: 0,
      };
    }

    // Check for existing entries to avoid duplicates
    const existingEntries = await db
      .select({ externalId: dataset_entry.externalId })
      .from(dataset_entry)
      .where(eq(dataset_entry.datasetId, datasetId));

    const existingExternalIds = new Set(existingEntries.map(e => e.externalId));

    // Filter out duplicates
    const newEntries = entries.filter(entry => !existingExternalIds.has(entry.externalId));

    if (newEntries.length === 0) {
      return {
        success: false,
        error: 'All entries already exist in the dataset',
        entriesCreated: 0,
      };
    }

    // Insert new entries into database
    await db.insert(dataset_entry).values(newEntries);

    revalidatePath(`/admin/datasets/${datasetId}`);

    return {
      success: true,
      entriesCreated: newEntries.length,
      message: `Successfully processed and inserted ${newEntries.length} entries.`,
    };
  } catch (error) {
    console.error('Error processing dataset entries:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process dataset entries';
    return {
      success: false,
      error: errorMessage,
      entriesCreated: 0,
    };
  } finally {
    // Clean up temp directory
    try {
      if (existsSync(tempDir)) {
        await rm(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp directory:', cleanupError);
    }
  }
}

/**
 * Update metadata for existing dataset entries
 * Uses the same metadata.csv parsing as processDatasetEntries
 * Matches entries by externalId and updates their metadata fields
 */
export async function updateDatasetEntriesMetadata(
  datasetId: number,
  tempDir: string
) {
  try {
    const result = await requireAdmin();
    if (!result.authenticated || !result.admin) {
      return {
        success: false,
        error: 'Unauthorized',
        entriesUpdated: 0,
      };
    }

    // Validate temp directory exists
    if (!existsSync(tempDir)) {
      return {
        success: false,
        error: 'Temporary extraction directory not found',
        entriesUpdated: 0,
      };
    }

    // Parse metadata from directory (reusing same logic as processDatasetEntries)
    const { rows } = await parseMetadataFromDirectory(tempDir);

    if (rows.length === 0) {
      return {
        success: false,
        error: 'No valid entries found in metadata.csv',
        entriesUpdated: 0,
      };
    }

    // Get all existing entries for this dataset
    const existingEntries = await db
      .select()
      .from(dataset_entry)
      .where(eq(dataset_entry.datasetId, datasetId));

    const existingByExternalId = new Map(
      existingEntries.map(entry => [entry.externalId, entry])
    );

    let entriesUpdated = 0;
    let entriesNotFound = 0;

    // Update each row that has a matching entry
    for (const row of rows) {
      const externalId = row.id;
      const existingEntry = existingByExternalId.get(externalId);

      if (!existingEntry) {
        entriesNotFound++;
        continue;
      }

      // Update only the metadata fields, don't change the ID or dataset reference
      await db
        .update(dataset_entry)
        .set({
          speakerId: row.speaker,
          modelName: row.model,
          utteranceId: row.utt_id,
          utteranceText: row.text,
          dialect: row.dialect,
          iteration: parseInt(row.iteration, 10),
          durationMs: row.duration_ms ? parseInt(row.duration_ms, 10) : undefined,
          rmsValue: row.rms_value ? parseFloat(row.rms_value) : undefined,
          longestPause: row.longest_pause ? parseFloat(row.longest_pause) : undefined,
          utmosScore: row.utmos_score ? parseFloat(row.utmos_score) : undefined,
          werScore: row.wer_score ? parseFloat(row.wer_score) : undefined,
        })
        .where(eq(dataset_entry.id, existingEntry.id));

      entriesUpdated++;
    }

    revalidatePath(`/admin/datasets/${datasetId}`);

    return {
      success: true,
      entriesUpdated,
      entriesNotFound,
      message: entriesUpdated > 0
        ? `Successfully updated ${entriesUpdated} entries${entriesNotFound > 0 ? ` (${entriesNotFound} not found)` : ''}.`
        : `No entries were updated (${entriesNotFound} not found).`,
    };
  } catch (error) {
    console.error('Error updating dataset entries metadata:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update dataset entries metadata';
    return {
      success: false,
      error: errorMessage,
      entriesUpdated: 0,
    };
  } finally {
    // Clean up temp directory
    try {
      if (existsSync(tempDir)) {
        await rm(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp directory:', cleanupError);
    }
  }
}

/**
 * Process calibration audio files for an experiment
 * Expects metadata.csv with columns: id, audio_file, dialect, order
 * Audio files should be in a 'wavs' subfolder
 */
export async function processCalibrationEntries(
  experimentId: number,
  tempDir: string
) {
  try {
    const result = await requireAdmin();
    if (!result.authenticated || !result.admin) {
      return {
        success: false,
        error: 'Unauthorized',
        entriesCreated: 0,
      };
    }

    const calibrationDir = join(process.cwd(), 'public', 'calibration', experimentId.toString());

    // Validate temp directory exists
    if (!existsSync(tempDir)) {
      return {
        success: false,
        error: 'Temporary extraction directory not found',
        entriesCreated: 0,
      };
    }

    // Parse metadata from directory
    const { rows } = await parseMetadataFromDirectory(tempDir);

    const entries: typeof experiment_calibration.$inferInsert[] = [];

    // Create calibration directory
    await mkdir(calibrationDir, { recursive: true });

    // Process each row
    for (let lineIndex = 0; lineIndex < rows.length; lineIndex++) {
      const row = rows[lineIndex];
      const audioFile = row.audio_file as string;
      // Audio files are in wavs subfolder
      const audioPath = join(tempDir, audioFile);

      if (existsSync(audioPath)) {
        // Copy audio file to calibration directory, preserving filename from audio_file
        const audioBuffer = await readFile(audioPath);
        const filename = audioFile.split('/').pop() || audioFile;
        const destPath = join(calibrationDir, filename);

        await writeFile(destPath, audioBuffer);

        entries.push({
          experimentId,
          dialectLabel: row.dialect,
          order: lineIndex + 1,
          file: `/calibration/${experimentId}/${filename}`,
        });
      }
    }

    if (entries.length === 0) {
      return {
        success: false,
        error: 'No valid audio files found in wavs folder',
        entriesCreated: 0,
      };
    }

    // Check for existing calibration entries to avoid duplicates
    const existingEntries = await db
      .select({ file: experiment_calibration.file })
      .from(experiment_calibration)
      .where(eq(experiment_calibration.experimentId, experimentId));

    const existingFiles = new Set(existingEntries.map(e => e.file));

    // Filter out duplicates
    const newEntries = entries.filter(entry => !existingFiles.has(entry.file));

    if (newEntries.length === 0) {
      return {
        success: false,
        error: 'All calibration entries already exist for this experiment',
        entriesCreated: 0,
      };
    }

    // Insert new entries into database
    await db.insert(experiment_calibration).values(newEntries);

    revalidatePath(`/admin/experiments/${experimentId}`);

    return {
      success: true,
      entriesCreated: newEntries.length,
      message: `Successfully processed and inserted ${newEntries.length} calibration entries.`,
    };
  } catch (error) {
    console.error('Error processing calibration entries:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process calibration entries';
    return {
      success: false,
      error: errorMessage,
      entriesCreated: 0,
    };
  } finally {
    // Clean up temp directory
    try {
      if (existsSync(tempDir)) {
        await rm(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp directory:', cleanupError);
    }
  }
}
