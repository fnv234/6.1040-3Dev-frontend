import axios, { AxiosInstance } from 'axios';
import type * as API from '@/types/api';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const http: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// OrgGraph endpoints
export const orgGraph = {
  
};

// ReviewCycle endpoints
export const reviewCycle = {
  
};

// ReportSynthesis endpoints
export const reportSynthesis = {
  
};

// FeedbackForm endpoints
export const feedbackForm = {
  
}

export default {
  
};
