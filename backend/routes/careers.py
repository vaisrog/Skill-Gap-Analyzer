from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import CareerRole, Skill, RoleSkill, User

careers_bp = Blueprint('careers', __name__, url_prefix='/api/careers')

def admin_required(fn):
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin privilege required.'}), 403
        return fn(*args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper


@careers_bp.route('', methods=['GET'])
def get_all_careers():
    roles = CareerRole.query.order_by(CareerRole.title.asc()).all()
    return jsonify({'career_roles': [role.to_dict(include_skills=True) for role in roles]}), 200


@careers_bp.route('/<int:role_id>', methods=['GET'])
def get_career_details(role_id):
    role = CareerRole.query.get(role_id)
    if not role:
        return jsonify({'error': 'Career role not found.'}), 404
    return jsonify({'career_role': role.to_dict(include_skills=True)}), 200


@careers_bp.route('/<int:role_id>/requirements', methods=['GET'])
def get_career_requirements(role_id):
    role = CareerRole.query.get(role_id)
    if not role:
        return jsonify({'error': 'Career role not found.'}), 404
    requirements = sorted(
        (item.to_dict() for item in role.role_skills),
        key=lambda item: (not item['is_core'], -item['required_proficiency'], item['skill_name'] or '')
    )
    return jsonify({
        'career_role': {
            'id': role.id,
            'title': role.title,
            'description': role.description,
            'category': role.category,
        },
        'requirements': requirements
    }), 200


@careers_bp.route('', methods=['POST'])
@admin_required
def create_career_role():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    icon = data.get('icon', 'Briefcase').strip()
    skills_data = data.get('skills', []) # List of {'skill_id': 1, 'required_proficiency': 4, 'is_core': True}

    if not title or not description:
        return jsonify({'error': 'Title and description are required.'}), 400

    if CareerRole.query.filter_by(title=title).first():
        return jsonify({'error': 'Career role with this title already exists.'}), 499

    role = CareerRole(title=title, description=description, icon=icon)
    db.session.add(role)
    db.session.flush()

    for item in skills_data:
        skill_id = item.get('skill_id')
        prof = item.get('required_proficiency', 3)
        is_core = item.get('is_core', True)
        if skill_id:
            rs = RoleSkill(role_id=role.id, skill_id=skill_id, required_proficiency=prof, is_core=is_core)
            db.session.add(rs)

    db.session.commit()
    return jsonify({'message': 'Career role created successfully.', 'career_role': role.to_dict()}), 201


@careers_bp.route('/<int:role_id>', methods=['PUT'])
@admin_required
def update_career_role(role_id):
    role = CareerRole.query.get(role_id)
    if not role:
        return jsonify({'error': 'Career role not found.'}), 404

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    icon = data.get('icon')

    if title:
        existing = CareerRole.query.filter_by(title=title).first()
        if existing and existing.id != role_id:
            return jsonify({'error': 'Another career role with this title already exists.'}), 409
        role.title = title

    if description:
        role.description = description
    if icon is not None:
        role.icon = icon

    db.session.commit()
    return jsonify({'message': 'Career role updated.', 'career_role': role.to_dict()}), 200


@careers_bp.route('/<int:role_id>', methods=['DELETE'])
@admin_required
def delete_career_role(role_id):
    role = CareerRole.query.get(role_id)
    if not role:
        return jsonify({'error': 'Career role not found.'}), 404

    db.session.delete(role)
    db.session.commit()
    return jsonify({'message': 'Career role deleted successfully.'}), 200
