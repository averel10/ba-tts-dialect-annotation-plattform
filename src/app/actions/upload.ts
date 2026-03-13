'use server';

import db from '@/lib/db';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { parseCSVLine } from '@/lib/csv-parser';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { requireAdmin } from '@/lib/auth';

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

    // Read metadata.csv again
    const metadataPath = join(tempDir, 'metadata.csv');
    if (!existsSync(metadataPath)) {
      return {
        success: false,
        error: 'metadata.csv not found in extracted files',
        entriesCreated: 0,
      };
    }

    const metadataContent = await readFile(metadataPath, 'utf-8');
    const lines = metadataContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return {
        success: false,
        error: 'metadata.csv is empty or invalid',
        entriesCreated: 0,
      };
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim());
    const entries: typeof dataset_entry.$inferInsert[] = [];

    // Create dataset directory
    await mkdir(datasetDir, { recursive: true });

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      if (values.length !== headers.length) {
        continue; // Skip malformed lines
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      const audioFile = row.audio_file as string;
      const relativePath = audioFile.replace(/\\/g, '/');
      const audioPath = join(tempDir, relativePath);

      if (existsSync(audioPath)) {
        // Copy audio file to dataset directory with external ID as filename
        const audioBuffer = await readFile(audioPath);
        const fileExtension = audioFile.substring(audioFile.lastIndexOf('.'));
        const destPath = join(datasetDir, `${row.id}${fileExtension}`);

        await writeFile(destPath, audioBuffer);

        entries.push({
          datasetId,
          externalId: row.id,
          speakerId: row.speaker,
          modelName: row.model,
          utteranceId: row.utt_id,
          utteranceText: row.text,
          fileName: relativePath,
          dialect: row.dialect,
          iteration: parseInt(row.iteration, 10),
          durationMs: row.duration_ms ? parseInt(row.duration_ms, 10) : undefined,
          rmsValue: row.rms_value ? parseFloat(row.rms_value) : undefined,
          longestPause: row.longest_pause ? parseFloat(row.longest_pause) : undefined,
          utmosScore: row.utmos_score ? parseFloat(row.utmos_score) : undefined,
          werScore: row.wer_score ? parseFloat(row.wer_score) : undefined,
        });
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
