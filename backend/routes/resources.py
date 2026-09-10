from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import LearningResource, Skill, User

resources_bp = Blueprint('resources', __name__, url_prefix='/api/resources')

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


@resources_bp.route('', methods=['GET'])
def get_resources():
    skill_id = request.args.get('skill_id', type=int)
    if skill_id:
        resources = LearningResource.query.filter_by(skill_id=skill_id).order_by(LearningResource.title.asc()).all()
    else:
        resources = LearningResource.query.order_by(LearningResource.created_at.desc()).all()

    return jsonify({'resources': [r.to_dict() for r in resources]}), 200


@resources_bp.route('', methods=['POST'])
@admin_required
def create_resource():
    data = request.get_json() or {}
    skill_id = data.get('skill_id')
    title = data.get('title', '').strip()
    url = data.get('url', '').strip()
    resource_type = data.get('resource_type', 'Course').strip()
    difficulty_level = data.get('difficulty_level', 'Beginner').strip()
    platform = data.get('platform', '').strip()

    if not skill_id or not title or not url:
        return jsonify({'error': 'Skill, title, and URL are required.'}), 400

    skill = Skill.query.get(skill_id)
    if not skill:
        return jsonify({'error': 'Associated skill not found.'}), 404

    resource = LearningResource(
        skill_id=skill_id,
        title=title,
        url=url,
        resource_type=resource_type,
        difficulty_level=difficulty_level,
        platform=platform
    )
    db.session.add(resource)
    db.session.commit()

    return jsonify({'message': 'Learning resource created.', 'resource': resource.to_dict()}), 201


@resources_bp.route('/<int:resource_id>', methods=['PUT'])
@admin_required
def update_resource(resource_id):
    resource = LearningResource.query.get(resource_id)
    if not resource:
        return jsonify({'error': 'Resource not found.'}), 404

    data = request.get_json() or {}
    if 'title' in data:
        resource.title = data['title'].strip()
    if 'url' in data:
        resource.url = data['url'].strip()
    if 'resource_type' in data:
        resource.resource_type = data['resource_type'].strip()
    if 'difficulty_level' in data:
        resource.difficulty_level = data['difficulty_level'].strip()
    if 'platform' in data:
        resource.platform = data['platform'].strip()
    if 'skill_id' in data:
        resource.skill_id = data['skill_id']

    db.session.commit()
    return jsonify({'message': 'Resource updated.', 'resource': resource.to_dict()}), 200


@resources_bp.route('/<int:resource_id>', methods=['DELETE'])
@admin_required
def delete_resource(resource_id):
    resource = LearningResource.query.get(resource_id)
    if not resource:
        return jsonify({'error': 'Resource not found.'}), 404

    db.session.delete(resource)
    db.session.commit()
    return jsonify({'message': 'Resource deleted.'}), 200

