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
        <div className="max-w-[700px] w-full">
          {/* Header */}
          <div className="text-center mb-8 mt-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Willkommen und vielen Dank für deine Teilnahme!</h1>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Worum geht es?</h2>
            <p className="text-gray-700 mb-4">
              Im Rahmen unserer Bachelorarbeit an der ZHAW untersuchen wir, wie authentisch ein KI-Modell schweizerdeutsche Dialekte synthetisieren kann. Dazu sind wir auf deine Einschätzung angewiesen.
            </p>
            <p className="text-gray-700">
              Deine Aufgabe ist es, kurze Audioaufnahmen anzuhören und zu bewerten, wie überzeugend sie nach einem bestimmten Dialekt klingen. Es gibt dabei keine richtigen oder falschen Antworten – wichtig ist deine persönliche Einschätzung.
            </p>
          </div>

          {/* Instructions Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">So läuft die Teilnahme ab:</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <span>Du beantwortest zuerst ein paar kurze Fragen zu dir und deinem Umgang mit Schweizer Dialekten.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <span>Danach folgt eine kurze Kalibrierungsphase mit echten Dialektaufnahmen.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <span>Anschliessend beginnt die eigentliche Bewertung der synthetischen Aufnahmen.</span>
              </li>
            </ol>
          </div>


          {/* Participation Section */}
          <div className="mb-12">
            <p className="text-gray-700 mb-4">
              Du entscheidest selbst, wie viele Aufnahmen du bewertest. Die gesamte Teilnahme inklusive Formular, Kalibrierung und 50 bewerteten Aufnahmen dauert etwa 30 Minuten. Unter allen Teilnehmenden, die 50 oder mehr Aufnahmen bewertet haben (ohne Kalibrierung), <strong>verlosen wir 5x <a href="https://bontique.ch/de/bontique-check/#check-offer" target="_blank" className="text-blue-600 underline " rel="noopener noreferrer">Bontique-Gutscheine</a> (einlösbar bei über 100 Marken/Shops) im Wert von je 20.- CHF!</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Alle Angaben werden anonym ausgewertet und ausschliesslich zu Forschungszwecken verwendet.
            </p>
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
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              Jetzt starten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
