import axios, { AxiosInstance } from 'axios';
import type * as API from '@/types/api';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const http: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ExperienceLog endpoints
export const experienceLog = {
  create: (payload: API.CreateLogRequest) =>
    http.post<API.CreateLogResponse>('/api/ExperienceLog/create_log', payload),

  update: (payload: API.UpdateLogRequest) =>
    http.post<{ log: API.ExperienceLog }>('/api/ExperienceLog/update_log', payload),

  delete: (logId: string) =>
    http.post('/api/ExperienceLog/delete_log', { logId }),

  getUserLogs: (userId: string) =>
    http.post<API.GetUserLogsResponse>('/api/ExperienceLog/_get_user_logs', { userId }),

  getPlaceLogs: (userId: string, placeId: string) =>
    http.post<API.GetUserLogsResponse>('/api/ExperienceLog/_get_place_logs', { userId, placeId }),

  getAverageRating: (userId: string, placeId: string) =>
    http.post<{ averageRating: number }>('/api/ExperienceLog/_get_average_rating', { userId, placeId }),

  getTriedPlaces: (userId: string) =>
    http.post<{ places: string[] }>('/api/ExperienceLog/_get_tried_places', { userId }),

  generateProfileSummary: (userId: string) =>
    http.post<{ summary: string }>('/api/ExperienceLog/generate_profile_summary', { userId })
};

// PlaceDirectory endpoints
export const placeDirectory = {
  create: (payload: API.CreatePlaceRequest) =>
    http.post<{ placeId: string }>('/api/PlaceDirectory/create_place', payload),

  edit: (placeId: string, updates: Partial<API.CreatePlaceRequest>) =>
    http.post('/api/PlaceDirectory/edit_place', { placeId, ...updates }),

  delete: (placeId: string) =>
    http.post('/api/PlaceDirectory/delete_place', { placeId }),

  findNearby: (coords: [number, number], radius: number) =>
    http.post<{ places: string[] }>('/api/PlaceDirectory/_find_nearby', { coords, radius }),

  searchByName: (query: string) =>
    http.post<{ places: string[] }>('/api/PlaceDirectory/_search_by_name', { query }),

  filter: (filters: { priceRange?: string; hours?: string; style?: string }) =>
    http.post<{ places: string[] }>('/api/PlaceDirectory/_filter_places', filters),

  getDetails: (placeId: string) =>
    http.post<API.GetPlaceDetailsResponse>('/api/PlaceDirectory/_get_details', { placeId })
};

// UserDirectory endpoints
export const userDirectory = {
  register: (payload: API.RegisterUserRequest) =>
    http.post<{ userId: string }>('/api/UserDirectory/register_user', payload),

  savePlace: (userId: string, placeId: string) =>
    http.post('/api/UserDirectory/save_place', { userId, placeId }),

  unsavePlace: (userId: string, placeId: string) =>
    http.post('/api/UserDirectory/unsave_place', { userId, placeId }),

  updatePreferences: (userId: string, newPrefs: Record<string, any>) =>
    http.post('/api/UserDirectory/update_preferences', { userId, newPrefs }),

  getSavedPlaces: (userId: string) =>
    http.post<{ places: string[] }>('/api/UserDirectory/_get_saved_places', { userId })
};

// RecommendationEngine endpoints
export const recommendationEngine = {
  getRecommendations: (userId: string) =>
    http.post<API.GetRecommendationsResponse>('/api/RecommendationEngine/get_recommendations', { userId }),

  refreshRecommendations: (userId: string, savedPlaces: string[], preferences: Record<string, any>, triedPlaces: string[]) =>
    http.post('/api/RecommendationEngine/refresh_recommendations', { userId, savedPlaces, preferences, triedPlaces }),

  clearRecommendations: (userId: string) =>
    http.post('/api/RecommendationEngine/clear_recommendations', { userId })
};

export default {
  experienceLog,
  placeDirectory,
  userDirectory,
  recommendationEngine
};
