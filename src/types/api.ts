// API request/response types matching backend spec

export interface ExperienceLog {
  _id: string;
  userId: string;
  placeId: string;
  timestamp: string;
  rating: number;
  sweetness: number;
  strength: number;
  notes?: string;
  photo?: string;
}

export interface Place {
  _id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  preparationStyles: string[];
  priceRange: string;
  hours?: string;
  photos: string[];
}

export interface User {
  _id: string;
  displayName: string;
  email: string;
  savedPlaces: string[];
  preferences: Record<string, any>;
}

// Request payloads
export interface CreateLogRequest {
  userId: string;
  placeId: string;
  rating: number;
  sweetness: number;
  strength: number;
  notes?: string;
  photo?: string;
}

export interface UpdateLogRequest {
  logId: string;
  rating?: number;
  sweetness?: number;
  strength?: number;
  notes?: string;
  photo?: string;
}

export interface CreatePlaceRequest {
  name: string;
  address: string;
  coords: [number, number];
  styles: string[];
  priceRange: string;
  hours?: string;
  photos?: string[];
}

export interface RegisterUserRequest {
  userId: string;
  displayName: string;
  email: string;
}

// Response types
export interface CreateLogResponse {
  logId: string;
}

export interface GetUserLogsResponse {
  logs: ExperienceLog[];
}

export interface GetPlaceDetailsResponse {
  place: Place;
}

export interface GetRecommendationsResponse {
  recommendations: string[];
}

export interface ApiError {
  error: string;
}
