'use client';

import { DIALECT_LABELS } from '@/lib/dialects';

interface CalibrationScoresDisplayProps {
  dialectScores: Record<string, number>;
}

export default function CalibrationScoresDisplay({
  dialectScores,
}: CalibrationScoresDisplayProps) {
  if (Object.keys(dialectScores).length === 0) return null;

  const sortedScores = Object.entries(dialectScores).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="space-y-4">
        {sortedScores.map(([dialect, score]) => {
          // Normalize score from -1 to 1 range to 0 to 100 percentage
          const percentage = ((score + 1) / 2) * 100;
          const isGood = score > 0.5;
          const isFair = score > -0.5;
          
          return (
            <div key={dialect}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">{DIALECT_LABELS[dialect]}</span>
                <span className={`text-sm font-semibold ${
                  isGood ? 'text-green-600' : isFair ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isGood ? 'bg-green-500' : isFair ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-500 mt-6">
        Die Scores basieren auf der Genauigkeit und dem Vertrauen in Ihre Kalibrierergebnisse.
        Dialekte mit höheren Scores werden zuerst in der Annotation angezeigt.
      </p>
    </div>
  );
}
