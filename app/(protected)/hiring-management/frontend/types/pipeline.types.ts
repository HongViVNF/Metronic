import { Job } from "./job.types";

export interface CandidatePipeline {
    id: string;
    full_name: string;
    email?: string | null;
    birthdate?: string | null;
    gender?: string | null;
    position?: string | null;
    experience?: string | null;
    strengths?: string | null;
    fit_score?: number | null;
    weaknesses?: string | null;
    source?: string | null;
    created_at: string;
    updated_at: string;
    stage_id?: string | null;
    job_id?: string | null;
    job?: Job | null;
    note?: string | null;
    pipeline_status?: string | null;
    reject_reason?: string | null;
    activities?: Array<{
        id: string;
        name: string;
        status: string;
    }>;
  }

export interface HiringPipeline {
    id: string;
    name: string;
    descriptions?: string;
    created_by?: string;
    updated_by?: string;
    created_at?: string;
    updated_at?: string;
    stages?: { id: string; name: string }[];
  }
  
