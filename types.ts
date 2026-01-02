
export enum Mood {
  STRESSED = 'Stressed',
  ENERGETIC = 'Energetic',
  SAD = 'Sad',
  HAPPY = 'Happy',
  TIRED = 'Tired',
  ANXIOUS = 'Anxious',
  LONELY = 'Lonely'
}

export enum Budget {
  LOW = '$',
  MID = '$$',
  HIGH = '$$$',
  UNDECIDED = 'Not Decided'
}

export interface User {
  fullName: string;
  age: number;
  nationality: string;
  dietaryPreferences: string[];
  allergies: string;
  location?: { latitude: number; longitude: number };
}

export interface Recommendation {
  dishName: string;
  energyMatch: string;
  moodExplanation: string;
  estimatedCost: string;
  keyIngredients: string[];
  instructions: string[];
  bestFor: string;
  prepTime: string;
  chefTip: string;
  imageUrl?: string;
  stepImages?: string[];
}
