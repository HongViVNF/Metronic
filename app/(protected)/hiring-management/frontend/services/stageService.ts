import { Stage } from "../types/stage.types";

export interface CreateStageData {
  name: string;
  description?: string;
  hiring_pipeline_id: string;
  settings?: Record<string, any>;
  created_by?: string;
  order?: number;
}

export interface UpdateStageData {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
  updated_by?: string;
  order?: number;
}

export interface MoveCandidatesParams {
  candidateIds: string[];
  stageId: string;
}

export interface RemoveStageParams {
  stageId: string;
}

export async function createStage(data: CreateStageData) {
  const response = await fetch('/hiring-management/api/stages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || 'Failed to create stage');
  }

  return response.json();
}

export async function fetchStages(hiringPipelineId: string): Promise<Stage[]> {
  const response = await fetch(`/hiring-management/api/stages?hiringPipelineId=${hiringPipelineId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch stages");
  }
  return response.json();
}

export async function fetchStagesByJobId(jobId: string) {
  const response = await fetch(`/hiring-management/api/job/${jobId}/stages`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || 'Failed to fetch stages');
  }
  return response.json();
}

export async function fetchFirstStageByPipelineId(pipelineId: string) {
  const response = await fetch(`/hiring-management/api/hiringpipeline/${pipelineId}/first-stage`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || 'Failed to fetch first stage');
  }
  return response.json();
}

export async function updateStage(id: string, data: UpdateStageData) {
  const response = await fetch('/hiring-management/api/stages', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || 'Failed to update stage');
  }

  return response.json();
}

export async function removeStage({ stageId }: RemoveStageParams) {
  const response = await fetch('/hiring-management/api/stages', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: stageId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || 'Failed to delete stage');
  }

  return response.json();
}

export async function moveCandidates({ candidateIds, stageId }: MoveCandidatesParams) {
  const response = await fetch('/hiring-management/api/candidate/bulk-update', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ candidateIds, stageId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.message || 'Failed to move candidates');
  }

  return response.json();
}

// export async function getFirstStageByPipelineId(pipelineId: string) {
//   const response = await fetch(`/hiring-management/api/stages?pipelineId=${pipelineId}`);
//   if (!response.ok) {
//     throw new Error("Failed to fetch stages");
//   }
//   return response.json();
// }
