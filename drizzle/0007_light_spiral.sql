CREATE TABLE IF NOT EXISTS `annotation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dataset_entry_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`dialect_label` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`dataset_entry_id`) REFERENCES `dataset_entry`(`id`) ON UPDATE no action ON DELETE no action
);
