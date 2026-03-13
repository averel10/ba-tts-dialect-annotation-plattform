import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { dataset } from './dataset';

export const dataset_entry = sqliteTable('dataset_entry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  externalId: text('external_id').notNull(),
  speakerId: text('speaker_id').notNull(),
  modelName: text('model_name').notNull(),
  utteranceId: text('utterance_id'),
  utteranceText: text('utterance_text'),
  datasetId: integer('dataset_id')
    .notNull()
    .references(() => dataset.id),
  fileName: text('file_name').notNull(),
  dialect: text('dialect').notNull(),
  iteration: integer('iteration').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
});

export const dataset_entryRelations = relations(dataset_entry, ({ one }) => ({
  dataset: one(dataset, {
    fields: [dataset_entry.datasetId],
    references: [dataset.id]
  })
}));

// Create a type for dataset records based on the schema
export type DatasetEntry = typeof dataset_entry.$inferSelect;
export type NewDatasetEntry = typeof dataset_entry.$inferInsert;