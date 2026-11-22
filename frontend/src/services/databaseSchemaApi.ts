import { apiRequest } from './api';

export interface SchemaColumn {
  name: string;
  data_type: string;
  is_primary?: boolean;
  is_foreign?: boolean;
  references?: string;
  is_unique?: boolean;
  is_nullable?: boolean;
}

export interface SchemaTable {
  name: string;
  description?: string;
  columns: SchemaColumn[];
}

export interface DatabaseSchemaProposalDiff {
  summary: string;
  rationale: string;
  db_engine: string;
  schema_type: 'table' | 'document';
  tables: SchemaTable[];
  added_entities: string[];
  modified_entities: string[];
  preserved_entities: string[];
  removed_entities: string[];
  code: string;
  modeling_notes?: string;
  roadmap_version?: string;
  schema_version?: string;
  has_conflict?: boolean;
  conflict_data?: any;
}

export interface DatabaseSchemaProposal {
  has_changes: boolean;
  roadmap_version?: string;
  summary?: string;
  rationale?: string;
  before_after_summary?: string;
  affected_entities?: string[];
  modeling_notes?: string;
  proposed_tables?: SchemaTable[];
  proposed_nodes?: any[];
  proposed_edges?: any[];
  code?: string;
  sql_ddl?: string;
  nosql_code?: string;
  created_at?: string;
}

export interface DatabaseSchema {
  id: number;
  project: number;
  schema_type: 'table' | 'document';
  db_engine: string;
  tables: SchemaTable[];
  nodes: any[];
  edges: any[];
  viewport?: { x: number; y: number; zoom: number };
  code?: string;
  sql_ddl?: string;
  nosql_code?: string;
  is_customized?: boolean;
  pending_proposal?: DatabaseSchemaProposal | null;
  has_conflict?: boolean;
  conflict_data?: any;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchemaDetailResponse {
  exists: boolean;
  schema: DatabaseSchema | null;
}

export interface SchemaRelationship {
  source_table: string;
  target_table: string;
  relationship_type: string;
  foreign_key_column?: string;
}

export interface GenerateEntityPromptResponse {
  explanation?: string;
  entity: SchemaTable;
  new_entities?: SchemaTable[];
  relationships?: SchemaRelationship[];
}

export const databaseSchemaApi = {
  getSchema: (projectId: number) =>
    apiRequest<DatabaseSchemaDetailResponse>(`/api/projects/${projectId}/database-schema/`),

  generateSchema: (projectId: number) =>
    apiRequest<{ message: string; schema: DatabaseSchema }>(
      `/api/projects/${projectId}/database-schema/generate/`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    ),

  previewRegeneration: (projectId: number) =>
    apiRequest<DatabaseSchemaProposalDiff>(
      `/api/projects/${projectId}/database-schema/generate/`,
      {
        method: 'POST',
        body: JSON.stringify({ action: 'preview' }),
      }
    ),

  confirmRegeneration: (
    projectId: number,
    payload: {
      proposal: DatabaseSchemaProposalDiff;
      roadmap_version?: string;
      schema_version?: string;
    }
  ) =>
    apiRequest<{
      message: string;
      schema: DatabaseSchema;
    }>(
      `/api/projects/${projectId}/database-schema/confirm-regeneration/`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  saveSchema: (
    projectId: number,
    payload: {
      nodes: any[];
      edges: any[];
      tables?: SchemaTable[];
      viewport?: { x: number; y: number; zoom: number };
    }
  ) =>
    apiRequest<{ message: string; schema: DatabaseSchema }>(
      `/api/projects/${projectId}/database-schema/`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    ),

  resetSchema: (projectId: number) =>
    apiRequest<{ message: string; schema: DatabaseSchema }>(
      `/api/projects/${projectId}/database-schema/reset/`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    ),

  generateEntityFromPrompt: (
    projectId: number,
    payload: {
      prompt: string;
      schema_type?: 'table' | 'document';
      db_engine?: string;
      current_entity?: any;
    }
  ) =>
    apiRequest<GenerateEntityPromptResponse>(
      `/api/projects/${projectId}/database-schema/generate-entity/`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  applyProposal: (
    projectId: number,
    payload?: {
      roadmap_version?: string;
    }
  ) =>
    apiRequest<DatabaseSchema>(
      `/api/projects/${projectId}/database-schema/apply-proposal/`,
      {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      }
    ),

  dismissProposal: (projectId: number) =>
    apiRequest<DatabaseSchema>(
      `/api/projects/${projectId}/database-schema/dismiss-proposal/`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    ),

  refreshProposal: (projectId: number) =>
    apiRequest<DatabaseSchema>(
      `/api/projects/${projectId}/database-schema/refresh-proposal/`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    ),
};
