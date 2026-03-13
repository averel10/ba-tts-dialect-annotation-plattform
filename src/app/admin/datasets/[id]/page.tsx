import Link from 'next/link';
import db from '@/lib/db';
import { dataset } from '@/lib/model/dataset';
import { eq } from 'drizzle-orm';
import EditableDatasetHeader from '@/components/EditableDatasetHeader';
import DatasetEntriesList from '@/components/DatasetEntriesList';
import UploadDatasetEntriesModal from '@/components/UploadDatasetEntriesModal';
import UpdateDatasetMetadataModal from '@/components/UpdateDatasetMetadataModal';
import RemoveAllEntriesButton from '@/components/RemoveAllEntriesButton';
import DeleteDatasetButton from '@/components/DeleteDatasetButton';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface DatasetPageProps {
  params: {
    id: string;
  };
}

export default async function DatasetPage({ params }: DatasetPageProps) {
  const result = await requireAdmin();

  if (!result.authenticated) {
    redirect("/user/sign-in");
  }

  if (!result.admin) {
    redirect("/");
  }

  const {id} = await params;
  const datasetId = parseInt(id, 10);

  const datasets = await db
    .select()
    .from(dataset)
    .where(eq(dataset.id, datasetId));

  if (datasets.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/admin"
            className="text-blue-500 hover:text-blue-600 mb-6 inline-block"
          >
            ← Back to Admin
          </Link>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Dataset not found</p>
          </div>
        </div>
      </div>
    );
  }

  const ds = datasets[0];

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/admin"
          className="text-blue-500 hover:text-blue-600 mb-6 inline-block"
        >
          ← Back to Admin
        </Link>

        <EditableDatasetHeader dataset={ds} />

        <div className="flex gap-3 mb-6">
          <UploadDatasetEntriesModal datasetId={datasetId} />
          <UpdateDatasetMetadataModal datasetId={datasetId} />
          <RemoveAllEntriesButton datasetId={datasetId} />
          <DeleteDatasetButton datasetId={datasetId} datasetName={ds.name} />
        </div>

        <DatasetEntriesList datasetId={datasetId} />
      </div>
    </div>
  );
}
