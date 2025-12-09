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
  (config: any) => {
    console.log('Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error: any) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
http.interceptors.response.use(
  (response: any) => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error: any) => {
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

  getAllTeams(data?: API.GetAllTeamsRequest) {
    return http.post<API.GetAllTeamsResponse>('/OrgGraph/getAllTeams', data ?? {});
  },

  // Create a team by name and optional member list
  createTeam(data: { name: string; members?: string[]; owner?: string }) {
    return http.post<{ team: string }>('/OrgGraph/createTeam', data);
  },

  // Create a team with explicit member roles and emails
  createTeamWithRoles(data: {
    name: string;
    members?: string[];
    membersWithRoles?: Array<{ memberId: string; role: string; email: string }>;
    owner?: string;
  }) {
    return http.post<{ team: string }>('/OrgGraph/createTeamWithRoles', data);
  },

  deleteTeam(data: API.DeleteTeamRequest) {
    return http.post<void>('/OrgGraph/deleteTeam', data);
  },

  // Update team information
  updateTeamInfo(data: {
    teamId: string;
    updates: {
      name?: string;
      members?: string[];
      membersWithRoles?: Array<{ memberId: string; role: string; email: string }>;
    };
    owner?: string;
  }) {
    return http.post<void>('/OrgGraph/updateTeamInfo', data);
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
  },

  generateTeamSummary(data: { teamId: string; teamName: string; members: Array<{name: string; role: string}> }) {
    return http.post<{ success: boolean; summary: string; teamId: string; teamName: string }>('/ReportSynthesis/generateTeamSummary', data);
  }
};

export default {
  hrAdmin,
  formTemplate,
  orgGraph,
  reportSynthesis
};

export { http };
