from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Skill, User

skills_bp = Blueprint('skills', __name__, url_prefix='/api/skills')

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


@skills_bp.route('', methods=['GET'])
def get_skills():
    search = (request.args.get('search') or '').strip()
    category = (request.args.get('category') or '').strip()
    query = Skill.query
    if search:
        query = query.filter(Skill.name.ilike(f'%{search}%'))
    if category:
        query = query.filter(Skill.category == category)
    skills = query.order_by(Skill.category.asc(), Skill.name.asc()).all()
    return jsonify({'skills': [skill.to_dict() for skill in skills]}), 200


@skills_bp.route('/categories', methods=['GET'])
def get_skill_categories():
    categories = [row[0] for row in db.session.query(Skill.category).distinct().order_by(Skill.category.asc()).all()]
    return jsonify({'categories': categories}), 200


@skills_bp.route('', methods=['POST'])
@admin_required
def create_skill():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    category = data.get('category', '').strip()
    description = data.get('description', '').strip()

    if not name or not category:
        return jsonify({'error': 'Skill name and category are required.'}), 400

    if Skill.query.filter_by(name=name).first():
        return jsonify({'error': 'Skill with this name already exists.'}), 409

    skill = Skill(name=name, category=category, description=description)
    db.session.add(skill)
    db.session.commit()

    return jsonify({'message': 'Skill created successfully.', 'skill': skill.to_dict()}), 201


@skills_bp.route('/<int:skill_id>', methods=['PUT'])
@admin_required
def update_skill(skill_id):
    skill = Skill.query.get(skill_id)
    if not skill:
        return jsonify({'error': 'Skill not found.'}), 404

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    category = data.get('category', '').strip()
    description = data.get('description')

    if name:
        existing = Skill.query.filter_by(name=name).first()
        if existing and existing.id != skill_id:
            return jsonify({'error': 'Skill with this name already exists.'}), 409
        skill.name = name

    if category:
        skill.category = category
    if description is not None:
        skill.description = description.strip()

    db.session.commit()
    return jsonify({'message': 'Skill updated successfully.', 'skill': skill.to_dict()}), 200


@skills_bp.route('/<int:skill_id>', methods=['DELETE'])
@admin_required
def delete_skill(skill_id):
    skill = Skill.query.get(skill_id)
    if not skill:
        return jsonify({'error': 'Skill not found.'}), 404

    db.session.delete(skill)
    db.session.commit()
    return jsonify({'message': 'Skill deleted successfully.'}), 200
