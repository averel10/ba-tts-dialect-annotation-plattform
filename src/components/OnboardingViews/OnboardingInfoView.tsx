'use client';

interface OnboardingInfoViewProps {
  onContinue: () => void;
  hasExistingAnswers: boolean;
}

export default function OnboardingInfoView({
  onContinue,
  hasExistingAnswers,
}: OnboardingInfoViewProps) {
  const handleContinue = () => {
    onContinue();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Willkommen</h1>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Was ist das Ziel?</h2>
            <p className="text-gray-700 mb-4">
              Vielen Dank, dass Sie an diesem Experiment teilnehmen. Bevor Sie mit der Annotation beginnen, möchten wir gerne ein paar grundlegende Informationen über Sie und Ihre Erfahrung mit Dialekten sammeln.
            </p>
            <p className="text-gray-700 mb-4">
              Diese Informationen helfen uns, Ihre Annotationsergebnisse besser zu verstehen und zu bewerten. Alle Angaben werden vertraulich behandelt.
            </p>
          </div>

          {/* Instructions Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Wie funktioniert es?</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <span>Sie beantworten ein kurzes Umfrage-Formular</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <span>Die Antworten werden gespeichert</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <span>Danach geht es zur Kalibrierungsphase</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </span>
                <span>Anschließend können Sie mit der Annotation beginnen</span>
              </li>
            </ol>
          </div>

          {/* Status */}
          {hasExistingAnswers && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <p className="text-green-800 text-sm">
                ✓ Sie haben diesen Teil bereits ausgefüllt. Klicken Sie auf "Weiter", um fortzufahren.
              </p>
            </div>
          )}

          {/* Continue Button */}
          <div className="flex justify-center">
            <button
              onClick={handleContinue}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Weiter zum Formular
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
