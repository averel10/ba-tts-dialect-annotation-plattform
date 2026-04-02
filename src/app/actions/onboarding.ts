'use server';

import db from '@/lib/db';
import { participant } from '@/lib/model/participant';
import { experiment } from '@/lib/model/experiment';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function isOnboardingDone(experimentId: number): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Nicht angemeldet');

  try {
    // Check if onboarding is enabled for this experiment
    const exp = await db
      .select()
      .from(experiment)
      .where(eq(experiment.id, experimentId))
      .limit(1);

    if (exp.length === 0) {
      throw new Error('Experiment not found');
    }

    // If onboarding is not enabled, consider it done
    if (!exp[0].onboardingEnabled) {
      return true;
    }

    const participantRecord = await db
      .select()
      .from(participant)
      .where(
        and(
          eq(participant.experimentId, experimentId),
          eq(participant.userId, session.user.id)
        )
      )
      .limit(1);

    // If no participant record exists, onboarding is not done
    if (participantRecord.length === 0) {
      return false;
    }

    // Check if onboarding answers are filled
    const onboardingAnswers = participantRecord[0].onboardingAnswers as Record<string, any> | null;
    return onboardingAnswers !== null && Object.keys(onboardingAnswers).length > 0;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    throw new Error('Failed to check onboarding status');
  }
}

export async function getOnboardingAnswers(experimentId: number) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Nicht angemeldet');

    const participantRecord = await db
      .select()
      .from(participant)
      .where(
        and(
          eq(participant.experimentId, experimentId),
          eq(participant.userId, session.user.id)
        )
      )
      .limit(1);

    if (participantRecord.length === 0) {
      return { success: true, data: null };
    }

    return { success: true, data: participantRecord[0].onboardingAnswers };
  } catch (error) {
    console.error('Error fetching onboarding answers:', error);
    throw new Error('Failed to fetch onboarding answers');
  }
}

export async function saveOnboardingAnswers(
  experimentId: number,
  answers: Record<string, any>
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Nicht angemeldet');

  try {
    // Upsert participant record with onboarding answers
    await db
      .insert(participant)
      .values({
        experimentId,
        userId: session.user.id,
        onboardingAnswers: answers,
      })
      .onConflictDoUpdate({
        target: [participant.experimentId, participant.userId],
        set: {
          onboardingAnswers: answers,
        },
      });
  } catch (error) {
    console.error('Error saving onboarding answers:', error);
    throw new Error('Failed to save onboarding answers');
  }
}
