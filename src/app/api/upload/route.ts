import { writeFile, mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import extract from 'extract-zip';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

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

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'File must be a ZIP archive' },
        { status: 400 }
      );
    }

    const tempDir = join(process.cwd(), 'tmp', `upload-${Date.now()}`);

    try {
      // Create temp directory
      await mkdir(tempDir, { recursive: true });

      // Save uploaded file to temp location
      const tempZipPath = join(tempDir, file.name);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(tempZipPath, buffer);

      // Extract ZIP file
      await extract(tempZipPath, { dir: tempDir });

      // Read and validate metadata.csv
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

      // Parse and count rows
      let validRowCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          validRowCount++;
        }
      }

      if (validRowCount === 0) {
        throw new Error('No valid entries found in metadata.csv');
      }

      return NextResponse.json({
        success: true,
        tempDir,
        metadataCount: validRowCount,
        message: `Successfully extracted ${validRowCount} entries. Ready for processing.`,
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
    console.error('Error uploading dataset ZIP:', error);
    const errorMsg =
      error instanceof Error ? error.message : 'Failed to upload dataset ZIP';
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
