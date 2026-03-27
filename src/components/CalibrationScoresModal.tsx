'use client';

import Modal from '@/components/Modal';
import { DIALECT_LABELS } from '@/lib/dialects';
import CalibrationScoresDisplay from './CalibrationScoresDisplay';

interface CalibrationScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  dialectScores: Record<string, number>;
}

export default function CalibrationScoresModal({
  isOpen,
  onClose,
  dialectScores,
}: CalibrationScoresModalProps) {
  if (!isOpen || Object.keys(dialectScores).length === 0) return null;

  const sortedScores = Object.entries(dialectScores).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Ihre Kalibrierungsergebnisse</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <CalibrationScoresDisplay dialectScores={dialectScores} />
      </div>
    </div>
  );
}
