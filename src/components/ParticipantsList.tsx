'use client';

import Link from 'next/link';
import { ParticipantListItem } from '@/app/actions/participants';
import { useState, useMemo } from 'react';

interface ParticipantsListProps {
  experimentId: number;
  participants: ParticipantListItem[];
}

type SortField = 'userId' | 'email' | 'createdAt' | 'annotationCount';
type SortOrder = 'asc' | 'desc';

export default function ParticipantsList({ experimentId, participants }: ParticipantsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return ' ↑↓';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const filteredAndSortedParticipants = useMemo(() => {
    let filtered = participants.filter((p) => {
      const query = searchQuery.toLowerCase();
      return (
        p.userId.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query)
      );
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [participants, searchQuery, sortField, sortOrder]);

  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No participants yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search by User ID or Email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('userId')}>
                  User ID{getSortIndicator('userId')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}>
                  Email{getSortIndicator('email')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Onboarding</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Calibration</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('annotationCount')}>
                  Annotations{getSortIndicator('annotationCount')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}>
                  Joined{getSortIndicator('createdAt')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedParticipants.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{participant.userId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{participant.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        participant.completedOnboarding
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {participant.completedOnboarding ? '✓ Done' : '○ Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        participant.completedCalibration
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {participant.completedCalibration ? '✓ Done' : '○ Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {participant.annotationCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(participant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/experiments/${experimentId}/participants/${participant.userId}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSortedParticipants.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-600">
            No participants match your search
          </div>
        )}
      </div>
    </div>
  );
}
