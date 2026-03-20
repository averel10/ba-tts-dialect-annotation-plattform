import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getAnnotationEntries } from '@/app/actions/annotations';
import { getExperimentById } from '@/app/actions/experiment';
import AnnotationPageView from '@/components/AnnotationViews/AnnotationPageView';

interface Props {
  params: Promise<{ experimentId: string}>;
}

export default async function AnnotatePage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/user/sign-in');

  const { experimentId: experimentIdStr } = await params;
  const experimentId = parseInt(experimentIdStr, 10);
  const prototype = await getExperimentById(experimentId).then(exp => exp?.annotationTool || null);

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


  const entries = await getAnnotationEntries(experimentId);

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
    <AnnotationPageView 
      entries={entries} 
      experimentId={experimentId} 
      viewType={prototype || ''} 
    />
  );
}
