import DatasetsList from "@/components/DatasetsList";
import CreateDatasetModal from "@/components/CreateDatasetModal";
import { AdminTokenForm } from "@/components/AdminTokenForm";
import BuildInfo from "@/components/BuildInfo";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
    const result = await requireAdmin();

    if (!result.authenticated) {
        redirect("/user/sign-in");
    }

    if (!result.admin) {
        return <AdminTokenForm userEmail={result.session?.user.email || ""} />;
    }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
        <div className="flex gap-4">
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Manage Users
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <BuildInfo />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Datasets</h2>
        <CreateDatasetModal />
        <DatasetsList />
      </div>
    </div>
  );
}
