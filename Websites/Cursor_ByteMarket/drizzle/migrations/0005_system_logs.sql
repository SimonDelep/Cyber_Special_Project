CREATE TABLE `system_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_type` text NOT NULL,
	`category` text NOT NULL,
	`outcome` text NOT NULL,
	`actor_user_id` integer,
	`actor_username` text,
	`target_user_id` integer,
	`target_resource` text,
	`message` text NOT NULL,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `system_logs_created_at_idx` ON `system_logs` (`created_at` DESC);
--> statement-breakpoint
CREATE INDEX `system_logs_category_idx` ON `system_logs` (`category`);
--> statement-breakpoint
CREATE INDEX `system_logs_event_type_idx` ON `system_logs` (`event_type`);
