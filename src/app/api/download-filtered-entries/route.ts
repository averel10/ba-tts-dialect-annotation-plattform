import { NextRequest, NextResponse } from 'next/server';
import { downloadFilteredEntries } from '@/app/actions/download-filtered-entries';
import JSZip from 'jszip';
import { join } from 'path';
import { readFile, existsSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs';
import { promisify } from 'util';
import { requireAdmin } from '@/lib/auth';

const readFileAsync = promisify(readFile);

// Clean up old ZIP files older than 24 hours
async function cleanupOldZips(downloadsDir: string, maxAgeHours: number = 24) {
  try {
    if (!existsSync(downloadsDir)) {
      return;
    }

    const files = readdirSync(downloadsDir);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    for (const file of files) {
      if (!file.startsWith('dataset-') || !file.endsWith('.zip')) {
        continue;
      }

      const filePath = join(downloadsDir, file);
      try {
        const stats = statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > maxAgeMs) {
          unlinkSync(filePath);
          console.log(`Cleaned up old ZIP file: ${file} (age: ${(fileAge / (60 * 60 * 1000)).toFixed(1)} hours)`);
        }
      } catch (error) {
        console.error(`Error cleaning up file ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

interface FilterParams {
  speakerId?: string;
  modelName?: string;
  dialect?: string;
  iteration?: number;
  utteranceId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const resultAdmin = await requireAdmin();
    if (!resultAdmin.authenticated || !resultAdmin.admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { datasetId, filters } = body;

    if (!datasetId) {
      return NextResponse.json(
        { error: 'datasetId is required' },
        { status: 400 }
      );
    }

    // Get filtered entries data from server action
    const result = await downloadFilteredEntries(datasetId, filters || {});

    // Create ZIP on server
    const zip = new JSZip();

    // Add CSV file
    zip.file('metadata.csv', result.csvContent);

    // Add metadata JSON
    zip.file('filter-metadata.json', result.metadataContent);

    // Add audio files to 'audio' folder
    if (result.entries && result.entries.length > 0) {
      const audioFolder = zip.folder('wavs');
      if (audioFolder) {
        let filesAdded = 0;
        for (const entry of result.entries) {
          try {
            const fileExtension = entry.fileName.substring(entry.fileName.lastIndexOf('.'));
            const audioPath = join(
              process.cwd(),
              'public',
              'datasets',
              datasetId.toString(),
              `${entry.id}${fileExtension}`
            );

            if (existsSync(audioPath)) {
              const fileBuffer = await readFileAsync(audioPath);
              zip.file(entry.fileName, fileBuffer);
              filesAdded++;
            } else {
              console.warn(`Audio file not found: ${audioPath}`);
            }
          } catch (error) {
            console.error(`Failed to add audio file for entry ${entry.id}:`, error);
            // Continue with other files
          }
        }
        console.log(`Added ${filesAdded}/${result.entries.length} audio files to ZIP`);
      }
    } else {
      console.warn('No entries to add audio files for');
    }

    // Generate ZIP blob
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Save ZIP to public folder
    const downloadsDir = join(process.cwd(), 'public', 'downloads');
    
    // Ensure downloads directory exists
    try {
      mkdirSync(downloadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating downloads directory:', error);
    }

    // Create filename with timestamp for uniqueness
    const timestamp = Date.now();
    const fileName = `dataset-${datasetId}-export-${new Date().toISOString().split('T')[0]}-${timestamp}.zip`;
    const filePath = join(downloadsDir, fileName);

    // Write ZIP file to disk
    writeFileSync(filePath, zipBuffer);
    console.log(`ZIP file saved to: ${filePath}`);

    // Clean up old ZIP files in the background
    cleanupOldZips(downloadsDir).catch(error => {
      console.error('Cleanup failed:', error);
    });

    // Return download URL
    const downloadUrl = `/downloads/${fileName}`;
    
    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName,
    });
  } catch (error) {
    console.error('Error creating ZIP:', error);
    return NextResponse.json(
      { error: 'Failed to create ZIP file' },
      { status: 500 }
    );
  }
}
