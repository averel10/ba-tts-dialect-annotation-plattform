import Link from "next/link";
import UsersList from "@/components/UsersList";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/app/actions/manage-users";

export default async function UsersPage() {
  const result = await requireAdmin();

  if (!result.authenticated) {
    redirect("/user/sign-in");
  }

  if (!result.admin) {
    redirect("/");
  }

  const users = await getAllUsers();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-blue-500 hover:text-blue-600 mb-4 inline-block"
        >
          ← Back to Admin
        </Link>
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <UsersList users={users} />
        </div>
      </div>
    </div>
  );
}
