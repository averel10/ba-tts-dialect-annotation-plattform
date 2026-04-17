'use server';

import db from '@/lib/db';
import { participant } from '@/lib/model/participant';
import { annotation } from '@/lib/model/annotation';
import { experiment } from '@/lib/model/experiment';
import { dataset } from '@/lib/model/dataset';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { user } from '@/lib/model/auth-schema';
import { and, eq, count } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { isParticipantCalibrationDone, getDialectScoresFromCalibration } from './calibration-scoring';
import JSZip from 'jszip';

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
    confidence: number;
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
        confidence: annotation.confidence,
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
      email: p.email || 'Unknown',
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
        confidence: a.confidence,
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

/**
 * Export participant data as JSON
 * Includes participant info, onboarding, calibration, calibration scores, and annotations
 */
export async function exportParticipantDataAsJson(
  experimentId: number,
  userId: string
): Promise<{
  jsonData: string;
  filename: string;
}> {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Get participant detail which includes all basic info and annotations
    const participantDetail = await getParticipantDetail(experimentId, userId);

    // Get calibration scores if calibration is completed
    let calibrationScores: Record<string, number> | null = null;
    if (participantDetail.completedCalibration) {
      try {
        calibrationScores = await getParticipantCalibrationScores(experimentId, userId);
      } catch (err) {
        console.warn('Could not fetch calibration scores:', err);
      }
    }

    // Create comprehensive export object
    const exportData = {
      exportedAt: new Date().toISOString(),
      participant: {
        id: participantDetail.id,
        userId: participantDetail.userId,
        email: participantDetail.email,
        experimentId: participantDetail.experimentId,
        createdAt: participantDetail.createdAt,
        updatedAt: participantDetail.updatedAt,
      },
      progress: {
        completedOnboarding: participantDetail.completedOnboarding,
        completedCalibration: participantDetail.completedCalibration,
        totalAnnotations: participantDetail.annotationCount,
      },
      onboarding: {
        completed: participantDetail.completedOnboarding,
        answers: participantDetail.onboardingAnswers,
      },
      calibration: {
        completed: participantDetail.completedCalibration,
        answers: participantDetail.calibrationAnswers,
        scores: calibrationScores,
      },
      annotations: participantDetail.annotations.map((ann) => ({
        id: ann.id,
        externalId: ann.externalId,
        fileName: ann.fileName,
        datasetId: ann.datasetId,
        rating: ann.rating,
        confidence: ann.confidence,
        dialectLabel: ann.dialectLabel,
        createdAt: ann.createdAt,
      })),
    };

    // Convert to JSON string with pretty formatting
    const jsonData = JSON.stringify(exportData, null, 2);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `participant-${userId}-${timestamp}.json`;

    return {
      jsonData,
      filename,
    };
  } catch (error) {
    console.error('Error exporting participant data:', error);
    throw error;
  }
}

/**
 * Export all participant data from an experiment as a ZIP file
 * Returns a base64-encoded ZIP archive and a filename
 */
export async function exportAllParticipantDataAsZip(experimentId: number): Promise<{
  base64Data: string;
  filename: string;
}> {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Verify experiment exists
    const exp = await db
      .select()
      .from(experiment)
      .where(eq(experiment.id, experimentId))
      .limit(1);

    if (!exp || exp.length === 0) {
      throw new Error('Experiment not found');
    }

    // Get all participants for this experiment
    const participants = await getParticipantsList(experimentId);

    if (participants.length === 0) {
      throw new Error('No participants found in this experiment');
    }

    // Create ZIP archive
    const zip = new JSZip();
    const participantsFolder = zip.folder('participants');

    if (!participantsFolder) {
      throw new Error('Failed to create ZIP folder structure');
    }

    // Export each participant's data
    for (const p of participants) {
      try {
        const { jsonData, filename } = await exportParticipantDataAsJson(experimentId, p.userId);
        participantsFolder.file(filename, jsonData);
      } catch (err) {
        console.warn(`Failed to export data for participant ${p.userId}:`, err);
        // Continue with next participant if one fails
      }
    }

    // Fetch dataset information
    const datasetInfo = await db
      .select()
      .from(dataset)
      .where(eq(dataset.id, exp[0].datasetId))
      .limit(1);

    // Count total entries in the dataset
    const totalEntries = await db
      .select({ count: count().as('count') })
      .from(dataset_entry)
      .where(eq(dataset_entry.datasetId, exp[0].datasetId));

    // Create summary file with metadata
    const summary = {
      exportedAt: new Date().toISOString(),
      experimentId: experimentId,
      experimentName: exp[0].name,
      dataset: datasetInfo.length > 0 ? {
        id: datasetInfo[0].id,
        name: datasetInfo[0].name,
        description: datasetInfo[0].description,
        totalEntries: totalEntries[0]?.count || 0,
        createdAt: datasetInfo[0].createdAt,
      } : null,
      totalParticipants: participants.length,
      participants: participants.map((p) => ({
        userId: p.userId,
        email: p.email,
        joinedAt: p.createdAt,
        completedOnboarding: p.completedOnboarding,
        completedCalibration: p.completedCalibration,
        annotationCount: p.annotationCount,
      })),
    };

    zip.file(
      'SUMMARY.json',
      JSON.stringify(summary, null, 2),
    );

    // Generate ZIP buffer
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const sanitizedExperimentName = exp[0].name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `experiment-${sanitizedExperimentName}-${timestamp}.zip`;

    // Convert buffer to base64 string for client transfer
    const base64Data = buffer.toString('base64');

    return {
      base64Data,
      filename,
    };
  } catch (error) {
    console.error('Error exporting all participant data:', error);
    throw error;
  }
}
