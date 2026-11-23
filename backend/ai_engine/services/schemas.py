from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class GeneratedTaskSchema(BaseModel):
    id: Optional[int] = Field(default=None, description="Stable database ID of task")
    title: str = Field(description="Actionable task title")
    description: str = Field(default="", description="One-sentence implementation note")
    order: int = Field(default=1)
    is_completed: Optional[bool] = Field(default=None, description="Completion status")


class GeneratedMilestoneSchema(BaseModel):
    id: Optional[int] = Field(default=None, description="Stable database ID of milestone")
    title: str = Field(description="Milestone deliverable title")
    description: str = Field(default="", description="One-sentence deliverable objective")
    order: int = Field(default=1)
    tasks: List[GeneratedTaskSchema] = Field(default_factory=list, description="Actionable tasks")


class GeneratedPhaseSchema(BaseModel):
    id: Optional[int] = Field(default=None, description="Stable database ID of phase")
    title: str = Field(description="Phase title")
    description: str = Field(default="", description="One-sentence phase goal")
    duration: str = Field(default="2 Weeks", description="Duration e.g. Weeks 1-3")
    order: Optional[int] = Field(default=None, description="Phase order e.g. 1, 2, 3")
    milestones: List[GeneratedMilestoneSchema] = Field(default_factory=list, description="Milestones per phase")


class GeneratedRoadmapSchema(BaseModel):
    title: str = Field(description="Roadmap title")
    summary: str = Field(description="Executive summary of the technical plan")
    phases: List[GeneratedPhaseSchema] = Field(description="Dynamic list of development phases based on project scope")


class RoadmapCopilotResponse(BaseModel):
    explanation: str = Field(default="", description="Helpful, conversational explanation of architecture, use cases, and changes.")
    action: Literal["none", "add_phase", "edit_phase", "delete_phase", "update_tech_stack", "update_roadmap"] = Field(default="none", description="Action type: none, add_phase, edit_phase, delete_phase, update_tech_stack, update_roadmap")
    operation: Optional[Literal["explanation", "clarification", "add_task", "edit_task", "remove_task", "add_phase", "edit_phase", "delete_phase", "update_tech_stack", "update_roadmap"]] = Field(default=None, description="Specific structured operation")
    phase_data: Optional[GeneratedPhaseSchema] = Field(default=None, description="New or edited phase details when action is add_phase or edit_phase")
    target_phase_id: Optional[int] = Field(default=None, description="Database ID of target phase being edited or deleted")
    target_phase_order: Optional[int] = Field(default=None, description="Phase order/number of target phase being edited or deleted")
    target_task_ids: Optional[List[int]] = Field(default=None, description="List of target task IDs affected or removed")
    changed_fields: Optional[List[str]] = Field(default=None, description="Names of fields changed")
    reason: Optional[str] = Field(default=None, description="Technical reason for the change")
    new_tech_stack: Optional[str] = Field(default=None, description="Updated tech stack when action is update_tech_stack")
    affected_phases: Optional[List[GeneratedPhaseSchema]] = Field(default=None, description="List of updated phases when action is update_tech_stack or update_roadmap")
    change_summary: Optional[str] = Field(default=None, description="Clear summary of proposed changes before user accepts")
    impact_on_completed_tasks: Optional[str] = Field(default=None, description="Impact explanation on completed tasks")
    roadmap_version: Optional[str] = Field(default=None, description="ISO timestamp of roadmap version")


class GeneratedColumnSchema(BaseModel):
    name: str = Field(description="Column or field name")
    data_type: str = Field(description="Data type e.g. UUID, VARCHAR(255), INTEGER, TIMESTAMP, ObjectId, String, Array")
    is_primary: bool = Field(default=False, description="Whether this is a primary key")
    is_foreign: bool = Field(default=False, description="Whether this is a foreign key")
    references: str = Field(default="", description="Target table and column e.g. users.id")
    is_unique: bool = Field(default=False, description="Whether this has a unique constraint")
    is_nullable: bool = Field(default=False, description="Whether this allows null values")


class GeneratedTableSchema(BaseModel):
    name: str = Field(description="Table or collection name in snake_case e.g. users, orders")
    description: str = Field(description="Brief explanation of entity role")
    columns: List[GeneratedColumnSchema] = Field(description="List of columns or document fields")


class GeneratedRelationshipSchema(BaseModel):
    source_table: str = Field(description="Source table name e.g. profiles, orders")
    target_table: str = Field(description="Target table name e.g. users")
    relationship_type: str = Field(default="1:N", description="'1:1', '1:N', or 'N:M'")
    foreign_key_column: str = Field(default="", description="The foreign key column name e.g. user_id")


class GeneratedEntityPromptResponse(BaseModel):
    explanation: str = Field(default="", description="Conversational, natural answer and explanation like an expert AI assistant explaining the architecture, answering user questions, or detailing what was modified.")
    primary_entity: GeneratedTableSchema = Field(description="The primary table or collection being edited or created")
    new_related_entities: List[GeneratedTableSchema] = Field(default_factory=list, description="Any new related tables or collections created to fulfill the prompt")
    relationships: List[GeneratedRelationshipSchema] = Field(default_factory=list, description="Connections between primary_entity and new_related_entities or other tables")


class GeneratedDBSchema(BaseModel):
    schema_type: str = Field(description="'table' for SQL or 'document' for NoSQL")
    db_engine: str = Field(description="e.g. PostgreSQL, MySQL, SQLite, MongoDB")
    tables: List[GeneratedTableSchema] = Field(description="List of database tables or document collections")
    sql_ddl: str = Field(default="", description="Ready-to-execute SQL CREATE TABLE statements")
    nosql_code: str = Field(default="", description="Mongoose or Prisma Schema representation")


class RoadmapSchemaChangeEntity(BaseModel):
    name: str = Field(description="Name of the table or collection")
    action: Literal["create", "modify", "delete", "preserve"] = Field(description="Action to take on this entity")
    description: Optional[str] = Field(default="", description="Technical reason and description of changes")
    columns_added: List[str] = Field(default_factory=list, description="Names of columns or fields added")
    columns_removed: List[str] = Field(default_factory=list, description="Names of columns or fields removed")


class RoadmapSchemaProposalSchema(BaseModel):
    has_changes: bool = Field(description="True if roadmap changes affect stored data models; False if no data-model impact")
    summary: str = Field(default="", description="Summary of schema proposal")
    before_after_summary: str = Field(default="", description="Before vs After comparison e.g. Before: 4 tables (...). After: 6 tables (added: subscriptions, invoices; modified: users).")
    modeling_notes: str = Field(default="", description="Explanation of SQL vs NoSQL architectural design choices for this stack")
    affected_entities: List[RoadmapSchemaChangeEntity] = Field(default_factory=list, description="List of affected entities with actions")
    proposed_tables: List[GeneratedTableSchema] = Field(default_factory=list, description="Full proposed list of tables/collections, merging new/modified ones while preserving all existing unmodified tables and IDs")
    sql_ddl: Optional[str] = Field(default="", description="Updated SQL DDL if relational")
    nosql_code: Optional[str] = Field(default="", description="Updated NoSQL code if document")


class SingleDatabaseSchemaProposal(BaseModel):
    summary: str = Field(description="Summary of database schema changes derived from project context")
    rationale: str = Field(description="Architectural rationale explaining entity models and relationships")
    db_engine: str = Field(description="Target database engine, e.g. PostgreSQL, MongoDB, MySQL, SQLite, Supabase")
    schema_type: str = Field(description="'table' for relational or 'document' for document databases")
    tables: List[GeneratedTableSchema] = Field(description="List of database tables or document collections")
    added_entities: List[str] = Field(default_factory=list, description="Names of new entities added compared to existing schema")
    modified_entities: List[str] = Field(default_factory=list, description="Names of entities modified compared to existing schema")
    preserved_entities: List[str] = Field(default_factory=list, description="Names of entities preserved intact from existing schema")
    removed_entities: List[str] = Field(default_factory=list, description="Names of entities removed from existing schema")
    code: str = Field(default="", description="Ready-to-execute schema code: SQL DDL for relational or Mongoose/TypeScript schema for document NoSQL")
    modeling_notes: str = Field(default="", description="Key modeling decisions specific to this engine")


