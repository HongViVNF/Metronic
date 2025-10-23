import axios from 'axios';

export type JobStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export interface JobFormData {
  title: string;
  descriptions?: string | null;
  requirements?: string | null;
  status: JobStatus;
  pipelineId?: string | null;
  isDefault?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  jobCode?: string | null;
}

interface User {
  id: string;
  name?: string | null;
  email: string;
}

export interface Job {
  id: string;
  title: string;
  descriptions?: string | null;
  requirements?: string | null;
  status?: JobStatus | null;
  pipelineId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  jobCode?: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  createdBy?: User | null;
  updatedBy?: User | null;
  candidateCount?: number;
  stageCounts?: number[];
  totalCandidates?: number;
}

export interface JobUpdateData {
  id: string;
  title: string;
  descriptions?: string | null;
  requirements?: string | null;
  status: JobStatus;
  pipelineId?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  jobCode: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  pipeline_status?: string | null;
  stage_id?: string | null;
  evaluation?: string | null;
  fit_score?: number | null;
  note?: string | null;
  cv_link?: string | null;
  created_at: string;
  updated_at: string;
  job_id?: string | null;
}

const API_BASE_URL = '/hiring-management/api/job';

export const jobService = {
  async getJobById(id: string) {   
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch job details");
    }

    const data = await response.json();
    return data;
  },

  async getAll(): Promise<Job[]> {
    const response = await fetch(API_BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch job list");
    }
    return response.json();
  },

  async create(data: JobFormData): Promise<Job> {
    const response = await axios.post(API_BASE_URL, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  async update(data: JobUpdateData): Promise<Job> {
    const response = await axios.put(API_BASE_URL, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(API_BASE_URL, {
      data: { id },
      headers: {
        "Content-Type": "application/json",
      },
    });
  },

  async getCandidateByJobId(jobId: string): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE_URL}/${jobId}/candidate`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch candidates");
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch candidates");
    }

    return data.data;
  },
};