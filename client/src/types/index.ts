// User and authentication types
export interface User {
  id: string | number;
  email: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Dietary profile types
export interface DietaryProfile {
  id: number;
  userId: number;
  allergies: string[];
  dietaryPreferences: string[];
  healthRestrictions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DietaryProfileFormData {
  allergies: string[];
  dietaryPreferences: string[];
  healthRestrictions: string[];
}

// Food scan types
export interface FoodScan {
  id: string;
  userId: string;
  foodName: string;
  imageUrl: string;
  ingredients: string[];
  isSafe: boolean;
  safetyReason: string;
  unsafeReasons: string[];
  description: string;
  scannedAt: string;
}

export interface FoodScanResult {
  foodName: string;
  ingredients: string[];
  isSafe: boolean | null;
  safetyReason?: string;
  incompatibleIngredients?: string[];
}

// Upload types
export interface UploadResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// User scan limits
export interface ScanLimit {
  userId: string | number;
  scansUsed: number;
  maxScans: number;
  resetDate: string | Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Food recognition service response
export interface FoodRecognitionResponse {
  success: boolean;
  food?: {
    name: string;
    ingredients: string[];
  };
  error?: string;
}

// Food safety check response
export interface FoodSafetyCheckResponse {
  food: string;
  safe: boolean | null;
  reason?: string;
  ingredients: string[];
  incompatibleIngredients?: string[];
}

// AI Analysis Result
export interface AIAnalysisResult {
  foodName: string;
  ingredients: string[];
  isSafe: boolean;
  unsafeReasons: string[];
  description: string;
}
