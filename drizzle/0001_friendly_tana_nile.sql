PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_dataset_entry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text NOT NULL,
	`speaker_id` text NOT NULL,
	`model_name` text NOT NULL,
	`dataset_id` integer NOT NULL,
	`file_name` text NOT NULL,
	`dialect` text NOT NULL,
	`iteration` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`dataset_id`) REFERENCES `dataset`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_dataset_entry`("id", "external_id", "speaker_id", "model_name", "dataset_id", "file_name", "dialect", "iteration", "created_at", "updated_at") SELECT "id", "external_id", "speaker_id", "model_name", "dataset_id", "file_name", "dialect", "iteration", "created_at", "updated_at" FROM `dataset_entry`;--> statement-breakpoint
DROP TABLE `dataset_entry`;--> statement-breakpoint
ALTER TABLE `__new_dataset_entry` RENAME TO `dataset_entry`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_dataset` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_dataset`("id", "name", "created_at", "updated_at") SELECT "id", "name", "created_at", "updated_at" FROM `dataset`;--> statement-breakpoint
DROP TABLE `dataset`;--> statement-breakpoint
ALTER TABLE `__new_dataset` RENAME TO `dataset`;