import re

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import db, bcrypt
from models import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
EMAIL_PATTERN = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Request body must be a JSON object.'}), 400

    full_name_raw = data.get('full_name', '')
    email_raw = data.get('email', '')
    qualification_raw = data.get('qualification', '')
    if not isinstance(full_name_raw, str) or not isinstance(email_raw, str) or not isinstance(qualification_raw, str):
        return jsonify({'error': 'Name, email address, and qualification must be text.'}), 400
    full_name = full_name_raw.strip()
    email = email_raw.strip().lower()
    password = data.get('password', '')
    qualification = qualification_raw.strip()
    graduation_year_raw = data.get('graduation_year')

    if not full_name or len(full_name) > 100:
        return jsonify({'error': 'Full name is required.'}), 400
    if not email or len(email) > 120 or not EMAIL_PATTERN.match(email):
        return jsonify({'error': 'Please enter a valid email address.'}), 400
    if not isinstance(password, str) or len(password) < 8:
        return jsonify({'error': 'Password must contain at least 8 characters.'}), 400
    if len(qualification) > 100:
        return jsonify({'error': 'Educational qualification must be 100 characters or fewer.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': f'An account with email "{email}" already exists.'}), 409

    graduation_year = None
    if graduation_year_raw is not None and str(graduation_year_raw).strip() != '':
        try:
            graduation_year = int(graduation_year_raw)
        except (ValueError, TypeError):
            return jsonify({'error': 'Graduation year must be a valid integer.'}), 400
        if graduation_year < 1900 or graduation_year > 2100:
            return jsonify({'error': 'Graduation year must be between 1900 and 2100.'}), 400

    try:
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        new_user = User(
            full_name=full_name,
            email=email,
            password_hash=hashed_password,
            role='student',
            qualification=qualification,
            graduation_year=graduation_year
        )

        db.session.add(new_user)
        db.session.commit()

        access_token = create_access_token(identity=str(new_user.id))
        print(f"[AUTH] Registered new student: {new_user.email} (ID: {new_user.id})")

        return jsonify({
            'message': 'User registered successfully.',
            'access_token': access_token,
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"[AUTH ERROR] Registration failed: {e}")
        return jsonify({'error': 'Registration could not be completed. Please try again.'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'Request body must be a JSON object.'}), 400

    email_raw = data.get('email', '')
    password = data.get('password', '')
    if not isinstance(email_raw, str) or not isinstance(password, str):
        return jsonify({'error': 'Email and password must be text.'}), 400
    email = email_raw.strip().lower()

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        print(f"[AUTH LOGIN FAILED] Email not found: {email}")
        return jsonify({'error': 'No account found with this email address.'}), 401

    if not bcrypt.check_password_hash(user.password_hash, password):
        print(f"[AUTH LOGIN FAILED] Incorrect password for: {email}")
        return jsonify({'error': 'Incorrect password. Please try again.'}), 401

    access_token = create_access_token(identity=str(user.id))
    print(f"[AUTH LOGIN SUCCESS] Logged in: {user.email} (Role: {user.role})")

    return jsonify({
        'message': 'Login successful.',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully.'}), 200
