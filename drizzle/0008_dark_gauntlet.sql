CREATE TABLE `experiment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dataset_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`dataset_id`) REFERENCES `dataset`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `annotation` ADD `experiment_id` integer NOT NULL REFERENCES experiment(id);--> statement-breakpoint
ALTER TABLE `annotation` ADD `updated_at` integer DEFAULT (unixepoch()) NOT NULL;