'use server';

import db from '@/lib/db';
import { dataset_utterance } from '@/lib/model/utterance';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function uploadDatasetUtterances(
  datasetId: number,
  formData: FormData
) {
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No file provided');
  }

  if (!file.name.endsWith('.csv')) {
    throw new Error('File must be a CSV file');
  }

  try {
    const csvContent = await file.text();
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV is empty or invalid');
    }

    // Parse CSV header
    const headers = lines[0].split(',').map((h) => h.trim());

    if (!headers.includes('id') || !headers.includes('text')) {
      throw new Error('CSV must have "id" and "text" columns');
    }

    // Get indices of id and text columns
    const idIndex = headers.indexOf('id');
    const textIndex = headers.indexOf('text');

    // Parse utterances
    const utterances: typeof dataset_utterance.$inferInsert[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Handle CSV parsing with quotes
      const line = lines[i];
      const parts: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = line[j + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            j++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());

      if (parts.length > Math.max(idIndex, textIndex)) {
        const id = parts[idIndex]?.trim();
        const text = parts[textIndex]?.trim();

        if (id && text) {
          utterances.push({
            datasetId,
            id,
            text,
          });
        }
      }
    }

    if (utterances.length === 0) {
      throw new Error('No valid utterances found in CSV');
    }

    // Check for existing utterances to avoid duplicates
    const existingUtterances = await db
      .select({ id: dataset_utterance.id })
      .from(dataset_utterance)
      .where(eq(dataset_utterance.datasetId, datasetId));

    const existingIds = new Set(existingUtterances.map((u) => u.id));

    // Filter out duplicates
    const newUtterances = utterances.filter((u) => !existingIds.has(u.id));

    if (newUtterances.length === 0) {
      throw new Error('All utterances already exist in the dataset');
    }

    // Insert new utterances into database
    await db.insert(dataset_utterance).values(newUtterances);

    revalidatePath(`/admin/datasets/${datasetId}`);

    return {
      success: true,
      utterancesCreated: newUtterances.length,
    };
  } catch (error) {
    console.error('Error uploading utterances:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to upload utterances'
    );
  }
}
