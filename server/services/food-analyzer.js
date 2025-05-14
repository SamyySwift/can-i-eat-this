import { storage } from "../storage.js";
import { OpenAI } from "openai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Initialize OpenAI with OpenRouter configuration
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Analyzes a food image and checks against user dietary restrictions
 * @param {Object} options - The options object
 * @param {string} options.userId - The user ID
 * @param {string} options.imagePath - The path to the uploaded image (for disk storage)
 * @param {Buffer} options.imageBuffer - The image buffer (for memory storage)
 * @returns {Promise<Object>} Analysis result with safety information
 */
async function analyzeFoodImage(options) {
  const { userId, imagePath, imageBuffer } = options;

  try {
    // Get user's dietary profile
    const dietaryProfile = await storage.getDietaryProfileByUserId(userId);

    if (!dietaryProfile) {
      console.log(`No dietary profile found for user ${userId}`);
      return {
        foodName: "Unknown Food",
        ingredients: [],
        isSafe: null,
        safetyReason: "No dietary profile found. Please set up your dietary profile first.",
        unsafeReasons: [],
        description: "No dietary profile found. Please set up your dietary profile first."
      };
    }

    // Convert image to base64
    let base64Image;
    if (imageBuffer) {
      // If we have the image buffer (e.g., from memory storage in production)
      base64Image = imageBuffer.toString("base64");
    } else if (imagePath) {
      // If we have the image path (e.g., from disk storage in development)
      base64Image = await imageToBase64(imagePath);
    } else {
      throw new Error("No image data provided");
    }

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
  } catch (error) {
    console.log(`Error analyzing food image: ${error}`, "food-analyzer");
    throw new Error(`Failed to analyze food image: ${error.message || String(error)}`);
  }
}

/**
 * Converts an image file to base64
 */
async function imageToBase64(filePath) {
  try {
    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(filePath);
    // Convert buffer to base64 string
    return fileBuffer.toString("base64");
  } catch (error) {
    console.log(`Error converting image to base64: ${error}`, "food-analyzer");
    throw new Error(`Failed to process image: ${error.message || String(error)}`);
  }
}

/**
 * Maps food restrictions to more detailed descriptions
 */
const RESTRICTION_DETAILS = {
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
function createAnalysisPrompt(activeRestrictions) {
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
async function callOpenRouterAPI(base64Image, prompt) {
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
  } catch (error) {
    console.log(`Error calling OpenRouter API: ${error}`, "food-analyzer");
    throw new Error(`Failed to analyze the image: ${error.message || String(error)}`);
  }
}

/**
 * Processes the AI response into a structured format
 */
function processAnalysisResponse(analysisText, activeRestrictions) {
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
        description: jsonResponse.description || "No detailed description provided.",
        safetyReason: jsonResponse.isSafe ? "This food appears safe based on your dietary profile." : 
          (jsonResponse.unsafeReasons && jsonResponse.unsafeReasons.length > 0 ? 
            jsonResponse.unsafeReasons[0] : "This food may not be compatible with your dietary profile.")
      };
    }

    // Fallback if JSON parsing fails completely
    return {
      isSafe: false,
      foodName: "Unknown food",
      ingredients: [],
      unsafeReasons: ["Could not properly analyze the image"],
      description: "The AI could not properly analyze this image. Please try again with a clearer photo.",
      safetyReason: "Could not properly analyze the image"
    };
  } catch (error) {
    console.log(`Error processing AI response: ${error}`, "food-analyzer");
    return {
      isSafe: false,
      foodName: "Unknown food",
      ingredients: [],
      unsafeReasons: ["Error processing analysis"],
      description: "There was an error processing the analysis. Please try again.",
      safetyReason: "Error processing analysis"
    };
  }
}

/**
 * Processes a chat query about food and provides a response
 * @param {Object} options - The options object
 * @param {string} options.userId - The user ID
 * @param {string} options.query - The user's chat query about food
 * @param {Array} options.history - Previous messages in the conversation
 * @returns {Promise<Object>} Chat response with answer
 */
async function processChatQuery(options) {
  const { userId, query, history = [] } = options;

  try {
    // Get user's dietary profile for context
    const dietaryProfile = await storage.getDietaryProfileByUserId(userId);
    
    // Create prompt for the AI with conversation history
    const prompt = createChatPrompt(query, dietaryProfile, history);
    
    // Call OpenRouter API using OpenAI SDK
    const response = await callOpenRouterChatAPI(prompt, history);
    
    return {
      answer: response,
      query: query
    };
  } catch (error) {
    console.log(`Error processing chat query: ${error}`, "food-analyzer");
    throw new Error(`Failed to process chat query: ${error.message || String(error)}`);
  }
}

/**
 * Creates a prompt for the AI based on user's query, dietary profile, and conversation history
 */
function createChatPrompt(query, dietaryProfile, history = []) {
  let dietaryContext = "The user has not set up a dietary profile.";
  
  if (dietaryProfile) {
    const restrictions = [
      ...(dietaryProfile.allergies || []),
      ...(dietaryProfile.dietaryPreferences || []),
      ...(dietaryProfile.healthRestrictions || []),
    ];
    
    if (restrictions.length > 0) {
      dietaryContext = `The user has the following dietary restrictions: ${restrictions
        .map((r) => `"${r}" (must avoid ${RESTRICTION_DETAILS[r] || r})`)
        .join(", ")}.`;
    } else {
      dietaryContext = "The user has no specific dietary restrictions.";
    }
  }

  // Create system instructions
  const systemInstructions = `
    You are a helpful food assistant that only answers questions related to food, nutrition, cooking, and dietary needs.
    
    ${dietaryContext}
    
    Important rules:
    1. Only answer questions related to food, nutrition, cooking, or dietary needs.
    2. If the question is not related to these topics, politely explain that you can only help with food-related questions.
    3. Be accurate, helpful, and concise in your answers.
    4. When discussing foods that might conflict with the user's dietary profile, mention those concerns.
    5. Do not make up information. If you're unsure, say so.
    6. Remember the conversation history to provide context-aware responses.
  `;

  return systemInstructions;
}

/**
 * Calls the OpenRouter API with the chat prompt and conversation history
 */
async function callOpenRouterChatAPI(systemPrompt, history = []) {
  try {
    // Format the messages array for the API
    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Add conversation history if available
    if (history && history.length > 0) {
      // Add previous messages to provide context
      history.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add the current user query as the last message
    messages.push({
      role: "user",
      content: history.length > 0 ? history[history.length - 1].content : "Hello"
    });

    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick:free",
      messages: messages,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.log(`Error calling OpenRouter API for chat: ${error}`, "food-analyzer");
    throw new Error(`Failed to process your question: ${error.message || String(error)}`);
  }
}

export { analyzeFoodImage, processChatQuery };
