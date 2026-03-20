CREATE TABLE `experiment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`description` text,
	`annotation_tool` text,
	`dataset_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`dataset_id`) REFERENCES `dataset`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `annotation` ADD `experiment_id` integer REFERENCES experiment(id);--> statement-breakpoint
ALTER TABLE annotation ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0;
UPDATE annotation SET updated_at = unixepoch();