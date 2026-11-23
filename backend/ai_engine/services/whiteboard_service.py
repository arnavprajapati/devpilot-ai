from typing import List, Dict, Any
from ..models import RoadmapWhiteboard

class WhiteboardService:
    @classmethod
    def build_nodes_and_edges(cls, roadmap):
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
            for milestone in milestones:
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
                        "animated": src_id == phase_node_id,
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
                    "description": f"Verify all {phase.title} deliverables before proceeding.",
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

        return nodes, edges

    @classmethod
    def generate_initial_whiteboard(cls, roadmap):
        from ..models import RoadmapWhiteboard
        nodes, edges = cls.build_nodes_and_edges(roadmap)
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


