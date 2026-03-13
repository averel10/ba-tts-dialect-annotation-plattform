import { NextRequest, NextResponse } from 'next/server';
import { downloadFilteredEntries } from '@/app/actions/download-filtered-entries';
import JSZip from 'jszip';
import { join } from 'path';
import { readFile, existsSync } from 'fs';
import { promisify } from 'util';
import { requireAdmin } from '@/lib/auth';

const readFileAsync = promisify(readFile);

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
              // Use the original fileName from CSV, removing 'wavs_' prefix if present
              const cleanFileName = entry.fileName.replace(/^wavs_/, '');
              audioFolder.file(cleanFileName, fileBuffer);
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

    // Create response with ZIP file
    const fileName = `dataset-${datasetId}-export-${new Date().toISOString().split('T')[0]}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating ZIP:', error);
    return NextResponse.json(
      { error: 'Failed to create ZIP file' },
      { status: 500 }
    );
  }
}
