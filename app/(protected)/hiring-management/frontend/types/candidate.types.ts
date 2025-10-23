import { Job } from "./job.types";

export interface Candidate {
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
    stage_name?: string | null;
    job_id?: string | null;
    job?: Job | null;
    note?: string | null;
    pipeline_status?: string | null;
    reject_reason?: string | null;
    cv_link?: string | null;
    evaluation?: string | null;
    activity_name?: string | null;
    activity_note?: string | null;
    skills?: string | null;
    activities?: Array<{
        id: string;
        name: string;
        status: string;
        start_date?: string;
        end_date?: string;
        note?: string;
    }>;
}