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

export interface UserProfile {
  name?: string;
  email: string;
  phone?: string;
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
}

export interface IStorage {
  // User methods
  getUser(id: string | number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserProfile(userId: string | number): Promise<UserProfile | undefined>;
  updateUserProfile(userId: string | number, profile: Partial<UserProfile>): Promise<UserProfile>;
  
  // Dietary profile methods
  getDietaryProfileByUserId(userId: string): Promise<DietaryProfile | undefined>;
  createDietaryProfile(profile: InsertDietaryProfile): Promise<DietaryProfile>;
  updateDietaryProfile(profile: DietaryProfile): Promise<DietaryProfile>;
  
  // Food scan methods
  getFoodScan(id: string): Promise<FoodScan | undefined>;
  getFoodScansByUserId(userId: string): Promise<FoodScan[]>;
  getRecentFoodScans(userId: string, limit: number): Promise<FoodScan[]>;
  createFoodScan(scan: InsertFoodScan): Promise<FoodScan>;
  deleteAllScansByUserId(userId: string): Promise<{ count: number }>;
  
  // Scan limit methods
  getScanLimitByUserId(userId: string): Promise<ScanLimit | undefined>;
  createScanLimit(limit: InsertScanLimit): Promise<ScanLimit>;
  updateScanLimit(limit: ScanLimit): Promise<ScanLimit>;
  incrementScanCount(userId: string): Promise<ScanLimit>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userProfiles: Map<number, UserProfile>;
  private dietaryProfiles: Map<number, DietaryProfile>;
  private foodScans: Map<number, FoodScan>;
  private scanLimits: Map<number, ScanLimit>;
  currentUserId: number;
  currentDietaryProfileId: number;
  currentFoodScanId: number;
  currentScanLimitId: number;

  constructor() {
    this.users = new Map();
    this.userProfiles = new Map();
    this.dietaryProfiles = new Map();
    this.foodScans = new Map();
    this.scanLimits = new Map();
    this.currentUserId = 1;
    this.currentDietaryProfileId = 1;
    this.currentFoodScanId = 1;
    this.currentScanLimitId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    
    // Initialize user profile with email
    this.userProfiles.set(id, {
      email: user.email
    });
    
    return user;
  }

  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    return this.userProfiles.get(userId);
  }

  async updateUserProfile(userId: number, profile: Partial<UserProfile>): Promise<UserProfile> {
    const existingProfile = this.userProfiles.get(userId) || { email: "" };
    const updatedProfile = { ...existingProfile, ...profile };
    this.userProfiles.set(userId, updatedProfile);
    return updatedProfile;
  }

  // Dietary profile methods
  async getDietaryProfileByUserId(userId: number): Promise<DietaryProfile | undefined> {
    return Array.from(this.dietaryProfiles.values()).find(
      (profile) => profile.userId === userId,
    );
  }

  async createDietaryProfile(insertProfile: InsertDietaryProfile): Promise<DietaryProfile> {
    const id = this.currentDietaryProfileId++;
    const now = new Date();
    const profile: DietaryProfile = {
      ...insertProfile,
      id,
      allergies: insertProfile.allergies || [],
      dietaryPreferences: insertProfile.dietaryPreferences || [],
      healthRestrictions: insertProfile.healthRestrictions || [],
      createdAt: now,
      updatedAt: now
    };
    this.dietaryProfiles.set(id, profile);
    return profile;
  }

  async updateDietaryProfile(profile: DietaryProfile): Promise<DietaryProfile> {
    const now = new Date();
    const updatedProfile: DietaryProfile = {
      ...profile,
      updatedAt: now
    };
    this.dietaryProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  // Food scan methods
  async getFoodScan(id: number): Promise<FoodScan | undefined> {
    return this.foodScans.get(id);
  }

  async getFoodScansByUserId(userId: number): Promise<FoodScan[]> {
    return Array.from(this.foodScans.values())
      .filter((scan) => scan.userId === userId)
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
  }

  async getRecentFoodScans(userId: number, limit: number): Promise<FoodScan[]> {
    return Array.from(this.foodScans.values())
      .filter((scan) => scan.userId === userId)
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
      .slice(0, limit);
  }

  async createFoodScan(insertScan: InsertFoodScan): Promise<FoodScan> {
    const id = this.currentFoodScanId++;
    const now = new Date();
    const scan: FoodScan = {
      ...insertScan,
      id,
      imageUrl: insertScan.imageUrl || undefined,
      ingredients: insertScan.ingredients || [],
      isSafe: insertScan.isSafe !== undefined ? insertScan.isSafe : null,
      safetyReason: insertScan.safetyReason || undefined,
      scannedAt: now
    };
    this.foodScans.set(id, scan);
    return scan;
  }

  // Scan limit methods
  async getScanLimitByUserId(userId: number): Promise<ScanLimit | undefined> {
    return Array.from(this.scanLimits.values()).find(
      (limit) => limit.userId === userId,
    );
  }

  async createScanLimit(insertLimit: InsertScanLimit): Promise<ScanLimit> {
    const id = this.currentScanLimitId++;
    const limit: ScanLimit = {
      ...insertLimit,
      id
    };
    this.scanLimits.set(id, limit);
    return limit;
  }

  async updateScanLimit(limit: ScanLimit): Promise<ScanLimit> {
    this.scanLimits.set(limit.id, limit);
    return limit;
  }

  async incrementScanCount(userId: number): Promise<ScanLimit> {
    const limit = await this.getScanLimitByUserId(userId);
    if (!limit) {
      throw new Error("Scan limit not found");
    }
    
    const updatedLimit: ScanLimit = {
      ...limit,
      scansUsed: limit.scansUsed + 1
    };
    
    return this.updateScanLimit(updatedLimit);
  }
  
  async deleteAllScansByUserId(userId: number | string): Promise<{ count: number }> {
    // Convert userId to number if it's a string
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    
    // Find all scans for this user
    const userScans = Array.from(this.foodScans.values())
      .filter(scan => scan.userId === userIdNum);
      
    // Count how many we're deleting
    const count = userScans.length;
    
    // Delete each scan
    userScans.forEach(scan => {
      this.foodScans.delete(scan.id);
    });
    
    return { count };
  }
}

// Import the Supabase storage implementation
import { SupabaseStorage } from './supabase-storage';

// Use Supabase storage if environment variables are set, otherwise fallback to memory storage
let useSupabase = false;
try {
  // Check if Supabase environment variables are set
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    useSupabase = true;
  }
} catch (error) {
  console.error('Error checking Supabase environment variables:', error);
}

// Export the appropriate storage implementation
export const storage = useSupabase 
  ? new SupabaseStorage() 
  : new MemStorage();
