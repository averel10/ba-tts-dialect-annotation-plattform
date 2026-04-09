'use server';

import db from '@/lib/db';
import { experiment_calibration } from '@/lib/model/experiment_calibration';
import { experiment } from '@/lib/model/experiment';
import { participant } from '@/lib/model/participant';
import { eq, and } from 'drizzle-orm';
import { auth, requireAdmin } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * Calculates dialect performance scores based on calibration answers.
 * Score = (correctness × confidence) averaged per dialect
 * Range: -1 to 1, where:
 *   1 = perfect identification with full confidence
 *   0 = neutral (correct but unsure, or incorrect and unsure)
 *   -1 = completely wrong with full confidence (penalizes false confidence)
 *
 * @param experimentId - The experiment ID
 * @param userId - Optional user ID. If provided, requires admin privileges. If not provided, uses current user.
 */
export async function getDialectScoresFromCalibration(
  experimentId: number,
  userId?: string
): Promise<Record<string, number>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Nicht angemeldet');

  // Determine which user to fetch scores for
  let targetUserId = userId;
  if (targetUserId) {
    // Admin access required for fetching other user's scores
    const result = await requireAdmin();
    if (!result.authenticated || !result.admin) {
      throw new Error('Unauthorized');
    }
  } else {
    // Use current user if no userId provided
    targetUserId = session.user.id;
  }

  // Fetch calibration items
  const calibrationItems = await db
    .select()
    .from(experiment_calibration)
    .where(eq(experiment_calibration.experimentId, experimentId));

  // Fetch participant record
  const participantRecord = await db
    .select()
    .from(participant)
    .where(
      and(
        eq(participant.experimentId, experimentId),
        eq(participant.userId, targetUserId)
      )
    )
    .limit(1);

  // Calculate dialect scores
  return calculateDialectScores(calibrationItems, participantRecord);
}

/**
 * Helper function to calculate dialect scores from calibration items and answers
 */
function calculateDialectScores(
  calibrationItems: typeof experiment_calibration.$inferSelect[],
  participantRecord: (typeof participant.$inferSelect)[]
): Record<string, number> {
  const dialectScores: Record<string, number> = {};

  if (participantRecord.length > 0 && participantRecord[0].calibrationAnswers) {
    const calibrationAnswers = participantRecord[0].calibrationAnswers as Record<
      number,
      { dialectLabel: string; confidence: number }
    >;

    // For each dialect, calculate accuracy and average confidence
    for (const item of calibrationItems) {
      const answer = calibrationAnswers[item.id];
      if (!answer) continue;

      const isCorrect = answer.dialectLabel === item.dialectLabel ? 1 : -1;
      const confidence = answer.confidence / 4; // Normalize to 0-1

      // Score = correctness * confidence
      // Correct answers: +confidence (0 to 1)
      // Incorrect answers: -confidence (-1 to 0) - penalizes false confidence
      const itemScore = isCorrect * confidence;

      if (!dialectScores[item.dialectLabel]) {
        dialectScores[item.dialectLabel] = 0;
      }
      dialectScores[item.dialectLabel] += itemScore;
    }

    // Average the scores by number of items per dialect
    const dialectCounts: Record<string, number> = {};
    for (const item of calibrationItems) {
      dialectCounts[item.dialectLabel] = (dialectCounts[item.dialectLabel] || 0) + 1;
    }
    for (const dialect in dialectScores) {
      dialectScores[dialect] = dialectScores[dialect] / (dialectCounts[dialect] || 1);
    }
  }

  return dialectScores;
}

/**
 * Checks if calibration is required and completed for the current user in an experiment.
 * Returns true if calibration is completed or not required, false if calibration is pending.
 */
export async function isCalibrationDone(experimentId: number): Promise<boolean> {
  console.log('Checking calibration status for experimentId:', experimentId);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Nicht angemeldet');

  // Check if participant exists for this user and experiment
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

  // If no participant record exists, calibration is not done
  if (participantRecord.length === 0) {
    return false;
  }

  // Use the shared validation logic
  return isParticipantCalibrationDone(experimentId, participantRecord[0]);
}

/**
 * Checks if a participant has completed calibration for an experiment.
 * This is a helper function for admin statistics that validates all calibration answers are complete.
 * Returns true if calibration is completed for this participant.
 */
export async function isParticipantCalibrationDone(
  experimentId: number,
  participantRecord: typeof participant.$inferSelect
): Promise<boolean> {
  // Check if calibration is enabled for this experiment
  const exp = await db
    .select()
    .from(experiment)
    .where(eq(experiment.id, experimentId))
    .limit(1);

  if (exp.length === 0) {
    throw new Error('Experiment not found');
  }

  // If calibration is not enabled, consider it done
  if (!exp[0].calibrationEnabled) {
    return true;
  }

  // Get calibration items for this experiment
  const calibrationItems = await db
    .select()
    .from(experiment_calibration)
    .where(eq(experiment_calibration.experimentId, experimentId));

  // If no calibration items are defined, calibration is not required
  if (calibrationItems.length === 0) {
    return true;
  }

  // Check if calibration answers are filled
  const calibrationAnswers = participantRecord.calibrationAnswers as Record<
    number,
    { dialectLabel: string; confidence: number }
  > | null;

  if (!calibrationAnswers) {
    return false;
  }

  // Verify that all calibration items have complete answers
  for (const item of calibrationItems) {
    const answer = calibrationAnswers[item.id];

    // Check if answer exists and has both required fields
    if (!answer || !answer.dialectLabel || !answer.confidence) {
      return false;
    }
  }

  return true;
}
