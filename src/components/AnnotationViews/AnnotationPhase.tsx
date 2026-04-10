'use client';

import { useState } from 'react';
import { type DatasetEntryForAnnotation } from '@/lib/dialects';
import AnnotationInfoView from './AnnotationInfoView';
import AnnotationPageView from './AnnotationPageView';

interface AnnotationPhaseProps {
  entries: DatasetEntryForAnnotation[];
  experimentId: number;
  viewType: string;
  hasExistingAnswers: boolean;
}

export default function AnnotationPhase({
  entries,
  experimentId,
  viewType,
  hasExistingAnswers,
}: AnnotationPhaseProps) {
  const [showInfoPage, setShowInfoPage] = useState(true);

  if (showInfoPage) {
    return (
      <AnnotationInfoView
        onContinue={() => setShowInfoPage(false)}
        hasExistingAnswers={hasExistingAnswers}
      />
    );
  }

  return <AnnotationPageView entries={entries} experimentId={experimentId} viewType={viewType} onShowIntro={() => setShowInfoPage(true)} />;
}
