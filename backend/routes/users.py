import re

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, CareerRole

users_bp = Blueprint('users', __name__, url_prefix='/api/users')
EMAIL_PATTERN = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')


def _validate_text(value, field_name, maximum, required=False):
    if not isinstance(value, str):
        return None, f'{field_name} must be text.'
    value = value.strip()
    if required and not value:
        return None, f'{field_name} is required.'
    if len(value) > maximum:
        return None, f'{field_name} must be {maximum} characters or fewer.'
    return value, None


@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    return jsonify({'user': user.to_dict()}), 200


@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Request body must be a JSON object.'}), 400

    # Only profile fields are accepted here. Identity, role, and permissions are never mutable.
    if 'full_name' in data:
        full_name, error = _validate_text(data['full_name'], 'Full name', 100, required=True)
        if error:
            return jsonify({'error': error}), 400
        user.full_name = full_name

    if 'email' in data:
        email, error = _validate_text(data['email'], 'Email address', 120, required=True)
        if error or not EMAIL_PATTERN.match(email):
            return jsonify({'error': error or 'Please enter a valid email address.'}), 400
        email = email.lower()
        existing = User.query.filter_by(email=email).first()
        if existing and existing.id != user.id:
            return jsonify({'error': 'An account with this email address already exists.'}), 409
        user.email = email

    if 'qualification' in data:
        qualification, error = _validate_text(data['qualification'] or '', 'Educational qualification', 100)
        if error:
            return jsonify({'error': error}), 400
        user.qualification = qualification

    if 'graduation_year' in data:
        gy = data['graduation_year']
        if gy is None or gy == '':
            user.graduation_year = None
        else:
            try:
                user.graduation_year = int(gy)
            except (ValueError, TypeError):
                return jsonify({'error': 'Graduation year must be a valid integer.'}), 400
            if user.graduation_year < 1900 or user.graduation_year > 2100:
                return jsonify({'error': 'Graduation year must be between 1900 and 2100.'}), 400

    if 'career_interest' in data:
        career_interest, error = _validate_text(data['career_interest'] or '', 'Career interest', 150)
        if error:
            return jsonify({'error': error}), 400
        user.career_interest = career_interest

    # Allow students to set/clear target career
    if 'target_career_id' in data:
        if user.role != 'student':
            return jsonify({'error': 'Only students can set a target career.'}), 403
        tc_id = data['target_career_id']
        if tc_id is None:
            user.target_career_id = None
        else:
            try:
                tc_id = int(tc_id)
            except (ValueError, TypeError):
                return jsonify({'error': 'target_career_id must be an integer.'}), 400
            career = CareerRole.query.get(tc_id)
            if not career:
                return jsonify({'error': 'Career role not found.'}), 404
            user.target_career_id = tc_id

    # Prevent role escalation — never allow role to be changed via profile update
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully.', 'user': user.to_dict()}), 200


@users_bp.route('/target-career', methods=['GET'])
@jwt_required()
def get_target_career():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    if user.role != 'student':
        return jsonify({'error': 'Only students have a target career.'}), 403
    return jsonify({
        'target_career': user.target_career.to_dict(include_skills=False) if user.target_career else None
    }), 200


@users_bp.route('/target-career', methods=['PUT'])
@jwt_required()
def set_target_career():
    """Dedicated endpoint for students to set/clear their target career."""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    if user.role != 'student':
        return jsonify({'error': 'Only students can set a target career.'}), 403

    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Request body must be a JSON object.'}), 400
    career_id = data.get('career_id')

    if career_id is None:
        user.target_career_id = None
        db.session.commit()
        return jsonify({'message': 'Target career cleared.', 'user': user.to_dict()}), 200

    try:
        career_id = int(career_id)
    except (ValueError, TypeError):
        return jsonify({'error': 'career_id must be an integer.'}), 400

    career = CareerRole.query.get(career_id)
    if not career:
        return jsonify({'error': 'Career role not found.'}), 404

    user.target_career_id = career_id
    db.session.commit()
    return jsonify({
        'message': f'Target career set to "{career.title}".',
        'user': user.to_dict()
    }), 200


@users_bp.route('/students', methods=['GET'])
@jwt_required()
def get_students_list():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(int(current_user_id))
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Admin privilege required.'}), 403

    students = User.query.filter_by(role='student').order_by(User.created_at.desc()).all()
    return jsonify({'students': [s.to_dict() for s in students]}), 200
