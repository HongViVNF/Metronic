import { CandidatePipeline } from "./pipeline.types";

// Simplified Candidate type that's compatible with StageDrawer's expectations
export interface Candidate {
  id: string;
  full_name: string;
  stage_id?: string | null;
  pipeline_status?: string | null | undefined;
  position?: string;
  experience?: string;
  fit_score?: number | string;
  birthdate?: string | null;
  gender?: string | null;
  email?: string | null;
  // Add other common candidate properties if needed
}

export interface Stage {
  id: string;
  name: string;
  description?: string;
  settings?: {
    color?: string;
    order?: number;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
  candidates?: CandidatePipeline[] | undefined;
  hiringPipelineId?: string;
}

export interface CandidateStage extends Candidate {
  // This can be extended with additional properties if needed
}
