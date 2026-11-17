import { apiRequest } from './api';

export interface RoadmapTask {
  id: number;
  title: string;
  description: string;
  order: number;
}

export interface RoadmapMilestone {
  id: number;
  title: string;
  description: string;
  order: number;
  tasks: RoadmapTask[];
}

export interface RoadmapPhase {
  id: number;
  title: string;
  description: string;
  duration: string;
  order: number;
  milestones: RoadmapMilestone[];
}

export interface Roadmap {
  id: number;
  project: number;
  title: string;
  summary: string;
  phases: RoadmapPhase[];
  has_customized_whiteboard?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoadmapDetailResponse {
  exists: boolean;
  roadmap: Roadmap | null;
}

export const roadmapApi = {
  getRoadmap: (projectId: number) =>
    apiRequest<RoadmapDetailResponse>(`/api/projects/${projectId}/roadmap/`),
  generateRoadmap: (projectId: number) =>
    apiRequest<{ message: string; roadmap: Roadmap }>(
      `/api/projects/${projectId}/roadmap/generate/`,
      {
        method: 'POST',
      }
    ),
};
