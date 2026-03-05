import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { dataset } from './dataset';
import { dataset_utterance } from './utterance';

// Define the dataset table schema
export const dataset_entry = sqliteTable('dataset_entry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  externalId: text('external_id').notNull(),
  speakerId: text('speaker_id').notNull(),
  modelName: text('model_name').notNull(),
  datasetId: integer('dataset_id')
    .notNull()
    .references(() => dataset.id),
  utteranceId: text('utterance_id').references(() => dataset_utterance.id),
  fileName: text('file_name').notNull(),
  dialect: text('dialect').notNull(),
  iteration: integer('iteration').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(new Date())
});

export const dataset_entryRelations = relations(dataset_entry, ({ one }) => ({
  dataset: one(dataset, {
    fields: [dataset_entry.datasetId],
    references: [dataset.id]
  }),
  utterance: one(dataset_utterance, {
    fields: [dataset_entry.utteranceId],
    references: [dataset_utterance.id]
  })
}));

// Create a type for dataset records based on the schema
export type DatasetEntry = typeof dataset_entry.$inferSelect;
export type NewDatasetEntry = typeof dataset_entry.$inferInsert;