ALTER TABLE `dataset_entry` ADD `utterance_id` text;--> statement-breakpoint
ALTER TABLE `dataset_entry` ADD `utterance_text` text;--> statement-breakpoint
ALTER TABLE `dataset_entry` DROP COLUMN `utterance`;