import { SupabaseStorage } from "./supabase-storage.js";
/**
 * @typedef {Object} UserProfile
 * @property {string} [name]
 * @property {string} email
 * @property {string} [phone]
 * @property {string} [emergencyName]
 * @property {string} [emergencyRelation]
 * @property {string} [emergencyPhone]
 */

class MemStorage {
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
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByEmail(email) {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser) {
    const id = this.currentUserId++;
    const now = new Date();
    const user = {
      ...insertUser,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    this.userProfiles.set(id, {
      email: user.email,
    });
    return user;
  }

  async getUserProfile(userId) {
    return this.userProfiles.get(userId);
  }

  async updateUserProfile(userId, profile) {
    const existingProfile = this.userProfiles.get(userId) || { email: "" };
    const updatedProfile = { ...existingProfile, ...profile };
    this.userProfiles.set(userId, updatedProfile);
    return updatedProfile;
  }

  // Dietary profile methods
  async getDietaryProfileByUserId(userId) {
    return Array.from(this.dietaryProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async createDietaryProfile(insertProfile) {
    const id = this.currentDietaryProfileId++;
    const now = new Date();
    const profile = {
      ...insertProfile,
      id,
      allergies: insertProfile.allergies || [],
      dietaryPreferences: insertProfile.dietaryPreferences || [],
      healthRestrictions: insertProfile.healthRestrictions || [],
      createdAt: now,
      updatedAt: now,
    };
    this.dietaryProfiles.set(id, profile);
    return profile;
  }

  async updateDietaryProfile(profile) {
    const now = new Date();
    const updatedProfile = {
      ...profile,
      updatedAt: now,
    };
    this.dietaryProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  // Food scan methods
  async getFoodScan(id) {
    return this.foodScans.get(id);
  }

  async getFoodScansByUserId(userId) {
    return Array.from(this.foodScans.values())
      .filter((scan) => scan.userId === userId)
      .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt));
  }

  async getRecentFoodScans(userId, limit) {
    return Array.from(this.foodScans.values())
      .filter((scan) => scan.userId === userId)
      .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))
      .slice(0, limit);
  }

  async createFoodScan(insertScan) {
    const id = this.currentFoodScanId++;
    const now = new Date();
    const scan = {
      ...insertScan,
      id,
      imageUrl: insertScan.imageUrl || undefined,
      ingredients: insertScan.ingredients || [],
      isSafe: insertScan.isSafe !== undefined ? insertScan.isSafe : null,
      safetyReason: insertScan.safetyReason || undefined,
      scannedAt: now,
    };
    this.foodScans.set(id, scan);
    return scan;
  }

  // Scan limit methods
  async getScanLimitByUserId(userId) {
    return Array.from(this.scanLimits.values()).find(
      (limit) => limit.userId === userId
    );
  }

  async createScanLimit(insertLimit) {
    const id = this.currentScanLimitId++;
    const limit = {
      ...insertLimit,
      id,
    };
    this.scanLimits.set(id, limit);
    return limit;
  }

  async updateScanLimit(limit) {
    this.scanLimits.set(limit.id, limit);
    return limit;
  }

  async incrementScanCount(userId) {
    const limit = await this.getScanLimitByUserId(userId);
    if (!limit) {
      throw new Error("Scan limit not found");
    }
    const updatedLimit = {
      ...limit,
      scansUsed: limit.scansUsed + 1,
    };
    return this.updateScanLimit(updatedLimit);
  }

  async deleteAllScansByUserId(userId) {
    const userIdNum =
      typeof userId === "string" ? parseInt(userId, 10) : userId;
    const userScans = Array.from(this.foodScans.values()).filter(
      (scan) => scan.userId === userIdNum
    );
    const count = userScans.length;
    userScans.forEach((scan) => {
      this.foodScans.delete(scan.id);
    });
    return { count };
  }
}

let useSupabase = false;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    useSupabase = true;
  }
} catch (error) {
  console.error("Error checking Supabase environment variables:", error);
}

export const storage = useSupabase ? new SupabaseStorage() : new MemStorage();
