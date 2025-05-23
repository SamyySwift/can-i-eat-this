import { createServer } from "http";
import { storage } from "./storage.js";
import {
  analyzeFoodImage,
  processChatQuery,
} from "./services/food-analyzer.js";
import { authMiddleware } from "./middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { supabase } from "./supabase.js";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use memory storage for all environments since we'll be uploading to Supabase
const storage2 = multer.memoryStorage();

const upload = multer({
  storage: storage2,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Accept only images
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|avif|webp)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

async function registerRoutes(app) {
  // Create HTTP server
  const server = createServer(app);

  // Serve Supabase credentials
  app.get("/api/supabase-credentials", (req, res) => {
    // Return the credentials stored in environment variables
    res.json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    });
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "User with this email already exists" });
      }

      // Create new user
      const user = await storage.createUser({ email, password });

      // Create a default scan limit for the user
      try {
        await storage.createScanLimit({
          userId: user.id,
          scansUsed: 0,
          maxScans: 10,
          resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        });
        console.log("Created or updated scan limit for user:", userId);
      } catch (err) {
        // Log the error but continue - this is not a critical failure
        console.error("Warning: Issue with scan limit:", err.message);
      }

      // Return user data (excluding password)
      const { password: _, ...userData } = user;
      res.status(201).json(userData);
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Check if user exists and password matches
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Return user data (excluding password)
      const { password: _, ...userData } = user;
      res.status(200).json(userData);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user data (excluding password)
      const { password: _, ...userData } = user;
      res.status(200).json(userData);
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dietary profile routes
  app.get("/api/dietary-profile/:userId", authMiddleware, async (req, res) => {
    try {
      console.log("👉 GET /api/dietary-profile/:userId - params:", req.params);
      console.log(
        "👉 GET /api/dietary-profile/:userId - authenticated user:",
        req.user
      );

      const userId = req.params.userId;
      const userEmail = req.user?.email;

      // Ensure user can only access their own profile
      if (req.user?.id !== userId) {
        console.log(
          "👉 Forbidden - token user ID:",
          req.user?.id,
          "vs requested userId:",
          userId
        );
        console.log(
          "👉 ID types - token user ID:",
          typeof req.user?.id,
          "vs requested userId:",
          typeof userId
        );
        return res.status(403).json({
          message: "Forbidden - You can only access your own profile",
        });
      }

      // Make sure the user exists in our database
      let user = await storage.getUser(userId);
      if (!user && userEmail) {
        console.log(
          "User doesn't exist in database yet, creating user record:",
          userId
        );
        try {
          user = await storage.createUser({
            id: userId,
            email: userEmail,
            password: "placeholder_password", // Not used for authentication, just a placeholder
          });
          console.log("Created user in database:", user);

          // Create a default scan limit for the user
          await storage.createScanLimit({
            userId: user.id,
            scansUsed: 0,
            maxScans: 10,
            resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          });
          console.log("Created default scan limit for user:", userId);
        } catch (err) {
          console.error("Error creating user record:", err);
          return res
            .status(500)
            .json({ message: "Failed to create user record" });
        }
      }

      console.log("👉 Fetching dietary profile for user:", userId);
      let profile = await storage.getDietaryProfileByUserId(userId);

      if (!profile) {
        console.log(
          "👉 No existing dietary profile found, creating default profile for user:",
          userId
        );

        // Create a default profile
        profile = await storage.createDietaryProfile({
          userId,
          allergies: [],
          dietaryPreferences: [],
          healthRestrictions: [],
        });

        console.log("👉 Created default dietary profile:", profile);
      }

      console.log("👉 Returning dietary profile:", profile);
      res.status(200).json(profile);
    } catch (error) {
      console.error("Get dietary profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/dietary-profile", authMiddleware, async (req, res) => {
    try {
      // Get the authenticated user ID from the request
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (!userId || !userEmail) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get the dietary preferences from the request body
      const { allergies, dietaryPreferences, healthRestrictions } = req.body;

      // Make sure the user exists in our database
      let user = await storage.getUser(userId);
      if (!user) {
        console.log(
          "User doesn't exist in database yet, creating user record:",
          userId
        );
        try {
          user = await storage.createUser({
            id: userId,
            email: userEmail,
            password: "placeholder_password", // Not used for authentication, just a placeholder
          });
          console.log("Created user in database:", user);

          // Create a default scan limit for the user
          await storage.createScanLimit({
            userId: user.id,
            scansUsed: 0,
            maxScans: 10,
            resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          });
          console.log("Created default scan limit for user:", userId);
        } catch (err) {
          console.error("Error creating user record:", err);
          return res
            .status(500)
            .json({ message: "Failed to create user record" });
        }
      }

      // Check if profile already exists
      const existingProfile = await storage.getDietaryProfileByUserId(userId);

      // For debugging
      console.log("Creating/updating dietary profile for user:", userId);
      console.log("Auth user ID type:", typeof userId);

      let profile;
      if (existingProfile) {
        // Update existing profile
        console.log("Updating existing profile:", existingProfile.id);
        profile = await storage.updateDietaryProfile({
          id: existingProfile.id,
          userId,
          allergies,
          dietaryPreferences,
          healthRestrictions,
        });
      } else {
        // Create new profile
        console.log("Creating new profile");
        profile = await storage.createDietaryProfile({
          userId,
          allergies,
          dietaryPreferences,
          healthRestrictions,
        });
      }

      res.status(200).json(profile);
    } catch (error) {
      console.error("Create/update dietary profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update dietary profile
  app.put("/api/dietary-profile/:userId", authMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId;

      // Ensure user can only update their own profile
      if (req.user?.id !== userId) {
        return res.status(403).json({
          message: "Forbidden - You can only update your own profile",
        });
      }

      const { allergies, dietaryPreferences, healthRestrictions } = req.body;

      // Get existing profile
      let profile = await storage.getDietaryProfileByUserId(userId);

      if (!profile) {
        // Create a new profile if it doesn't exist
        profile = await storage.createDietaryProfile({
          userId,
          allergies: allergies || [],
          dietaryPreferences: dietaryPreferences || [],
          healthRestrictions: healthRestrictions || [],
        });
      } else {
        // Update existing profile
        profile.allergies = allergies || profile.allergies;
        profile.dietaryPreferences =
          dietaryPreferences || profile.dietaryPreferences;
        profile.healthRestrictions =
          healthRestrictions || profile.healthRestrictions;

        profile = await storage.updateDietaryProfile(profile);
      }

      res.status(200).json(profile);
    } catch (error) {
      console.error("Update dietary profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User profile routes
  app.get("/api/users/:userId/profile", authMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId;

      // Ensure user can only access their own profile
      if (req.user?.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      res.status(200).json(userProfile);
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  //user update profile route
  app.put("/api/users/:userId/profile", authMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId; // Don't parse as int, keep as string
      const { name, phone, emergencyName, emergencyRelation, emergencyPhone } =
        req.body;

      console.log("Update profile - params userId:", userId);
      console.log("Update profile - auth user:", req.user?.id);

      // Ensure user can only update their own profile
      if (req.user?.id !== userId) {
        console.log("User ID mismatch:", req.user?.id, "vs", userId);
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedProfile = await storage.updateUserProfile(userId, {
        name,
        phone,
        emergencyName,
        emergencyRelation,
        emergencyPhone,
      });

      res.status(200).json(updatedProfile);
    } catch (error) {
      console.error("Update user profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Food scan routes
  app.post(
    "/api/scan/upload",
    authMiddleware,
    upload.single("image"),
    async (req, res) => {
      try {
        const { userId } = req.body;

        if (!req.file) {
          return res.status(400).json({ message: "No image uploaded" });
        }

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        // Ensure user can only upload for themselves
        if (req.user?.id !== userId) {
          return res.status(403).json({
            message: "Forbidden - You can only upload for your own account",
          });
        }

        // Check if user has reached scan limit
        const scanLimit = await storage.getScanLimitByUserId(userId);
        if (scanLimit && scanLimit.scansUsed >= scanLimit.maxScans) {
          return res.status(403).json({
            message: "You have reached your monthly scan limit",
          });
        }

        // Get user's dietary profile
        const dietaryProfile = await storage.getDietaryProfileByUserId(userId);
        if (!dietaryProfile) {
          return res.status(400).json({
            message: "Please set up your dietary profile before scanning food",
          });
        }

        // Get the file buffer and prepare the file path
        const fileBuffer = req.file.buffer;
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${fileExt}`;
        const filePath = `food-scans/${userId}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("food-images")
          .upload(filePath, fileBuffer);

        if (uploadError) {
          console.error("Supabase storage upload error:", uploadError);
          return res
            .status(500)
            .json({ message: "Failed to upload image to storage" });
        }

        // Get the public URL for the uploaded image
        const { data: publicUrlData } = supabase.storage
          .from("food-images")
          .getPublicUrl(filePath);

        const imageUrl = publicUrlData.publicUrl;

        // Analyze the food image
        const analysisResult = await analyzeFoodImage({
          userId,
          imageBuffer: fileBuffer,
        });

        // Save the scan to the database with the Supabase URL
        const scan = await storage.createFoodScan({
          userId,
          foodName: analysisResult.foodName,
          imageUrl,
          ingredients: analysisResult.ingredients,
          isSafe: analysisResult.isSafe,
          safetyReason: analysisResult.safetyReason,
          unsafeReasons: analysisResult.unsafeReasons || [],
          description:
            analysisResult.description || "No detailed description provided.",
        });

        // Increment the user's scan count
        await storage.incrementScanCount(userId);

        res.status(201).json({ scanId: scan.id });
      } catch (error) {
        console.error("Scan upload error:", error);
        res.status(500).json({
          message: error.message || "Failed to process the food scan",
        });
      }
    }
  );

  // Handle /api/scans to return all scans for authenticated user
  app.get("/api/scans", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // console.log("🔍 Getting all scans for authenticated user:", userId);

      const scans = await storage.getFoodScansByUserId(userId);
      // console.log(`🔍 Found ${scans.length} scans for user`);

      res.status(200).json(scans);
    } catch (error) {
      console.error("Get all scans error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // // Get user's scan history
  app.get("/api/scans/user/:userId", authMiddleware, async (req, res) => {
    try {
      // When using UUIDs, don't parse as int
      const userId = req.params.userId;
      console.log("🔍 Getting scans for user:", userId);
      console.log("🔍 Authenticated user:", req.user?.id);

      // Ensure user can only access their own scans
      if (req.user?.id !== userId) {
        console.log("🔍 Forbidden: User ID mismatch");
        return res.status(403).json({ message: "Forbidden" });
      }

      const scans = await storage.getFoodScansByUserId(userId);
      console.log("🔍 Found scans for user:", scans?.length || 0);
      res.status(200).json(scans);
    } catch (error) {
      console.error("Get user scans error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete all scans for a user
  app.delete("/api/scans/user/:userId", authMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId;

      // Ensure user can only delete their own scans
      if (req.user?.id !== userId) {
        return res.status(403).json({
          message: "Forbidden - You can only delete your own scans",
        });
      }

      // First, get all scans for this user to collect image URLs
      const userScans = await storage.getFoodScansByUserId(userId);

      // Delete images from Supabase storage
      if (userScans && userScans.length > 0) {
        console.log(`Deleting ${userScans.length} scans for user ${userId}`);

        for (const scan of userScans) {
          if (scan.imageUrl) {
            try {
              // Extract the file path from the URL using the URL object
              const url = new URL(scan.imageUrl);
              const fullPath = url.pathname.split(
                "/storage/v1/object/public/food-images/"
              )[1];

              if (fullPath) {
                console.log(`Deleting image: ${fullPath}`);
                const { data, error } = await supabase.storage
                  .from("food-images")
                  .remove([fullPath]);

                if (error) {
                  console.error(`Error deleting image ${fullPath}:`, error);
                } else {
                  console.log(`Successfully deleted image: ${fullPath}`);
                }
              }
            } catch (imgError) {
              console.error(
                `Error processing image URL ${scan.imageUrl}:`,
                imgError
              );
              // Continue with other images even if one fails
            }
          }
        }
      }

      // Now delete all scans from the database
      const result = await storage.deleteAllScansByUserId(userId);
      res.status(200).json({
        message: "All scans deleted successfully",
        count: result.count || userScans.length,
      });
    } catch (error) {
      console.error("Delete all scans error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's scan limit
  app.get("/api/scan-limits/:userId", authMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId;

      // Ensure user can only access their own scan limit
      if (req.user?.id !== userId) {
        return res.status(403).json({
          message: "Forbidden - You can only access your own scan limit",
        });
      }

      let scanLimit = await storage.getScanLimitByUserId(userId);

      if (!scanLimit) {
        // Create a default scan limit if it doesn't exist
        scanLimit = await storage.createScanLimit({
          userId,
          scansUsed: 0,
          maxScans: 10,
          resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        });
      }

      res.status(200).json(scanLimit);
    } catch (error) {
      console.error("Get scan limit error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/scans/recent/:userId", authMiddleware, async (req, res) => {
    try {
      // When using UUIDs, don't parse as int
      const userId = req.params.userId;
      console.log("🔍 Getting recent scans for user:", userId);

      // Ensure user can only access their own scans
      if (req.user?.id !== userId) {
        console.log("🔍 Forbidden: User ID mismatch");
        return res.status(403).json({ message: "Forbidden" });
      }

      const scans = await storage.getRecentFoodScans(userId, 3);
      console.log("🔍 Found recent scans for user:", scans?.length || 0);
      res.status(200).json(scans);
    } catch (error) {
      console.error("Get recent scans error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Now add the generic scan by ID route, which should come after more specific routes
  app.get("/api/scans/:scanId", authMiddleware, async (req, res) => {
    try {
      const scanId = req.params.scanId; // Keep as string (UUID)
      console.log("👁️ Looking up scan with ID:", scanId);
      console.log("👁️ Request path:", req.path);
      console.log("👁️ Request params:", req.params);
      console.log("👁️ Authenticated user:", req.user);

      const scan = await storage.getFoodScan(scanId);
      if (!scan) {
        console.log("👁️ Scan not found:", scanId);
        return res.status(404).json({ message: "Scan not found" });
      }

      console.log("👁️ Found scan:", scan);
      console.log("👁️ User comparison:", {
        reqUserId: req.user?.id,
        scanUserId: scan.userId,
        match: req.user?.id === scan.userId,
      });

      // Ensure user can only access their own scans
      if (req.user?.id !== scan.userId) {
        console.log("👁️ Forbidden: User ID mismatch");
        return res.status(403).json({ message: "Forbidden" });
      }

      console.log("👁️ Sending scan response");
      res.status(200).json(scan);
    } catch (error) {
      console.error("Get scan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/scans/:scanId/save", authMiddleware, async (req, res) => {
    try {
      const scanId = req.params.scanId; // Keep as string (UUID)

      const scan = await storage.getFoodScan(scanId);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }

      // Ensure user can only save their own scans
      if (req.user?.id !== scan.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // In a real implementation, we might add additional metadata or mark as saved
      // For simplicity, we'll just return a success response
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Save scan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/scan-stats/:userId", authMiddleware, async (req, res) => {
    try {
      // When using UUIDs, don't parse as int
      const userId = req.params.userId;
      console.log("📊 Getting scan stats for user:", userId);

      // Ensure user can only access their own stats
      if (req.user?.id !== userId) {
        console.log("📊 Forbidden: User ID mismatch");
        return res.status(403).json({ message: "Forbidden" });
      }

      const scans = await storage.getFoodScansByUserId(userId);
      console.log("📊 Found scans for stats:", scans?.length || 0);

      // Count scans by safety status
      const stats = {
        safe: scans.filter((scan) => scan.isSafe === true).length,
        caution: scans.filter((scan) => scan.isSafe === null).length,
        unsafe: scans.filter((scan) => scan.isSafe === false).length,
      };

      res.status(200).json(stats);
    } catch (error) {
      console.error("Get scan stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create HTTP server
  // Add this to the registerRoutes function, before the return statement

  // Chat query route
  app.post("/api/chat", authMiddleware, async (req, res) => {
    try {
      const { userId, query, history } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!query || typeof query !== "string") {
        return res
          .status(400)
          .json({ message: "Valid query text is required" });
      }

      // Ensure user can only chat for themselves
      if (req.user?.id !== userId) {
        return res.status(403).json({
          message: "Forbidden - You can only use chat for your own account",
        });
      }

      // Process the chat query with history
      const response = await processChatQuery({
        userId,
        query,
        history: history || [],
      });

      res.status(200).json(response);
    } catch (error) {
      console.error("Chat query error:", error);
      res.status(500).json({
        message: error.message || "Failed to process your question",
      });
    }
  });

  // Model settings route
  app.put("/api/settings/model", authMiddleware, async (req, res) => {
    try {
      const { model } = req.body;

      if (!model) {
        return res.status(400).json({ message: "Model name is required" });
      }

      // Validate model name against allowed models
      const allowedModels = [
        "meta-llama/llama-4-maverick:free",
        "google/gemini-2.0-flash-exp:free",
        "opengvlab/internvl3-14b:free",
        "google/gemma-3-27b-it:free",
        "mistralai/mistral-small-3.1-24b-instruct:free",
      ];

      if (!allowedModels.includes(model)) {
        return res.status(400).json({ message: "Invalid model name" });
      }

      // Store the model preference in a global variable or database
      // For simplicity, we'll use a global variable here
      global.selectedModel = model;

      res.status(200).json({ message: "Model updated successfully" });
    } catch (error) {
      console.error("Model update error:", error);
      res.status(500).json({
        message: error.message || "Failed to update model",
      });
    }
  });

  return server;
}

export { registerRoutes };
