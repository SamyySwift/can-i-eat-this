import { FoodSafetyCheckResponse, DietaryProfile } from "@/types";

// Map of common food items to their ingredients (simplified version)
export const foodToIngredientsMap: Record<string, string[]> = {
  'pizza': ['wheat', 'cheese', 'tomato', 'yeast'],
  'burger': ['beef', 'wheat', 'lettuce', 'tomato', 'onion', 'cheese'],
  'salad': ['lettuce', 'tomato', 'cucumber', 'olive oil'],
  'pasta': ['wheat', 'egg', 'tomato', 'garlic'],
  'sushi': ['rice', 'seaweed', 'fish', 'soy sauce'],
  'sandwich': ['wheat', 'cheese', 'lettuce', 'tomato', 'meat'],
  'ice cream': ['milk', 'sugar', 'cream', 'egg'],
  'chocolate': ['cocoa', 'sugar', 'milk', 'soy lecithin'],
  'cookies': ['wheat', 'butter', 'sugar', 'egg'],
  'cake': ['wheat', 'butter', 'sugar', 'egg', 'milk'],
  'greek salad': ['cucumber', 'tomato', 'olives', 'feta cheese', 'olive oil'],
  'caesar salad': ['romaine lettuce', 'parmesan cheese', 'croutons', 'eggs', 'garlic'],
  'margherita pizza': ['wheat', 'tomato sauce', 'mozzarella cheese', 'basil'],
  'peanut butter cookies': ['peanuts', 'wheat', 'eggs', 'sugar', 'butter'],
  'chicken caesar salad': ['chicken', 'romaine lettuce', 'parmesan cheese', 'croutons', 'eggs', 'garlic']
};

// Common allergens and their related ingredients
export const allergenMap: Record<string, string[]> = {
  'peanuts': ['peanuts', 'peanut oil', 'peanut butter'],
  'tree nuts': ['almonds', 'cashews', 'walnuts', 'pecans', 'pistachios', 'hazelnuts'],
  'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'whey', 'casein'],
  'eggs': ['egg', 'eggs', 'mayonnaise', 'meringue'],
  'shellfish': ['shrimp', 'crab', 'lobster', 'crawfish', 'prawns'],
  'fish': ['fish', 'cod', 'salmon', 'tuna', 'tilapia', 'anchovies'],
  'wheat': ['wheat', 'flour', 'bread', 'pasta', 'croutons', 'bran'],
  'soy': ['soy', 'tofu', 'edamame', 'soy sauce', 'soy lecithin'],
  'sesame': ['sesame', 'sesame oil', 'tahini'],
  'gluten': ['wheat', 'barley', 'rye', 'oats', 'bread', 'pasta']
};

// Dietary preference restrictions
export const dietaryPreferenceMap: Record<string, string[]> = {
  'vegetarian': ['beef', 'chicken', 'pork', 'lamb', 'fish', 'shellfish', 'gelatin'],
  'vegan': ['beef', 'chicken', 'pork', 'lamb', 'fish', 'shellfish', 'milk', 'cheese', 'butter', 'egg', 'honey', 'gelatin'],
  'keto': ['sugar', 'flour', 'rice', 'pasta', 'bread', 'potatoes', 'corn'],
  'paleo': ['dairy', 'grains', 'wheat', 'sugar', 'legumes', 'peanuts'],
  'halal': ['pork', 'alcohol', 'non-halal meat'],
  'kosher': ['pork', 'shellfish', 'mixture of meat and dairy']
};

// Health restriction based ingredients to avoid
export const healthRestrictionMap: Record<string, string[]> = {
  'diabetes': ['sugar', 'high fructose corn syrup', 'honey', 'agave nectar', 'white bread', 'white rice'],
  'hypertension': ['salt', 'sodium', 'monosodium glutamate', 'cured meats'],
  'heart disease': ['trans fat', 'saturated fat', 'cholesterol', 'salt', 'sodium'],
  'celiac disease': ['wheat', 'barley', 'rye', 'gluten'],
  'kidney disease': ['potassium', 'phosphorus', 'sodium', 'protein'],
  'low sugar': ['sugar', 'corn syrup', 'honey', 'maple syrup', 'agave nectar']
};

// Function to get ingredients for a food item from our database
export function getIngredientsForFood(foodName: string): string[] {
  const lowerFoodName = foodName.toLowerCase();
  
  // Direct match
  if (foodToIngredientsMap[lowerFoodName]) {
    return foodToIngredientsMap[lowerFoodName];
  }
  
  // Partial match
  for (const [key, ingredients] of Object.entries(foodToIngredientsMap)) {
    if (lowerFoodName.includes(key)) {
      return ingredients;
    }
  }
  
  return [];
}

// Function to check if food is safe based on user's dietary profile
export function checkFoodSafety(
  foodName: string, 
  ingredients: string[], 
  dietaryProfile: DietaryProfile
): FoodSafetyCheckResponse {
  const incompatibleIngredients: string[] = [];
  let safetyReason = '';
  
  // Check allergies
  for (const allergy of dietaryProfile.allergies) {
    const allergenIngredients = allergenMap[allergy.toLowerCase()] || [allergy.toLowerCase()];
    
    for (const ingredient of ingredients) {
      if (allergenIngredients.some(allergen => ingredient.toLowerCase().includes(allergen))) {
        incompatibleIngredients.push(ingredient);
        safetyReason = `Contains ${ingredient} which you're allergic to`;
      }
    }
  }
  
  // Check dietary preferences
  for (const preference of dietaryProfile.dietaryPreferences) {
    const restrictedIngredients = dietaryPreferenceMap[preference.toLowerCase()] || [];
    
    for (const ingredient of ingredients) {
      if (restrictedIngredients.some(restricted => ingredient.toLowerCase().includes(restricted))) {
        if (!incompatibleIngredients.includes(ingredient)) {
          incompatibleIngredients.push(ingredient);
          if (!safetyReason) {
            safetyReason = `Contains ${ingredient} which doesn't match your ${preference} preference`;
          }
        }
      }
    }
  }
  
  // Check health restrictions
  for (const restriction of dietaryProfile.healthRestrictions) {
    const restrictedIngredients = healthRestrictionMap[restriction.toLowerCase()] || [];
    
    for (const ingredient of ingredients) {
      if (restrictedIngredients.some(restricted => ingredient.toLowerCase().includes(restricted))) {
        if (!incompatibleIngredients.includes(ingredient)) {
          incompatibleIngredients.push(ingredient);
          if (!safetyReason) {
            safetyReason = `Contains ${ingredient} which may not be suitable for your ${restriction} condition`;
          }
        }
      }
    }
  }
  
  return {
    food: foodName,
    safe: incompatibleIngredients.length === 0,
    ingredients,
    incompatibleIngredients,
    reason: safetyReason
  };
}

// Function to get safe alternatives for a food item
export function getSafeAlternatives(
  foodType: string,
  unsafeIngredients: string[]
): { name: string; description: string; ingredients: string[] }[] {
  // Sample alternatives - in a real app, these would come from a more extensive database
  if (foodType.includes('salad') && unsafeIngredients.includes('eggs')) {
    return [
      {
        name: 'Green Salad',
        description: 'Lettuce, tomatoes, cucumber with oil and vinegar',
        ingredients: ['lettuce', 'tomato', 'cucumber', 'olive oil', 'vinegar']
      },
      {
        name: 'Grilled Chicken Salad',
        description: 'With olive oil dressing (no egg-based dressing)',
        ingredients: ['chicken', 'lettuce', 'tomato', 'cucumber', 'olive oil']
      },
      {
        name: 'Mediterranean Salad',
        description: 'With lemon and olive oil dressing',
        ingredients: ['lettuce', 'cucumber', 'tomato', 'olives', 'lemon juice', 'olive oil']
      }
    ];
  }
  
  if (foodType.includes('pizza') && (unsafeIngredients.includes('cheese') || unsafeIngredients.includes('wheat'))) {
    return [
      {
        name: 'Cauliflower Crust Pizza',
        description: 'Pizza with gluten-free cauliflower crust',
        ingredients: ['cauliflower', 'tomato sauce', 'vegetables']
      },
      {
        name: 'Vegan Pizza',
        description: 'Pizza with dairy-free cheese alternative',
        ingredients: ['wheat', 'tomato sauce', 'vegan cheese', 'vegetables']
      }
    ];
  }
  
  // Default alternatives for any food
  return [
    {
      name: 'Fresh Fruit Plate',
      description: 'Selection of seasonal fruits',
      ingredients: ['apple', 'banana', 'orange', 'grapes', 'berries']
    },
    {
      name: 'Steamed Vegetables',
      description: 'Assorted vegetables lightly seasoned',
      ingredients: ['broccoli', 'carrots', 'zucchini', 'bell peppers', 'olive oil']
    }
  ];
}
