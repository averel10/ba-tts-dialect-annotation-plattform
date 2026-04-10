import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { dataset_entry } from './dataset_entry';
import { experiment } from './experiment';

export const annotation = sqliteTable(
  'annotation',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    datasetEntryId: integer('dataset_entry_id').notNull().references(() => dataset_entry.id),
    experimentId: integer('experiment_id')
      .references(() => experiment.id),
    userId: text('user_id').notNull(),
    rating: integer('rating').notNull(), // 1–4
    confidence: integer('confidence').notNull(), // 1-4
    dialectLabel: text('dialect_label').notNull(), // e.g. 'ch_be', 'ch_zh', …
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => sql`(unixepoch())`),
  },
  (table) => ({
    uniqueAnnotation: uniqueIndex('unique_annotation').on(table.datasetEntryId, table.experimentId, table.userId),
  })
);

export const annotationRelations = relations(annotation, ({ one }) => ({
  experiment: one(experiment, {
    fields: [annotation.experimentId],
    references: [experiment.id],
  }),
  datasetEntry: one(dataset_entry, {
    fields: [annotation.datasetEntryId],
    references: [dataset_entry.id],
  }),
}));

export type Annotation = typeof annotation.$inferSelect;
export type NewAnnotation = typeof annotation.$inferInsert;
