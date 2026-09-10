from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import StudentSkill, Skill, User

student_skills_bp = Blueprint('student_skills', __name__, url_prefix='/api/student-skills')

PROFICIENCY_LABELS = {
    0: 'No Knowledge',
    1: 'Beginner',
    2: 'Basic',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert'
}


def _get_verified_student(user_id_str):
    """Return the current student; this is not an admin API."""
    try:
        uid = int(user_id_str)
    except (TypeError, ValueError):
        return None
    user = User.query.get(uid)
    return user if user and user.role == 'student' else None


@student_skills_bp.route('', methods=['GET'])
@jwt_required()
def get_my_skills():
    """Return all skills the current student has added with their proficiency."""
    uid = get_jwt_identity()
    user = _get_verified_student(uid)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    my_skills = (
        StudentSkill.query
        .filter_by(student_id=user.id)
        .order_by(StudentSkill.updated_at.desc())
        .all()
    )
    return jsonify({'skills': [s.to_dict() for s in my_skills]}), 200


@student_skills_bp.route('', methods=['POST'])
@jwt_required()
def add_skill():
    """Add a skill with a proficiency level for the current student."""
    uid = get_jwt_identity()
    user = _get_verified_student(uid)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Request body must be a JSON object.'}), 400
    skill_id = data.get('skill_id')
    proficiency = data.get('proficiency', 0)

    if skill_id is None:
        return jsonify({'error': 'skill_id is required.'}), 400

    try:
        skill_id = int(skill_id)
        proficiency = int(proficiency)
    except (ValueError, TypeError):
        return jsonify({'error': 'skill_id and proficiency must be integers.'}), 400

    if proficiency < 0 or proficiency > 5:
        return jsonify({'error': 'Proficiency must be between 0 and 5.'}), 400

    skill = Skill.query.get(skill_id)
    if not skill:
        return jsonify({'error': 'Skill not found.'}), 404

    existing = StudentSkill.query.filter_by(student_id=user.id, skill_id=skill_id).first()
    if existing:
        existing.proficiency = proficiency
        db.session.commit()
        return jsonify({
            'message': f'Skill "{skill.name}" already existed; proficiency updated to {PROFICIENCY_LABELS[proficiency]}.',
            'skill': existing.to_dict()
        }), 200

    entry = StudentSkill(student_id=user.id, skill_id=skill_id, proficiency=proficiency)
    db.session.add(entry)
    db.session.commit()

    return jsonify({
        'message': f'Skill "{skill.name}" added with proficiency {PROFICIENCY_LABELS[proficiency]}.',
        'skill': entry.to_dict()
    }), 201


@student_skills_bp.route('/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_skill_proficiency(entry_id):
    """Update the proficiency level for an existing student skill entry."""
    uid = get_jwt_identity()
    user = _get_verified_student(uid)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    entry = StudentSkill.query.get(entry_id)
    if not entry:
        return jsonify({'error': 'Skill entry not found.'}), 404

    # Ownership check
    if entry.student_id != user.id:
        return jsonify({'error': 'You can only modify your own skill entries.'}), 403

    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Request body must be a JSON object.'}), 400
    proficiency = data.get('proficiency')

    if proficiency is None:
        return jsonify({'error': 'proficiency is required.'}), 400

    try:
        proficiency = int(proficiency)
    except (ValueError, TypeError):
        return jsonify({'error': 'proficiency must be an integer between 0 and 5.'}), 400

    if proficiency < 0 or proficiency > 5:
        return jsonify({'error': 'Proficiency must be between 0 and 5.'}), 400

    entry.proficiency = proficiency
    db.session.commit()

    return jsonify({
        'message': f'Proficiency updated to {PROFICIENCY_LABELS[proficiency]}.',
        'skill': entry.to_dict()
    }), 200


@student_skills_bp.route('/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def remove_skill(entry_id):
    """Remove a skill from the student's profile."""
    uid = get_jwt_identity()
    user = _get_verified_student(uid)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    entry = StudentSkill.query.get(entry_id)
    if not entry:
        return jsonify({'error': 'Skill entry not found.'}), 404

    if entry.student_id != user.id:
        return jsonify({'error': 'You can only remove your own skill entries.'}), 403

    skill_name = entry.skill.name if entry.skill else 'Unknown'
    db.session.delete(entry)
    db.session.commit()

    return jsonify({'message': f'Skill "{skill_name}" removed from your profile.'}), 200


@student_skills_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_skill_summary():
    """Return a summary: count by category and overall count."""
    uid = get_jwt_identity()
    user = _get_verified_student(uid)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    my_skills = StudentSkill.query.filter_by(student_id=user.id).all()

    by_category = {}
    for s in my_skills:
        cat = s.skill.category if s.skill else 'Unknown'
        by_category.setdefault(cat, 0)
        by_category[cat] += 1

    return jsonify({
        'total_skills': len(my_skills),
        'by_category': by_category,
        'avg_proficiency': round(sum(s.proficiency for s in my_skills) / len(my_skills), 1) if my_skills else 0
    }), 200
