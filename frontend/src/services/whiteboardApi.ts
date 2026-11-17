import { apiRequest } from './api';

export interface WhiteboardNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    title: string;
    description?: string;
    duration?: string;
    order?: number;
    nodeType: 'phase' | 'milestone' | 'task' | 'decision';
    phaseId?: number;
    milestoneId?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface WhiteboardEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  label?: string;
  [key: string]: any;
}

export interface WhiteboardData {
  id: number;
  roadmap: number;
  nodes: WhiteboardNode[];
  edges: WhiteboardEdge[];
  viewport?: { x: number; y: number; zoom: number };
  is_customized: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhiteboardResponse {
  exists: boolean;
  whiteboard: WhiteboardData | null;
  message?: string;
}

export const whiteboardApi = {
  getWhiteboard: (projectId: number) =>
    apiRequest<WhiteboardResponse>(`/api/projects/${projectId}/whiteboard/`),

  updateWhiteboard: (
    projectId: number,
    data: {
      nodes: WhiteboardNode[];
      edges: WhiteboardEdge[];
      viewport?: { x: number; y: number; zoom: number };
    }
  ) =>
    apiRequest<{ message: string; whiteboard: WhiteboardData }>(
      `/api/projects/${projectId}/whiteboard/`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  resetWhiteboard: (projectId: number) =>
    apiRequest<{ message: string; whiteboard: WhiteboardData }>(
      `/api/projects/${projectId}/whiteboard/reset/`,
      {
        method: 'POST',
      }
    ),
};
