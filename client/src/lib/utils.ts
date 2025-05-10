import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for combining Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string
 * @param dateStr The date string to format
 * @returns A formatted date string
 */
export function formatDate(dateStr?: string | Date) {
  if (!dateStr) {
    return "Recent";
  }
  
  try {
    const date = new Date(dateStr);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateStr);
      return "Recent";
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error("Date parsing error:", error);
    return "Recent";
  }
}

/**
 * Get appropriate food emoji based on food name
 * @param foodName The name of the food
 * @returns An emoji representing the food
 */
export function getFoodEmoji(foodName?: string): string {
  if (!foodName) return "🍽️";
  
  const foodNameLower = foodName.toLowerCase();
  
  if (foodNameLower.includes("pizza")) return "🍕";
  if (foodNameLower.includes("salad")) return "🥗";
  if (foodNameLower.includes("burger") || foodNameLower.includes("hamburger")) return "🍔";
  if (foodNameLower.includes("rice")) return "🍚";
  if (foodNameLower.includes("pasta") || foodNameLower.includes("spaghetti")) return "🍝";
  if (foodNameLower.includes("taco")) return "🌮";
  if (foodNameLower.includes("burrito")) return "🌯";
  if (foodNameLower.includes("soup")) return "🍲";
  if (foodNameLower.includes("sushi")) return "🍣";
  if (foodNameLower.includes("sandwich")) return "🥪";
  if (foodNameLower.includes("bread")) return "🍞";
  if (foodNameLower.includes("cake")) return "🍰";
  if (foodNameLower.includes("ice cream")) return "🍦";
  if (foodNameLower.includes("fruit")) return "🍎";
  if (foodNameLower.includes("vegetable")) return "🥦";
  if (foodNameLower.includes("meat")) return "🥩";
  if (foodNameLower.includes("chicken")) return "🍗";
  if (foodNameLower.includes("fish")) return "🐟";
  
  // Default to a generic food emoji
  return "🍲";
}