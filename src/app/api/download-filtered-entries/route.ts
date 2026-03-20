import { NextRequest, NextResponse } from 'next/server';
import { downloadFilteredEntries } from '@/app/actions/download-filtered-entries';
import archiver from 'archiver';
import { join } from 'path';
import { existsSync, mkdirSync, readdirSync, unlinkSync, statSync, createWriteStream } from 'fs';
import { requireAdmin } from '@/lib/auth';

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

    // Create filename with timestamp for uniqueness
    const timestamp = Date.now();
    const fileName = `dataset-${datasetId}-export-${new Date().toISOString().split('T')[0]}-${timestamp}.zip`;
    
    const downloadsDir = join(process.cwd(), 'public', 'downloads');
    
    // Ensure downloads directory exists
    try {
      mkdirSync(downloadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating downloads directory:', error);
    }

    const filePath = join(downloadsDir, fileName);

    // Create ZIP archive with streaming to disk
    const output = createWriteStream(filePath);
    const zip = archiver('zip', { zlib: { level: 9 } });

    // Pipe archive to file
    zip.pipe(output);

    // Add CSV file
    zip.append(result.csvContent, { name: 'metadata.csv' });

    // Add metadata JSON
    zip.append(result.metadataContent, { name: 'filter-metadata.json' });

    // Add audio files to 'wavs' folder
    if (result.entries && result.entries.length > 0) {
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
            zip.file(audioPath, { name: `wavs/${entry.fileName}` });
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
    } else {
      console.warn('No entries to add audio files for');
    }

    // Finalize and wait for the archive to finish writing to disk
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => {
        console.log(`ZIP file saved to: ${filePath}`);
        resolve();
      });
      zip.on('error', (error: Error) => {
        console.error('Archive error:', error);
        reject(error);
      });
      output.on('error', (error: Error) => {
        console.error('Output stream error:', error);
        reject(error);
      });
      zip.finalize();
    });

    // Clean up old ZIP files in the background
    cleanupOldZips(downloadsDir).catch(error => {
      console.error('Cleanup failed:', error);
    });

    // Return download URL
    const downloadUrl = `/public/downloads/${fileName}`;
    
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
