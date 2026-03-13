import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getAnnotationEntries } from '@/app/actions/annotations';
import SingleChoiceView from '@/components/AnnotationViews/SingleChoiceView';

interface Props {
  params: Promise<{ datasetId: string; prototype: string }>;
}

export default async function AnnotatePage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/user/sign-in');

  const { datasetId: datasetIdStr, prototype } = await params;
  const datasetId = parseInt(datasetIdStr, 10);

  if (isNaN(datasetId)) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <p className="text-gray-600">Ungültige Dataset-ID.</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Startseite
        </Link>
      </div>
    );
  }

  if (prototype !== 'single-choice') {
    notFound();
  }

  const entries = await getAnnotationEntries(datasetId);

  if (entries.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-green-600 mb-3">
          Alle Samples bewertet!
        </h1>
        <p className="text-gray-600 mb-8">
          Sie haben alle Samples in diesem Dataset bereits bewertet. Danke für Ihre Mitarbeit!
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

  return <SingleChoiceView entries={entries} datasetId={datasetId} />;
}
