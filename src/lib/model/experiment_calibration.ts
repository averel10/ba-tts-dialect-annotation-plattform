import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { experiment } from './experiment';

export const experiment_calibration = sqliteTable(
  'experiment_calibration',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    experimentId: integer('experiment_id')
      .references(() => experiment.id),
    dialectLabel: text('dialect_label').notNull(), // e.g. 'ch_be', 'ch_zh', …
    order: integer('order').notNull(), // order of the calibration items
    file: text('file').notNull(), // path to the audio file for calibration
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => sql`(unixepoch())`),
  },
);

export const experiment_calibrationRelations = relations(experiment_calibration, ({ one }) => ({
  experiment: one(experiment, {
    fields: [experiment_calibration.experimentId],
    references: [experiment.id],
  })
}));

export type ExperimentCalibration = typeof experiment_calibration.$inferSelect;
export type NewExperimentCalibration = typeof experiment_calibration.$inferInsert;
