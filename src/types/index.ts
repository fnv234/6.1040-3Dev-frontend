// Domain models for HR Feedback Admin

export interface HRAdmin {
  _id: string;
  email: string;
}

export interface TeamMember {
  memberId: string; // Employee ID
  role: string; // e.g., "manager", "team lead", "developer", etc.
}

export interface Team {
  _id: string;
  name: string;
  members: string[]; // Employee IDs (for backward compatibility)
  membersWithRoles?: TeamMember[]; // New field for members with roles
}

export interface FeedbackQuestion {
  prompt: string;
  type: 'Multiple Choice' | 'Free' | 'Scale';
  response?: string;
  targetRoles?: string[]; // Optional: if specified, only members with these roles will see this question
}

export interface FeedbackForm {
  _id?: string; // Optional because backend generates this
  name: string;
  creator: string; // User/HR Admin ID
  reviewer: string; // Employee ID
  target: string; // Employee ID
  status: 'Created' | 'Sent' | 'Completed';
  createdDate: string;
  completedDate?: string;
  questions: FeedbackQuestion[];
}

// Frontend-only extended types for team-based form creation
export interface FeedbackFormDraft {
  _id?: string;
  name: string;
  creator: string; // User/HR Admin ID
  teamId?: string; // Frontend only: for bulk form creation
  status: 'Created' | 'Sent' | 'Completed';
  createdDate: string;
  completedDate?: string;
  dueDate?: string; // Optional due date for the feedback form
  questions: FeedbackQuestion[];
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
