import { pgTable, text, serial, integer, boolean, timestamp, json, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  // Use text type for UUID storage to match Supabase Auth
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Dietary profiles table
export const dietaryProfiles = pgTable("dietary_profiles", {
  id: text("id").primaryKey(),
  // Use text type for Supabase UUID compatibility
  userId: text("user_id").references(() => users.id).notNull(),
  allergies: json("allergies").$type<string[]>().default([]),
  dietaryPreferences: json("dietary_preferences").$type<string[]>().default([]),
  healthRestrictions: json("health_restrictions").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Food scans table
export const foodScans = pgTable("food_scans", {
  id: text("id").primaryKey(),
  // Use text type for Supabase UUID compatibility
  userId: text("user_id").references(() => users.id).notNull(),
  foodName: text("food_name").notNull(),
  imageUrl: text("image_url"),
  ingredients: json("ingredients").$type<string[]>().default([]),
  isSafe: boolean("is_safe"),
  safetyReason: text("safety_reason"),
  unsafeReasons: json("unsafe_reasons").$type<string[]>().default([]),
  description: text("description"),
  scannedAt: timestamp("scanned_at").defaultNow().notNull()
});

// User monthly scan limits
export const scanLimits = pgTable("scan_limits", {
  id: text("id").primaryKey(),
  // Use text type for Supabase UUID compatibility
  userId: text("user_id").references(() => users.id).notNull().unique(),
  scansUsed: integer("scans_used").default(0).notNull(),
  maxScans: integer("max_scans").default(10).notNull(),
  resetDate: timestamp("reset_date").notNull()
});

// Schema definitions for validation
export const insertUserSchema = createInsertSchema(users).omit({ 
  createdAt: true, 
  updatedAt: true 
});

// Add explicit id field type to make it optional
export const insertUserWithoutIdSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertDietaryProfileSchema = createInsertSchema(dietaryProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFoodScanSchema = createInsertSchema(foodScans).omit({
  id: true,
  scannedAt: true
});

export const insertScanLimitSchema = createInsertSchema(scanLimits).omit({
  id: true
});

// Types for usage in the application
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type DietaryProfile = typeof dietaryProfiles.$inferSelect;
export type InsertDietaryProfile = z.infer<typeof insertDietaryProfileSchema>;

export type FoodScan = typeof foodScans.$inferSelect;
export type InsertFoodScan = z.infer<typeof insertFoodScanSchema>;

export type ScanLimit = typeof scanLimits.$inferSelect;
export type InsertScanLimit = z.infer<typeof insertScanLimitSchema>;
