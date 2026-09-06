ALTER TABLE `recipes` ADD `meal_type` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `cooking_method` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `budget_level` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `calories_per_serving` integer;--> statement-breakpoint
ALTER TABLE `recipes` ADD `protein_grams` real;--> statement-breakpoint
ALTER TABLE `recipes` ADD `is_freezer_friendly` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `recipes_active_meal_type_idx` ON `recipes` (`is_active`,`meal_type`);--> statement-breakpoint
CREATE INDEX `recipes_active_cooking_method_idx` ON `recipes` (`is_active`,`cooking_method`);--> statement-breakpoint
CREATE INDEX `recipes_active_budget_idx` ON `recipes` (`is_active`,`budget_level`);