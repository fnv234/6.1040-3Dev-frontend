import axios, { type AxiosInstance } from 'axios';
import type * as API from '@/types/api';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://six-1040-3dev-backend.onrender.com';
const apiBaseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const http: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// FeedbackForm endpoints
export const feedbackForm = {
  createFeedbackForm(data: API.CreateFeedbackFormRequest) {
    return http.post<API.CreateFeedbackFormResponse>('/FeedbackForm/createFeedbackForm', data);
  },

  sendFeedbackForm(data: API.SendFeedbackFormRequest) {
    return http.post<API.SendFeedbackFormResponse>('/FeedbackForm/sendFeedbackForm', data);
  },

  submitFeedbackForm(data: API.SubmitFeedbackFormRequest) {
    return http.post<void>('/FeedbackForm/submitFeedbackForm', data);
  },

  getFeedbackForm(data: API.GetFeedbackFormRequest) {
    return http.post<API.GetFeedbackFormResponse>('/FeedbackForm/getFeedbackForm', data);
  },

  getFeedbackFormsByTarget(data: API.GetFeedbackFormsByTargetRequest) {
    return http.post<void>('/FeedbackForm/getFeedbackFormsByTarget', data);
  },

  getFeedbackFormsByReviewer(data: API.GetFeedbackFormsByReviewerRequest) {
    return http.post<void>('/FeedbackForm/getFeedbackFormsByReviewer', data);
  }
};

// OrgGraph endpoints
export const orgGraph = {
  importRoster(data: API.ImportRosterRequest) {
    return http.post<void>('/OrgGraph/importRoster', data);
  },

  updateManager(data: API.UpdateManagerRequest) {
    return http.post<void>('/OrgGraph/updateManager', data);
  },

  updateTeam(data: API.UpdateTeamRequest) {
    return http.post<void>('/OrgGraph/updateTeam', data);
  },

  getManager(data: API.GetManagerRequest) {
    return http.post<API.GetManagerResponse>('/OrgGraph/getManager', data);
  },

  getDirectReports(data: API.GetDirectReportsRequest) {
    return http.post<API.GetDirectReportsResponse>('/OrgGraph/getDirectReports', data);
  },

  getPeers(data: API.GetPeersRequest) {
    return http.post<API.GetPeersResponse>('/OrgGraph/getPeers', data);
  },

  getAllEmployees() {
    return http.post<API.GetAllEmployeesResponse>('/OrgGraph/getAllEmployees');
  },

  getAllTeams() {
    return http.post<API.GetAllTeamsResponse>('/OrgGraph/getAllTeams');
  }
};

// ReviewCycle endpoints
export const reviewCycle = {
  createCycle(data: API.CreateCycleRequest) {
    return http.post<API.CreateCycleResponse>('/ReviewCycle/createCycle', data);
  },

  configureAssignments(data: API.ConfigureAssignmentsRequest) {
    return http.post<void>('/ReviewCycle/configureAssignments', data);
  },

  addReviewers(data: API.AddReviewersRequest) {
    return http.post<void>('/ReviewCycle/addReviewers', data);
  },

  activate(data: API.ActivateCycleRequest) {
    return http.post<void>('/ReviewCycle/activate', data);
  },

  submitFeedback(data: API.SubmitFeedbackRequest) {
    return http.post<void>('/ReviewCycle/submitFeedback', data);
  },

  close(data: API.CloseCycleRequest) {
    return http.post<void>('/ReviewCycle/close', data);
  },

  getActiveCycles() {
    return http.post<API.GetActiveCyclesResponse>('/ReviewCycle/getActiveCycles');
  },

  getReviewerTasks(data: API.GetReviewerTasksRequest) {
    return http.post<API.GetReviewerTasksResponse>('/ReviewCycle/getReviewerTasks', data);
  }
};

// ReportSynthesis endpoints
export const reportSynthesis = {
  ingestResponses(data: API.IngestResponsesRequest) {
    return http.post<API.IngestResponsesResponse>('/ReportSynthesis/ingestResponses', data);
  },

  applyKAnonymity(data: API.ApplyKAnonymityRequest) {
    return http.post<void>('/ReportSynthesis/applyKAnonymity', data);
  },

  extractThemes(data: API.ExtractThemesRequest) {
    return http.post<API.ExtractThemesResponse>('/ReportSynthesis/extractThemes', data);
  },

  draftSummaryLLM(data: API.DraftSummaryLLMRequest) {
    return http.post<API.DraftSummaryLLMResponse>('/ReportSynthesis/draftSummaryLLM', data);
  },

  approveSummary(data: API.ApproveSummaryRequest) {
    return http.post<void>('/ReportSynthesis/approveSummary', data);
  },

  getFinalReport(data: API.GetFinalReportRequest) {
    return http.post<API.GetFinalReportResponse>('/ReportSynthesis/getFinalReport', data);
  },

  getReportsByTarget(data: API.GetReportsByTargetRequest) {
    return http.post<void>('/ReportSynthesis/getReportsByTarget', data);
  }
};

export default {
  feedbackForm,
  orgGraph,
  reviewCycle,
  reportSynthesis
};
