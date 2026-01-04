import { text, sqliteTable, integer, unique } from "drizzle-orm/sqlite-core";
import { randomUUID } from "crypto";

export const usersTable = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type User = typeof usersTable.$inferInsert;

export const guestsTable = sqliteTable("guests", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  rankToken: text("rank_token").$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type Guest = typeof guestsTable.$inferInsert;

export const ALLERGIES = [
  "gluten",
  "dairy",
  "eggs",
  "fish",
  "shellfish",
  "peanuts",
  "tree-nuts",
  "soy",
  "sesame",
] as const;

export type Allergy = (typeof ALLERGIES)[number];

export const DISH_CATEGORIES = ["main", "side", "dessert", "other"] as const;

export const dishesTable = sqliteTable("dishes", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", { enum: DISH_CATEGORIES })
    .notNull()
    .default("other"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type Dish = typeof dishesTable.$inferInsert;

export const guestAllergiesTable = sqliteTable(
  "guest_allergies",
  {
    guestId: text("guest_id")
      .notNull()
      .references(() => guestsTable.id, { onDelete: "cascade" }),
    allergy: text("allergy", { enum: ALLERGIES }).notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdate(() => new Date().toISOString()),
  },
  (t) => [unique().on(t.guestId, t.allergy)],
);

export type GuestAllergy = typeof guestAllergiesTable.$inferInsert;

export const dishAllergensTable = sqliteTable(
  "dish_allergens",
  {
    dishId: text("dish_id")
      .notNull()
      .references(() => dishesTable.id, { onDelete: "cascade" }),
    allergy: text("allergy", { enum: ALLERGIES }).notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdate(() => new Date().toISOString()),
  },
  (t) => [unique().on(t.dishId, t.allergy)],
);

export type DishAllergen = typeof dishAllergensTable.$inferInsert;

export const dishesRankTable = sqliteTable(
  "dishes_rank",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => randomUUID()),
    guestId: text("guest_id")
      .notNull()
      .references(() => guestsTable.id, { onDelete: "cascade" }),
    dishId: text("dish_id")
      .notNull()
      .references(() => dishesTable.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdate(() => new Date().toISOString()),
  },
  (t) => [unique().on(t.guestId, t.dishId)],
);

export type DishRank = typeof dishesRankTable.$inferInsert;

export const refreshTokensTable = sqliteTable("refresh_tokens", {
  token: text("token").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  revokedAt: integer("revoked_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type RefreshToken = typeof refreshTokensTable.$inferInsert;

export const mealsTable = sqliteTable("meals", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString()),
});

export type Meal = typeof mealsTable.$inferInsert;

export const mealGuestsTable = sqliteTable(
  "meal_guests",
  {
    mealId: text("meal_id")
      .notNull()
      .references(() => mealsTable.id, { onDelete: "cascade" }),
    guestId: text("guest_id")
      .notNull()
      .references(() => guestsTable.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString())
      .$onUpdate(() => new Date().toISOString()),
  },
  (t) => [unique().on(t.mealId, t.guestId)],
);

export type MealGuest = typeof mealGuestsTable.$inferInsert;
