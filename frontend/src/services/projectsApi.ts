import { apiRequest } from './api';

export type ProjectStatus = 'Planning' | 'In Progress' | 'Completed';

export interface Project {
  id: number;
  name: string;
  description: string;
  requirements: string;
  tech_stack: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  requirements?: string;
  tech_stack?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  requirements?: string;
  tech_stack?: string;
  status?: ProjectStatus;
}

export interface TechStackCategory {
  name: string;
  items: string[];
}

export interface TechStacksResponse {
  categories: TechStackCategory[];
  popular: string[];
}

export const projectsApi = {
  getTechStacks: () => apiRequest<TechStacksResponse>('/api/projects/tech-stacks/'),
  list: () => apiRequest<Project[]>('/api/projects/'),
  get: (id: number) => apiRequest<Project>(`/api/projects/${id}/`),
  create: (payload: CreateProjectPayload) =>
    apiRequest<Project>('/api/projects/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: UpdateProjectPayload) =>
    apiRequest<Project>(`/api/projects/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  patchStatus: (id: number, status: ProjectStatus) =>
    apiRequest<Project>(`/api/projects/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/projects/${id}/`, {
      method: 'DELETE',
    }),
};
