import re
from django.db import transaction
from ..models import (
    RoadmapPhase,
    RoadmapMilestone,
    RoadmapTask,
)

def _sync_milestones_and_tasks(phase, milestones_data):
    existing_milestones = list(phase.milestones.all().order_by('order'))
    kept_milestone_ids = []
    used_milestone_ids = set()

    for m_idx, m_item in enumerate(milestones_data, start=1):
        m_title = (m_item.get('title') or f"Milestone {m_idx}").strip()
        m_desc = m_item.get('description', '')
        matched_m = None

        m_id = m_item.get('id')
        if m_id:
            for em in existing_milestones:
                if em.id == m_id and em.id not in used_milestone_ids:
                    matched_m = em
                    break

        if not matched_m:
            for em in existing_milestones:
                if em.title.strip().lower() == m_title.lower() and em.id not in used_milestone_ids:
                    matched_m = em
                    break

        if not matched_m and len(existing_milestones) == len(milestones_data):
            for em in existing_milestones:
                if em.order == m_idx and em.id not in used_milestone_ids:
                    matched_m = em
                    break

        if matched_m:
            used_milestone_ids.add(matched_m.id)
            matched_m.title = m_title
            matched_m.description = m_desc
            matched_m.order = m_idx
            matched_m.save()
            milestone = matched_m
        else:
            milestone = RoadmapMilestone.objects.create(
                phase=phase,
                title=m_title,
                description=m_desc,
                order=m_idx,
            )
        kept_milestone_ids.append(milestone.id)

        existing_tasks = list(milestone.tasks.all().order_by('order'))
        kept_task_ids = []
        used_task_ids = set()
        raw_tasks = m_item.get('tasks', [])

        for t_idx, t_item in enumerate(raw_tasks, start=1):
            t_title = (t_item.get('title') or f"Task {t_idx}").strip()
            t_desc = t_item.get('description', '')
            matched_t = None

            t_id = t_item.get('id')
            if t_id:
                for et in existing_tasks:
                    if et.id == t_id and et.id not in used_task_ids:
                        matched_t = et
                        break

            if not matched_t:
                for et in existing_tasks:
                    if et.title.strip().lower() == t_title.lower() and et.id not in used_task_ids:
                        matched_t = et
                        break

            if not matched_t and len(existing_tasks) == len(raw_tasks):
                for et in existing_tasks:
                    if et.order == t_idx and et.id not in used_task_ids:
                        matched_t = et
                        break

            if matched_t:
                used_task_ids.add(matched_t.id)
                matched_t.title = t_title
                matched_t.description = t_desc
                matched_t.order = t_idx
                matched_t.save()
                task = matched_t
            else:
                task = RoadmapTask.objects.create(
                    milestone=milestone,
                    title=t_title,
                    description=t_desc,
                    order=t_idx,
                )
            kept_task_ids.append(task.id)
        milestone.tasks.exclude(id__in=kept_task_ids).delete()
    phase.milestones.exclude(id__in=kept_milestone_ids).delete()


def _validate_and_sanitize_roadmap_consistency(roadmap):
    existing_phases = list(roadmap.phases.all().order_by('order'))
    auto_pat = re.compile(r'\b(?:auto(?:matic(?:ally)?)?[- ]+(?:upgrade|purchase|billing|charge)|automatically[- ]+charge)\b', re.I)
    for idx, p in enumerate(existing_phases, start=1):
        if p.order != idx:
            p.order = idx
            p.save()
        existing_milestones = list(p.milestones.all().order_by('order'))
        for m_idx, m in enumerate(existing_milestones, start=1):
            if m.order != m_idx:
                m.order = m_idx
                m.save()
            seen_task_titles = set()
            existing_tasks = list(m.tasks.all().order_by('order'))
            active_task_idx = 1
            for t in existing_tasks:
                clean_title = (t.title or '').strip().lower()
                if not clean_title or clean_title in seen_task_titles:
                    t.delete()
                    continue
                seen_task_titles.add(clean_title)
                changed_t = False
                if auto_pat.search(t.title):
                    t.title = auto_pat.sub('prompt upgrade and plan selection', t.title)
                    changed_t = True
                if auto_pat.search(t.description):
                    t.description = auto_pat.sub('prompt user with upgrade modal and plan selection options', t.description)
                    changed_t = True
                if t.order != active_task_idx:
                    t.order = active_task_idx
                    changed_t = True
                if changed_t:
                    t.save()
                active_task_idx += 1


