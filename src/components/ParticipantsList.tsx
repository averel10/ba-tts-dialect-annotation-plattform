'use client';

import Link from 'next/link';
import { ParticipantListItem } from '@/app/actions/participants';

interface ParticipantsListProps {
  experimentId: number;
  participants: ParticipantListItem[];
}

export default function ParticipantsList({ experimentId, participants }: ParticipantsListProps) {
  if (participants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No participants yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Onboarding</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Calibration</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Annotations</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {participants.map((participant) => (
              <tr key={participant.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{participant.userId}</td>
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
    </div>
  );
}
