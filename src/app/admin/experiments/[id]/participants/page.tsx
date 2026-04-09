import Link from 'next/link';
import { getParticipantsList } from '@/app/actions/participants';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { experiment } from '@/lib/model/experiment';
import { eq } from 'drizzle-orm';
import ParticipantsList from '@/components/ParticipantsList';

interface ParticipantsPageProps {
  params: {
    id: string;
  };
}

export default async function ParticipantsPage({ params }: ParticipantsPageProps) {
  const result = await requireAdmin();

  if (!result.authenticated) {
    redirect("/user/sign-in");
  }

  if (!result.admin) {
    redirect("/");
  }

  const { id } = await params;
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

  // Get participants
  const participants = await getParticipantsList(experimentId);

  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href={`/admin/experiments/${experimentId}`}
              className="text-blue-500 hover:text-blue-600 mb-4 inline-block"
            >
              ← Back to Experiment
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Participants</h1>
            <p className="text-gray-600 mt-1">{exp.name}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{participants.length}</div>
            <div className="text-sm text-gray-600">Total Participants</div>
          </div>
        </div>

        <ParticipantsList experimentId={experimentId} participants={participants} />
      </div>
    </div>
  );
}
