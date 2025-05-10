import { DietaryProfile } from "@shared/schema";

// Map of common allergens and their related ingredients
const allergenMap: Record<string, string[]> = {
  "peanuts": ["peanuts", "peanut", "peanut oil", "peanut butter"],
  "tree-nuts": ["almonds", "cashews", "walnuts", "pecans", "pistachios", "hazelnuts"],
  "dairy": ["milk", "cheese", "butter", "cream", "yogurt", "lactose", "whey", "casein"],
  "eggs": ["egg", "eggs", "mayonnaise", "meringue"],
  "shellfish": ["shrimp", "crab", "lobster", "crawfish", "prawns"],
  "fish": ["fish", "cod", "salmon", "tuna", "tilapia", "anchovies"],
  "wheat": ["wheat", "flour", "bread", "pasta", "croutons", "bran"],
  "soy": ["soy", "tofu", "edamame", "soy sauce", "soy lecithin"],
  "sesame": ["sesame", "sesame oil", "tahini"],
  "gluten": ["wheat", "barley", "rye", "oats", "bread", "pasta"]
};

// Dietary preference restrictions
const dietaryPreferenceMap: Record<string, string[]> = {
  "vegetarian": ["beef", "chicken", "pork", "lamb", "fish", "shellfish", "gelatin"],
  "vegan": ["beef", "chicken", "pork", "lamb", "fish", "shellfish", "milk", "cheese", "butter", "egg", "honey", "gelatin"],
  "keto": ["sugar", "flour", "rice", "pasta", "bread", "potatoes", "corn"],
  "paleo": ["dairy", "grains", "wheat", "sugar", "legumes", "peanuts"],
  "halal": ["pork", "alcohol", "non-halal meat"],
  "kosher": ["pork", "shellfish", "mixture of meat and dairy"]
};

// Health restriction based ingredients to avoid
const healthRestrictionMap: Record<string, string[]> = {
  "diabetes": ["sugar", "high fructose corn syrup", "honey", "agave nectar", "white bread", "white rice"],
  "hypertension": ["salt", "sodium", "monosodium glutamate", "cured meats"],
  "heart-disease": ["trans fat", "saturated fat", "cholesterol", "salt", "sodium"],
  "celiac-disease": ["wheat", "barley", "rye", "gluten"],
  "kidney-disease": ["potassium", "phosphorus", "sodium", "protein"],
  "low-sugar": ["sugar", "corn syrup", "honey", "maple syrup", "agave nectar"]
};

export function matchIngredients(
  foodName: string,
  ingredients: string[],
  dietaryProfile: DietaryProfile
): {
  safe: boolean;
  reason?: string;
  incompatibleIngredients?: string[];
} {
  const incompatibleIngredients: string[] = [];
  let safetyReason: string | undefined;
  
  // Check allergies
  for (const allergy of dietaryProfile.allergies) {
    const allergenIngredients = allergenMap[allergy] || [allergy];
    
    for (const ingredient of ingredients) {
      if (allergenIngredients.some(allergen => 
        ingredient.toLowerCase().includes(allergen.toLowerCase())
      )) {
        incompatibleIngredients.push(ingredient);
        safetyReason = `Contains ${ingredient} which you're allergic to`;
      }
    }
  }
  
  // Check dietary preferences
  for (const preference of dietaryProfile.dietaryPreferences) {
    const restrictedIngredients = dietaryPreferenceMap[preference] || [];
    
    for (const ingredient of ingredients) {
      if (restrictedIngredients.some(restricted => 
        ingredient.toLowerCase().includes(restricted.toLowerCase())
      )) {
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
    const restrictedIngredients = healthRestrictionMap[restriction] || [];
    
    for (const ingredient of ingredients) {
      if (restrictedIngredients.some(restricted => 
        ingredient.toLowerCase().includes(restricted.toLowerCase())
      )) {
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
    safe: incompatibleIngredients.length === 0,
    reason: safetyReason,
    incompatibleIngredients: incompatibleIngredients.length > 0 ? incompatibleIngredients : undefined
  };
}
