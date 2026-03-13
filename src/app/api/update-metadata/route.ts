import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if (!result.authenticated || !result.admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const datasetId = formData.get('datasetId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV file' },
        { status: 400 }
      );
    }

    const tempDir = join(process.cwd(), 'tmp', `update-metadata-${Date.now()}`);

    try {
      // Create temp directory
      await mkdir(tempDir, { recursive: true });

      // Save uploaded CSV file as metadata.csv
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const metadataPath = join(tempDir, 'metadata.csv');
      await writeFile(metadataPath, buffer);

      return NextResponse.json({
        success: true,
        tempDir,
        message: `Successfully uploaded metadata.csv. Ready for processing.`,
      });
    } catch (error) {
      // Clean up on error
      try {
        if (existsSync(tempDir)) {
          await rm(tempDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp directory:', cleanupError);
      }

      throw error;
    }
  } catch (error) {
    console.error('Error uploading metadata CSV:', error);
    const errorMsg =
      error instanceof Error ? error.message : 'Failed to upload metadata CSV';
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

