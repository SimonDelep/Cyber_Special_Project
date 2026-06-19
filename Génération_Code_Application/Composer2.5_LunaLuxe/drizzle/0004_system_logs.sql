CREATE TABLE `system_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_type` text NOT NULL,
	`severity` text NOT NULL,
	`message` text NOT NULL,
	`user_id` integer,
	`username` text,
	`ip_address` text,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `system_logs_event_type_idx` ON `system_logs` (`event_type`);
--> statement-breakpoint
CREATE INDEX `system_logs_created_at_idx` ON `system_logs` (`created_at`);
--> statement-breakpoint
CREATE INDEX `system_logs_severity_idx` ON `system_logs` (`severity`);
