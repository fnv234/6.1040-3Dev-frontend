// Domain models for HR Feedback Admin

export interface HRAdmin {
  id: string;
  email: string;
  displayName: string;
}

export interface Team {
  id: string;
  name: string;
  memberEmails: string[];
  createdAt: string;
}

export interface FeedbackQuestion {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'multipleChoice';
  options?: string[]; // for multipleChoice
  required: boolean;
}

export interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  questions: FeedbackQuestion[];
  teamId: string;
  createdBy: string; // HR admin ID
  createdAt: string;
  sentAt?: string;
}

export interface FeedbackResponse {
  id: string;
  formId: string;
  respondentEmail: string;
  answers: Record<string, string | number>; // questionId -> answer
  submittedAt: string;
  anonymous: boolean;
}

export interface TeamStatistics {
  teamId: string;
  teamName: string;
  totalResponses: number;
  responseRate: number; // percentage
  averageComfortLevel?: number; // if comfort question exists
  sentimentSummary?: string; // LLM-generated
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface LoginResponse {
  userId: string;
  token?: string;
}

export interface CreateFormResponse {
  formId: string;
}

export interface SendFormResponse {
  emailsSent: number;
}
