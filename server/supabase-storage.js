import { supabase } from "./supabase.js";

// Add custom logger function
function logMessage(message, category) {
  const prefix = category ? `[${category}]` : "";
  console.log(`${prefix} ${message}`);
}

export class SupabaseStorage {
  // User methods
  async getUser(id) {
    console.log("Getting user with ID:", id, "Type:", typeof id);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error getting user:", error);
      return undefined;
    }

    if (!data) {
      console.log("No user found with ID:", id);
      return undefined;
    }

    console.log("Found user:", data);
    return data;
  }

  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return undefined;
    }

    return data;
  }

  async createUser(user) {
    try {
      // First check if a user with this email already exists
      const existingUser = await this.getUserByEmail(user.email);
      if (existingUser) {
        console.log(
          `User with email ${user.email} already exists. Returning existing user.`,
          "storage"
        );

        // If the existing user has a different ID, update their ID to match the auth user
        if (user.id && existingUser.id !== user.id) {
          console.log(
            `Existing user has different ID (${existingUser.id}) than auth user (${user.id}). Will return existing user.`,
            "storage"
          );
        }

        return existingUser;
      }

      // No existing user, proceed with creating a new one
      const now = new Date();

      // Log the user data for debugging
      console.log(
        `Creating new user with data: ${JSON.stringify(user)}`,
        "storage"
      );

      // Make sure id is included if provided
      const insertData = {
        email: user.email,
        password: user.password,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      // If id is provided, include it in the insert (which it should be)
      if (user.id) {
        insertData.id = user.id;
        console.log(`Including id in user creation: ${user.id}`, "storage");
      } else {
        console.log(
          `WARNING: No user ID provided for new user with email ${user.email}`,
          "storage"
        );
      }

      const { data, error } = await supabase
        .from("users")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.log(`Error creating user: ${error?.message}`, "storage");
        throw new Error(error?.message || "Failed to create user");
      }

      if (!data) {
        console.log(`No data returned when creating user`, "storage");
        throw new Error("Failed to create user - no data returned");
      }

      console.log(
        `User created successfully: ${JSON.stringify(data)}`,
        "storage"
      );
      return data;
    } catch (error) {
      console.log(`Exception in createUser: ${error}`, "storage");
      throw error;
    }
  }

  async getUserProfile(userId) {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // For now, we're deriving profile from user data
    return {
      email: user.email,
    };
  }

  async updateUserProfile(userId, profile) {
    // In a full implementation, this would write to a profiles table
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      email: user.email,
      ...profile,
    };
  }

  // Dietary profile methods
  async getDietaryProfileByUserId(userId) {
    console.log(
      "Getting dietary profile for user ID:",
      userId,
      "Type:",
      typeof userId
    );

    try {
      // Directly query the existing dietary_profiles table
      const { data, error } = await supabase
        .from("dietary_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // Only log the error if it's not just "no rows found"
        if (error.code !== "PGRST116") {
          console.error("Error getting dietary profile:", error);
        }
        return undefined;
      }

      if (!data) {
        console.log("No dietary profile found for user ID:", userId);
        return undefined;
      }

      console.log("Found dietary profile:", data);

      // Map from snake_case DB fields to camelCase object
      return {
        id: data.id,
        userId: data.user_id,
        allergies: data.allergies || [],
        dietaryPreferences: data.dietary_preferences || [],
        healthRestrictions: data.health_restrictions || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error("Error in getDietaryProfileByUserId:", error);
      return undefined;
    }
  }

  async createDietaryProfile(profile) {
    console.log(
      "Creating dietary profile with user ID:",
      profile.userId,
      "Type:",
      typeof profile.userId
    );

    try {
      const now = new Date();

      // Directly use the existing dietary_profiles table
      // Don't include ID - let the database generate it with serial
      const { data, error } = await supabase
        .from("dietary_profiles")
        .insert({
          user_id: profile.userId,
          allergies: profile.allergies || [],
          dietary_preferences: profile.dietaryPreferences || [],
          health_restrictions: profile.healthRestrictions || [],
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating dietary profile:", error);
        throw new Error(error?.message || "Failed to create dietary profile");
      }

      if (!data) {
        console.error("No data returned when creating dietary profile");
        throw new Error("Failed to create dietary profile - no data returned");
      }

      console.log("Created dietary profile:", data);

      // Map from snake_case DB fields to camelCase object
      return {
        id: data.id,
        userId: data.user_id,
        allergies: data.allergies || [],
        dietaryPreferences: data.dietary_preferences || [],
        healthRestrictions: data.health_restrictions || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error("Error in createDietaryProfile:", error);
      throw error;
    }
  }

  async updateDietaryProfile(profile) {
    console.log("Updating dietary profile:", profile);
    const now = new Date();

    try {
      // Update directly in the dietary_profiles table
      const { data, error } = await supabase
        .from("dietary_profiles")
        .update({
          allergies: profile.allergies,
          dietary_preferences: profile.dietaryPreferences,
          health_restrictions: profile.healthRestrictions,
          updated_at: now.toISOString(),
        })
        .eq("id", profile.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating dietary profile:", error);

        // If the profile doesn't exist, create it
        if (error.code === "PGRST116") {
          // "no rows returned" error
          console.log("No profile found to update, creating a new one");
          return await this.createDietaryProfile({
            userId: profile.userId,
            allergies: profile.allergies,
            dietaryPreferences: profile.dietaryPreferences,
            healthRestrictions: profile.healthRestrictions,
          });
        }

        throw new Error(error?.message || "Failed to update dietary profile");
      }

      if (!data) {
        console.log("No data returned when updating profile, creating new");
        return await this.createDietaryProfile({
          userId: profile.userId,
          allergies: profile.allergies,
          dietaryPreferences: profile.dietaryPreferences,
          healthRestrictions: profile.healthRestrictions,
        });
      }

      console.log("Updated dietary profile:", data);

      // Map from snake_case DB fields to camelCase object
      return {
        id: data.id,
        userId: data.user_id,
        allergies: data.allergies || [],
        dietaryPreferences: data.dietary_preferences || [],
        healthRestrictions: data.health_restrictions || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error("Error in updateDietaryProfile:", error);
      throw error;
    }
  }

  // Food scan methods
  async getFoodScan(id) {
    const { data, error } = await supabase
      .from("food_scans")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.log("Error getting scan with ID:", id, error);
      return undefined;
    }

    console.log("Found scan with ID:", id, data);

    // Map from snake_case DB fields to camelCase object
    return {
      id: data.id,
      userId: data.user_id,
      foodName: data.food_name,
      imageUrl: data.image_url,
      ingredients: data.ingredients || [],
      isSafe: data.is_safe,
      safetyReason: data.safety_reason,
      unsafeReasons: data.unsafe_reasons || [],
      description: data.description || "",
      scannedAt: new Date(data.scanned_at),
    };
  }

  async getFoodScansByUserId(userId) {
    const { data, error } = await supabase
      .from("food_scans")
      .select("*")
      .eq("user_id", userId)
      .order("scanned_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    // Map from snake_case DB fields to camelCase objects
    return data.map((scan) => ({
      id: scan.id,
      userId: scan.user_id,
      foodName: scan.food_name,
      imageUrl: scan.image_url,
      ingredients: scan.ingredients || [],
      isSafe: scan.is_safe,
      safetyReason: scan.safety_reason,
      unsafeReasons: scan.unsafe_reasons || [],
      description: scan.description || "",
      scannedAt: new Date(scan.scanned_at),
    }));
  }

  async getRecentFoodScans(userId, limit) {
    const { data, error } = await supabase
      .from("food_scans")
      .select("*")
      .eq("user_id", userId)
      .order("scanned_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    // Map from snake_case DB fields to camelCase objects
    return data.map((scan) => ({
      id: scan.id,
      userId: scan.user_id,
      foodName: scan.food_name,
      imageUrl: scan.image_url,
      ingredients: scan.ingredients || [],
      isSafe: scan.is_safe,
      safetyReason: scan.safety_reason,
      unsafeReasons: scan.unsafe_reasons || [],
      description: scan.description || "",
      scannedAt: new Date(scan.scanned_at),
    }));
  }

  async createFoodScan(scan) {
    const now = new Date();
    console.log("Creating food scan with data:", scan);

    const { data, error } = await supabase
      .from("food_scans")
      .insert({
        user_id: scan.userId,
        food_name: scan.foodName,
        image_url: scan.imageUrl,
        ingredients: scan.ingredients || [],
        is_safe: scan.isSafe,
        safety_reason: scan.safetyReason,
        unsafe_reasons: scan.unsafeReasons || [],
        description: scan.description || "",
        scanned_at: now.toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      console.log(`Error creating food scan: ${error?.message}`, "storage");
      throw new Error(error?.message || "Failed to create food scan");
    }

    console.log("Food scan created successfully:", data);

    // Map from snake_case DB fields to camelCase object
    return {
      id: data.id,
      userId: data.user_id,
      foodName: data.food_name,
      imageUrl: data.image_url,
      ingredients: data.ingredients || [],
      isSafe: data.is_safe,
      safetyReason: data.safety_reason,
      unsafeReasons: data.unsafe_reasons || [],
      description: data.description || "",
      scannedAt: new Date(data.scanned_at),
    };
  }

  async deleteAllScansByUserId(userId) {
    const { data, error } = await supabase
      .from("food_scans")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting scans:", error);
      throw new Error(error?.message || "Failed to delete scans");
    }

    return { count: data?.length || 0 };
  }

  // Scan limit methods
  async getScanLimitByUserId(userId) {
    try {
      // First check if the scan_limits_v2 table exists, if not, create it
      const { error: tableError } = await supabase
        .from("scan_limits_v2")
        .select("id")
        .limit(1);

      if (tableError && tableError.code === "42P01") {
        console.log("Creating new scan_limits_v2 table");

        // Create the table using raw SQL through RPC
        await supabase.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS scan_limits_v2 (
              id SERIAL PRIMARY KEY,
              user_id TEXT NOT NULL,
              scans_used INTEGER DEFAULT 0,
              max_scans INTEGER DEFAULT 5,
              reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
            );
            CREATE INDEX IF NOT EXISTS scan_limits_v2_user_id_idx ON scan_limits_v2 (user_id);
          `,
        });
      }

      // Query the v2 table
      const { data, error } = await supabase
        .from("scan_limits_v2")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // Not "no rows returned" error
        console.error("Error getting scan limit from v2 table:", error);

        // Try fallback to original table
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("scan_limits")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (fallbackError && fallbackError.code !== "PGRST116") {
          console.error(
            "Error getting scan limit from original table:",
            fallbackError
          );
          return undefined;
        }

        if (!fallbackData) {
          // Create a default scan limit
          return await this.createScanLimit({
            userId,
            scansUsed: 0,
            maxScans: 5,
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          });
        }

        return {
          id: fallbackData.id,
          userId: fallbackData.user_id,
          scansUsed: fallbackData.scans_used,
          maxScans: fallbackData.max_scans,
          resetDate: new Date(fallbackData.reset_date),
        };
      }

      if (!data) {
        // Create a default scan limit
        return await this.createScanLimit({
          userId,
          scansUsed: 0,
          maxScans: 5,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        });
      }

      // Map from snake_case DB fields to camelCase object
      return {
        id: data.id,
        userId: data.user_id,
        scansUsed: data.scans_used,
        maxScans: data.max_scans,
        resetDate: new Date(data.reset_date),
      };
    } catch (error) {
      console.error("Error in getScanLimitByUserId:", error);
      return undefined;
    }
  }

  async createScanLimit(limit) {
    try {
      // First try to insert into the v2 table
      const { data, error } = await supabase
        .from("scan_limits_v2")
        .insert({
          user_id: limit.userId,
          scans_used: limit.scansUsed,
          max_scans: limit.maxScans,
          reset_date: limit.resetDate.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(
          "Error creating scan limit in v2 table, trying fallback:",
          error
        );

        // Try fallback to original table
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("scan_limits")
          .insert({
            user_id: limit.userId,
            scans_used: limit.scansUsed,
            max_scans: limit.maxScans,
            reset_date: limit.resetDate.toISOString(),
          })
          .select()
          .single();

        if (fallbackError) {
          console.log(
            `Error creating scan limit: ${fallbackError?.message}`,
            "storage"
          );
          throw new Error(
            fallbackError?.message || "Failed to create scan limit"
          );
        }

        if (!fallbackData) {
          throw new Error("No data returned when creating scan limit");
        }

        // Map from snake_case DB fields to camelCase object
        return {
          id: fallbackData.id,
          userId: fallbackData.user_id,
          scansUsed: fallbackData.scans_used,
          maxScans: fallbackData.max_scans,
          resetDate: new Date(fallbackData.reset_date),
        };
      }

      if (!data) {
        throw new Error("No data returned when creating scan limit");
      }

      // Map from snake_case DB fields to camelCase object
      return {
        id: data.id,
        userId: data.user_id,
        scansUsed: data.scans_used,
        maxScans: data.max_scans,
        resetDate: new Date(data.reset_date),
      };
    } catch (error) {
      console.error("Error in createScanLimit:", error);
      throw error;
    }
  }

  async updateScanLimit(limit) {
    try {
      // First try to update in the v2 table
      const { data, error } = await supabase
        .from("scan_limits_v2")
        .update({
          scans_used: limit.scansUsed,
          max_scans: limit.maxScans,
          reset_date: limit.resetDate.toISOString(),
        })
        .eq("id", limit.id)
        .select()
        .single();

      if (error && error.code !== "PGRST116") {
        // Not "no rows returned" error
        console.log(
          "Error updating scan limit in v2 table, trying fallback:",
          error
        );

        // Try fallback to original table
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("scan_limits")
          .update({
            scans_used: limit.scansUsed,
            max_scans: limit.maxScans,
            reset_date: limit.resetDate.toISOString(),
          })
          .eq("id", limit.id)
          .select()
          .single();

        if (fallbackError) {
          console.log(
            `Error updating scan limit: ${fallbackError?.message}`,
            "storage"
          );
          throw new Error(
            fallbackError?.message || "Failed to update scan limit"
          );
        }

        if (!fallbackData) {
          throw new Error("No data returned when updating scan limit");
        }

        // Map from snake_case DB fields to camelCase object
        return {
          id: fallbackData.id,
          userId: fallbackData.user_id,
          scansUsed: fallbackData.scans_used,
          maxScans: fallbackData.max_scans,
          resetDate: new Date(fallbackData.reset_date),
        };
      }

      if (!data || error) {
        // If the scan limit doesn't exist in either table, create it
        return await this.createScanLimit({
          userId: limit.userId,
          scansUsed: limit.scansUsed,
          maxScans: limit.maxScans,
          resetDate: limit.resetDate,
        });
      }

      // Map from snake_case DB fields to camelCase object
      return {
        id: data.id,
        userId: data.user_id,
        scansUsed: data.scans_used,
        maxScans: data.max_scans,
        resetDate: new Date(data.reset_date),
      };
    } catch (error) {
      console.error("Error in updateScanLimit:", error);
      throw error;
    }
  }

  async incrementScanCount(userId) {
    try {
      // Get the current scan limit
      const scanLimit = await this.getScanLimitByUserId(userId);
      if (!scanLimit) {
        throw new Error(`No scan limit found for user ${userId}`);
      }

      // Check if we need to reset the counter (if reset date has passed)
      const now = new Date();
      if (now > scanLimit.resetDate) {
        // Reset the counter and set a new reset date
        const updatedLimit = {
          ...scanLimit,
          scansUsed: 1, // Start with 1 for the current scan
          resetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        };
        return await this.updateScanLimit(updatedLimit);
      }

      // Otherwise just increment the counter
      const updatedLimit = {
        ...scanLimit,
        scansUsed: scanLimit.scansUsed + 1,
      };
      return await this.updateScanLimit(updatedLimit);
    } catch (error) {
      console.error("Error incrementing scan count:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const storage = new SupabaseStorage();

export { storage };
