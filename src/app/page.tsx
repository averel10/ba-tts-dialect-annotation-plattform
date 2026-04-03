import Link from 'next/link';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getAllExperiments, getAnnotationProgress } from '@/app/actions/annotations';

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Willkommen zur Dialektannotation
        </h1>
        <p className="text-gray-600 mb-8">
          Bitte melden Sie sich an, um mit der Annotation zu beginnen.
        </p>
        <Link
          href="/user/sign-in"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Anmelden
        </Link>
      </div>
    );
  }

  const experiments = await getAllExperiments();

  if (experiments.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Keine Experimente verfügbar
        </h1>
        <p className="text-gray-500">
          Es wurden noch keine Experimente freigeschalten. Wenden Sie sich an einen Administrator.
        </p>
      </div>
    );
  }

  // Fetch progress for all experiments in parallel
  const progressData = await Promise.all(
    experiments.map((exp) => getAnnotationProgress(exp.id))
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2 mt-4">Experimente</h1>
      <p className="text-gray-500 mb-8">
        Wählen Sie ein Experiment aus, um mit der Annotation zu beginnen oder fortzufahren.
      </p>

      <div className="flex flex-col gap-4">
        {experiments.map((exp, i) => {
          const { total, done } = progressData[i];
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const isFinished = total > 0 && done >= total;

          return (
            <div
              key={exp.id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-800 truncate">{exp.name}</h2>
                  {exp.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{exp.description}</p>
                  )}

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{done} / {total} annotiert</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isFinished ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Link
                  href={`/annotate/${exp.id}`}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isFinished
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : done > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isFinished ? '✓ Fertig' : done > 0 ? 'Fortsetzen' : 'Starten'}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
