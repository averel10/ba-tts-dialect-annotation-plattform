'use client';

interface CalibrationInfoViewProps {
  onContinue: () => void;
  hasExistingAnswers: boolean;
}

export default function CalibrationInfoView({
  onContinue,
  hasExistingAnswers,
}: CalibrationInfoViewProps) {
  const handleContinue = () => {
    onContinue();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-12 mt-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kalibrierungsphase</h1>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Was ist die Kalibrierungsphase?</h2>
            <p className="text-gray-700 mb-4">
              Die Kalibrierungsphase dient dazu, Ihre individuellen Stärken und Schwächen bei der Dialekterkennung zu verstehen. Sie hören verschiedene Audiosamples und geben an, welchen Dialekt Sie hören und wie sicher Sie sich dabei sind.
            </p>
            <p className="text-gray-700 mb-4">
              Dies hilft uns, Ihre Annotationsergebnisse später besser zu bewerten und zu
              verstehen. Die Annotationen werden auf Basis Ihrer Kalibrierungsergebnisse gewichtet, sodass Ihre Stärken stärker berücksichtigt werden.
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
                <span>Sie hören ein Audiosample</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <span>Sie wählen den Dialekt aus, den Sie gehört haben</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <span>Sie bewerten Ihr Vertrauen in die Identifikation (von 1-5)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </span>
                <span>Sie wiederholen dies für alle Audiosamples</span>
              </li>
            </ol>
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
            <h4 className="font-semibold text-amber-900 mb-2">ℹ️ Wichtig</h4>
            <p className="text-amber-800 text-sm">
              Sie können diese Seite jederzeit verlassen und später zurückkehren, um Ihre
              Kalibrierung fortzusetzen. Ihre Antworten werden automatisch gespeichert.
            </p>
          </div>

          {/* Status */}
          {hasExistingAnswers && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <p className="text-green-800 text-sm">
                ✓ Sie haben diese Einführung bereits gesehen. Sie können Ihre Kalibrierung
                fortsetzen.
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={handleContinue}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              {hasExistingAnswers ? 'Kalibrierung fortsetzen' : 'Kalibrierung starten'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
