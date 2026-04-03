import Link from 'next/link';
import { getParticipantDetail } from '@/app/actions/participants';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { experiment } from '@/lib/model/experiment';
import { eq } from 'drizzle-orm';
import ParticipantDetailView from '@/components/ParticipantDetailView';

interface ParticipantDetailPageProps {
  params: {
    id: string;
    userId: string;
  };
}

export default async function ParticipantPage({ params }: ParticipantDetailPageProps) {
  const result = await requireAdmin();

  if (!result.authenticated) {
    redirect("/user/sign-in");
  }

  if (!result.admin) {
    redirect("/");
  }

  const { id, userId } = await params;
  const experimentId = parseInt(id, 10);

  // Verify experiment exists
  const experiments = await db
    .select()
    .from(experiment)
    .where(eq(experiment.id, experimentId));

  if (experiments.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/admin/experiments"
            className="text-blue-500 hover:text-blue-600 mb-6 inline-block"
          >
            ← Back to Experiments
          </Link>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Experiment not found</p>
          </div>
        </div>
      </div>
    );
  }

  const exp = experiments[0];

  // Get participant details
  let participant;
  try {
    participant = await getParticipantDetail(experimentId, userId);
  } catch (error) {
    return (
      <div className="min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href={`/admin/experiments/${experimentId}/participants`}
            className="text-blue-500 hover:text-blue-600 mb-6 inline-block"
          >
            ← Back to Participants
          </Link>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Participant not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/admin/experiments/${experimentId}/participants`}
            className="text-blue-500 hover:text-blue-600 mb-4 inline-block"
          >
            ← Back to Participants
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{exp.name}</p>
              <h1 className="text-3xl font-bold text-gray-900">Participant Data</h1>
            </div>
          </div>
        </div>

        <ParticipantDetailView participant={participant} experimentId={experimentId} />
      </div>
    </div>
  );
}
