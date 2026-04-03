'use server';

import db from '@/lib/db';
import { participant } from '@/lib/model/participant';
import { annotation } from '@/lib/model/annotation';
import { experiment } from '@/lib/model/experiment';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { user } from '@/lib/model/auth-schema';
import { and, eq, count } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { isParticipantCalibrationDone, getDialectScoresFromCalibration } from './calibration-scoring';

export interface ParticipantListItem {
  id: number;
  experimentId: number;
  userId: string;
  email: string;
  completedOnboarding: boolean;
  completedCalibration: boolean;
  annotationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticipantDetail extends ParticipantListItem {
  onboardingAnswers: any;
  calibrationAnswers: any;
  annotations: Array<{
    id: number;
    datasetEntryId: number;
    externalId: string;
    fileName: string;
    datasetId: number;
    rating: number;
    dialectLabel: string;
    createdAt: Date;
  }>;
}

/**
 * Get all participants for an experiment as a list
 */
export async function getParticipantsList(experimentId: number): Promise<ParticipantListItem[]> {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Verify experiment exists
    const exp = await db.select().from(experiment).where(eq(experiment.id, experimentId)).limit(1);
    if (!exp || exp.length === 0) {
      throw new Error('Experiment not found');
    }

    // Get all participants for this experiment
    const participants = await db
      .select({
        id: participant.id,
        experimentId: participant.experimentId,
        userId: participant.userId,
        email: user.email,
        calibrationAnswers: participant.calibrationAnswers,
        onboardingAnswers: participant.onboardingAnswers,
        createdAt: participant.createdAt,
        updatedAt: participant.updatedAt,
      })
      .from(participant)
      .leftJoin(user, eq(participant.userId, user.id))
      .where(eq(participant.experimentId, experimentId));

    // Build list with annotation counts
    const participantsList: ParticipantListItem[] = [];

    for (const p of participants) {
      // Count annotations for this participant
      const annotationCounts = await db
        .select({ count: count().as('count') })
        .from(annotation)
        .where(
          and(
            eq(annotation.experimentId, experimentId),
            eq(annotation.userId, p.userId)
          )
        );

      const annotationCount = annotationCounts[0]?.count || 0;

      // Use the proper calibration validation function
      const completedCalibration = await isParticipantCalibrationDone(experimentId, p);

      participantsList.push({
        id: p.id,
        experimentId: p.experimentId!,
        userId: p.userId,
        email: p.email || 'Unknown',
        completedOnboarding: p.onboardingAnswers !== null && p.onboardingAnswers !== undefined,
        completedCalibration,
        annotationCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      });
    }

    // Sort by descending creation date
    participantsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return participantsList;
  } catch (error) {
    console.error('Error fetching participants list:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific participant
 */
export async function getParticipantDetail(
  experimentId: number,
  userId: string
): Promise<ParticipantDetail> {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Verify experiment exists
    const exp = await db.select().from(experiment).where(eq(experiment.id, experimentId)).limit(1);
    if (!exp || exp.length === 0) {
      throw new Error('Experiment not found');
    }

    // Get participant
    const participants = await db
      .select()
      .from(participant)
      .where(
        and(
          eq(participant.experimentId, experimentId),
          eq(participant.userId, userId)
        )
      )
      .limit(1);

    if (!participants || participants.length === 0) {
      throw new Error('Participant not found');
    }

    const p = participants[0];

    // Get all annotations for this participant
    const participantAnnotations = await db
      .select({
        id: annotation.id,
        datasetEntryId: annotation.datasetEntryId,
        externalId: dataset_entry.externalId,
        fileName: dataset_entry.fileName,
        datasetId: dataset_entry.datasetId,
        rating: annotation.rating,
        dialectLabel: annotation.dialectLabel,
        createdAt: annotation.createdAt,
      })
      .from(annotation)
      .leftJoin(dataset_entry, eq(annotation.datasetEntryId, dataset_entry.id))
      .where(
        and(
          eq(annotation.experimentId, experimentId),
          eq(annotation.userId, userId)
        )
      );

    // Use the proper calibration validation function
    const completedCalibration = await isParticipantCalibrationDone(experimentId, p);

    return {
      id: p.id,
      experimentId: p.experimentId!,
      userId: p.userId,
      completedOnboarding: p.onboardingAnswers !== null && p.onboardingAnswers !== undefined,
      completedCalibration,
      onboardingAnswers: p.onboardingAnswers || {},
      calibrationAnswers: p.calibrationAnswers || {},
      annotationCount: participantAnnotations.length,
      annotations: participantAnnotations.map(a => ({
        id: a.id,
        datasetEntryId: a.datasetEntryId,
        externalId: a.externalId || 'Unknown',        fileName: a.fileName || 'Unknown',
        datasetId: a.datasetId || 0,        rating: a.rating,
        dialectLabel: a.dialectLabel,
        createdAt: a.createdAt,
      })),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching participant detail:', error);
    throw error;
  }
}

/**
 * Get calibration scores for a participant
 */
export async function getParticipantCalibrationScores(
  experimentId: number,
  userId: string
): Promise<Record<string, number>> {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Verify experiment exists
    const exp = await db.select().from(experiment).where(eq(experiment.id, experimentId)).limit(1);
    if (!exp || exp.length === 0) {
      throw new Error('Experiment not found');
    }

    // Verify participant exists
    const participants = await db
      .select()
      .from(participant)
      .where(
        and(
          eq(participant.experimentId, experimentId),
          eq(participant.userId, userId)
        )
      )
      .limit(1);

    if (!participants || participants.length === 0) {
      throw new Error('Participant not found');
    }

    // Get calibration scores using the existing server action
    const scores = await getDialectScoresFromCalibration(experimentId, userId);
    return scores;
  } catch (error) {
    console.error('Error fetching participant calibration scores:', error);
    throw error;
  }
}
