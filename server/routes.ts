import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeFoodImage } from "./services/food-analyzer";
import { authMiddleware } from "./middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage2 =
  process.env.NODE_ENV === "production"
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, uploadsDir);
        },
        filename: function (req, file, cb) {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(
            null,
            file.fieldname +
              "-" +
              uniqueSuffix +
              path.extname(file.originalname)
          );
        },
      });

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve Supabase credentials
  app.get("/api/supabase-credentials", (req: Request, res: Response) => {
    // Return the credentials stored in environment variables
    res.json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    });
  });

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
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
      await storage.createScanLimit({
        userId: user.id,
        scansUsed: 0,
        maxScans: 10,
        resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      });

      // Return user data (excluding password)
      const { password: _, ...userData } = user;
      res.status(201).json(userData);
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
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

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.status(200).json({ message: "Logged out successfully" });
  });

  app.get(
    "/api/auth/me",
    authMiddleware,
    async (req: Request, res: Response) => {
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
    }
  );

  // Dietary profile routes
  app.get(
    "/api/dietary-profile/:userId",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        console.log(
          "👉 GET /api/dietary-profile/:userId - params:",
          req.params
        );
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
              id: userId as string,
              email: userEmail,
              password: "placeholder_password", // Not used for authentication, just a placeholder
            });
            console.log("Created user in database:", user);

            // Create a default scan limit for the user
            await storage.createScanLimit({
              userId: user.id,
              scansUsed: 0,
              maxScans: 10,
              resetDate: new Date(
                new Date().setMonth(new Date().getMonth() + 1)
              ),
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
    }
  );

  app.post(
    "/api/dietary-profile",
    authMiddleware,
    async (req: Request, res: Response) => {
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
              id: userId as string,
              email: userEmail,
              password: "placeholder_password", // Not used for authentication, just a placeholder
            });
            console.log("Created user in database:", user);

            // Create a default scan limit for the user
            await storage.createScanLimit({
              userId: user.id,
              scansUsed: 0,
              maxScans: 10,
              resetDate: new Date(
                new Date().setMonth(new Date().getMonth() + 1)
              ),
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
    }
  );

  app.put(
    "/api/dietary-profile/:userId",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.userId;
        const userEmail = req.user?.email;
        const { allergies, dietaryPreferences, healthRestrictions } = req.body;

        // Ensure user can only update their own profile
        if (req.user?.id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
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
              id: userId as string,
              email: userEmail,
              password: "placeholder_password", // Not used for authentication, just a placeholder
            });
            console.log("Created user in database:", user);

            // Create a default scan limit for the user
            await storage.createScanLimit({
              userId: user.id,
              scansUsed: 0,
              maxScans: 10,
              resetDate: new Date(
                new Date().setMonth(new Date().getMonth() + 1)
              ),
            });
            console.log("Created default scan limit for user:", userId);
          } catch (err) {
            console.error("Error creating user record:", err);
            return res
              .status(500)
              .json({ message: "Failed to create user record" });
          }
        }

        console.log("Updating dietary profile with body:", req.body);

        let profile;
        const existingProfile = await storage.getDietaryProfileByUserId(userId);

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
          // Create a new profile
          console.log("No existing profile, creating new one");
          profile = await storage.createDietaryProfile({
            userId,
            allergies,
            dietaryPreferences,
            healthRestrictions,
          });
        }

        console.log("Dietary profile updated/created:", profile);
        // Invalidate any cached data by returning the updated profile
        res.status(200).json(profile);
      } catch (error) {
        console.error("Update dietary profile error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // User profile routes
  app.get(
    "/api/users/:userId/profile",
    authMiddleware,
    async (req: Request, res: Response) => {
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
    }
  );

  app.put(
    "/api/users/:userId/profile",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const {
          name,
          phone,
          emergencyName,
          emergencyRelation,
          emergencyPhone,
        } = req.body;

        // Ensure user can only update their own profile
        if (req.user?.id !== userId) {
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
    }
  );

  // Scan limits routes
  app.get(
    "/api/scan-limits/:userId",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.userId;

        // Ensure user can only access their own scan limits
        if (req.user?.id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const scanLimit = await storage.getScanLimitByUserId(userId);
        if (!scanLimit) {
          return res.status(404).json({ message: "Scan limit not found" });
        }

        res.status(200).json(scanLimit);
      } catch (error) {
        console.error("Get scan limit error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Food scan routes
  app.post(
    "/api/scan/upload",
    authMiddleware,
    upload.single("image"),
    async (req: Request, res: Response) => {
      try {
        // Get the user ID from the authenticated user
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ message: "Authentication required" });
        }

        // Check if user has reached scan limit
        const scanLimit = await storage.getScanLimitByUserId(userId);
        if (!scanLimit) {
          return res.status(404).json({ message: "Scan limit not found" });
        }

        if (scanLimit.scansUsed >= scanLimit.maxScans) {
          return res
            .status(403)
            .json({ message: "Monthly scan limit reached" });
        }

        // Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({ message: "No image file uploaded" });
        }

        // Get the image path
        const imagePath = req.file.path;
        const imageUrl = `/uploads/${path.basename(imagePath)}`;

        // Get user's dietary profile
        const dietaryProfile = await storage.getDietaryProfileByUserId(userId);
        if (!dietaryProfile) {
          return res.status(404).json({
            message:
              "Dietary profile not found. Please set up your dietary restrictions first.",
          });
        }

        // Use AI to analyze food image and check against dietary restrictions
        const analysisResult = await analyzeFoodImage(
          imagePath,
          dietaryProfile
        );

        const { foodName, ingredients, isSafe, unsafeReasons, description } =
          analysisResult;

        // Format the safety reason message
        const safetyReason = isSafe
          ? "This food appears safe based on your dietary restrictions."
          : `This food may not be safe: ${unsafeReasons.join(
              ". "
            )}. ${description}`;

        // Create food scan record
        const scan = await storage.createFoodScan({
          userId,
          foodName,
          imageUrl,
          ingredients,
          isSafe,
          safetyReason,
          unsafeReasons: !isSafe ? unsafeReasons : [],
          description,
        });

        // Increment user's scan count
        await storage.incrementScanCount(userId);

        res.status(200).json({ success: true, scanId: scan.id });
      } catch (error) {
        console.error("Food scan upload error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // The order of these routes is important!
  // More specific routes need to come first

  // Handle /api/scans to return all scans for authenticated user
  app.get("/api/scans", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log("🔍 Getting all scans for authenticated user:", userId);

      const scans = await storage.getFoodScansByUserId(userId);
      console.log(`🔍 Found ${scans.length} scans for user`);

      res.status(200).json(scans);
    } catch (error) {
      console.error("Get all scans error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(
    "/api/scans/user/:userId",
    authMiddleware,
    async (req: Request, res: Response) => {
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
    }
  );

  // Delete all scans for a user
  app.delete(
    "/api/scans/user/:userId",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        // Get the user ID from the parameter
        const userId = req.params.userId;
        console.log("🗑️ Attempting to delete all scans for user:", userId);

        // Ensure user can only delete their own scans
        if (req.user?.id !== userId) {
          console.log(
            "🗑️ Forbidden: User ID mismatch when attempting to delete scans"
          );
          return res
            .status(403)
            .json({ message: "Forbidden: You can only delete your own scans" });
        }

        // Delete all scans from storage
        const result = await storage.deleteAllScansByUserId(userId);
        console.log(
          `🗑️ Deleted ${result.count} scans from database for user ${userId}`
        );

        // Also delete the image files from the uploads folder
        try {
          // Only delete files if scans were deleted
          if (result.count > 0) {
            const uploadsDir = path.join(process.cwd(), "uploads");
            const files = fs.readdirSync(uploadsDir);

            // Look for files that belong to this user (prefixed with userId)
            const userFiles = files.filter(
              (file) =>
                file.startsWith(`${userId}-`) || file.includes(`-${userId}-`)
            );
            console.log(`🗑️ Found ${userFiles.length} image files to delete`);

            // Delete each file
            userFiles.forEach((file) => {
              const filePath = path.join(uploadsDir, file);
              fs.unlinkSync(filePath);
              console.log(`🗑️ Deleted image file: ${file}`);
            });
          }
        } catch (fileError) {
          console.error("Error deleting image files:", fileError);
          // Continue even if there was an error with files - we still deleted the DB records
        }

        return res.status(200).json({
          message: `Successfully deleted ${result.count} scan(s)`,
          count: result.count,
        });
      } catch (error) {
        console.error("Error deleting food scans:", error);
        return res
          .status(500)
          .json({ message: "Internal server error when deleting scans" });
      }
    }
  );

  app.get(
    "/api/scans/recent/:userId",
    authMiddleware,
    async (req: Request, res: Response) => {
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
    }
  );

  // Now add the generic scan by ID route, which should come after more specific routes
  app.get(
    "/api/scans/:scanId",
    authMiddleware,
    async (req: Request, res: Response) => {
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
    }
  );

  app.post(
    "/api/scans/:scanId/save",
    authMiddleware,
    async (req: Request, res: Response) => {
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
    }
  );

  // Food alternatives and dietary info routes
  app.get(
    "/api/food/alternatives/:scanId",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const scanId = req.params.scanId; // Keep as string (UUID)

        const scan = await storage.getFoodScan(scanId);
        if (!scan) {
          return res.status(404).json({ message: "Scan not found" });
        }

        // Ensure user can only access their own data
        if (req.user?.id !== scan.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Generate alternatives based on the food type
        const alternatives = [
          {
            name: "Green Salad",
            description: "Lettuce, tomatoes, cucumber with oil and vinegar",
            ingredients: [
              "lettuce",
              "tomato",
              "cucumber",
              "olive oil",
              "vinegar",
            ],
          },
          {
            name: "Grilled Chicken Salad",
            description: "With olive oil dressing (no egg-based dressing)",
            ingredients: [
              "chicken",
              "lettuce",
              "tomato",
              "cucumber",
              "olive oil",
            ],
          },
          {
            name: "Mediterranean Salad",
            description: "With lemon and olive oil dressing",
            ingredients: [
              "lettuce",
              "cucumber",
              "tomato",
              "olives",
              "lemon juice",
              "olive oil",
            ],
          },
        ];

        res.status(200).json(alternatives);
      } catch (error) {
        console.error("Get food alternatives error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.get(
    "/api/food/dietary-info/:scanId",
    authMiddleware,
    async (req: Request, res: Response) => {
      try {
        const scanId = req.params.scanId; // Keep as string (UUID)

        const scan = await storage.getFoodScan(scanId);
        if (!scan) {
          return res.status(404).json({ message: "Scan not found" });
        }

        // Ensure user can only access their own data
        if (req.user?.id !== scan.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Get user's dietary profile
        const dietaryProfile = await storage.getDietaryProfileByUserId(
          scan.userId
        );

        // Generate dietary information based on the food and user's profile
        let dietaryInfo = {
          title: "General Information",
          description: "No specific dietary concerns for this food item.",
          avoidList: [],
        };

        if (scan.isSafe === false && scan.safetyReason && dietaryProfile) {
          if (scan.safetyReason.toLowerCase().includes("egg")) {
            dietaryInfo = {
              title: "Common egg-containing foods to avoid:",
              description:
                "People with egg allergies should avoid foods containing eggs or egg derivatives. Traditional Caesar dressing contains raw or coddled eggs.",
              avoidList: [
                "Mayonnaise-based dressings",
                "Caesar dressing",
                "Aioli",
                "Hollandaise sauce",
                "Some baked goods",
              ],
            };
          } else if (scan.safetyReason.toLowerCase().includes("peanut")) {
            dietaryInfo = {
              title: "Common peanut-containing foods to avoid:",
              description:
                "People with peanut allergies should be careful with these items that may contain peanuts or peanut oil.",
              avoidList: [
                "Peanut butter",
                "Many baked goods",
                "Some Asian and African cuisines",
                "Some candy bars",
                "Some cereals and granola",
              ],
            };
          }
        }

        res.status(200).json(dietaryInfo);
      } catch (error) {
        console.error("Get dietary info error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Stats routes
  app.get(
    "/api/scan-stats/:userId",
    authMiddleware,
    async (req: Request, res: Response) => {
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
    }
  );

  const httpServer = createServer(app);

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    // Check if the request is for a file that exists
    const filePath = path.join(uploadsDir, path.basename(req.path));
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    next();
  });

  return httpServer;
}
