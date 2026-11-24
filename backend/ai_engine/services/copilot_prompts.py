import json
import re

class RoadmapCopilotPromptHelper:
    @classmethod
    def _normalize_copilot_data(cls, data):
        if not isinstance(data, dict):
            return data
        if 'explanation' not in data and 'message' in data:
            data['explanation'] = str(data['message'])
        elif 'explanation' not in data:
            data['explanation'] = 'Here is the requested roadmap architectural proposal.'
        valid_actions = {'none', 'add_phase', 'edit_phase', 'delete_phase', 'update_tech_stack', 'update_roadmap'}
        if data.get('action') not in valid_actions:
            data['action'] = 'none'

        if not data.get('operation'):
            action_to_op = {
                'none': 'explanation',
                'add_phase': 'add_phase',
                'edit_phase': 'edit_phase',
                'delete_phase': 'delete_phase',
                'update_tech_stack': 'update_tech_stack',
                'update_roadmap': 'update_roadmap',
            }
            data['operation'] = action_to_op.get(data.get('action'), 'explanation')

        def _norm_single_phase(p, default_idx=None):
            if not isinstance(p, dict):
                return p
            if 'id' in p and p['id'] is not None:
                try:
                    p['id'] = int(p['id'])
                except (ValueError, TypeError):
                    p['id'] = None
            if not p.get('description'):
                p_title = p.get('title', 'Development Phase')
                p['description'] = f"Comprehensive architecture and implementation for {p_title}."
            if 'order' in p and p['order'] is not None:
                try:
                    p['order'] = int(p['order'])
                except (ValueError, TypeError):
                    p['order'] = default_idx
            else:
                p['order'] = default_idx
            milestones = p.get('milestones', [])
            for m_idx, m in enumerate(milestones, start=1):
                if isinstance(m, dict):
                    if 'id' in m and m['id'] is not None:
                        try:
                            m['id'] = int(m['id'])
                        except (ValueError, TypeError):
                            m['id'] = None
                    m_title = m.get('title') or f"Milestone {m_idx}"
                    if not m.get('description'):
                        m['description'] = f"Deliver and validate core components for {m_title}."
                    raw_tasks = m.get('tasks', [])
                    norm_tasks = []
                    auto_pat = re.compile(r'\b(?:auto(?:matic(?:ally)?)?[- ]+(?:upgrade|purchase|billing|charge)|automatically[- ]+charge)\b', re.I)
                    for t_idx, t in enumerate(raw_tasks, start=1):
                        if isinstance(t, str):
                            t_title = t.strip()
                            if auto_pat.search(t_title):
                                t_title = auto_pat.sub('prompt upgrade and plan selection', t_title)
                            t_desc = f"Implement and configure {t_title}."
                            norm_tasks.append({'id': None, 'title': t_title, 'description': t_desc, 'order': t_idx, 'is_completed': None})
                        elif isinstance(t, dict):
                            t_id = None
                            if 'id' in t and t['id'] is not None:
                                try:
                                    t_id = int(t['id'])
                                except (ValueError, TypeError):
                                    t_id = None
                            t_title = t.get('title') or t.get('name') or f'Task {t_idx}'
                            t_desc = (t.get('description') or '').strip()
                            if auto_pat.search(t_title):
                                t_title = auto_pat.sub('prompt upgrade and plan selection', t_title)
                            if auto_pat.search(t_desc):
                                t_desc = auto_pat.sub('prompt user with upgrade modal and plan selection options', t_desc)
                            if not t_desc:
                                t_desc = f"Implement and verify {t_title}."
                            norm_tasks.append({
                                'id': t_id,
                                'title': t_title,
                                'description': t_desc,
                                'order': t.get('order', t_idx),
                                'is_completed': t.get('is_completed'),
                            })
                    m['tasks'] = norm_tasks
                    if 'order' not in m:
                        m['order'] = m_idx
            return p

        phase = data.get('phase_data')
        if isinstance(phase, dict):
            data['phase_data'] = _norm_single_phase(phase)

        affected = data.get('affected_phases')
        if isinstance(affected, list):
            data['affected_phases'] = [_norm_single_phase(p, idx) for idx, p in enumerate(affected, start=1)]

        return data

    @classmethod
    def _resolve_target_phase(cls, roadmap, data, active_phase=None, prompt_text=""):
        if not isinstance(data, dict):
            return data
        action = data.get('action')
        if action in ['edit_phase', 'delete_phase']:
            target_phase = None
            target_id = data.get('target_phase_id')
            target_order = data.get('target_phase_order')
            phase_data = data.get('phase_data') or {}
            phase_title = (phase_data.get('title') or '').strip().lower()

            prompt_phase_match = re.search(r'\bphase\s*(\d+)\b', prompt_text or '', re.IGNORECASE)
            if prompt_phase_match:
                try:
                    p_num = int(prompt_phase_match.group(1))
                    target_phase = roadmap.phases.filter(order=p_num).first()
                except (ValueError, TypeError):
                    pass

            if not target_phase and target_order:
                try:
                    target_phase = roadmap.phases.filter(order=int(target_order)).first()
                except (ValueError, TypeError):
                    pass

            if not target_phase and target_id:
                try:
                    target_phase = roadmap.phases.filter(id=int(target_id)).first()
                except (ValueError, TypeError):
                    pass

            if not target_phase and phase_title:
                target_phase = roadmap.phases.filter(title__iexact=phase_title).first()

            if not target_phase and active_phase:
                target_phase = active_phase

            if target_phase:
                data['target_phase_id'] = target_phase.id
                data['target_phase_order'] = target_phase.order
                if isinstance(data.get('phase_data'), dict):
                    data['phase_data']['order'] = target_phase.order

        elif action in ['update_roadmap', 'update_tech_stack']:
            affected = data.get('affected_phases')
            if isinstance(affected, list):
                used_phase_ids = set()
                for p in affected:
                    if not isinstance(p, dict):
                        continue
                    p_id = p.get('id')
                    p_title = (p.get('title') or '').strip().lower()
                    matched = None
                    if p_id:
                        try:
                            matched = roadmap.phases.filter(id=int(p_id)).first()
                        except (ValueError, TypeError):
                            pass
                    if not matched and p_title:
                        matched = roadmap.phases.filter(title__iexact=p_title).exclude(id__in=used_phase_ids).first()
                    if matched:
                        used_phase_ids.add(matched.id)
                        p['id'] = matched.id
                        p['target_phase_id'] = matched.id
                        p['order'] = matched.order

                for p in affected:
                    if not isinstance(p, dict) or p.get('id'):
                        continue
                    p_order = p.get('order')
                    if p_order:
                        try:
                            candidate = roadmap.phases.filter(order=int(p_order)).exclude(id__in=used_phase_ids).first()
                            if candidate:
                                used_phase_ids.add(candidate.id)
                                p['id'] = candidate.id
                                p['target_phase_id'] = candidate.id
                                p['order'] = candidate.order
                        except (ValueError, TypeError):
                            pass

        return data

    @classmethod
    def _is_explanation_request(cls, prompt_text: str):
        text = (prompt_text or "").strip().lower()
        explanation_prefixes = (
            'what ', 'why ', 'how ', 'explain', 'describe', 'tell me',
            'recommend', 'suggest', 'what is', 'what are', 'pros and cons',
            'compare', 'is it better', 'which tech', 'which database'
        )
        if any(text.startswith(p) for p in explanation_prefixes) and not any(kw in text for kw in ['instead of', 'replace', 'remove', 'add task', 'add phase', 'delete phase', 'change to']):
            return True
        return False

    @classmethod
    def _is_ambiguous_request(cls, prompt_text: str):
        text = (prompt_text or "").strip().lower()
        ambiguous_exacts = [
            'change database', 'change the database', 'switch database',
            'change tech stack', 'change the tech stack', 'update tech stack',
            'change framework', 'change architecture', 'optimize', 'improve',
            'update deployment', 'change hosting', 'modify roadmap'
        ]
        if text in ambiguous_exacts:
            return True
        if (text.startswith('change ') or text.startswith('update ') or text.startswith('switch ')) and len(text.split()) <= 3:
            if not any(kw in text for kw in ['to', 'with', 'instead', 'phase', 'task', 'add', 'remove']):
                return True
        return False

    @classmethod
    def _sanitize_phase_data_structure(cls, phase_dict):
        if not isinstance(phase_dict, dict):
            return phase_dict
        milestones = phase_dict.get('milestones', [])
        clean_milestones = []
        for m_idx, m in enumerate(milestones, start=1):
            if not isinstance(m, dict):
                continue
            seen_titles = set()
            clean_tasks = []
            for t_idx, t in enumerate(m.get('tasks', []), start=1):
                if not isinstance(t, dict):
                    continue
                norm_title = (t.get('title') or '').strip().lower()
                if not norm_title or norm_title in seen_titles:
                    continue
                seen_titles.add(norm_title)
                t_copy = dict(t)
                t_copy['order'] = len(clean_tasks) + 1
                clean_tasks.append(t_copy)
            if clean_tasks:
                m_copy = dict(m)
                m_copy['order'] = len(clean_milestones) + 1
                m_copy['tasks'] = clean_tasks
                clean_milestones.append(m_copy)
        phase_dict['milestones'] = clean_milestones
        return phase_dict

    @classmethod
    def _apply_generic_roadmap_intent(cls, roadmap, data, prompt_text="", current_tech_stack=""):
        if not isinstance(data, dict):
            return data

        if cls._is_explanation_request(prompt_text):
            data['action'] = 'none'
            data['operation'] = 'explanation'
            data['phase_data'] = None
            data['affected_phases'] = None
            data['target_phase_id'] = None
            data['target_phase_order'] = None
            return data

        if cls._is_ambiguous_request(prompt_text):
            data['action'] = 'none'
            data['operation'] = 'clarification'
            data['phase_data'] = None
            data['affected_phases'] = None
            data['target_phase_id'] = None
            data['target_phase_order'] = None
            if not data.get('explanation') or '?' not in data.get('explanation', '') or 'clarif' not in data.get('explanation', '').lower():
                data['explanation'] = "Could you please clarify your request by specifying the exact technology, phase, or tasks you would like to modify?"
            return data

        if data.get('phase_data'):
            p_data = cls._sanitize_phase_data_structure(data['phase_data'])
            if data.get('action') != 'add_phase':
                target_p = None
                if data.get('target_phase_id'):
                    target_p = roadmap.phases.filter(id=data['target_phase_id']).first()
                if not target_p and data.get('target_phase_order'):
                    target_p = roadmap.phases.filter(order=data['target_phase_order']).first()
                if not target_p and p_data.get('title'):
                    target_p = roadmap.phases.filter(title__iexact=p_data['title'].strip()).first()
                if target_p:
                    p_data['id'] = target_p.id
                    p_data['order'] = target_p.order
                    p_data['target_phase_id'] = target_p.id
                    data['target_phase_id'] = target_p.id
                    data['target_phase_order'] = target_p.order
            else:
                p_data['id'] = None
                p_data['target_phase_id'] = None
            data['phase_data'] = p_data

        affected = data.get('affected_phases')
        if isinstance(affected, list) and affected:
            clean_affected = []
            max_existing_order = 0
            for existing_p in roadmap.phases.all():
                if existing_p.order > max_existing_order:
                    max_existing_order = existing_p.order

            used_phase_ids = set()
            for p in affected:
                if not isinstance(p, dict):
                    continue
                matched = None
                p_id = p.get('id') or p.get('target_phase_id')
                if p_id:
                    try:
                        matched = roadmap.phases.filter(id=int(p_id)).first()
                    except (ValueError, TypeError):
                        pass
                if not matched and p.get('title'):
                    matched = roadmap.phases.filter(title__iexact=p['title'].strip()).exclude(id__in=used_phase_ids).first()
                if not matched and p.get('order'):
                    try:
                        candidate = roadmap.phases.filter(order=int(p['order'])).exclude(id__in=used_phase_ids).first()
                        if candidate:
                            matched = candidate
                    except (ValueError, TypeError):
                        pass
                if matched:
                    used_phase_ids.add(matched.id)
                    p['id'] = matched.id
                    p['order'] = matched.order
                    p['target_phase_id'] = matched.id
                    db_task_ids = {t.id for m in matched.milestones.all() for t in m.tasks.all()}
                    for m in p.get('milestones', []):
                        if isinstance(m, dict):
                            for t in m.get('tasks', []):
                                if isinstance(t, dict) and t.get('id') in db_task_ids:
                                    pass
                    clean_affected.append(cls._sanitize_phase_data_structure(p))
                else:
                    p['id'] = None
                    p['target_phase_id'] = None
                    if not p.get('order'):
                        max_existing_order += 1
                        p['order'] = max_existing_order
                    clean_affected.append(cls._sanitize_phase_data_structure(p))

            clean_affected.sort(key=lambda x: x.get('order', 1))
            data['affected_phases'] = clean_affected

            if len(clean_affected) > 1:
                data['action'] = 'update_roadmap'
                data['operation'] = 'update_roadmap'
            elif len(clean_affected) == 1:
                first_p = clean_affected[0]
                if first_p.get('id'):
                    data['action'] = 'edit_phase'
                    if not data.get('operation') or data['operation'] in ['explanation', 'clarification']:
                        data['operation'] = 'edit_task'
                    data['target_phase_id'] = first_p.get('id')
                    data['target_phase_order'] = first_p.get('order')
                    data['phase_data'] = first_p
                else:
                    data['action'] = 'add_phase'
                    data['operation'] = 'add_phase'
                    data['phase_data'] = first_p

        return data

