import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { dataset } from './dataset';

// Define the dataset_utterance table schema
export const dataset_utterance = sqliteTable('dataset_utterance', {
  id: text('id').primaryKey(),
  datasetId: integer('dataset_id')
    .notNull()
    .references(() => dataset.id),
  text: text('text').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(new Date()),
});

export const dataset_utteranceRelations = relations(dataset_utterance, ({ one }) => ({
  dataset: one(dataset, {
    fields: [dataset_utterance.datasetId],
    references: [dataset.id],
  }),
}));

// Create types for dataset_utterance records based on the schema
export type DatasetUtterance = typeof dataset_utterance.$inferSelect;
export type NewDatasetUtterance = typeof dataset_utterance.$inferInsert;
