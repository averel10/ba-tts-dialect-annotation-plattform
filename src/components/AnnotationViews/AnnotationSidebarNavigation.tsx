'use client';

import { DatasetEntryForAnnotation } from '@/lib/dialects';
import { useEffect, useRef } from 'react';

interface AnnotationSidebarNavigationProps {
  entries: DatasetEntryForAnnotation[];
  currentIndex: number;
  onSelectEntry: (index: number) => void;
  annotatedCount: number;
}

export default function AnnotationSidebarNavigation({
  entries,
  currentIndex,
  onSelectEntry,
  annotatedCount
}: AnnotationSidebarNavigationProps) {
  const progressPct = Math.round((annotatedCount / entries.length) * 100);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentIndex]);

  return (
    <aside className="hidden md:flex md:flex-col w-64 h-full bg-gray-50 border-r border-gray-200 p-4 overflow-hidden">
      {/* Header - fixed at top */}
      <div className="mb-6 flex-shrink-0">
        <h2 className="font-semibold text-gray-900 mb-2">Fortschritt</h2>
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            {annotatedCount}/{entries.length} annotiert ({progressPct}%)
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-gray-200 mb-4 flex-shrink-0" />

      {/* Entries List - scrollable middle section with max height */}
      <div className="space-y-1 flex-1 min-h-0 overflow-hidden flex flex-col">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 px-2 flex-shrink-0">
          Samples
        </h3>
        <div className="space-y-1 overflow-y-auto max-h-96">
          {entries.map((entry, index) => (
            <button
              ref={index === currentIndex ? activeButtonRef : null}
              key={entry.id}
              onClick={() => onSelectEntry(index)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                index === currentIndex
                  ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-500 font-medium'
                  : entry.annotation !== null
                    ? 'bg-green-50 text-gray-700 hover:bg-green-100'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              title={`Entry ${index + 1}`}
            >
              <div className="flex items-center gap-2">
                {/* Status indicator */}
                <span
                  className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                    index === currentIndex
                      ? 'bg-blue-600'
                      : entry.annotation !== null
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                  }`}
                />
                {/* Entry number and filename */}
                <span className="truncate">
                  {index + 1}. {`Sample ${index + 1}`}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
