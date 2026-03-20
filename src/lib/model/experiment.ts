import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { annotation } from './annotation';
import { dataset } from './dataset';

export const experiment = sqliteTable(
  'experiment',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    published: integer('published', { mode: 'boolean' }).notNull().default(false), // 0 = draft, 1 = published
    description: text('description'),
    annotationTool: text('annotation_tool'),
    datasetId: integer('dataset_id')
      .notNull()
      .references(() => dataset.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
        updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
  }
);

export const experimentRelations = relations(experiment, ({ one, many }) => ({
  dataset: one(dataset, {
    fields: [experiment.datasetId],
    references: [dataset.id],
  }),
    annotations: many(annotation),
}));

export type Experiment = typeof experiment.$inferSelect;
export type NewExperiment = typeof experiment.$inferInsert;
