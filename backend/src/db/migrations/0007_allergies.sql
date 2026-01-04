CREATE TABLE `guest_allergies` (
	`guest_id` text NOT NULL,
	`allergy` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`guest_id`) REFERENCES `guests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guest_allergies_guest_id_allergy_unique` ON `guest_allergies` (`guest_id`,`allergy`);
--> statement-breakpoint
CREATE TABLE `dish_allergens` (
	`dish_id` text NOT NULL,
	`allergy` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dish_allergens_dish_id_allergy_unique` ON `dish_allergens` (`dish_id`,`allergy`);
