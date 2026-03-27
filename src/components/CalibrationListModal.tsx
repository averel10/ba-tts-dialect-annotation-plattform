'use client';

import { useEffect, useState, useRef } from 'react';
import { getCalibrationEntries, deleteCalibrationEntry, updateCalibrationOrder, deleteAllCalibrationEntries } from '@/app/actions/calibration';
import Modal from '@/components/Modal';
import { ExperimentCalibration } from '@/lib/model/experiment_calibration';
import { useAudio } from './AudioProvider';

interface CalibrationListModalProps {
  experimentId: number;
}

export default function CalibrationListModal({ experimentId }: CalibrationListModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [calibrationItems, setCalibrationItems] = useState<ExperimentCalibration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const { currentAudioId, setCurrentAudio } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadCalibrationItems();
    }
  }, [isOpen]);

  async function loadCalibrationItems() {
    setLoading(true);
    setError(null);
    try {
      const result = await getCalibrationEntries(experimentId);
      if (result.success) {
        const sorted = [...result.data].sort((a, b) => a.order - b.order);
        setCalibrationItems(sorted);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calibration items');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(calibrationId: number) {
    if (!confirm('Are you sure you want to delete this calibration item?')) {
      return;
    }

    try {
      await deleteCalibrationEntry(calibrationId, experimentId);
      setCalibrationItems(items => items.filter(item => item.id !== calibrationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  }

  async function handleDeleteAll() {
    if (!confirm('Are you sure you want to delete ALL calibration items? This cannot be undone.')) {
      return;
    }

    try {
      await deleteAllCalibrationEntries(experimentId);
      setCalibrationItems([]);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setCurrentAudio(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete all items');
    }
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;

    const reorderedItems = [...calibrationItems];
    const temp = reorderedItems[index];
    reorderedItems[index] = reorderedItems[index - 1];
    reorderedItems[index - 1] = temp;
    setCalibrationItems(reorderedItems);

    // Prepare order map
    const orderMap: Record<number, number> = {};
    reorderedItems.forEach((item, idx) => {
      orderMap[item.id] = idx;
    });

    try {
      await updateCalibrationOrder(experimentId, orderMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      // Revert on error
      await loadCalibrationItems();
    }
  }

  async function handleMoveDown(index: number) {
    if (index === calibrationItems.length - 1) return;

    const reorderedItems = [...calibrationItems];
    const temp = reorderedItems[index];
    reorderedItems[index] = reorderedItems[index + 1];
    reorderedItems[index + 1] = temp;
    setCalibrationItems(reorderedItems);

    // Prepare order map
    const orderMap: Record<number, number> = {};
    reorderedItems.forEach((item, idx) => {
      orderMap[item.id] = idx;
    });

    try {
      await updateCalibrationOrder(experimentId, orderMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      // Revert on error
      await loadCalibrationItems();
    }
  }

  function handlePlayAudio(calibrationId: number, filePath: string) {
    const audioId = `calibration-${calibrationId}`;

    if (currentAudioId === audioId && audioRef.current && !audioRef.current.paused) {
      // Stop playing
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentAudio(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Play new audio
    if (audioRef.current) {
      const fullPath = `/public${filePath}`;
      audioRef.current.src = fullPath;
      setCurrentAudio(audioId);
      audioRef.current.play().catch(err => console.error('Failed to play audio:', err));
    }
  }

  function handleDragStart(index: number) {
    setDraggedItem(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const reorderedItems = [...calibrationItems];
    const draggedItemContent = reorderedItems[draggedItem];
    reorderedItems.splice(draggedItem, 1);
    reorderedItems.splice(index, 0, draggedItemContent);
    setCalibrationItems(reorderedItems);
    setDraggedItem(index);
  }

  async function handleDragEnd() {
    setDraggedItem(null);

    // Update order in database
    const orderMap: Record<number, number> = {};
    calibrationItems.forEach((item, idx) => {
      orderMap[item.id] = idx;
    });

    try {
      await updateCalibrationOrder(experimentId, orderMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      // Revert on error
      await loadCalibrationItems();
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        📋 View Calibration List
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          setCurrentAudio(null);
          setIsOpen(false);
        }}
        title="Calibration Items"
        actions={[
          {
            label: 'Close',
            onClick: () => setIsOpen(false),
            variant: 'secondary',
          },
        ]}
      >
        <audio
          ref={audioRef}
          onEnded={() => setCurrentAudio(null)}
        />
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : calibrationItems.length === 0 ? (
            <div className="text-center text-gray-500">No calibration items found</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {calibrationItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-move ${
                    draggedItem === index
                      ? 'bg-gray-100 border-gray-400 opacity-50'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{item.dialectLabel}</div>
                    <div className="text-xs text-gray-500 truncate">{item.file}</div>
                  </div>

                  <button
                    onClick={() => handlePlayAudio(item.id, item.file)}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors flex-shrink-0 ${
                      currentAudioId === `calibration-${item.id}`
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    title={currentAudioId === `calibration-${item.id}` ? 'Stop' : 'Play'}
                  >
                    {currentAudioId === `calibration-${item.id}` ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <rect x="6" y="4" width="2" height="12" />
                        <rect x="12" y="4" width="2" height="12" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    )}
                  </button>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === calibrationItems.length - 1}
                      className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {calibrationItems.length > 0 && (
            <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-50 rounded">
              💡 Drag items to reorder, or use the arrow buttons. Click the play button to preview audio.
            </div>
          )}

          {calibrationItems.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
            >
              🗑️ Delete All Items
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
