// API request/response types matching backend spec

// may not need
export interface OrgGraph {
  
}

export interface ReviewCycle {

}

export interface ReportSynthesis {

}

export interface Cycle {

}

export interface User {
  _id: string;
  displayName: string;
  email: string;
  savedPlaces: string[];
  preferences: Record<string, any>;
}

export interface ApiError {
  error: string;
}
