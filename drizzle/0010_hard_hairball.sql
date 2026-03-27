CREATE TABLE `experiment_calibration` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`experiment_id` integer,
	`dialect_label` text NOT NULL,
	`order` integer NOT NULL,
	`file` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`experiment_id`) REFERENCES `experiment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `participant` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`experiment_id` integer,
	`user_id` text NOT NULL,
	`calibration_answers` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`experiment_id`) REFERENCES `experiment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_participant` ON `participant` (`experiment_id`,`user_id`);