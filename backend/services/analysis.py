"""Deterministic, database-backed skill-gap analysis calculations."""

from models import StudentSkill

PROFICIENCY_LABELS = {
    0: 'No Knowledge',
    1: 'Beginner',
    2: 'Basic',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert',
}

IMPORTANCE_WEIGHTS = {
    'Critical': 5,
    'Important': 3,
    'Optional': 1,
}


def _importance_for(role_skill):
    """Map the Phase 2 core flag to documented, stable analysis weights."""
    if role_skill.is_core is True:
        return 'Critical', IMPORTANCE_WEIGHTS['Critical']
    if role_skill.is_core is False:
        return 'Important', IMPORTANCE_WEIGHTS['Important']
    return 'Optional', IMPORTANCE_WEIGHTS['Optional']


def _gap_status(gap):
    if gap == 0:
        return 'No Gap'
    if gap == 1:
        return 'Minor Gap'
    if gap == 2:
        return 'Moderate Gap'
    return 'Major Gap'


def _readiness_classification(score):
    if score >= 80:
        return 'Highly Ready'
    if score >= 60:
        return 'Developing'
    if score >= 40:
        return 'Needs Improvement'
    return 'Beginner'


def _priority_reason(item):
    current_label = PROFICIENCY_LABELS[item['current_proficiency']]
    required_label = PROFICIENCY_LABELS[item['required_proficiency']]
    if item['current_proficiency'] == 0:
        return (
            f"You currently have no proficiency in {item['skill_name']}, while "
            f"{item['target_career_title']} requires {required_label.lower()} proficiency. "
            f"It is a {item['importance'].lower()} requirement."
        )
    return (
        f"Your current level is {current_label.lower()}, while "
        f"{item['target_career_title']} requires {required_label.lower()} proficiency. "
        f"This is a {item['importance'].lower()} requirement with a {item['status'].lower()}."
    )


def build_skill_gap_analysis(student):
    """Return the current student's analysis or a stable empty-state error code.

    The score is a weighted requirement-satisfaction percentage:
    sum(importance_weight * min(current, required) / required) / sum(weights).
    It deliberately compares only the latest persisted student skills and role requirements.
    """
    career = student.target_career
    if not career:
        return None, 'no_target_career'

    role_skills = list(career.role_skills)
    if not role_skills:
        return None, 'no_career_requirements'

    current_skills = {
        entry.skill_id: entry.proficiency
        for entry in StudentSkill.query.filter_by(student_id=student.id).all()
    }
    skill_analysis = []
    weighted_match_total = 0.0
    weight_total = 0

    for requirement in role_skills:
        required = max(0, min(5, requirement.required_proficiency))
        current = max(0, min(5, current_skills.get(requirement.skill_id, 0)))
        gap = max(required - current, 0)
        importance, weight = _importance_for(requirement)
        match_ratio = min(current, required) / required if required else 1
        weighted_match_total += weight * match_ratio
        weight_total += weight
        skill_analysis.append({
            'skill_id': requirement.skill_id,
            'skill_name': requirement.skill.name if requirement.skill else 'Unknown skill',
            'skill_category': requirement.skill.category if requirement.skill else None,
            'current_proficiency': current,
            'current_proficiency_label': PROFICIENCY_LABELS[current],
            'required_proficiency': required,
            'required_proficiency_label': PROFICIENCY_LABELS[required],
            'skill_gap': gap,
            'status': _gap_status(gap),
            'importance': importance,
            'importance_weight': weight,
            'is_missing': current == 0,
            'is_absent_from_profile': requirement.skill_id not in current_skills,
            'priority_score': (gap * weight) + (weight if current == 0 and gap else 0),
            'target_career_title': career.title,
        })

    gaps = [item for item in skill_analysis if item['skill_gap'] > 0]
    gaps.sort(key=lambda item: (-item['priority_score'], -item['skill_gap'], item['skill_name'].lower()))
    for rank, item in enumerate(gaps, start=1):
        item['priority_rank'] = rank
        item['recommendation_reason'] = _priority_reason(item)
    for item in skill_analysis:
        if item['skill_gap'] == 0:
            item['priority_rank'] = None
            item['recommendation_reason'] = None
        item.pop('target_career_title')

    readiness_score = round((weighted_match_total / weight_total) * 100) if weight_total else 0
    status_counts = {
        status: sum(1 for item in skill_analysis if item['status'] == status)
        for status in ('No Gap', 'Minor Gap', 'Moderate Gap', 'Major Gap')
    }
    strengths = [item for item in skill_analysis if item['skill_gap'] == 0]
    missing_skills = [item for item in skill_analysis if item['is_missing']]
    major_gaps = [item for item in gaps if item['skill_gap'] >= 3]

    return {
        'target_career': {
            'id': career.id,
            'title': career.title,
            'description': career.description,
            'category': career.category,
        },
        'readiness_score': readiness_score,
        'readiness_classification': _readiness_classification(readiness_score),
        'calculation': {
            'method': 'weighted requirement satisfaction',
            'importance_weights': IMPORTANCE_WEIGHTS,
            'note': 'This estimated skill match score is not a guarantee of employment or job qualification.',
        },
        'summary': {
            'total_required_skills': len(skill_analysis),
            'skills_satisfied': len(strengths),
            'skills_requiring_improvement': len(gaps),
            'missing_skills': len(missing_skills),
            'status_counts': status_counts,
        },
        'recommended_next_skill': gaps[0] if gaps else None,
        'priority_skills': gaps[:5],
        'skill_gaps': gaps,
        'strengths': strengths,
        'major_gaps': major_gaps,
        'missing_skills': missing_skills,
        'skill_analysis': skill_analysis,
        'warnings': ['no_skills_added'] if not current_skills else [],
    }, None
