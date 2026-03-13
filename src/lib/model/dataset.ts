import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { dataset_entry } from './dataset_entry';

// Define the dataset table schema
export const dataset = sqliteTable('dataset', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
});

export const datasetRelations = relations(dataset, ({ many }) => ({
  entries: many(dataset_entry)
}));

// Create a type for dataset records based on the schema
export type Dataset = typeof dataset.$inferSelect;
export type NewDataset = typeof dataset.$inferInsert;