// API request/response types matching backend spec

export type QuestionType = 'Free' | 'Scale' | 'Multiple Choice';

export interface FeedbackQuestion {
  prompt: string;
  type: QuestionType;
}

// FeedbackForm

export interface CreateFeedbackFormRequest {
  reviewer: string;
  target: string;
  questions: FeedbackQuestion[];
}

export interface CreateFeedbackFormResponse {
  feedbackForm: string;
}

export interface SendFeedbackFormRequest {
  feedbackForm: string;
}

export interface SendFeedbackFormResponse {
  link: string;
}

export interface SubmitFeedbackFormRequest {
  feedbackForm: string;
  responses: Record<string, string>;
}

export interface GetFeedbackFormRequest {
  id: string;
}

export type FeedbackFormStatus = 'Created' | 'Sent' | 'Completed';

export interface FeedbackForm {
  _id: string;
  reviewer: string;
  target: string;
  status: FeedbackFormStatus;
  createdDate: string;
  completedDate?: string;
  questions: FeedbackQuestion[];
}

export interface GetFeedbackFormResponse {
  feedbackForm: FeedbackForm;
}

export interface GetFeedbackFormsByTargetRequest {
  target: string;
  startDate: string;
  endDate: string;
}

export interface GetFeedbackFormsByReviewerRequest {
  reviewer: string;
}

// OrgGraph

export interface OrgEmployeeSource {
  id: string;
  manager: string;
  teamName: string;
}

export interface ImportRosterRequest {
  sourceData: {
    employees: OrgEmployeeSource[];
  };
}

export interface UpdateManagerRequest {
  employee: string;
  newManager: string;
}

export interface UpdateTeamRequest {
  employee: string;
  newTeamName: string;
}

export interface GetManagerRequest {
  employee: string;
}

export interface GetManagerResponse {
  manager: string;
}

export interface GetDirectReportsRequest {
  employee: string;
}

export interface GetDirectReportsResponse {
  reports: string[];
}

export interface GetPeersRequest {
  employee: string;
}

export interface GetPeersResponse {
  peers: string[];
}

export interface GetAllEmployeesResponse {
  employees: string[];
}

export interface OrgTeam {
  _id: string;
  name: string;
}

export interface GetAllTeamsResponse {
  teams: OrgTeam[];
}

// ReviewCycle

export interface CreateCycleRequest {
  creator: string;
  form: string;
  startDate: string;
  endDate: string;
}

export interface CreateCycleResponse {
  cycle: string;
}

export interface ConfigureAssignmentsRequest {
  cycle: string;
  targets: string[];
}

export interface AddReviewersRequest {
  cycle: string;
  target: string;
  reviewers: string[];
}

export interface ActivateCycleRequest {
  cycle: string;
}

export interface SubmitFeedbackRequest {
  cycle: string;
  target: string;
  reviewer: string;
  responses: Record<string, string>;
}

export interface CloseCycleRequest {
  cycle: string;
}

export interface ReviewCycleSummary {
  _id: string;
  createdBy: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface GetActiveCyclesResponse {
  cycles: ReviewCycleSummary[];
}

export interface GetReviewerTasksRequest {
  reviewer: string;
}

export interface ReviewerTask {
  cycle: string;
  target: string;
  form: string;
  endDate: string;
}

export interface GetReviewerTasksResponse {
  tasks: ReviewerTask[];
}

// ReportSynthesis

export interface IngestResponseItem {
  questionIndex: number;
  questionText: string;
  response: string;
  reviewer: string;
}

export interface IngestResponsesRequest {
  target: string;
  form: string;
  responses: IngestResponseItem[];
  anonymityFlag: boolean;
  kThreshold: number;
}

export interface IngestResponsesResponse {
  responseSet: string;
}

export interface ApplyKAnonymityRequest {
  responseSet: string;
}

export interface ExtractThemesRequest {
  responseSet: string;
}

export interface ExtractThemesResponse {
  themes: string[];
}

export interface DraftSummaryLLMRequest {
  responseSet: string;
  themes: string[];
}

export interface DraftSummaryLLMResponse {
  draft: string;
}

export interface ApproveSummaryRequest {
  responseSet: string;
  finalText: string;
  keyQuotes: string[];
}

export interface GetFinalReportRequest {
  responseSet: string;
}

export interface ReportMetrics {
  totalResponses: number;
  uniqueReviewers: number;
}

export interface FinalReport {
  _id: string;
  target: string;
  textSummary: string;
  keyQuotes: string[];
  metrics: ReportMetrics;
  createdAt: string;
}

export interface GetFinalReportResponse {
  report: FinalReport;
}

export interface GetReportsByTargetRequest {
  target: string;
}

export interface ApiError {
  error: string;
}
