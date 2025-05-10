import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { supabase } from "../supabase";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number | string;
        email: string;
      };
    }
  }
}

// Middleware to authenticate requests using Supabase Auth
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("🔐 Auth Middleware - Request path:", req.path);
    console.log("🔐 Auth headers:", req.headers);
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("🔐 No Bearer token in Authorization header");
      
      // Check for user ID in header for backward compatibility
      const userId = req.headers["x-user-id"];
      
      if (userId) {
        console.log("🔐 Using X-User-ID header for auth:", userId);
        const user = await storage.getUser(Number(userId));
        if (user) {
          console.log("🔐 User found via X-User-ID:", user.id);
          req.user = {
            id: user.id,
            email: user.email
          };
          return next();
        }
      }
      
      // For development purposes, allow certain requests without authentication
      if (process.env.NODE_ENV === 'development') {
        console.log("🔐 In development mode, checking params/body for userId");
        
        // Extract user ID from request parameters or body
        const paramUserId = req.params.userId;
        const bodyUserId = req.body?.userId;
        
        console.log("🔐 Request params:", req.params);
        console.log("🔐 Request body:", req.body);
        
        if (paramUserId) {
          console.log("🔐 Using userId from params:", paramUserId);
          req.user = {
            id: paramUserId,
            email: "development@example.com"
          };
          return next();
        }
        
        if (bodyUserId) {
          console.log("🔐 Using userId from body:", bodyUserId);
          req.user = {
            id: bodyUserId,
            email: "development@example.com"
          };
          return next();
        }
      }
      
      console.log("🔐 Authentication failed - no valid auth method");
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    console.log("🔐 Processing Bearer token:", token.substring(0, 10) + "...");
    
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error("🔐 Supabase auth error:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    if (!data?.user) {
      console.error("🔐 No user data returned from Supabase");
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    console.log("🔐 Supabase auth successful - User:", data.user.id);
    
    // Set user information in the request object
    req.user = {
      id: data.user.id,
      email: data.user.email || ''
    };
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
