import Link from 'next/link';
import db from '@/lib/db';
import { experiment } from '@/lib/model/experiment';
import { eq } from 'drizzle-orm';
import EditableExperimentHeader from '@/components/EditableExperimentHeader';
import DeleteExperimentButton from '@/components/DeleteExperimentButton';
import ClearExperimentDataButton from '@/components/ClearExperimentDataButton';
import UploadCalibrationModal from '@/components/UploadCalibrationModal';
import CalibrationListModal from '@/components/CalibrationListModal';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface ExperimentPageProps {
  params: {
    id: string;
  };
}

export default async function ExperimentPage({ params }: ExperimentPageProps) {
  const result = await requireAdmin();

  if (!result.authenticated) {
    redirect("/user/sign-in");
  }

  if (!result.admin) {
    redirect("/");
  }

  const { id } = await params;
  const experimentId = parseInt(id, 10);

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

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/admin/experiments"
          className="text-blue-500 hover:text-blue-600 mb-6 inline-block"
        >
          ← Back to Experiments
        </Link>

        <EditableExperimentHeader experiment={exp} />

        <div className="flex gap-3 mb-6">
          <DeleteExperimentButton experimentId={experimentId} experimentName={exp.name} />
          <ClearExperimentDataButton experimentId={experimentId} experimentName={exp.name} />
          <UploadCalibrationModal experimentId={experimentId} />
          <CalibrationListModal experimentId={experimentId} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          Statistics
        </div>
      </div>
    </div>
  );
}
