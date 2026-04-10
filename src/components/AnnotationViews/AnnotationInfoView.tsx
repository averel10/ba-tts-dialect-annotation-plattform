'use client';

import { useEffect } from 'react';

interface AnnotationInfoViewProps {
  onContinue: () => void;
  hasExistingAnswers: boolean;
}

export default function AnnotationInfoView({
  onContinue,
  hasExistingAnswers,
}: AnnotationInfoViewProps) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-[700px] w-full">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 mt-4">Bewertungsphase</h1>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Was ist deine Aufgabe?</h2>
            <p className="text-gray-700 mb-4">
              Du hörst kurze Audioaufnahmen, die von einem KI-Modell generiert wurden. Pro Aufnahme bewertest du zwei Dinge:
            </p>
            <div className="space-y-3 text-gray-700 mb-8">
              <div>
                <p className="font-semibold mb-1">Authentizität</p>
                <p>Klingt es so, wie jemand aus dieser Region wirklich sprechen würde, mit der typischen Ausdrucksweise dieser Region? Oder klingt es eher wie eine Imitation?</p>
              </div>
              <div>
                <p className="font-semibold mb-1 mt-4">Sicherheit</p>
                <p>Wie sicher bist du dir bei deiner Einschätzung?</p>
              </div>
            </div>
            <div className="border-t border-blue-200 pt-4 text-gray-700">
              <p className="font-semibold mb-1 mt-1">Keine Trickfragen</p>
              <p>Jede Aufnahme wurde tatsächlich im angegebenen Dialekt generiert.</p>
            </div>
          </div>

          {/* Instructions Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Wie funktioniert es?</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <span>Du hörst eine synthetische Audioaufnahme</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <span>Du bewertest, wie authentisch die Aufnahme nach dem angegebenen Dialekt klingt</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <span>Du gibst an, wie sicher du dir bei deiner Wahl bist</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  4
                </span>
                <span>Dies wiederholst du für weitere Aufnahmen</span>
              </li>
            </ol>
          </div>

          {/* Hints Section */}
          <div className="mb-12">
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>Die Aufnahmen sind aufgrund deiner Kalibrierungsergebnisse sortiert – du siehst zuerst Dialekte, die du gut erkennst. Du kannst aber jederzeit vor- und zurückspringen.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0">•</span>
                <span>Du kannst die Bewertung jederzeit unterbrechen und später dort weitermachen, wo du aufgehört hast.</span>
              </li>
            </ul>
          </div>

          {/* Status */}
          {hasExistingAnswers && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <p className="text-green-800 text-sm">
                ✓ Du hast diese Einführung bereits gesehen. Du kannst direkt mit der Bewertung weitermachen.
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={onContinue}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              {hasExistingAnswers ? 'Bewertung fortsetzen' : 'Bewertung starten'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
