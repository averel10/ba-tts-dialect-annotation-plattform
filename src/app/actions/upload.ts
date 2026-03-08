'use server';

import db from '@/lib/db';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir, readFile, rm, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import extract from 'extract-zip';
import { line } from 'drizzle-orm/pg-core';

interface DatasetEntryInput {
  id: string;
  audio_file: string;
  duration_ms: string;
  speaker: string;
  model: string;
  dialect: string;
  iteration: string;
}

export async function uploadDatasetEntries(
  datasetId: number,
  formData: FormData
) {
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No file provided');
  }

  if (!file.name.endsWith('.zip')) {
    throw new Error('File must be a ZIP archive');
  }

  const tempDir = join(process.cwd(), 'tmp', `upload-${Date.now()}`);
  const datasetDir = join(process.cwd(), 'public', 'datasets', datasetId.toString());

  try {
    // Create temp directory
    await mkdir(tempDir, { recursive: true });

    // Save uploaded file to temp location
    const tempZipPath = join(tempDir, file.name);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(tempZipPath, buffer);

    // Extract ZIP file
    await extract( tempZipPath, { dir: tempDir } );

    // Read metadata.csv
    const metadataPath = join(tempDir, 'metadata.csv');
    if (!existsSync(metadataPath)) {
      throw new Error('metadata.csv not found in ZIP');
    }

    const metadataContent = await readFile(metadataPath, 'utf-8');
    const lines = metadataContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('metadata.csv is empty or invalid');
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim());

    // Create dataset directory
    await mkdir(datasetDir, { recursive: true });

    // Parse and insert entries
    const entries: typeof dataset_entry.$inferInsert[] = [];

    // CSV parser that handles quoted fields
    const parseCSVLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++;
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // Field separator
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      // Add the last field
      values.push(current.trim());
      return values;
    };

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      if (values.length !== headers.length) {
        continue; // Skip malformed lines
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      })

      const audioFile = row.audio_file as string;
      // Try different path separators and remove /output prefix
      const relativePath = audioFile.replace(/\\/g, '/')
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
          fileName: relativePath,
          dialect: row.dialect,
          iteration: parseInt(row.iteration, 10),
        });
      }
    }

    if (entries.length === 0) {
      throw new Error('No valid entries found in metadata.csv');
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
      throw new Error('All entries already exist in the dataset');
    }

    // Insert new entries into database
    await db.insert(dataset_entry).values(newEntries);

    revalidatePath(`/admin/datasets/${datasetId}`);

    return {
      success: true,
      entriesCreated: entries.length,
    };
  } catch (error) {
    console.error('Error uploading dataset entries:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to upload dataset entries'
    );
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
