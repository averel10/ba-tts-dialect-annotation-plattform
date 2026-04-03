import Link from 'next/link';
import db from '@/lib/db';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { eq } from 'drizzle-orm';
import WaveformPlayer from '@/components/WaveformPlayer';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface DatasetEntryPageProps {
  params: {
    id: string;
    entryId: string;
  };
}

export default async function DatasetEntryPage({ params }: DatasetEntryPageProps) {
  const result = await requireAdmin();

  if (!result.authenticated) {
    redirect("/user/sign-in");
  }

  if (!result.admin) {
    redirect("/");
  }

  const { id: datasetId, entryId } = await params;
  const datasetIdNum = parseInt(datasetId, 10);
  const entryIdNum = parseInt(entryId, 10);

  const entries = await db
    .select()
    .from(dataset_entry)
    .where(eq(dataset_entry.id, entryIdNum));

  if (entries.length === 0 || entries[0].datasetId !== datasetIdNum) {
    return (
      <div className="min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href={`/admin/datasets/${datasetId}`}
            className="text-blue-500 hover:text-blue-600 mb-6 inline-block"
          >
            ← Back to Dataset
          </Link>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Dataset entry not found</p>
          </div>
        </div>
      </div>
    );
  }

  const entry = entries[0];

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/admin/datasets/${datasetId}`}
          className="text-blue-500 hover:text-blue-600 mb-6 inline-block"
        >
          ← Back to Dataset
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6">Dataset Entry Details</h1>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Entry ID</p>
              <p className="text-lg font-semibold">{entry.id}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">External ID</p>
              <p className="text-lg font-semibold">{entry.externalId}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Speaker ID</p>
              <p className="text-lg font-semibold">{entry.speakerId}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Model Name</p>
              <p className="text-lg font-semibold">{entry.modelName}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Utterance ID</p>
              <p className="text-lg font-semibold">{entry.utteranceId || '-'}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Dialect</p>
              <p className="text-lg font-semibold">{entry.dialect}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Iteration</p>
              <p className="text-lg font-semibold">{entry.iteration}</p>
            </div>

            <div className="col-span-2 bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">File Name</p>
              <p className="text-lg font-semibold break-all">{entry.fileName}</p>
            </div>

            <div className="col-span-2 bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Utterance Text</p>
              <p className="text-lg font-semibold break-words">{entry.utteranceText || '-'}</p>
            </div>

            <div className="col-span-2 bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Audio Player</p>
              {(() => {
                const fileExtension = entry.fileName.substring(entry.fileName.lastIndexOf('.'));
                const src = `/public/datasets/${datasetIdNum}/${entry.externalId}${fileExtension}`;
                return <WaveformPlayer src={src} showWaveform={false} />;
              })()}
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Duration (ms)</p>
              <p className="text-lg font-semibold">{entry.durationMs?.toLocaleString() || '-'}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">RMS Value</p>
              <p className="text-lg font-semibold">{entry.rmsValue?.toFixed(3) || '-'}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Longest Pause (s)</p>
              <p className="text-lg font-semibold">{entry.longestPause?.toFixed(3) || '-'}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">UTMOS Score</p>
              <p className="text-lg font-semibold">{entry.utmosScore?.toFixed(3) || '-'}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">WER Score</p>
              <p className="text-lg font-semibold">{entry.werScore?.toFixed(3) || '-'}</p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Created</p>
              <p className="text-lg font-semibold">
                {new Date(entry.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Last Updated</p>
              <p className="text-lg font-semibold">
                {new Date(entry.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
