"use client";

import { deleteUser, setUserAdmin } from "@/app/actions/manage-users";
import { useState, useMemo } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  admin: boolean;
  createdAt: Date;
}

interface UsersListProps {
  users: User[];
}

export default function UsersList({ users: initialUsers }: UsersListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        u.name.toLowerCase().includes(query)
    );
  }, [users, search]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    setLoading(userId);
    try {
      await deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      alert("Failed to delete user");
    } finally {
      setLoading(null);
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdmin: boolean) => {
    setLoading(userId);
    try {
      await setUserAdmin(userId, !currentAdmin);
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, admin: !currentAdmin } : u
        )
      );
    } catch (error) {
      alert("Failed to update user");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Admin</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Created
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      user.admin
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.admin ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => handleToggleAdmin(user.id, user.admin)}
                    disabled={loading === user.id}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading === user.id
                      ? "..."
                      : user.admin
                        ? "Remove Admin"
                        : "Make Admin"}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={loading === user.id}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  >
                    {loading === user.id ? "..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {search ? "No users found matching your search" : "No users found"}
          </div>
        )}
      </div>
    </div>
  );
}
