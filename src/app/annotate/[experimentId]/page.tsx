import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getAnnotationEntries, getAnnotationProgress } from '@/app/actions/annotations';
import { isCalibrationDone } from '@/app/actions/calibration-scoring';
import { isOnboardingDone } from '@/app/actions/onboarding';
import { getExperimentById } from '@/app/actions/experiment';
import AnnotationPhase from '@/components/AnnotationViews/AnnotationPhase';
import OnboardingPhase from '@/components/OnboardingViews/OnboardingPhase';
import CalibrationPhase from '@/components/CalibrationViews/CalibrationPhase';

interface Props {
  params: Promise<{ experimentId: string}>;
}

export default async function AnnotatePage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const { experimentId: experimentIdStr } = await params;
  const experimentId = parseInt(experimentIdStr, 10);
  
  if (isNaN(experimentId)) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <p className="text-gray-600">Ungültige Experiment-ID.</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Startseite
        </Link>
      </div>
    );
  }

  // Check if onboarding is required and not yet done
  const onboardingDone = await isOnboardingDone(experimentId);
  if (!onboardingDone) {
    return <OnboardingPhase experimentId={experimentId} />;
  }

  // Check if calibration is required and not yet done
  const calibrationDone = await isCalibrationDone(experimentId);
  if (!calibrationDone) {
    return <CalibrationPhase experimentId={experimentId} />;
  }

  const [prototype, entries, { done }] = await Promise.all([
    getExperimentById(experimentId).then(exp => exp?.annotationTool || null),
    getAnnotationEntries(experimentId),
    getAnnotationProgress(experimentId),
  ]);

  if (entries.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-green-600 mb-3">
          Alle Samples bewertet!
        </h1>
        <p className="text-gray-600 mb-8">
          Sie haben alle Samples in diesem Experiment bereits bewertet. Danke für Ihre Mitarbeit!
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Zurück zur Startseite
        </Link>
      </div>
    );
  }

  return (
    <AnnotationPhase
      entries={entries}
      experimentId={experimentId}
      viewType={prototype || ''}
      hasExistingAnswers={done > 0}
    />
  );
}
