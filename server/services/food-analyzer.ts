import { OpenAI } from "openai";
import fs from "fs";
import { DietaryProfile } from "@shared/schema";

// Initialize OpenAI with OpenRouter configuration
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Define the response structure
export interface AnalysisResult {
  foodName: string;
  ingredients: string[];
  isSafe: boolean;
  unsafeReasons: string[];
  description: string;
}

/**
 * Analyzes a food image and checks against user dietary restrictions
 * @param imagePath - The path to the uploaded image
 * @param dietaryProfile - User's dietary profile containing restrictions
 * @returns Analysis result with safety information
 */
export async function analyzeFoodImage(
  imagePath: string,
  dietaryProfile: DietaryProfile
): Promise<AnalysisResult> {
  try {
    // Convert image to base64
    const base64Image = await imageToBase64(imagePath);

    // Get active restrictions from dietary profile
    const activeRestrictions = [
      ...(dietaryProfile.allergies || []),
      ...(dietaryProfile.dietaryPreferences || []),
      ...(dietaryProfile.healthRestrictions || []),
    ];

    // Create prompt for the AI
    const prompt = createAnalysisPrompt(activeRestrictions);

    // Call OpenRouter API using OpenAI SDK
    const analysis = await callOpenRouterAPI(base64Image, prompt);

    return processAnalysisResponse(analysis, activeRestrictions);
  } catch (error: any) {
    console.log(`Error analyzing food image: ${error}`, "food-analyzer");
    throw new Error(
      `Failed to analyze food image: ${error.message || String(error)}`
    );
  }
}

/**
 * Converts an image file to base64
 */
async function imageToBase64(filePath: string): Promise<string> {
  try {
    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(filePath);
    // Convert buffer to base64 string
    return fileBuffer.toString("base64");
  } catch (error: any) {
    console.log(`Error converting image to base64: ${error}`, "food-analyzer");
    throw new Error(
      `Failed to process image: ${error.message || String(error)}`
    );
  }
}

/**
 * Maps food restrictions to more detailed descriptions
 */
const RESTRICTION_DETAILS: Record<string, string> = {
  // Allergies
  peanuts: "peanuts and peanut derivatives",
  "tree-nuts": "tree nuts like almonds, walnuts, cashews",
  dairy: "milk, cheese, yogurt, and other dairy products",
  eggs: "eggs and egg-derived ingredients",
  fish: "fish and fish-derived ingredients",
  shellfish: "shellfish like shrimp, crab, lobster",
  soy: "soy and soy-derived products",
  wheat: "wheat and wheat-derived products",

  // Dietary preferences
  vegetarian: "meat, including beef, pork, poultry",
  vegan: "all animal products including meat, dairy, eggs, honey",
  pescatarian: "meat excluding fish and seafood",
  halal: "non-halal meat, alcohol, and certain food additives",
  kosher: "non-kosher meat, shellfish, certain food combinations",
  "gluten-free": "wheat, barley, rye, and other gluten-containing grains",

  // Health restrictions
  "low-sodium": "high-sodium ingredients and foods",
  "low-sugar": "high-sugar ingredients and foods",
  "low-carb": "high-carbohydrate foods like pasta, bread, potatoes",
  "low-fat": "high-fat ingredients and foods",
  "low-cholesterol": "high-cholesterol foods like egg yolks, organ meats",
  "low-calorie": "high-calorie dense foods",
  "kidney-disease": "high-phosphorus, high-potassium, and high-sodium foods",
  diabetes: "high glycemic index foods and added sugars",
};

/**
 * Creates a prompt for the AI based on user restrictions
 */
function createAnalysisPrompt(activeRestrictions: string[]): string {
  const restrictionsText =
    activeRestrictions.length > 0
      ? `The user has the following dietary restrictions: ${activeRestrictions
          .map((r) => `"${r}" (must avoid ${RESTRICTION_DETAILS[r] || r})`)
          .join(", ")}.`
      : "The user has no specific dietary restrictions.";

  return `
    Analyze this food image and provide the following information:
    1. What food item(s) are in the image?
    2. List all identifiable ingredients.
    3. ${restrictionsText}
    4. Is this food safe for the user to eat based on their restrictions?
    5. If not safe, explain specifically which ingredients conflict with which restrictions.
    
    Format your response as JSON with the following structure:
    {
      "foodName": "Name of the food",
      "ingredients": ["ingredient1", "ingredient2", ...],
      "isSafe": true/false,
      "unsafeReasons": ["reason1", "reason2", ...],
      "description": "Brief explanation of the analysis"
    }
  `;
}

/**
 * Calls the OpenRouter API with the image and prompt
 */
async function callOpenRouterAPI(
  base64Image: string,
  prompt: string
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick:free",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }, // Ensure JSON response
    });

    return completion.choices[0].message.content || "";
  } catch (error: any) {
    console.log(`Error calling OpenRouter API: ${error}`, "food-analyzer");
    throw new Error(
      `Failed to analyze the image: ${error.message || String(error)}`
    );
  }
}

/**
 * Processes the AI response into a structured format
 */
function processAnalysisResponse(
  analysisText: string,
  activeRestrictions: string[]
): AnalysisResult {
  try {
    // Try to extract JSON from the response
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(analysisText);
    } catch (e) {
      // If direct parsing fails, try to extract JSON from a text response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      }
    }

    if (jsonResponse) {
      return {
        isSafe: jsonResponse.isSafe,
        foodName: jsonResponse.foodName,
        ingredients: jsonResponse.ingredients || [],
        unsafeReasons: jsonResponse.unsafeReasons || [],
        description:
          jsonResponse.description || "No detailed description provided.",
      };
    }

    // Fallback if JSON parsing fails completely
    return {
      isSafe: false,
      foodName: "Unknown food",
      ingredients: [],
      unsafeReasons: ["Could not properly analyze the image"],
      description:
        "The AI could not properly analyze this image. Please try again with a clearer photo.",
    };
  } catch (error: any) {
    console.log(`Error processing AI response: ${error}`, "food-analyzer");
    return {
      isSafe: false,
      foodName: "Unknown food",
      ingredients: [],
      unsafeReasons: ["Error processing analysis"],
      description:
        "There was an error processing the analysis. Please try again.",
    };
  }
}
