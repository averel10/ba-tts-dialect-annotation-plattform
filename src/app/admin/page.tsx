import AuthRedirect from "@/components/AuthRedirect";

export default function AdminPage() {

  return (
    <div>
        <AuthRedirect />
        <h1>Admin Dashboard</h1>
        <p>Welcome to the admin dashboard. Here you can manage the application.</p>
    </div>
  );
}
