import { eq } from 'drizzle-orm';
import { db } from './database';
import { 
  users, 
  dietaryProfiles, 
  foodScans,
  scanLimits,
  type User, 
  type InsertUser,
  type DietaryProfile,
  type InsertDietaryProfile,
  type FoodScan,
  type InsertFoodScan,
  type ScanLimit,
  type InsertScanLimit
} from "@shared/schema";
import { IStorage, UserProfile } from './storage';

// Add custom logger function
function logMessage(message: string, category?: string): void {
  const prefix = category ? `[${category}]` : '';
  console.log(`${prefix} ${message}`);
}

export class DbStorage implements IStorage {
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result.length ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const now = new Date();
    const result = await db.insert(users).values({
      ...user,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    if (!result.length) {
      throw new Error('Failed to create user');
    }
    
    return result[0];
  }

  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Since we don't have a separate profile table, we'll construct the profile from user data
    // In a real app, you might want to add a profiles table
    return {
      email: user.email,
    };
  }

  async updateUserProfile(userId: number, profile: Partial<UserProfile>): Promise<UserProfile> {
    // In a real app, you'd update a profiles table
    // For now, we'll just return the profile as if it was updated
    const existingUser = await this.getUser(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    return {
      email: existingUser.email,
      ...profile
    };
  }
  
  // Dietary profile methods
  async getDietaryProfileByUserId(userId: number): Promise<DietaryProfile | undefined> {
    const result = await db.select()
      .from(dietaryProfiles)
      .where(eq(dietaryProfiles.userId, userId))
      .limit(1);
    
    return result.length ? result[0] : undefined;
  }

  async createDietaryProfile(profile: InsertDietaryProfile): Promise<DietaryProfile> {
    const now = new Date();
    const result = await db.insert(dietaryProfiles).values({
      userId: profile.userId,
      allergies: profile.allergies || [],
      dietaryPreferences: profile.dietaryPreferences || [],
      healthRestrictions: profile.healthRestrictions || [],
      createdAt: now,
      updatedAt: now
    }).returning();
    
    if (!result.length) {
      throw new Error('Failed to create dietary profile');
    }
    
    return result[0];
  }

  async updateDietaryProfile(profile: DietaryProfile): Promise<DietaryProfile> {
    const now = new Date();
    const result = await db.update(dietaryProfiles)
      .set({
        ...profile,
        updatedAt: now
      })
      .where(eq(dietaryProfiles.id, profile.id))
      .returning();
    
    if (!result.length) {
      throw new Error('Failed to update dietary profile');
    }
    
    return result[0];
  }
  
  // Food scan methods
  async getFoodScan(id: number): Promise<FoodScan | undefined> {
    const result = await db.select().from(foodScans).where(eq(foodScans.id, id)).limit(1);
    return result.length ? result[0] : undefined;
  }

  async getFoodScansByUserId(userId: number): Promise<FoodScan[]> {
    return db.select()
      .from(foodScans)
      .where(eq(foodScans.userId, userId))
      .orderBy(foodScans.scannedAt);
  }

  async getRecentFoodScans(userId: number, limit: number): Promise<FoodScan[]> {
    return db.select()
      .from(foodScans)
      .where(eq(foodScans.userId, userId))
      .orderBy(foodScans.scannedAt)
      .limit(limit);
  }

  async createFoodScan(scan: InsertFoodScan): Promise<FoodScan> {
    const now = new Date();
    const result = await db.insert(foodScans).values({
      userId: scan.userId,
      foodName: scan.foodName,
      imageUrl: scan.imageUrl,
      ingredients: scan.ingredients || [],
      isSafe: scan.isSafe,
      safetyReason: scan.safetyReason,
      scannedAt: now
    }).returning();
    
    if (!result.length) {
      throw new Error('Failed to create food scan');
    }
    
    return result[0];
  }
  
  // Scan limit methods
  async getScanLimitByUserId(userId: number): Promise<ScanLimit | undefined> {
    const result = await db.select()
      .from(scanLimits)
      .where(eq(scanLimits.userId, userId))
      .limit(1);
    
    return result.length ? result[0] : undefined;
  }

  async createScanLimit(limit: InsertScanLimit): Promise<ScanLimit> {
    const result = await db.insert(scanLimits).values(limit).returning();
    
    if (!result.length) {
      throw new Error('Failed to create scan limit');
    }
    
    return result[0];
  }

  async updateScanLimit(limit: ScanLimit): Promise<ScanLimit> {
    const result = await db.update(scanLimits)
      .set(limit)
      .where(eq(scanLimits.id, limit.id))
      .returning();
    
    if (!result.length) {
      throw new Error('Failed to update scan limit');
    }
    
    return result[0];
  }

  async incrementScanCount(userId: number): Promise<ScanLimit> {
    const limit = await this.getScanLimitByUserId(userId);
    if (!limit) {
      throw new Error("Scan limit not found");
    }
    
    const result = await db.update(scanLimits)
      .set({
        scansUsed: limit.scansUsed + 1
      })
      .where(eq(scanLimits.userId, userId))
      .returning();
    
    if (!result.length) {
      throw new Error('Failed to increment scan count');
    }
    
    return result[0];
  }
}