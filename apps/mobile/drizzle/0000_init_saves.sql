CREATE TABLE `saves` (
	`id` text PRIMARY KEY NOT NULL,
	`schema_version` integer NOT NULL,
	`seed` integer NOT NULL,
	`game_date` text NOT NULL,
	`current_mode` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
