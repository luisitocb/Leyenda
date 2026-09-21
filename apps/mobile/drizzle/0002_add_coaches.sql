CREATE TABLE `coaches` (
	`id` text PRIMARY KEY NOT NULL,
	`save_id` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`save_id`) REFERENCES `saves`(`id`) ON UPDATE no action ON DELETE no action
);
