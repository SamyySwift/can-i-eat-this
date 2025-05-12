import { storage } from "../storage.js";
import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

/**
 * Analyzes a food image to determine if it's safe to eat based on user's dietary profile
 */
async function analyzeFoodImage(options) {
  const { userId, imagePath, imageBuffer } = options;

  try {
    console.log(`Analyzing food image for user ${userId}`);

    // Get user's dietary profile
    const dietaryProfile = await storage.getDietaryProfileByUserId(userId);

    if (!dietaryProfile) {
      console.log(`No dietary profile found for user ${userId}`);
      return {
        foodName: "Unknown Food",
        ingredients: [],
        isSafe: null,
        safetyReason:
          "No dietary profile found. Please set up your dietary profile first.",
      };
    }

    // Prepare the image for analysis
    let imageData;

    if (imageBuffer) {
      // If we have the image buffer (e.g., from memory storage in production)
      imageData = imageBuffer.toString("base64");
    } else if (imagePath) {
      // If we have the image path (e.g., from disk storage in development)
      imageData = fs.readFileSync(imagePath, { encoding: "base64" });
    } else {
      throw new Error("No image data provided");
    }

    // Prepare the dietary restrictions for the prompt
    const allergies = dietaryProfile.allergies || [];
    const dietaryPreferences = dietaryProfile.dietaryPreferences || [];
    const healthRestrictions = dietaryProfile.healthRestrictions || [];

    // Combine all restrictions
    const allRestrictions = [
      ...allergies.map((a) => `Allergy: ${a}`),
      ...dietaryPreferences.map((p) => `Dietary Preference: ${p}`),
      ...healthRestrictions.map((r) => `Health Restriction: ${r}`),
    ];

    const restrictionsText =
      allRestrictions.length > 0
        ? `The user has the following dietary restrictions:\n${allRestrictions.join(
            "\n"
          )}`
        : "The user has no specific dietary restrictions.";

    // Create the prompt for the AI
    const prompt = `
You are a food safety expert analyzing a food image. Your task is to:
1. Identify the food in the image
2. List the likely ingredients
3. Determine if the food is safe for the user to eat based on their dietary restrictions
4. Provide a brief explanation for your safety determination

${restrictionsText}

Respond in the following JSON format:
{
  "foodName": "Name of the food",
  "ingredients": ["ingredient1", "ingredient2", ...],
  "isSafe": true/false/null,
  "safetyReason": "Brief explanation of safety determination",
  "unsafeReasons": ["reason1", "reason2", ...] (only if isSafe is false)
}

If you cannot identify the food or determine safety with confidence, set isSafe to null.
`;

    // Call the AI to analyze the image
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick:free",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    // Parse the AI response
    const responseText = response.choices[0].message.content;
    console.log("AI Response:", responseText);

    try {
      // Extract JSON from the response
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/{[\s\S]*?}/);

      const jsonString = jsonMatch
        ? jsonMatch[1] || jsonMatch[0]
        : responseText;
      const result = JSON.parse(jsonString);

      // Validate the result
      if (!result.foodName) result.foodName = "Unknown Food";
      if (!result.ingredients) result.ingredients = [];
      if (result.isSafe === undefined) result.isSafe = null;
      if (!result.safetyReason)
        result.safetyReason = "Could not determine safety";
      if (result.isSafe === false && !result.unsafeReasons)
        result.unsafeReasons = [];

      // Store the scan in the database
      await storage.createFoodScan({
        userId,
        foodName: result.foodName,
        ingredients: result.ingredients,
        isSafe: result.isSafe,
        safetyReason: result.safetyReason,
        unsafeReasons: result.unsafeReasons || [],
        description: result.description || null,
      });

      // Increment the user's scan count
      await storage.incrementScanCount(userId);

      return result;
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return {
        foodName: "Analysis Error",
        ingredients: [],
        isSafe: null,
        safetyReason: "Could not analyze the food image. Please try again.",
      };
    }
  } catch (error) {
    console.error("Food analysis error:", error);
    return {
      foodName: "Analysis Error",
      ingredients: [],
      isSafe: null,
      safetyReason: "An error occurred during analysis. Please try again.",
    };
  }
}

export { analyzeFoodImage };
