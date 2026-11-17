import json
from django.conf import settings
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List


class GeneratedTaskSchema(BaseModel):
    title: str = Field(description="Actionable task title for engineers")
    description: str = Field(description="Brief explanation of task implementation")
    order: int = Field(default=1, description="Sequential task execution order")


class GeneratedMilestoneSchema(BaseModel):
    title: str = Field(description="Milestone milestone deliverable title")
    description: str = Field(description="Deliverable objective description")
    order: int = Field(default=1, description="Sequential milestone execution order")
    tasks: List[GeneratedTaskSchema] = Field(description="List of actionable tasks")


class GeneratedPhaseSchema(BaseModel):
    title: str = Field(description="Phase architectural title")
    description: str = Field(description="Phase engineering objective")
    duration: str = Field(description="Estimated phase duration e.g. 'Weeks 1-2'")
    order: int = Field(default=1, description="Phase sequential order")
    milestones: List[GeneratedMilestoneSchema] = Field(description="Phase milestones")


class GeneratedRoadmapSchema(BaseModel):
    title: str = Field(description="Overall development roadmap title")
    summary: str = Field(description="Executive summary of the technical execution plan")
    phases: List[GeneratedPhaseSchema] = Field(description="List of roadmap phases")


class GeminiRoadmapService:
    @classmethod
    def get_api_key(cls):
        api_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
        return api_key.strip()

    @classmethod
    def generate_roadmap(cls, project):
        api_key = cls.get_api_key()
        if not api_key:
            raise ValueError(
                "Gemini API key is not configured. AI service is unavailable."
            )

        model_name = getattr(settings, 'GEMINI_MODEL', 'gemini-3.6-flash')
        client = genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})

        prompt = (
            f"You are a Principal Software Architect at DevPilot AI.\n"
            f"Create a comprehensive, production-grade, highly personalized software engineering development roadmap "
            f"for the following software project:\n\n"
            f"Project Name: {project.name}\n"
            f"Project Description: {project.description}\n"
            f"Tech Stack: {project.tech_stack or 'Modern Full-Stack'}\n"
            f"Requirements / Constraints: {project.requirements or 'Standard production architecture'}\n\n"
            f"Instructions:\n"
            f"1. Break this project down into 3 to 4 sequential, realistic development phases.\n"
            f"2. Each phase must have a descriptive title, estimated duration (e.g. 'Weeks 1-2'), and clear description.\n"
            f"3. Under each phase, create 2 to 3 concrete engineering milestones.\n"
            f"4. Under each milestone, create 2 to 4 actionable, developer-friendly tasks specific to the tech stack.\n"
            f"5. Do NOT provide generic placeholders. Tailor all tasks specifically to '{project.name}' and its stated technologies."
        )

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
                response_schema=GeneratedRoadmapSchema,
                temperature=0.3,
            ),
        )

        raw_text = response.text or ''
        if not raw_text.strip():
            raise RuntimeError("Gemini returned an empty response. Please try again.")

        try:
            validated = GeneratedRoadmapSchema.model_validate_json(raw_text)
            return validated.model_dump()
        except Exception:
            cleaned = raw_text.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]
            if cleaned.startswith('```'):
                cleaned = cleaned[3:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            parsed = json.loads(cleaned.strip())
            validated = GeneratedRoadmapSchema.model_validate(parsed)
            return validated.model_dump()


class WhiteboardService:
    @classmethod
    def generate_initial_whiteboard(cls, roadmap):
        nodes = []
        edges = []
        current_x = 80
        base_y = 260

        phases = list(roadmap.phases.prefetch_related('milestones__tasks').all())

        for p_idx, phase in enumerate(phases):
            phase_node_id = f"phase-{phase.id}"
            nodes.append({
                "id": phase_node_id,
                "type": "phaseNode",
                "position": {"x": current_x, "y": base_y},
                "data": {
                    "label": phase.title,
                    "title": phase.title,
                    "description": phase.description,
                    "duration": phase.duration,
                    "order": phase.order,
                    "nodeType": "phase",
                    "phaseId": phase.id,
                },
            })

            pending_sources = [phase_node_id]
            cursor_x = current_x + 360

            milestones = list(phase.milestones.all())
            for m_idx, milestone in enumerate(milestones):
                milestone_node_id = f"milestone-{milestone.id}"
                nodes.append({
                    "id": milestone_node_id,
                    "type": "milestoneNode",
                    "position": {"x": cursor_x, "y": base_y},
                    "data": {
                        "label": milestone.title,
                        "title": milestone.title,
                        "description": milestone.description,
                        "order": milestone.order,
                        "nodeType": "milestone",
                        "phaseId": phase.id,
                        "milestoneId": milestone.id,
                    },
                })

                for src_id in pending_sources:
                    edges.append({
                        "id": f"e-{src_id}-{milestone_node_id}",
                        "source": src_id,
                        "target": milestone_node_id,
                        "type": "smoothstep",
                        "animated": True if src_id == phase_node_id else False,
                    })

                tasks = list(milestone.tasks.all())
                num_tasks = len(tasks)

                if num_tasks > 0:
                    task_cursor_x = cursor_x + 360
                    start_y = base_y - ((num_tasks - 1) * 75)
                    task_node_ids = []
                    for t_idx, task in enumerate(tasks):
                        task_node_id = f"task-{task.id}"
                        task_y = start_y + (t_idx * 150)
                        nodes.append({
                            "id": task_node_id,
                            "type": "taskNode",
                            "position": {"x": task_cursor_x, "y": task_y},
                            "data": {
                                "label": task.title,
                                "title": task.title,
                                "description": task.description,
                                "order": task.order,
                                "nodeType": "task",
                                "phaseId": phase.id,
                                "milestoneId": milestone.id,
                            },
                        })
                        edges.append({
                            "id": f"e-{milestone_node_id}-{task_node_id}",
                            "source": milestone_node_id,
                            "target": task_node_id,
                            "type": "smoothstep",
                        })
                        task_node_ids.append(task_node_id)
                    cursor_x = task_cursor_x + 340
                    pending_sources = task_node_ids
                else:
                    cursor_x += 360
                    pending_sources = [milestone_node_id]

            decision_node_id = f"decision-phase-{phase.id}"
            decision_x = cursor_x + 40
            nodes.append({
                "id": decision_node_id,
                "type": "decisionNode",
                "position": {"x": decision_x, "y": base_y},
                "data": {
                    "label": f"Phase {phase.order} Review Gate",
                    "title": f"Phase {phase.order} Review Gate",
                    "description": f"Verify all {phase.title} deliverables and test suites before progressing.",
                    "nodeType": "decision",
                    "phaseId": phase.id,
                },
            })

            for src_id in pending_sources:
                edges.append({
                    "id": f"e-{src_id}-{decision_node_id}",
                    "source": src_id,
                    "target": decision_node_id,
                    "type": "smoothstep",
                })

            if p_idx < len(phases) - 1:
                next_phase = phases[p_idx + 1]
                next_phase_node_id = f"phase-{next_phase.id}"
                current_x = decision_x + 380
                edges.append({
                    "id": f"e-{decision_node_id}-{next_phase_node_id}",
                    "source": decision_node_id,
                    "target": next_phase_node_id,
                    "type": "smoothstep",
                    "animated": True,
                    "label": "Approved",
                })
            else:
                current_x = decision_x + 380

        from .models import RoadmapWhiteboard
        whiteboard, _ = RoadmapWhiteboard.objects.update_or_create(
            roadmap=roadmap,
            defaults={
                "nodes": nodes,
                "edges": edges,
                "viewport": {"x": 0, "y": 0, "zoom": 1},
                "is_customized": False,
            },
        )
        return whiteboard
