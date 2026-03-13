import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { auth } from '@/lib/auth';

const PROTOTYPES = [
  {
    id: 'single-choice',
    name: 'Single Choice',
    description: 'Bewerten Sie jedes Sample auf einer Skala von 1–5.',
  },
];

interface Props {
  params: Promise<{ datasetId: string }>;
}

export default async function PrototypeSelectionPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/user/sign-in');

  const { datasetId } = await params;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← Zurück zur Startseite
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Prototyp auswählen</h1>
      <p className="text-gray-500 mb-8">
        Wählen Sie einen Annotationsprototyp aus, um mit der Bewertung zu beginnen.
      </p>

      <div className="flex flex-col gap-4">
        {PROTOTYPES.map((proto) => (
          <Link
            key={proto.id}
            href={`/annotate/${datasetId}/${proto.id}`}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">{proto.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{proto.description}</p>
              </div>
              <span className="text-gray-400 text-lg">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
