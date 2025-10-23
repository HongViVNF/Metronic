import { HiringPipeline } from "../pipeline/types";

export interface Job {
    id: string;
    title: string;
    descriptions?: string;
    requirements?: string;
    status: 'DRAFT' | 'OPEN' | 'CLOSED';
    pipelineId?: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
    pipeline?: HiringPipeline;
}