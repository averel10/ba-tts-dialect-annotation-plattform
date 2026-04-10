import DatasetsList from "@/components/DatasetsList";
import ExperimentsList from "@/components/ExperimentsList";
import { AdminTokenForm } from "@/components/AdminTokenForm";
import BuildInfo from "@/components/BuildInfo";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
    const result = await requireAdmin();

    if (!result.authenticated) {
        redirect("/");
    }

    if (!result.admin) {
        return <AdminTokenForm userEmail={result.session?.user.email || ""} />;
    }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/datasets"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Manage Datasets
          </Link>
          <Link
            href="/admin/experiments"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Manage Experiments
          </Link>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div>
          <DatasetsList />
        </div>

        <div>
          <ExperimentsList />
        </div>
      </div>
    </div>
  );
}
