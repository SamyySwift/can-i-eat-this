import fs from "fs";
import path from "path";

// Sample food data to simulate a food recognition API
const sampleFoods = [
  {
    name: "Greek Salad",
    ingredients: ["cucumber", "tomato", "olives", "feta cheese", "olive oil", "red onion"]
  },
  {
    name: "Caesar Salad",
    ingredients: ["romaine lettuce", "parmesan cheese", "croutons", "eggs", "garlic", "olive oil"]
  },
  {
    name: "Chicken Caesar Salad",
    ingredients: ["chicken", "romaine lettuce", "parmesan cheese", "croutons", "eggs", "garlic"]
  },
  {
    name: "Margherita Pizza",
    ingredients: ["wheat", "tomato sauce", "mozzarella cheese", "basil"]
  },
  {
    name: "Peanut Butter Cookies",
    ingredients: ["peanuts", "wheat", "eggs", "sugar", "butter"]
  },
  {
    name: "Burger",
    ingredients: ["beef", "wheat bun", "lettuce", "tomato", "onion", "cheese"]
  },
  {
    name: "Pasta",
    ingredients: ["wheat", "tomato sauce", "garlic", "onion", "herbs"]
  },
  {
    name: "Sushi",
    ingredients: ["rice", "seaweed", "fish", "soy sauce", "wasabi", "ginger"]
  },
  {
    name: "Ice Cream",
    ingredients: ["milk", "cream", "sugar", "vanilla", "egg yolks"]
  },
  {
    name: "Chocolate Cake",
    ingredients: ["wheat flour", "cocoa", "sugar", "eggs", "butter", "milk"]
  }
];

// In a real implementation, this would use an actual food recognition API
// For this example, we'll simulate the recognition based on the image filename
export async function recognizeFood(imagePath: string): Promise<{
  success: boolean;
  food?: {
    name: string;
    ingredients: string[];
  };
  error?: string;
}> {
  try {
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, we would send the image to an AI service like Clarifai or Google Vision
    // For this simulation, we'll randomly select a food from our sample data
    const randomIndex = Math.floor(Math.random() * sampleFoods.length);
    const recognizedFood = sampleFoods[randomIndex];
    
    return {
      success: true,
      food: {
        name: recognizedFood.name,
        ingredients: recognizedFood.ingredients
      }
    };
  } catch (error) {
    console.error("Food recognition error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during food recognition"
    };
  }
}
