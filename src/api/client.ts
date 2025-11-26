import axios, { type AxiosInstance } from 'axios';
import type * as API from '@/types/api';

// In development, we use the Vite proxy to avoid CORS issues
// The proxy is configured in vite.config.ts to forward /api/* to the backend
const apiBaseUrl = import.meta.env.DEV ? '/api' : 'https://six-1040-3dev-backend.onrender.com/api';

const http: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
http.interceptors.request.use(
  (config) => {
    console.log('Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
http.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('Response error:', {
        url: error.config?.url,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// HRAdmin endpoints
export const hrAdmin = {
  registerHRAdmin(data: API.RegisterHRAdminRequest) {
    return http.post<API.RegisterHRAdminResponse>('/HRAdmin/registerHRAdmin', data);
  },

  authenticateHRAdmin(data: API.AuthenticateHRAdminRequest) {
    return http.post<API.AuthenticateHRAdminResponse>('/HRAdmin/authenticateHRAdmin', data);
  },

  getHRAdmin(data: API.GetHRAdminRequest) {
    return http.post<API.GetHRAdminResponse>('/HRAdmin/getHRAdmin', data);
  }
};

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
  },

  getFeedbackFormsByCreator(data: API.GetFeedbackFormsByCreatorRequest) {
    return http.post<API.GetFeedbackFormsByCreatorResponse>('/FeedbackForm/getFeedbackFormsByCreator', data);
  }
};

// FormTemplate endpoints (for HR-admin templates)
export const formTemplate = {
  createTemplate(data: API.CreateFormTemplateRequest) {
    return http.post<API.CreateFormTemplateResponse>('/FormTemplate/createTemplate', data);
  },

  getTemplatesByCreator(data: API.GetFormTemplatesByCreatorRequest) {
    return http.post<API.GetFormTemplatesByCreatorResponse>('/FormTemplate/getTemplatesByCreator', data);
  }
};

// OrgGraph endpoints
export const orgGraph = {
  importRoster(data: API.ImportRosterRequest) {
    return http.post<void>('/org-graph/import-roster', data);
  },

  updateManager(data: API.UpdateManagerRequest) {
    return http.post<void>('/org-graph/update-manager', data);
  },

  updateTeam(data: API.UpdateTeamRequest) {
    return http.post<void>('/org-graph/update-team', data);
  },

  getManager(data: API.GetManagerRequest) {
    return http.post<API.GetManagerResponse>('/org-graph/get-manager', data);
  },

  getDirectReports(data: API.GetDirectReportsRequest) {
    return http.post<API.GetDirectReportsResponse>('/org-graph/get-direct-reports', data);
  },

  getPeers(data: API.GetPeersRequest) {
    return http.post<API.GetPeersResponse>('/org-graph/get-peers', data);
  },

  getAllEmployees() {
    return http.post<API.GetAllEmployeesResponse>('/org-graph/get-all-employees');
  },

  getAllTeams() {
    return http.post<API.GetAllTeamsResponse>('/org-graph/get-all-teams');
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
  hrAdmin,
  feedbackForm,
  formTemplate,
  orgGraph,
  reviewCycle,
  reportSynthesis
};

export { http };
