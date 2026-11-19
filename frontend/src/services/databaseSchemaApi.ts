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

export interface DatabaseSchema {
  id: number;
  project: number;
  schema_type: 'table' | 'document';
  db_engine: string;
  tables: SchemaTable[];
  nodes: any[];
  edges: any[];
  viewport?: { x: number; y: number; zoom: number };
  sql_ddl?: string;
  nosql_code?: string;
  is_customized?: boolean;
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
  getSchema: (projectId: number, schemaType?: 'table' | 'document') => {
    const query = schemaType ? `?schema_type=${schemaType}` : '';
    return apiRequest<DatabaseSchemaDetailResponse>(`/api/projects/${projectId}/database-schema/${query}`);
  },

  generateSchema: (projectId: number, schemaType?: 'table' | 'document') =>
    apiRequest<{ message: string; schema: DatabaseSchema }>(
      `/api/projects/${projectId}/database-schema/generate/`,
      {
        method: 'POST',
        body: JSON.stringify(schemaType ? { schema_type: schemaType } : {}),
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
      }
    ),

  generateEntityFromPrompt: (
    projectId: number,
    payload: {
      prompt: string;
      schema_type: 'table' | 'document';
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
};
