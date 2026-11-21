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

export interface RoadmapCopilotResponse {
  explanation: string;
  action: 'none' | 'add_phase' | 'edit_phase' | 'delete_phase' | 'update_tech_stack' | 'update_roadmap';
  phase_data?: {
    title: string;
    description: string;
    duration: string;
    order: number;
    milestones: {
      title: string;
      description: string;
      order: number;
      tasks: {
        title: string;
        description: string;
        order: number;
      }[];
    }[];
  } | null;
  target_phase_id?: number | null;
  target_phase_order?: number | null;
  new_tech_stack?: string | null;
  affected_phases?: any[] | null;
  change_summary?: string | null;
  impact_on_completed_tasks?: string | null;
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
  chatCopilot: (
    projectId: number,
    prompt: string,
    conversationHistory?: { role: string; content: string }[],
    activePhaseId?: number,
    completedTaskIds?: number[]
  ) =>
    apiRequest<RoadmapCopilotResponse>(`/api/projects/${projectId}/roadmap/chat/`, {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        conversation_history: conversationHistory,
        active_phase_id: activePhaseId,
        completed_task_ids: completedTaskIds,
      }),
    }),
  applyPhaseAction: (
    projectId: number,
    payload: {
      action: 'add_phase' | 'edit_phase' | 'delete_phase' | 'update_tech_stack' | 'update_roadmap';
      phase_data?: any;
      target_phase_id?: number | null;
      target_phase_order?: number | null;
      new_tech_stack?: string | null;
      affected_phases?: any[] | null;
      change_summary?: string | null;
    }
  ) =>
    apiRequest<{ message: string; roadmap: Roadmap; project?: any }>(
      `/api/projects/${projectId}/roadmap/apply-action/`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
};
