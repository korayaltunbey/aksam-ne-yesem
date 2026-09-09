DROP INDEX `recipes_active_budget_idx`;--> statement-breakpoint
ALTER TABLE `recipes` DROP COLUMN `budget_level`;--> statement-breakpoint
ALTER TABLE `recipes` DROP COLUMN `estimated_cost_per_serving`;