import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Environment setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log(
    "Missing Supabase environment variables, functionality will be limited",
    "supabase"
  );
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables"
  );
}

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
  db: {
    schema: "public",
  },
});

// Test connection
async function testConnection() {
  try {
    console.log(
      `Testing Supabase connection with URL: ${supabaseUrl.substring(
        0,
        15
      )}...`,
      "supabase"
    );

    // Try a different query that doesn't require the table to exist yet
    const { data, error } = await supabase.from("users").select("*").limit(1);

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "relation does not exist"
      console.log(`Supabase test query error: ${error.message}`, "supabase");
      console.error("Supabase error details:", error);
    } else {
      console.log("Supabase connection successful", "supabase");
      if (data) {
        console.log(`Found ${data.length} user records`, "supabase");
      }
    }

    // Test auth functionality
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getSession();
      console.log(
        `Auth session check: ${authData ? "Session exists" : "No session"}`,
        "supabase"
      );

      if (authError) {
        console.log(`Auth check error: ${authError.message}`, "supabase");
        console.error("Auth error details:", authError);
      }
    } catch (authErr) {
      console.log(`Auth check exception: ${authErr}`, "supabase");
      console.error("Auth exception details:", authErr);
    }
  } catch (error) {
    console.log(`Supabase connection error: ${error}`, "supabase");
    console.error("Connection exception details:", error);
  }
}

// Run test connection
// testConnection();
