'use server';

import db from '@/lib/db';
import { annotation } from '@/lib/model/annotation';
import { dataset_entry } from '@/lib/model/dataset_entry';
import { experiment } from '@/lib/model/experiment';
import { eq, and, count, gt, isNull } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';

export type DistributionDimension = 'dialect' | 'utteranceId' | 'model' | 'speaker';

export interface DistributionItem {
  label: string;
  count: number;
  entryId?: number;
  fileName?: string;
  durationMs?: number | null;
}

export interface DistributionData {
  dimension: DistributionDimension;
  items: DistributionItem[];
  total: number;
}

/**
 * Fetches annotation distribution data grouped by the specified dimension.
 * Includes entries with 0 annotations and sample entry information for playback.
 */
export async function getAnnotationDistribution(
  experimentId: number,
  dimension: DistributionDimension
): Promise<DistributionData> {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Get experiment to verify it exists and get dataset
    const exp = await db
      .select()
      .from(experiment)
      .where(eq(experiment.id, experimentId))
      .limit(1);

    if (exp.length === 0) {
      throw new Error('Experiment not found');
    }

    const datasetId = exp[0].datasetId;

    // Map dimension to database field
    const dimensionFieldMap = {
      dialect: dataset_entry.dialect,
      utteranceId: dataset_entry.utteranceId,
      model: dataset_entry.modelName,
      speaker: dataset_entry.speakerId,
    };

    const dimensionField = dimensionFieldMap[dimension];

    // First, get all unique dimension values from dataset_entry for this dataset
    const allDimensionValues = await db
      .selectDistinct({ dimensionValue: dimensionField })
      .from(dataset_entry)
      .where(eq(dataset_entry.datasetId, datasetId));

    // Now get annotation counts for each dimension value
    const items: DistributionItem[] = [];
    let total = 0;

    for (const dimValueObj of allDimensionValues) {
      const dimValue = dimValueObj.dimensionValue;

      // Count annotations for this dimension value in this experiment
      const annotationCountResult = await db
        .select({ total: count().as('total') })
        .from(annotation)
        .innerJoin(
          dataset_entry,
          eq(annotation.datasetEntryId, dataset_entry.id)
        )
        .where(
          and(
            eq(annotation.experimentId, experimentId),
            dimValue === null ? isNull(dimensionField) : eq(dimensionField, dimValue)
          )
        );

      const annotationCount = annotationCountResult[0]?.total ? parseInt(annotationCountResult[0].total as any) : 0;
      total += annotationCount;

      // Get a sample entry for this dimension group (any entry, even if not annotated)
      const sampleEntry = await db
        .select({
          id: dataset_entry.id,
          fileName: dataset_entry.fileName,
          durationMs: dataset_entry.durationMs,
        })
        .from(dataset_entry)
        .where(
          and(
            eq(dataset_entry.datasetId, datasetId),
            dimValue === null ? isNull(dimensionField) : eq(dimensionField, dimValue)
          )
        )
        .limit(1);

      items.push({
        label: dimValue || 'Unknown',
        count: annotationCount,
        entryId: sampleEntry[0]?.id,
        fileName: sampleEntry[0]?.fileName,
        durationMs: sampleEntry[0]?.durationMs,
      });
    }

    // Sort by count descending
    items.sort((a, b) => b.count - a.count);

    return {
      dimension,
      items,
      total,
    };
  } catch (error) {
    console.error('Error fetching annotation distribution:', error);
    throw new Error('Failed to fetch annotation distribution');
  }
}

export interface AnnotatedSample {
  id: number;
  fileName: string;
  durationMs: number | null;
  annotationCount: number;
}

/**
 * Gets all annotated samples for an experiment with their annotation counts.
 */
export async function getAnnotatedSamples(
  experimentId: number
): Promise<AnnotatedSample[]> {
  const result = await requireAdmin();
  if (!result.authenticated || !result.admin) {
    throw new Error('Unauthorized');
  }

  try {
    // First get the dataset for this experiment
    const expData = await db
      .select({ datasetId: experiment.datasetId })
      .from(experiment)
      .where(eq(experiment.id, experimentId))
      .limit(1);

    if (expData.length === 0) {
      throw new Error('Experiment not found');
    }

    const datasetId = expData[0].datasetId;

    // Get all dataset entries that have annotations for this experiment
    // with their annotation counts
    const samples = await db
      .select({
        id: dataset_entry.id,
        fileName: dataset_entry.fileName,
        durationMs: dataset_entry.durationMs,
        annotationCount: count(annotation.id).as('annotationCount'),
      })
      .from(dataset_entry)
      .leftJoin(
        annotation,
        and(
          eq(dataset_entry.id, annotation.datasetEntryId),
          eq(annotation.experimentId, experimentId)
        )
      )
      .where(eq(dataset_entry.datasetId, datasetId))
      .groupBy(dataset_entry.id);

    // Type assertion for the count
    return samples
      .map((s) => ({
        id: s.id,
        fileName: s.fileName,
        durationMs: s.durationMs,
        annotationCount: parseInt(s.annotationCount as any) || 0,
      }))
      .sort((a, b) => b.annotationCount - a.annotationCount);
  } catch (error) {
    console.error('Error fetching annotated samples:', error);
    throw new Error('Failed to fetch annotated samples');
  }
}
