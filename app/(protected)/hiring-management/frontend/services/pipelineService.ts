import { HiringPipeline } from "../pipeline/types";
import { Job } from "../types/job.types";
import { Candidate } from "../types/candidate.types";


const pipelineService = {
  async getPipelines(): Promise<HiringPipeline[]> {
    try {
      const response = await fetch('/hiring-management/api/hiringpipeline', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pipelines');
      }

      const pipelines: HiringPipeline[] = await response.json();
      return pipelines;
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      throw error;
    }
  },

  async getPipelineById(id: string): Promise<HiringPipeline | null> {
    try {
      const response = await fetch(`/hiring-management/api/hiringpipeline?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pipeline');
      }

      const pipeline: HiringPipeline = await response.json();
      return pipeline;
    } catch (error) {
      console.error(`Error fetching pipeline with id ${id}:`, error);
      return null;
    }
  },

  async updateJobPipeline(jobId: string, pipelineId: string | null): Promise<Job> {
    try {
      const response = await fetch(`/hiring-management/api/jobs/${jobId}/pipeline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pipelineId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update job pipeline');
      }

      const updatedJob: Job = await response.json();
      return updatedJob;
    } catch (error) {
      console.error(`Error updating pipeline for job ${jobId}:`, error);
      throw error;
    }
  },

  async getCandidatesByJobId(jobId: string): Promise<Candidate[]> {
    try {
      const response = await fetch(`/hiring-management/api/job/${jobId}/stages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const result = await response.json();
      const stages = result.stages || [];

      // Collect all candidates from all stages
      const allCandidates = stages.flatMap((stage: any) => stage.candidates || []);

      // Remove duplicates
      const uniqueCandidates = Array.from(new Set(allCandidates.map((c:any) => c.id))).map(id => allCandidates.find((c:any) => c.id === id));

      return uniqueCandidates;
    } catch (error) {
      console.error('Lỗi khi tải danh sách ứng viên theo job:', error);
      throw error;
    }
  },
};

export default pipelineService;