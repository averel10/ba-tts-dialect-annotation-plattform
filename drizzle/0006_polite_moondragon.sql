CREATE TABLE `annotation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dataset_entry_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`dataset_entry_id`) REFERENCES `dataset_entry`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `annotation_user_entry_idx` ON `annotation` (`user_id`,`dataset_entry_id`);