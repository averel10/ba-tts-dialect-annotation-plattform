'use client';

import { useEffect, useState } from 'react';
import { getOnboardingAnswers } from '@/app/actions/onboarding';
import OnboardingInfoView from './OnboardingInfoView';
import OnboardingFormView from './OnboardingFormView';

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

interface OnboardingPhaseProps {
  experimentId: number;
}

export default function OnboardingPhase({ experimentId }: OnboardingPhaseProps) {
  const [showInfoPage, setShowInfoPage] = useState(true);
  const [hasExistingAnswers, setHasExistingAnswers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Load existing answers to check if user has completed onboarding before
        const answersResult = await getOnboardingAnswers(experimentId);
        if (answersResult.success && answersResult.data) {
          const answers = answersResult.data as Record<string, any> | null;
          if (answers && Object.keys(answers).length > 0) {
            setHasExistingAnswers(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [experimentId]);

  // Show loading view
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  // Show info page first
  if (showInfoPage) {
    
    return (
      <OnboardingInfoView
        onContinue={() => {
          scrollToTop();
          setShowInfoPage(false);
        }}
        hasExistingAnswers={hasExistingAnswers}
      />
    );
  }

  
  return <OnboardingFormView experimentId={experimentId} />;
}
