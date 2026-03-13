DROP INDEX `annotation_user_entry_idx`;--> statement-breakpoint
ALTER TABLE `annotation` ADD `dialect_label` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `annotation_user_entry_dialect_idx` ON `annotation` (`user_id`,`dataset_entry_id`,`dialect_label`);