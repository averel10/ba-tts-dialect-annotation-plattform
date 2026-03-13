import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { dataset_entry } from './dataset_entry';

export const annotation = sqliteTable(
  'annotation',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    datasetEntryId: integer('dataset_entry_id')
      .notNull()
      .references(() => dataset_entry.id),
    userId: text('user_id').notNull(),
    rating: integer('rating').notNull(), // 1–5
    dialectLabel: text('dialect_label').notNull(), // e.g. 'ch_be', 'ch_zh', …
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex('annotation_user_entry_dialect_idx').on(
      table.userId,
      table.datasetEntryId,
      table.dialectLabel
    ),
  ]
);

export const annotationRelations = relations(annotation, ({ one }) => ({
  datasetEntry: one(dataset_entry, {
    fields: [annotation.datasetEntryId],
    references: [dataset_entry.id],
  }),
}));

export type Annotation = typeof annotation.$inferSelect;
export type NewAnnotation = typeof annotation.$inferInsert;
