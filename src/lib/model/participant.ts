import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { dataset_entry } from './dataset_entry';
import { experiment } from './experiment';

export const participant = sqliteTable(
  'participant',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    experimentId: integer('experiment_id').references(() => experiment.id),
    userId: text('user_id').notNull(),
    calibrationAnswers: text('calibration_answers', { mode: 'json' }), 
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => sql`(unixepoch())`),
  },
  (table) => ({
    uniqueParticipant: uniqueIndex('unique_participant').on(table.experimentId, table.userId),
  })
);

export const participantRelations = relations(participant, ({ one }) => ({
  experiment: one(experiment, {
    fields: [participant.experimentId],
    references: [experiment.id],
  })
}));

export type Participant = typeof participant.$inferSelect;
export type NewParticipant = typeof participant.$inferInsert;
