# DevPilot AI

DevPilot AI is an AI-powered developer workspace and architecture planning platform. It bridges the gap between project requirements and implementation by automatically transforming project scopes, target tech stacks, and specifications into structured development roadmaps, an interactive visual whiteboard, and an architectural database schema.

---

## Overview

Software projects often suffer from planning overhead, vague scope definitions, architectural mismatches, and fragmented documentation. Developers frequently need to:
- Break complex requirements down into chronological phases, milestones, and actionable tasks.
- Keep execution roadmaps synchronized with technology stack changes.
- Visualize dependency trees across phases and tasks without manually diagramming each change.
- Design database entities (tables or document collections) matching the chosen tech stack without drift between product requirements and database schema.

DevPilot AI resolves this by providing a unified, project-scoped workspace where AI generates, refines, and synchronizes the roadmap, visual DAG whiteboard, and database schema in real time.

---

## Core Feature Areas

### 1. AI-Generated Roadmaps and Roadmap Copilot
- **Automated Roadmap Generation:** When a project is created or regenerated with a name, description, tech stack, and requirements, DevPilot AI synthesizes a full multi-phase engineering plan (typically 3 to 5 distinct phases such as Foundation & Infrastructure, Core Features, and Integrations).
- **Phased Hierarchy:** Each roadmap organizes work into Phases, Milestones within each phase, and actionable Tasks within each milestone.
- **Roadmap Copilot Drawer:** An interactive chat copilot that acts as a Principal Software Architect. You can ask architectural questions, request new features, or initiate stack migrations (e.g., migrating from MongoDB to PostgreSQL, adding Redis caching, or reorganizing milestones).
- **Reviewable Action Proposals:** Modifications suggested by the Copilot (such as `edit_phase`, `add_phase`, `delete_phase`, `update_roadmap`, or `update_tech_stack`) generate non-destructive visual proposal cards in the chat drawer. Changes are only applied to the database when confirmed by the user.

### 2. Project and Task Progress Tracking
- **Project Scope Management:** Create and manage distinct software projects with designated status markers (`Planning`, `In Progress`, `Completed`), target tech stacks, and functional specifications.
- **Task Execution Tracking:** Developers can toggle task completion states. Progress percentage bars across phases and the overall roadmap dynamically recalculate as milestones and tasks are executed.
- **Architectural Constraints & Continuity:** Copilot sessions persist confirmed architectural decisions (e.g., choosing a specific deployment target or database vendor) so subsequent chat turns and roadmap updates adhere to established project invariants.

### 3. Visual Roadmap Whiteboard & Database Schema Designer
- **Interactive Whiteboard Canvas:** A zoomable, pannable flow canvas powered by ReactFlow (`@xyflow/react`) that maps the roadmap into a Directed Acyclic Graph (DAG) connecting Phases, Milestones, Tasks, and Decision nodes.
- **Programmatic Whiteboard Layout:** The whiteboard is generated programmatically from roadmap database records. It does not invoke a separate LLM call to build the graph layout, preventing hallucinated connections and unnecessary token overhead. Node positions, drag states, custom additions, edits, cuts, copies, and pastes can be customized and saved per project.
- **Unified Database Schema Designer:** Derives a project-scoped database schema directly matching the database technology declared in the project's tech stack (e.g., PostgreSQL relational tables with 3NF foreign keys vs. MongoDB collections with embedded documents or ObjectId references).
- **Code Generation & Reviewable Schema Sync:** Schema changes generate runnable SQL DDL or NoSQL schemas (e.g., Mongoose code). When roadmap features change, DevPilot AI generates reviewable schema proposals showing added, preserved, or removed entities that must be approved before saving.

---

## How AI Works in DevPilot AI

DevPilot AI implements a dual-provider orchestration strategy designed for high speed and fault tolerance:

```
[ Frontend Request (Roadmap / Copilot / Schema) ]
                     │
                     ▼
           [ Backend AI Services ]
                     │
         Is GROQ_API_KEY configured?
                    / \
             YES  /     \  NO
                /         \
               ▼           ▼
        [ GroqService ]  [ Google Gemini Client ]
        (Primary attempt) (Fallback or primary if no Groq)
               │                 │
      Success? ───► YES ──► Return Parsed & Validated JSON
               │
              NO (Error / Timeout)
               │
               ▼
        [ Google Gemini Client ]
        (Tries configured model + fallback model chain)
               │
      Success? ───► Return Validated Pydantic Models
```

### Provider Flow & Model Defaults
1. **Groq (Primary Attempt):** When `GROQ_API_KEY` is present and valid (starts with `gsk_`), requests first attempt JSON generation via Groq using fast open-weights models.
   - Code default model: `qwen/qwen3.8-27b`
   - Fallback models in code: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`
   - Configurable via: `GROQ_MODEL` environment variable.
2. **Google Gemini (Fallback or Direct):** If Groq is unconfigured or fails (e.g. rate limit, connection timeout, or schema mismatch), the service automatically falls back to the Google GenAI SDK using `GEMINI_API_KEY`.
   - Code default model: `gemini-3.6-flash` (or `gemini-3-flash-preview` in fallback chains)
   - Fallback models in code: `gemini-2.5-flash-lite`, `gemini-flash-latest`, `gemini-2.0-flash`
   - Configurable via: `GEMINI_MODEL` environment variable.
3. **Structured Outputs:** All responses are strictly validated through Pydantic schemas (`GeneratedRoadmapSchema`, `SingleDatabaseSchemaProposal`, `RoadmapCopilotResponse`) before returning to the frontend.
4. **Whiteboard Graph Construction:** Unlike schema and roadmap generation, the visual whiteboard canvas is derived programmatically from the persisted relational roadmap records (`Roadmap`, `RoadmapPhase`, `RoadmapMilestone`, `RoadmapTask`) using topological layout calculations. It does not call an AI model.

---

## Tech Stack

### Frontend
- **Framework:** React 19, TypeScript
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS 4
- **Diagramming & Flow Canvas:** `@xyflow/react` (ReactFlow v12)
- **Icons:** `lucide-react`
- **State & Networking:** Native Fetch with CSRF handling and credential cookies

### Backend
- **Framework:** Django 5+ / Python 3.10+
- **API Framework:** Django REST Framework (DRF)
- **Authentication:** TokenAuthentication and SessionAuthentication with CSRF protection
- **CORS:** `django-cors-headers`
- **Database:** SQLite (default for development) or PostgreSQL via `dj-database-url` / `psycopg2-binary`
- **AI Integration:** `google-genai` SDK, `requests` for Groq API, and `pydantic` for schema validation
