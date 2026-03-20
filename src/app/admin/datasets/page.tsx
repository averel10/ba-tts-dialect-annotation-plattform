import Link from 'next/link';
import DatasetsList from '@/components/DatasetsList';
import CreateDatasetModal from '@/components/CreateDatasetModal';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DatasetsAdminPage() {
  const result = await requireAdmin();

  if (!result.authenticated) {
    redirect("/user/sign-in");
  }

  if (!result.admin) {
    redirect("/");
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/admin"
        className="text-blue-500 hover:text-blue-600 mb-6 inline-block"
      >
        ← Back to Admin
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Datasets Management</h1>
        <p className="text-gray-600">Manage all datasets</p>
      </div>

      <CreateDatasetModal />

      <DatasetsList />
    </div>
  );
}
