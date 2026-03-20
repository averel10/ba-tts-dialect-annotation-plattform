import { NextRequest, NextResponse } from 'next/server';
import { downloadFilteredEntries } from '@/app/actions/download-filtered-entries';
import { requireAdmin } from '@/lib/auth';

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

    const fileName = `dataset-${datasetId}-metadata-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(result.csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': Buffer.byteLength(result.csvContent).toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading CSV:', error);
    return NextResponse.json(
      { error: 'Failed to download CSV file' },
      { status: 500 }
    );
  }
}
