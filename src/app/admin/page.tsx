import DatasetsList from "@/components/DatasetsList";
import CreateDatasetModal from "@/components/CreateDatasetModal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if(!session) {
        redirect("/user/sign-in")
    }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateDatasetModal />
        <DatasetsList />
    </div>
  );
}
