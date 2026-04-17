'use client';

import { useEffect } from 'react';

interface CalibrationInfoViewProps {
  onContinue: () => void;
  hasExistingAnswers: boolean;
}

export default function CalibrationInfoView({
  onContinue,
  hasExistingAnswers,
}: CalibrationInfoViewProps) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const handleContinue = () => {
    onContinue();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-[700px] w-full">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 mt-4">Kalibrierungsphase</h1>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Was ist die Kalibrierungsphase?</h2>
            <p className="text-gray-700">
              In der Kalibrierungsphase hörst du echte Dialektaufnahmen und gibst an, welchen Dialekt du erkennst und wie sicher du dir dabei bist. So können wir deine Dialektkenntnisse besser einschätzen und deine späteren Bewertungen entsprechend gewichten.
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
                <span>Du hörst eine Audioaufnahme.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <span>Du wählst den Dialekt aus, den du gehört hast.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <span>Du gibst an, wie sicher du dir bei deiner Wahl bist.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </span>
                <span>Dies wiederholst du für alle Aufnahmen.</span>
              </li>
            </ol>
          </div>

          
          {/* Participation Section */}
          <div className="mb-8">
            <p className="text-gray-700 mb-4">
              Die Kalibrierung umfasst 28 Aufnahmen und dauert etwa 5–10 Minuten.
            </p>
          </div>

          {/* Hints Section */}
          <div className="mb-12">
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>Diese Aufnahmen gehören nicht zur eigentlichen Bewertung.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>Du kannst die Kalibrierung jederzeit unterbrechen und später dort weitermachen, wo du aufgehört hast.</span>
              </li>
            </ul>
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
