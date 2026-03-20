'use server';

import { readdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';
import { requireAdmin } from '@/lib/auth';

interface DownloadFile {
  name: string;
  url: string;
  size: number;
}

export async function getAvailableDownloads(datasetId: number): Promise<DownloadFile[]> {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    const downloadsDir = join(process.cwd(), 'public', 'downloads');
    const files = readdirSync(downloadsDir);
    
    const pattern = new RegExp(`^dataset-${datasetId}-export-`);
    const matching = files.filter(file => pattern.test(file) && file.endsWith('.zip'));
    
    // Sort by timestamp descending (most recent first)
    matching.sort().reverse();
    
    return matching.map(file => {
      const filePath = join(downloadsDir, file);
      const stats = statSync(filePath);
      return {
        name: file,
        url: `/public/downloads/${file}`,
        size: stats.size
      };
    });
  } catch (error) {
    console.error('Error fetching available downloads:', error);
    throw new Error('Failed to fetch available downloads');
  }
}

export async function deleteDownload(fileName: string): Promise<void> {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Validate filename to prevent directory traversal attacks
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      throw new Error('Invalid filename');
    }

    const downloadsDir = join(process.cwd(), 'public', 'downloads');
    const filePath = join(downloadsDir, fileName);
    
    // Ensure the file is within the downloads directory
    if (!filePath.startsWith(downloadsDir)) {
      throw new Error('Invalid file path');
    }

    unlinkSync(filePath);
  } catch (error) {
    console.error('Error deleting download:', error);
    throw new Error('Failed to delete download');
  }
}
